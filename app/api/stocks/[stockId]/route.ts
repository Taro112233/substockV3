// 📄 File: app/api/stocks/[stockId]/route.ts
// ===== ENHANCED STOCK API WITH MINIMUM STOCK SUPPORT =====

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import { TransactionType } from '@/types'

// Schema สำหรับ validation
const updateStockSchema = z.object({
  totalQuantity: z.number().min(0, 'จำนวนสต็อกต้องไม่น้อยกว่า 0'),
  minimumStock: z.number().min(0, 'จำนวนขั้นต่ำต้องไม่น้อยกว่า 0'),
  adjustmentReason: z.string().min(1, 'กรุณาระบุเหตุผล'),
  department: z.enum(['PHARMACY', 'OPD'])
})

// ✅ ฟังก์ชันสำหรับกำหนด TransactionType ตามการเปลี่ยนแปลง
const determineTransactionType = (
  quantityChange: number,
  minimumStockChange: number,
  reason: string
): TransactionType => {
  // กรณีเปลี่ยนสต็อกจริง
  if (quantityChange !== 0) {
    if (quantityChange > 0) return 'ADJUST_INCREASE' as TransactionType
    if (quantityChange < 0) return 'ADJUST_DECREASE' as TransactionType
  }
  
  // กรณีเปลี่ยน minimum stock เท่านั้น
  if (quantityChange === 0 && minimumStockChange !== 0) {
    if (minimumStockChange > 0) return 'MIN_STOCK_INCREASE' as TransactionType
    if (minimumStockChange < 0) return 'MIN_STOCK_DECREASE' as TransactionType
  }
  
  // กรณีไม่เปลี่ยนอะไรเลย
  return 'DATA_UPDATE' as TransactionType
}

// ✅ ฟังก์ชันสำหรับสร้างเหตุผลอัตโนมัติ
const generateAdjustmentReason = (
  currentQty: number, 
  newQty: number, 
  currentMin: number, 
  newMin: number
): string => {
  const qtyChange = newQty - currentQty
  const minChange = newMin - currentMin

  if (qtyChange === 0) {
    if (minChange === 0) return 'อัพเดทข้อมูล'
    if (minChange > 0) return 'ปรับเพิ่มขั้นต่ำ'
    if (minChange < 0) return 'ปรับลดขั้นต่ำ'
  }
  
  if (qtyChange > 0) return 'ปรับเพิ่มสต็อก'
  if (qtyChange < 0) return 'ปรับลดสต็อก'

  return 'อัพเดทข้อมูล'
}

interface RouteContext {
  params: Promise<{ stockId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { stockId } = await context.params

    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'ไม่พบ token การเข้าสู่ระบบ' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
      include: {
        drug: {
          select: {
            hospitalDrugCode: true,
            name: true,
            genericName: true,
            dosageForm: true,
            strength: true,
            unit: true,
            packageSize: true,
            category: true,
            pricePerBox: true,
            notes: true
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: { 
                firstName: true,
                lastName: true 
              }
            }
          }
        }
      }
    })

    if (!stock) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลสต็อก' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: stock
    })

  } catch (error: any) {
    console.error('Get stock error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสต็อก' },
      { status: 500 }
    )
  }
}

