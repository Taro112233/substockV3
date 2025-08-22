// 📄 File: app/api/stocks/[stockId]/route.ts (ปรับปรุงให้รองรับ enum ใหม่)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

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
): string => {
  // กรณีเปลี่ยนสต็อกจริง
  if (quantityChange !== 0) {
    if (quantityChange > 0) return 'ADJUST_INCREASE'
    if (quantityChange < 0) return 'ADJUST_DECREASE'
  }
  
  // กรณีเปลี่ยน minimum stock เท่านั้น
  if (quantityChange === 0 && minimumStockChange !== 0) {
    if (minimumStockChange > 0) return 'MIN_STOCK_INCREASE'
    if (minimumStockChange < 0) return 'MIN_STOCK_DECREASE'
  }
  
  // กรณีไม่เปลี่ยนอะไรเลย
  return 'DATA_UPDATE'
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

// ✅ PATCH - อัปเดตข้อมูลสต็อก (รองรับ enum ใหม่)
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

    // ✅ กำหนด TransactionType ตามการเปลี่ยนแปลง
    const transactionType = determineTransactionType(quantityChange, minimumStockChange, adjustmentReason)

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

      // ✅ สร้าง transaction record ตาม enum ใหม่
      let transactionNote = adjustmentReason
      let recordQuantity = 0

      // ปรับข้อมูลสำหรับ transaction record
      switch (transactionType) {
        case 'ADJUST_INCREASE':
        case 'ADJUST_DECREASE':
          recordQuantity = Math.abs(quantityChange)
          break
        case 'MIN_STOCK_INCREASE':
          recordQuantity = minimumStockChange
          transactionNote = `เพิ่มจำนวนขั้นต่ำจาก ${currentStock.minimumStock} เป็น ${minimumStock}`
          break
        case 'MIN_STOCK_DECREASE':
          recordQuantity = Math.abs(minimumStockChange)
          transactionNote = `ลดจำนวนขั้นต่ำจาก ${currentStock.minimumStock} เป็น ${minimumStock}`
          break
        case 'DATA_UPDATE':
          recordQuantity = 0
          transactionNote = 'อัปเดตข้อมูลทั่วไป'
          break
      }

      // บันทึก transaction log (บันทึกทุกประเภท เพื่อติดตาม audit trail)
      await tx.stockTransaction.create({
        data: {
          stockId: currentStock.id,
          userId: decoded.userId,
          type: transactionType,
          quantity: recordQuantity,
          beforeQty: currentStock.totalQuantity,
          afterQty: totalQuantity,
          unitCost: currentStock.totalValue / Math.max(currentStock.totalQuantity, 1),
          totalCost: recordQuantity * (currentStock.totalValue / Math.max(currentStock.totalQuantity, 1)),
          reference: `${transactionType}_${Date.now()}`,
          note: transactionNote
        }
      })

      return updatedStock
    })

    // สร้างข้อความตอบกลับ
    let message = 'อัปเดตข้อมูลสำเร็จ'
    
    switch (transactionType) {
      case 'ADJUST_INCREASE':
        message = `เพิ่มสต็อก ${quantityChange} หน่วยสำเร็จ`
        break
      case 'ADJUST_DECREASE':
        message = `ลดสต็อก ${Math.abs(quantityChange)} หน่วยสำเร็จ`
        break
      case 'MIN_STOCK_INCREASE':
        message = `เพิ่มจำนวนขั้นต่ำเป็น ${minimumStock} สำเร็จ`
        break
      case 'MIN_STOCK_DECREASE':
        message = `ลดจำนวนขั้นต่ำเป็น ${minimumStock} สำเร็จ`
        break
      case 'DATA_UPDATE':
        message = 'อัปเดตข้อมูลทั่วไปสำเร็จ'
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        lastUpdated: result.lastUpdated.toISOString()
      },
      message,
      transactionInfo: {
        type: transactionType,
        quantityChanged: quantityChange !== 0,
        quantityChange,
        minimumStockChanged: minimumStockChange !== 0,
        minimumStockChange,
        reason: adjustmentReason
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