// 📄 File: app/api/drugs/[drugId]/route.ts
// Drug Management API Endpoint for Next.js 15

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

// Schema สำหรับ validation ข้อมูลยา
const updateDrugSchema = z.object({
  name: z.string().min(1, 'ชื่อยาเป็นข้อมูลที่จำเป็น').max(255, 'ชื่อยาต้องไม่เกิน 255 ตัวอักษร'),
  genericName: z.string().max(255, 'ชื่อสามัญต้องไม่เกิน 255 ตัวอักษร').nullable().optional(),
  dosageForm: z.enum([
    'APP', 'BAG', 'CAP', 'CR', 'DOP', 'ENE', 'GEL', 'HAN', 'IMP', 
    'INJ', 'LIQ', 'LOT', 'LVP', 'MDI', 'MIX', 'NAS', 'NB', 'OIN', 
    'PAT', 'POW', 'PWD', 'SAC', 'SOL', 'SPR', 'SUP', 'SUS', 'SYR', 
    'TAB', 'TUR'
  ], { 
    message: 'รูปแบบยาไม่ถูกต้อง' 
  }),
  strength: z.string().max(50, 'ความแรงต้องไม่เกิน 50 ตัวอักษร').nullable().optional(),
  unit: z.string().min(1, 'หน่วยเป็นข้อมูลที่จำเป็น').max(20, 'หน่วยต้องไม่เกิน 20 ตัวอักษร'),
  packageSize: z.string().max(50, 'ขนาดบรรจุต้องไม่เกิน 50 ตัวอักษร').nullable().optional(),
  pricePerBox: z.number().min(0, 'ราคาต้องไม่น้อยกว่า 0').max(999999.99, 'ราคาต้องไม่เกิน 999,999.99'),
  category: z.enum([
    'REFER', 'HAD', 'NARCOTIC', 'REFRIGERATED', 'PSYCHIATRIC', 
    'FLUID', 'GENERAL', 'TABLET', 'SYRUP', 'INJECTION', 'EXTEMP', 'ALERT'
  ], { 
    message: 'ประเภทยาไม่ถูกต้อง' 
  }),
  notes: z.string().max(1000, 'หมายเหตุต้องไม่เกิน 1000 ตัวอักษร').nullable().optional()
})

// ✅ Context type สำหรับ Next.js 15
interface RouteContext {
  params: Promise<{ drugId: string }>
}

// GET - ดึงข้อมูลยาเฉพาะรายการ
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { drugId } = await context.params

    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'ไม่พบ token การเข้าสู่ระบบ' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    // ดึงข้อมูลยา พร้อมข้อมูลสต็อก
    const drug = await prisma.drug.findUnique({
      where: { id: drugId },
      include: {
        stocks: {
          select: {
            id: true,
            department: true,
            totalQuantity: true,
            reservedQty: true,
            minimumStock: true,
            totalValue: true,
            lastUpdated: true
          }
        },
        _count: {
          select: {
            transferItems: true,
            batches: true
          }
        }
      }
    })

    if (!drug) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลยา' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: drug
    })

  } catch (error) {
    console.error('Get drug error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลยา' },
      { status: 500 }
    )
  }
}

