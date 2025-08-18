// 📄 File: app/api/transactions/opd/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // ดึงข้อมูล transaction ของแผนก OPD
    const transactions = await prisma.stockTransaction.findMany({
      where: {
        stock: {
          department: 'OPD'
        }
      },
      include: {
        stock: {
          include: {
            drug: {
              select: {
                hospitalDrugCode: true,
                name: true,
                strength: true,
                unit: true
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // แสดง 50 รายการล่าสุด
    })

    // คำนวณสถิติ
    const totalTransactions = transactions.length
    const recentTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt)
      const today = new Date()
      const diffTime = Math.abs(today.getTime() - transactionDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 7 // ภายใน 7 วันที่ผ่านมา
    }).length

    // แปลงข้อมูลให้ตรงกับ interface
    const mappedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      quantity: transaction.quantity,
      beforeQty: transaction.beforeQty,
      afterQty: transaction.afterQty,
      unitCost: transaction.unitCost,
      totalCost: transaction.totalCost,
      reference: transaction.reference || '',
      note: transaction.note || '',
      createdAt: transaction.createdAt.toISOString(),
      drug: {
        hospitalDrugCode: transaction.stock.drug.hospitalDrugCode,
        name: transaction.stock.drug.name,
        strength: transaction.stock.drug.strength || '',
        unit: transaction.stock.drug.unit
      },
      user: {
        name: `${transaction.user.firstName} ${transaction.user.lastName}`
      }
    }))

    const responseData = {
      transactions: mappedTransactions,
      stats: {
        totalTransactions,
        recentTransactions
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('OPD transactions API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'ไม่สามารถดึงข้อมูลประวัติแผนก OPD ได้',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500 
    })
  }
}