// ⭐ ENHANCED PATCH - อัปเดตข้อมูลสต็อกพร้อม Minimum Stock Fields
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { stockId } = await context.params

    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'ไม่พบ token การเข้าสู่ระบบ' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    const body = await request.json()

    // ดึงข้อมูลสต็อกปัจจุบันก่อน
    const currentStock = await prisma.stock.findUnique({
      where: { id: stockId },
      include: { drug: true }
    })

    if (!currentStock) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลสต็อก' }, { status: 404 })
    }

    // ✅ สร้างเหตุผลอัตโนมัติถ้าไม่มี
    if (!body.adjustmentReason || !body.adjustmentReason.trim()) {
      body.adjustmentReason = generateAdjustmentReason(
        currentStock.totalQuantity,
        body.totalQuantity || currentStock.totalQuantity,
        currentStock.minimumStock,
        body.minimumStock || currentStock.minimumStock
      )
    }

    const validatedData = updateStockSchema.parse(body)
    const { totalQuantity, minimumStock, adjustmentReason, department } = validatedData

    if (currentStock.department !== department) {
      return NextResponse.json({ error: 'แผนกไม่ตรงกับข้อมูลในระบบ' }, { status: 400 })
    }

    // คำนวณการเปลี่ยนแปลง
    const quantityChange = totalQuantity - currentStock.totalQuantity
    const minimumStockChange = minimumStock - currentStock.minimumStock

    const result = await prisma.$transaction(async (tx) => {
      // อัปเดตข้อมูลสต็อก
      const updatedStock = await tx.stock.update({
        where: { id: stockId },
        data: {
          totalQuantity,
          minimumStock,
          lastUpdated: new Date(),
          ...(quantityChange !== 0 && {
            totalValue: (currentStock.totalValue / Math.max(currentStock.totalQuantity, 1)) * totalQuantity
          })
        },
        include: {
          drug: {
            select: {
              hospitalDrugCode: true,
              name: true,
              genericName: true,
              dosageForm: true,
              strength: true,
              unit: true,
              packageSize: true,
              category: true,
              pricePerBox: true,
              notes: true
            }
          }
        }
      })

      // 🎯 สร้าง Transaction Records แยกตามประเภทการเปลี่ยนแปลง
      
      // 1️⃣ ถ้ามีการเปลี่ยนสต็อกจริง -> สร้าง Stock Transaction
      if (quantityChange !== 0) {
        const stockTransactionType: TransactionType = quantityChange > 0 ? 'ADJUST_INCREASE' : 'ADJUST_DECREASE'
        
        await tx.stockTransaction.create({
          data: {
            stockId: currentStock.id,
            userId: decoded.userId,
            type: stockTransactionType,
            // 📦 ข้อมูลสต็อกจริง
            quantity: quantityChange,
            beforeQty: currentStock.totalQuantity,
            afterQty: totalQuantity,
            // 🎯 ข้อมูลขั้นต่ำ (ไม่เปลี่ยนในรอบนี้)
            minStockChange: 0,
            beforeMinStock: currentStock.minimumStock,
            afterMinStock: currentStock.minimumStock, // ยังคงเท่าเดิม
            // 💰 ข้อมูลต้นทุน
            unitCost: currentStock.totalValue / Math.max(currentStock.totalQuantity, 1),
            totalCost: Math.abs(quantityChange) * (currentStock.totalValue / Math.max(currentStock.totalQuantity, 1)),
            reference: `STOCK_ADJ_${Date.now()}`,
            note: `${adjustmentReason} | เปลี่ยนสต็อกจาก ${currentStock.totalQuantity} เป็น ${totalQuantity}`
          }
        })
      }

      // 2️⃣ ถ้ามีการเปลี่ยนขั้นต่ำ -> สร้าง Minimum Stock Transaction
      if (minimumStockChange !== 0) {
        const minStockTransactionType: TransactionType = minimumStockChange > 0 ? 'MIN_STOCK_INCREASE' : 'MIN_STOCK_DECREASE'
        
        await tx.stockTransaction.create({
          data: {
            stockId: currentStock.id,
            userId: decoded.userId,
            type: minStockTransactionType,
            // 📦 ข้อมูลสต็อกจริง (ไม่เปลี่ยน)
            quantity: 0, // ไม่มีการเปลี่ยนสต็อกจริง
            beforeQty: totalQuantity, // ใช้ค่าหลังจากอัปเดต
            afterQty: totalQuantity, // ยังคงเท่าเดิม
            // 🎯 ข้อมูลขั้นต่ำ
            minStockChange: minimumStockChange,
            beforeMinStock: currentStock.minimumStock,
            afterMinStock: minimumStock,
            // 💰 ข้อมูลต้นทุน (ไม่มี cost สำหรับการปรับขั้นต่ำ)
            unitCost: 0,
            totalCost: 0,
            reference: `MIN_STOCK_ADJ_${Date.now()}`,
            note: `${adjustmentReason} | เปลี่ยนขั้นต่ำจาก ${currentStock.minimumStock} เป็น ${minimumStock}`
          }
        })
      }

      // 3️⃣ ถ้าไม่มีการเปลี่ยนแปลงอะไร -> สร้าง Data Update Transaction
      if (quantityChange === 0 && minimumStockChange === 0) {
        await tx.stockTransaction.create({
          data: {
            stockId: currentStock.id,
            userId: decoded.userId,
            type: 'DATA_UPDATE',
            quantity: 0,
            beforeQty: currentStock.totalQuantity,
            afterQty: currentStock.totalQuantity,
            minStockChange: 0,
            beforeMinStock: currentStock.minimumStock,
            afterMinStock: currentStock.minimumStock,
            unitCost: 0,
            totalCost: 0,
            reference: `DATA_UPDATE_${Date.now()}`,
            note: adjustmentReason
          }
        })
      }

      return updatedStock
    })

    // สร้างข้อความตอบกลับ
    const changes = []
    if (quantityChange !== 0) {
      changes.push(`สต็อก: ${currentStock.totalQuantity} → ${totalQuantity}`)
    }
    if (minimumStockChange !== 0) {
      changes.push(`ขั้นต่ำ: ${currentStock.minimumStock} → ${minimumStock}`)
    }

    const message = changes.length > 0 
      ? `อัปเดตสำเร็จ (${changes.join(', ')})`
      : 'อัปเดตข้อมูลสำเร็จ'

    return NextResponse.json({
      success: true,
      message,
      data: {
        ...result,
        lastUpdated: result.lastUpdated.toISOString()
      },
      transactionInfo: {
        quantityChanged: quantityChange !== 0,
        quantityChange,
        minimumStockChanged: minimumStockChange !== 0,
        minimumStockChange,
        reason: adjustmentReason,
        transactionsCreated: [
          ...(quantityChange !== 0 ? ['STOCK_ADJUSTMENT'] : []),
          ...(minimumStockChange !== 0 ? ['MIN_STOCK_ADJUSTMENT'] : []),
          ...(quantityChange === 0 && minimumStockChange === 0 ? ['DATA_UPDATE'] : [])
        ]
      }
    })

  } catch (error: any) {
    console.error('Update stock error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'ข้อมูลไม่ถูกต้อง',
          details: error.issues.map((issue) => issue.message).join(', ')
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลสต็อก' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { stockId } = await context.params

    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'ไม่พบ token การเข้าสู่ระบบ' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    const existingStock = await prisma.stock.findUnique({
      where: { id: stockId },
      include: { 
        drug: { select: { name: true } },
        transactions: { take: 1 }
      }
    })

    if (!existingStock) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลสต็อก' }, { status: 404 })
    }

    if (existingStock.transactions.length > 0) {
      return NextResponse.json({ 
        error: 'ไม่สามารถลบข้อมูลสต็อกได้ เนื่องจากมีประวัติการเคลื่อนไหวแล้ว' 
      }, { status: 400 })
    }

    await prisma.stock.delete({
      where: { id: stockId }
    })

    return NextResponse.json({
      success: true,
      message: `ลบข้อมูลสต็อกยา "${existingStock.drug.name}" สำเร็จ`
    })

  } catch (error: any) {
    console.error('Delete stock error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบข้อมูลสต็อก' },
      { status: 500 }
    )
  }
}