// 📄 File: app/api/stock/route.ts (Fixed)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, Department } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const department = searchParams.get('department') as Department | null

    // Build where clause with proper Prisma types
    const where: Prisma.StockWhereInput = {}
    if (department) {
      where.department = department
    }

    const stocks = await prisma.stock.findMany({
      where,
      include: {
        drug: {
          select: {
            id: true,
            hospitalDrugCode: true,
            name: true,
            genericName: true,
            dosageForm: true,
            strength: true,
            unit: true,
            category: true,
            pricePerBox: true,
            isActive: true
          }
        }
      },
      orderBy: [
        { totalQuantity: 'asc' }, // Low stock first
        { drug: { name: 'asc' } }
      ]
    })

    // Filter only active drugs
    const activeStocks = stocks.filter(stock => stock.drug.isActive)

    return NextResponse.json(activeStocks)

  } catch (error) {
    console.error('Stock fetch error:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลสต็อกได้' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { drugId, department, quantity, type, note, reference, userId } = body

    // Validate required fields
    if (!drugId || !department || !quantity || !type || !userId) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    // Start transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Get or create stock record
      let currentStock = await prisma.stock.findUnique({
        where: {
          drugId_department: {
            drugId,
            department
          }
        }
      })

      if (!currentStock) {
        // Create new stock record if doesn't exist
        currentStock = await prisma.stock.create({
          data: {
            drugId,
            department,
            totalQuantity: 0,
            reservedQty: 0,
            minimumStock: 10, // Default minimum
            totalValue: 0
          }
        })
      }

      const beforeQty = currentStock.totalQuantity
      const afterQty = beforeQty + quantity

      if (afterQty < 0) {
        throw new Error('จำนวนสต็อกไม่เพียงพอ')
      }

      // Update stock
      const updatedStock = await prisma.stock.update({
        where: {
          drugId_department: {
            drugId,
            department
          }
        },
        data: {
          totalQuantity: afterQty,
          lastUpdated: new Date()
        },
        include: {
          drug: true
        }
      })

      // Create transaction record
      await prisma.stockTransaction.create({
        data: {
          stockId: currentStock.id,
          userId,
          type,
          quantity,
          beforeQty,
          afterQty,
          reference,
          note
        }
      })

      return updatedStock
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Stock adjustment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ไม่สามารถปรับสต็อกได้' },
      { status: 500 }
    )
  }
}