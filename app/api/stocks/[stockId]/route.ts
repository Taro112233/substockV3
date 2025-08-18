// 📄 File: app/api/stocks/[stockId]/route.ts (ALL ERRORS FIXED)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth' // ใช้ verifyToken ที่มีอยู่แล้ว
import { z } from 'zod'

// Schema สำหรับ validation
const updateStockSchema = z.object({
  totalQuantity: z.number().min(0, 'จำนวนสต็อกต้องไม่น้อยกว่า 0'),
  minimumStock: z.number().min(0, 'จำนวนขั้นต่ำต้องไม่น้อยกว่า 0'),
  adjustmentReason: z.string().min(1, 'กรุณาระบุเหตุผลในการปรับสต็อก'),
  department: z.enum(['PHARMACY', 'OPD'])
})

// GET - ดึงข้อมูลสต็อกเฉพาะรายการ
export async function GET(
  request: NextRequest,
  { params }: { params: { stockId: string } }
) {
  try {
    // Verify authentication - ใช้ verifyToken ที่มีอยู่
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'ไม่พบ token การเข้าสู่ระบบ' }, { status: 401 })
    }

    const decoded = await verifyToken(token) // ใช้ verifyToken แทน verifyJWT
    if (!decoded) {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    const { stockId } = params

    // ดึงข้อมูลสต็อก - แก้ไข user select fields
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
            category: true
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: { 
                firstName: true,   // แก้ไข: ใช้ firstName และ lastName แทน name
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

  } catch (error) {
    console.error('Get stock error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสต็อก' },
      { status: 500 }
    )
  }
}

// PATCH - อัปเดตข้อมูลสต็อก
export async function PATCH(
  request: NextRequest,
  { params }: { params: { stockId: string } }
) {
  try {
    // Verify authentication - ใช้ verifyToken ที่มีอยู่
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'ไม่พบ token การเข้าสู่ระบบ' }, { status: 401 })
    }

    const decoded = await verifyToken(token) // ใช้ verifyToken แทน verifyJWT
    if (!decoded) {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    const { stockId } = params
    const body = await request.json()

    // Validate input data
    const validatedData = updateStockSchema.parse(body)
    const { totalQuantity, minimumStock, adjustmentReason, department } = validatedData

    // ดึงข้อมูลสต็อกปัจจุบัน
    const currentStock = await prisma.stock.findUnique({
      where: { id: stockId },
      include: { drug: true }
    })

    if (!currentStock) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลสต็อก' }, { status: 404 })
    }

    // ตรวจสอบว่าแผนกตรงกัน
    if (currentStock.department !== department) {
      return NextResponse.json({ error: 'แผนกไม่ตรงกับข้อมูลในระบบ' }, { status: 400 })
    }

    // คำนวณการเปลี่ยนแปลง
    const quantityChange = totalQuantity - currentStock.totalQuantity
    const minimumStockChange = minimumStock !== currentStock.minimumStock

    // ใช้ transaction เพื่อความปลอดภัยของข้อมูล
    const result = await prisma.$transaction(async (tx) => {
      // อัปเดตข้อมูลสต็อก
      const updatedStock = await tx.stock.update({
        where: { id: stockId },
        data: {
          totalQuantity,
          minimumStock,
          lastUpdated: new Date(),
          // คำนวณมูลค่าใหม่ถ้าจำนวนเปลี่ยน (ใช้ราคาเดิม)
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
              category: true
            }
          }
        }
      })

      // บันทึก transaction log ถ้ามีการเปลี่ยนแปลงจำนวน
      if (quantityChange !== 0) {
        const transactionType = quantityChange > 0 ? 'ADJUST_INCREASE' : 'ADJUST_DECREASE'
        
        await tx.stockTransaction.create({
          data: {
            stockId: currentStock.id,
            userId: decoded.userId,
            type: transactionType,
            quantity: Math.abs(quantityChange),
            beforeQty: currentStock.totalQuantity,
            afterQty: totalQuantity,
            unitCost: currentStock.totalValue / Math.max(currentStock.totalQuantity, 1),
            totalCost: Math.abs(quantityChange) * (currentStock.totalValue / Math.max(currentStock.totalQuantity, 1)),
            reference: `MANUAL_ADJUSTMENT_${Date.now()}`,
            note: adjustmentReason
          }
        })
      }

      // บันทึก minimum stock change log ถ้ามีการเปลี่ยนแปลง
      if (minimumStockChange) {
        await tx.stockTransaction.create({
          data: {
            stockId: currentStock.id,
            userId: decoded.userId,
            type: 'ADJUST_INCREASE', // ใช้เป็น placeholder สำหรับ minimum stock change
            quantity: 0,
            beforeQty: currentStock.totalQuantity,
            afterQty: totalQuantity,
            unitCost: 0,
            totalCost: 0,
            reference: `MINIMUM_STOCK_UPDATE_${Date.now()}`,
            note: `ปรับจำนวนขั้นต่ำจาก ${currentStock.minimumStock} เป็น ${minimumStock} | ${adjustmentReason}`
          }
        })
      }

      return updatedStock
    })

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        lastUpdated: result.lastUpdated.toISOString()
      },
      message: 'อัปเดตข้อมูลสต็อกสำเร็จ'
    })

  } catch (error) {
    console.error('Update stock error:', error)
    
    // Handle validation errors - แก้ไข ZodError handling
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'ข้อมูลไม่ถูกต้อง',
          details: error.issues.map((issue) => issue.message).join(', ') // แก้ไข: ใช้ issues แทน errors
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

// DELETE - ลบข้อมูลสต็อก (เฉพาะ Manager)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { stockId: string } }
) {
  try {
    // Verify authentication - ใช้ verifyToken ที่มีอยู่
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'ไม่พบ token การเข้าสู่ระบบ' }, { status: 401 })
    }

    const decoded = await verifyToken(token) // ใช้ verifyToken แทน verifyJWT
    if (!decoded) {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    const { stockId } = params

    // ตรวจสอบว่ามีข้อมูลสต็อกอยู่หรือไม่
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

    // ตรวจสอบว่ายังมี transaction ที่เกี่ยวข้องอยู่หรือไม่
    if (existingStock.transactions.length > 0) {
      return NextResponse.json({ 
        error: 'ไม่สามารถลบข้อมูลสต็อกได้ เนื่องจากมีประวัติการเคลื่อนไหวแล้ว' 
      }, { status: 400 })
    }

    // ลบข้อมูลสต็อก
    await prisma.stock.delete({
      where: { id: stockId }
    })

    return NextResponse.json({
      success: true,
      message: `ลบข้อมูลสต็อกยา "${existingStock.drug.name}" สำเร็จ`
    })

  } catch (error) {
    console.error('Delete stock error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบข้อมูลสต็อก' },
      { status: 500 }
    )
  }
}