// PATCH - อัปเดตข้อมูลยา
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { drugId } = await context.params

    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'ไม่พบ token การเข้าสู่ระบบ' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    // Get and validate input data
    const body = await request.json()
    const validatedData = updateDrugSchema.parse(body)

    // ตรวจสอบว่ามียาอยู่จริง
    const existingDrug = await prisma.drug.findUnique({
      where: { id: drugId },
      include: {
        stocks: {
          select: {
            id: true,
            department: true,
            totalQuantity: true,
            totalValue: true
          }
        }
      }
    })

    if (!existingDrug) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลยา' }, { status: 404 })
    }

    // ตรวจสอบว่าชื่อยาซ้ำหรือไม่ (ยกเว้นตัวเอง)
    if (validatedData.name !== existingDrug.name) {
      const duplicateName = await prisma.drug.findFirst({
        where: {
          name: validatedData.name,
          id: { not: drugId }
        }
      })

      if (duplicateName) {
        return NextResponse.json({ 
          error: 'ชื่อยานี้มีอยู่ในระบบแล้ว' 
        }, { status: 400 })
      }
    }

    // เก็บข้อมูลเดิมสำหรับ log
    const oldPricePerBox = existingDrug.pricePerBox
    const newPricePerBox = validatedData.pricePerBox
    const priceChanged = oldPricePerBox !== newPricePerBox

    // ใช้ transaction เพื่อความปลอดภัยของข้อมูล
    const result = await prisma.$transaction(async (tx) => {
      // อัปเดตข้อมูลยา
      const updatedDrug = await tx.drug.update({
        where: { id: drugId },
        data: {
          ...validatedData,
          updatedAt: new Date()
        },
        include: {
          stocks: {
            select: {
              id: true,
              department: true,
              totalQuantity: true,
              reservedQty: true,
              minimumStock: true,
              totalValue: true,
              lastUpdated: true
            }
          }
        }
      })

      // ถ้าราคาเปลี่ยน ให้อัปเดตมูลค่าสต็อก
      if (priceChanged && existingDrug.stocks.length > 0) {
        for (const stock of existingDrug.stocks) {
          const newTotalValue = stock.totalQuantity * newPricePerBox

          await tx.stock.update({
            where: { id: stock.id },
            data: {
              totalValue: newTotalValue,
              lastUpdated: new Date()
            }
          })

          // บันทึก transaction log สำหรับการเปลี่ยนแปลงราคา
          await tx.stockTransaction.create({
            data: {
              stockId: stock.id,
              userId: decoded.userId,
              type: 'ADJUST_INCREASE',
              quantity: 0,
              beforeQty: stock.totalQuantity,
              afterQty: stock.totalQuantity,
              unitCost: newPricePerBox,
              totalCost: 0,
              reference: `PRICE_UPDATE_${Date.now()}`,
              note: `อัปเดตราคาจาก ฿${oldPricePerBox.toFixed(2)} เป็น ฿${newPricePerBox.toFixed(2)} | มูลค่าใหม่: ฿${newTotalValue.toFixed(2)}`
            }
          })
        }
      }

      return updatedDrug
    })

    // ส่งการแจ้งเตือนถ้าราคาเปลี่ยน
    let message = 'อัปเดตข้อมูลยาสำเร็จ'
    if (priceChanged) {
      message += ` และปรับมูลค่าสต็อกตามราคาใหม่แล้ว`
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        // เพิ่มข้อมูลการเปลี่ยนแปลงราคา
        priceChanged,
        oldPrice: priceChanged ? oldPricePerBox : null,
        newPrice: priceChanged ? newPricePerBox : null
      },
      message
    })

  } catch (error: any) {
    console.error('Update drug error:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'ข้อมูลไม่ถูกต้อง',
          details: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
        },
        { status: 400 }
      )
    }

    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'ข้อมูลซ้ำกับรายการที่มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลยา' },
      { status: 500 }
    )
  }
}

// DELETE - ลบข้อมูลยา (ระวัง - จะลบข้อมูลที่เกี่ยวข้องทั้งหมด)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { drugId } = await context.params

    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'ไม่พบ token การเข้าสู่ระบบ' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    // ตรวจสอบว่ามียาอยู่จริง และมีข้อมูลที่เกี่ยวข้องหรือไม่
    const existingDrug = await prisma.drug.findUnique({
      where: { id: drugId },
      include: {
        stocks: true,
        transferItems: { take: 1 },
        batches: { take: 1 },
        _count: {
          select: {
            stocks: true,
            transferItems: true,
            batches: true
          }
        }
      }
    })

    if (!existingDrug) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลยา' }, { status: 404 })
    }

    // ตรวจสอบว่ามีข้อมูลที่เกี่ยวข้องหรือไม่
    const hasRelatedData = existingDrug._count.stocks > 0 || 
                          existingDrug._count.transferItems > 0 || 
                          existingDrug._count.batches > 0

    if (hasRelatedData) {
      return NextResponse.json({ 
        error: 'ไม่สามารถลบยาได้ เนื่องจากมีข้อมูลสต็อกหรือประวัติการใช้งานแล้ว',
        details: {
          stocks: existingDrug._count.stocks,
          transfers: existingDrug._count.transferItems,
          batches: existingDrug._count.batches
        }
      }, { status: 400 })
    }

    // ลบข้อมูลยา (Cascade delete จะลบข้อมูลที่เกี่ยวข้องอัตโนมัติ)
    await prisma.drug.delete({
      where: { id: drugId }
    })

    return NextResponse.json({
      success: true,
      message: `ลบข้อมูลยา "${existingDrug.name}" สำเร็จ`
    })

  } catch (error: any) {
    console.error('Delete drug error:', error)

    // Handle foreign key constraint errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'ไม่สามารถลบยาได้ เนื่องจากมีข้อมูลที่เกี่ยวข้องอยู่' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบข้อมูลยา' },
      { status: 500 }
    )
  }
}