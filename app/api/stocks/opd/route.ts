// 📄 File: app/api/stocks/opd/route.ts (Fixed)

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // ดึงข้อมูลสต็อกของแผนก OPD
    const stocks = await prisma.stock.findMany({
      where: {
        department: 'OPD'
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
            pricePerBox: true,  // ← เพิ่ม pricePerBox
            category: true,
            isActive: true,     // ← เพิ่ม isActive
            notes: true         // ← เพิ่ม notes
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
        pricePerBox: stock.drug.pricePerBox, // ← เพิ่ม pricePerBox
        category: stock.drug.category,
        isActive: stock.drug.isActive,
        notes: stock.drug.notes || ''
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
    console.error('OPD stocks API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'ไม่สามารถดึงข้อมูลสต็อกแผนก OPD ได้',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500 
    })
  }
}