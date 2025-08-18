// 📄 File: app/api/stocks/pharmacy/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // ดึงข้อมูลสต็อกของแผนกเภสัชกรรม
    const stocks = await prisma.stock.findMany({
      where: {
        department: 'PHARMACY'
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
      },
      orderBy: [
        { totalQuantity: 'asc' }, // แสดงสต็อกต่ำก่อน
        { drug: { name: 'asc' } }
      ]
    })

    // คำนวณสถิติ
    const totalDrugs = stocks.length
    const totalValue = stocks.reduce((sum, stock) => sum + stock.totalValue, 0)
    const lowStockCount = stocks.filter(stock => 
      stock.totalQuantity <= stock.minimumStock
    ).length
    const totalQuantity = stocks.reduce((sum, stock) => sum + stock.totalQuantity, 0)

    // แปลงข้อมูลให้ตรงกับ interface
    const mappedStocks = stocks.map(stock => ({
      id: stock.id,
      drugId: stock.drugId,
      department: stock.department,
      totalQuantity: stock.totalQuantity,
      reservedQty: stock.reservedQty,
      minimumStock: stock.minimumStock,
      totalValue: stock.totalValue,
      lastUpdated: stock.lastUpdated.toISOString(),
      drug: {
        hospitalDrugCode: stock.drug.hospitalDrugCode,
        name: stock.drug.name,
        genericName: stock.drug.genericName || '',
        dosageForm: stock.drug.dosageForm,
        strength: stock.drug.strength || '',
        unit: stock.drug.unit,
        packageSize: stock.drug.packageSize || '',
        category: stock.drug.category
      }
    }))

    const responseData = {
      stocks: mappedStocks,
      stats: {
        totalDrugs,
        totalValue,
        lowStockCount,
        totalQuantity
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Pharmacy stocks API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'ไม่สามารถดึงข้อมูลสต็อกแผนกเภสัชกรรมได้',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500 
    })
  }
}