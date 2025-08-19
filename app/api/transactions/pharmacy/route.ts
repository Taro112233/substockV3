// 📄 File: app/api/transactions/pharmacy/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // ดึงข้อมูล transaction ของแผนกเภสัชกรรม
    const transactions = await prisma.stockTransaction.findMany({
      where: {
        stock: {
          department: 'PHARMACY'
        }
      },
      include: {
        stock: {
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
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
        // ⭐ ลบ transfer include ออกชั่วคราวจนกว่าจะ migrate DB
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // แสดง 100 รายการล่าสุด
    })

    // คำนวณสถิติ
    const totalTransactions = transactions.length
    const totalValue = transactions.reduce((sum, transaction) => sum + Math.abs(transaction.totalCost), 0)
    const recentTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return transactionDate >= sevenDaysAgo
    }).length

    // แปลงข้อมูลให้ตรงกับ interface
    const mappedTransactions = transactions.map((transaction: any) => ({
      id: transaction.id,
      type: transaction.type,
      quantity: transaction.quantity,
      beforeQty: transaction.beforeQty,
      afterQty: transaction.afterQty,
      unitCost: transaction.unitCost,
      totalCost: transaction.totalCost,
      reference: transaction.reference || '',
      note: transaction.note || '',
      batchNumber: transaction.batchNumber || '',
      createdAt: transaction.createdAt.toISOString(),
      drug: {
        hospitalDrugCode: transaction.stock.drug.hospitalDrugCode,
        name: transaction.stock.drug.name,
        genericName: transaction.stock.drug.genericName || '',
        dosageForm: transaction.stock.drug.dosageForm,
        strength: transaction.stock.drug.strength || '',
        unit: transaction.stock.drug.unit,
        packageSize: transaction.stock.drug.packageSize || '',
        category: transaction.stock.drug.category
      },
      user: {
        firstName: transaction.user.firstName,
        lastName: transaction.user.lastName
      },
      transfer: null // ⭐ ตั้งเป็น null ชั่วคราวจนกว่าจะ migrate DB
    }))

    const responseData = {
      transactions: mappedTransactions,
      stats: {
        totalTransactions,
        totalValue,
        recentTransactions
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Pharmacy transactions API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'ไม่สามารถดึงข้อมูลประวัติแผนกเภสัชกรรมได้',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500 
    })
  }
}