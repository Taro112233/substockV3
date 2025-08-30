// 📄 File: app/api/drugs/[drugId]/route.ts
// API สำหรับจัดการข้อมูลยาแต่ละตัว (GET, PATCH, DELETE) - NO AUTHENTICATION
// ✅ Fixed TypeScript Strict Mode และ ESLint warnings

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Schema สำหรับ validation การอัปเดตข้อมูลยา
const updateDrugSchema = z.object({
  hospitalDrugCode: z
    .string()
    .min(1, 'รหัสยาโรงพยาบาลเป็นข้อมูลที่จำเป็น')
    .max(50, 'รหัสยาต้องไม่เกิน 50 ตัวอักษร'),
  name: z
    .string()
    .min(1, 'ชื่อยาเป็นข้อมูลที่จำเป็น')
    .max(255, 'ชื่อยาต้องไม่เกิน 255 ตัวอักษร'),
  genericName: z
    .string()
    .max(255, 'ชื่อสามัญต้องไม่เกิน 255 ตัวอักษร')
    .nullable()
    .optional(),
  dosageForm: z.enum([
    'APP', 'BAG', 'CAP', 'CR', 'DOP', 'ENE', 'GEL', 'HAN', 'IMP',
    'INJ', 'LIQ', 'LOT', 'LVP', 'MDI', 'MIX', 'NAS', 'NB', 'OIN',
    'PAT', 'POW', 'PWD', 'SAC', 'SOL', 'SPR', 'SUP', 'SUS', 'SYR',
    'TAB', 'TUR'
  ], {
    message: 'รูปแบบยาไม่ถูกต้อง'
  }),
  strength: z
    .string()
    .max(50, 'ความแรงต้องไม่เกิน 50 ตัวอักษร')
    .nullable()
    .optional(),
  unit: z
    .string()
    .min(1, 'หน่วยเป็นข้อมูลที่จำเป็น')
    .max(20, 'หน่วยต้องไม่เกิน 20 ตัวอักษร'),
  packageSize: z
    .string()
    .max(50, 'ขนาดบรรจุต้องไม่เกิน 50 ตัวอักษร')
    .nullable()
    .optional(),
  pricePerBox: z
    .number()
    .min(0, 'ราคาต้องไม่น้อยกว่า 0')
    .max(999999.99, 'ราคาต้องไม่เกิน 999,999.99'),
  category: z.enum([
    'REFER', 'HAD', 'NARCOTIC', 'REFRIGERATED', 'PSYCHIATRIC',
    'FLUID', 'GENERAL', 'TABLET', 'SYRUP', 'INJECTION', 'EXTEMP', 'ALERT', 'CANCELLED'
  ], {
    message: 'ประเภทยาไม่ถูกต้อง'
  }),
  notes: z
    .string()
    .max(1000, 'หมายเหตุต้องไม่เกิน 1000 ตัวอักษร')
    .nullable()
    .optional(),
  // เพิ่ม userId สำหรับการบันทึก transaction
  userId: z.string().min(1, 'User ID เป็นข้อมูลที่จำเป็น').optional(),
})

// Route context interface
interface RouteContext {
  params: Promise<{ drugId: string }>
}

// Type-safe error response
interface ErrorResponse {
  error: string
  details?: string
}

// GET - ดึงข้อมูลยาแต่ละตัว
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { drugId } = await context.params

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
            fixedStock: true,
            totalValue: true,
            lastUpdated: true
          }
        },
        _count: {
          select: {
            transferItems: true,
            stocks: true
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

  } catch (error: unknown) {
    console.error('Get drug error:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลยา' },
      { status: 500 }
    )
  }
}

