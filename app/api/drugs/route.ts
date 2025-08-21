// 📄 File: app/api/drugs/route.ts (Fixed TypeScript errors)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, DrugCategory } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')

    // Build where clause with proper Prisma types
    const where: Prisma.DrugWhereInput = {}

    if (search) {
      where.OR = [
        { hospitalDrugCode: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) {
      // ✅ Fixed: Type-safe category validation
      const validCategories: DrugCategory[] = [
        'REFER', 'HAD', 'NARCOTIC', 'REFRIGERATED', 
        'PSYCHIATRIC', 'FLUID', 'GENERAL', 'TABLET', 'SYRUP', 'INJECTION' ,'EXTEMP', 'ALERT'
      ]
      
      if (validCategories.includes(category as DrugCategory)) {
        where.category = category as DrugCategory
      }
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const drugs = await prisma.drug.findMany({
      where,
      include: {
        stocks: {
          select: {
            id: true,
            department: true,
            totalQuantity: true,
            reservedQty: true,
            minimumStock: true,
            totalValue: true
          }
        },
        _count: {
          select: {
            transferItems: true,
            batches: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    })

    return NextResponse.json(drugs)

  } catch (error) {
    console.error('Drugs fetch error:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลยาได้' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      hospitalDrugCode,
      name,
      genericName,
      dosageForm,
      strength,
      unit,
      packageSize,
      pricePerBox,
      category,
      notes
    } = body

    // Validate required fields
    if (!hospitalDrugCode || !name || !dosageForm || !unit) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน: ต้องมีรหัสยา, ชื่อยา, รูปแบบยา, และหน่วย' },
        { status: 400 }
      )
    }

    // Check if drug code already exists
    const existingDrug = await prisma.drug.findUnique({
      where: { hospitalDrugCode }
    })

    if (existingDrug) {
      return NextResponse.json(
        { error: 'รหัสยาซ้ำ' },
        { status: 400 }
      )
    }

    // Create new drug
    const drug = await prisma.drug.create({
      data: {
        hospitalDrugCode,
        name,
        genericName,
        dosageForm,
        strength,
        unit,
        packageSize,
        pricePerBox: pricePerBox || 0,
        category: category || 'GENERAL',
        notes,
        isActive: true
      }
    })

    return NextResponse.json(drug)

  } catch (error) {
    console.error('Drug creation error:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถสร้างข้อมูลยาได้' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      hospitalDrugCode,
      name,
      genericName,
      dosageForm,
      strength,
      unit,
      packageSize,
      pricePerBox,
      category,
      notes,
      isActive
    } = body

    // Validate required fields
    if (!id || !hospitalDrugCode || !name || !dosageForm || !unit) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    // Check if drug exists
    const existingDrug = await prisma.drug.findUnique({
      where: { id }
    })

    if (!existingDrug) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลยา' },
        { status: 404 }
      )
    }

    // Check if new drug code conflicts with other drugs
    if (hospitalDrugCode !== existingDrug.hospitalDrugCode) {
      const conflictingDrug = await prisma.drug.findUnique({
        where: { hospitalDrugCode }
      })

      if (conflictingDrug) {
        return NextResponse.json(
          { error: 'รหัสยาซ้ำ' },
          { status: 400 }
        )
      }
    }

    // Update drug
    const updatedDrug = await prisma.drug.update({
      where: { id },
      data: {
        hospitalDrugCode,
        name,
        genericName,
        dosageForm,
        strength,
        unit,
        packageSize,
        pricePerBox: pricePerBox || 0,
        category: category || 'GENERAL',
        notes,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(updatedDrug)

  } catch (error) {
    console.error('Drug update error:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถอัปเดตข้อมูลยาได้' },
      { status: 500 }
    )
  }
}