// PATCH - อัปเดตข้อมูลยา
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { drugId } = await context.params

    // ตรวจสอบว่ามียาอยู่หรือไม่
    const existingDrug = await prisma.drug.findUnique({
      where: { id: drugId },
      include: {
        stocks: {
          select: {
            totalQuantity: true,
            totalValue: true
          }
        }
      }
    })

    if (!existingDrug) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลยา' }, { status: 404 })
    }

    // Parse และ validate ข้อมูลที่ส่งมา
    const body = await request.json()
    const validatedData = updateDrugSchema.parse(body)

    // ตรวจสอบรหัสยาซ้ำ (ถ้าเปลี่ยนรหัส)
    if (validatedData.hospitalDrugCode !== existingDrug.hospitalDrugCode) {
      const duplicateCode = await prisma.drug.findFirst({
        where: {
          hospitalDrugCode: validatedData.hospitalDrugCode,
          id: { not: drugId }
        }
      })

      if (duplicateCode) {
        return NextResponse.json({ 
          error: 'รหัสยานี้มีอยู่ในระบบแล้ว' 
        }, { status: 400 })
      }
    }

    // เช็คการเปลี่ยนแปลงราคา
    const priceChanged = validatedData.pricePerBox !== existingDrug.pricePerBox
    const oldPrice = existingDrug.pricePerBox
    const newPrice = validatedData.pricePerBox

    // ใช้ transaction เพื่ออัปเดตข้อมูลยาและสต็อก
    const result = await prisma.$transaction(async (tx) => {
      // อัปเดตข้อมูลยา
      const updatedDrug = await tx.drug.update({
        where: { id: drugId },
        data: {
          hospitalDrugCode: validatedData.hospitalDrugCode,
          name: validatedData.name,
          genericName: validatedData.genericName,
          dosageForm: validatedData.dosageForm,
          strength: validatedData.strength,
          unit: validatedData.unit,
          packageSize: validatedData.packageSize,
          pricePerBox: validatedData.pricePerBox,
          category: validatedData.category,
          notes: validatedData.notes,
          updatedAt: new Date()
        }
      })

      // ถ้าราคาเปลี่ยน -> อัปเดต total value ของสต็อกทุกแผนก
      if (priceChanged) {
        await tx.stock.updateMany({
          where: { drugId },
          data: {
            totalValue: {
              // คำนวณใหม่จาก totalQuantity * newPrice
              multiply: newPrice / (oldPrice || 1)
            },
            lastUpdated: new Date()
          }
        })
      }

      return updatedDrug
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: `อัปเดตข้อมูลยา "${validatedData.name}" สำเร็จ`,
      priceChanged,
      oldPrice: priceChanged ? oldPrice : undefined,
      newPrice: priceChanged ? newPrice : undefined
    })

  } catch (error: unknown) {
    console.error('Update drug error:', error)

    // Zod validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'ข้อมูลไม่ถูกต้อง',
          details: error.issues.map((issue) => issue.message).join(', ')
        },
        { status: 400 }
      )
    }

    // Prisma unique constraint error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = error.meta?.target
        const field = Array.isArray(target) ? target[0] : undefined
        let message = 'ข้อมูลซ้ำกับรายการที่มีอยู่แล้ว'

        if (field === 'hospitalDrugCode') {
          message = 'รหัสยาโรงพยาบาลนี้มีอยู่ในระบบแล้ว'
        } else if (field === 'name') {
          message = 'ชื่อยานี้มีอยู่ในระบบแล้ว'
        }

        return NextResponse.json({ error: message }, { status: 400 })
      }
    }

    // Generic error
    return NextResponse.json<ErrorResponse>(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลยา' },
      { status: 500 }
    )
  }
}

// DELETE - ลบข้อมูลยา
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { drugId } = await context.params

    // ตรวจสอบว่ามียาอยู่หรือไม่
    const existingDrug = await prisma.drug.findUnique({
      where: { id: drugId },
      include: {
        stocks: {
          where: {
            totalQuantity: { gt: 0 }
          }
        },
        transferItems: { take: 1 },
        _count: {
          select: {
            transferItems: true,
            stocks: true
          }
        }
      }
    })

    if (!existingDrug) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลยา' }, { status: 404 })
    }

    // ตรวจสอบว่าสามารถลบได้หรือไม่
    if (existingDrug.stocks.length > 0) {
      return NextResponse.json<ErrorResponse>({ 
        error: 'ไม่สามารถลบข้อมูลยาได้ เนื่องจากยังมีสต็อกคงเหลืออยู่' 
      }, { status: 400 })
    }

    if (existingDrug._count.transferItems > 0) {
      return NextResponse.json<ErrorResponse>({ 
        error: 'ไม่สามารถลบข้อมูลยาได้ เนื่องจากมีประวัติการโอนย้ายแล้ว' 
      }, { status: 400 })
    }

    // ลบข้อมูลยา (cascade delete จะจัดการ stocks ที่เหลือ)
    await prisma.drug.delete({
      where: { id: drugId }
    })

    return NextResponse.json({
      success: true,
      message: `ลบข้อมูลยา "${existingDrug.name}" สำเร็จ`
    })

  } catch (error: unknown) {
    console.error('Delete drug error:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'เกิดข้อผิดพลาดในการลบข้อมูลยา' },
      { status: 500 }
    )
  }
}