// 📄 File: app/api/transactions/pharmacy/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Department } from '@prisma/client'

// Define string literal types for enums that match Prisma schema
type DosageForm = 
  | 'APP' | 'BAG' | 'CAP' | 'CR' | 'DOP' | 'ENE' | 'GEL' | 'HAN' | 'IMP' 
  | 'INJ' | 'LIQ' | 'LOT' | 'LVP' | 'MDI' | 'MIX' | 'NAS' | 'NB' 
  | 'OIN' | 'PAT' | 'POW' | 'PWD' | 'SAC' | 'SOL' | 'SPR' | 'SUP' 
  | 'SUS' | 'SYR' | 'TAB' | 'TUR'

type DrugCategory = 
  | 'REFER' | 'HIGH_ALERT' | 'NARCOTIC' | 'REFRIGERATED' 
  | 'PSYCHIATRIC' | 'FLUID' | 'GENERAL'

// Define proper type for transaction mapping that matches actual Prisma return
interface StockTransactionWithRelations {
  id: string
  type: string
  quantity: number
  beforeQty: number
  afterQty: number
  unitCost: number
  totalCost: number
  reference: string | null
  note: string | null
  createdAt: Date
  stock: {
    drug: {
      hospitalDrugCode: string
      name: string
      genericName: string | null
      dosageForm: string  // Prisma returns string, not enum
      strength: string | null
      unit: string
      packageSize: string | null
      category: string | null  // Prisma returns string | null, not enum
    }
  }
  user: {
    firstName: string
    lastName: string
  }
}

export async function GET() {
  try {
    // ดึงข้อมูล transaction ของแผนกเภสัชกรรม
    const transactions = await prisma.stockTransaction.findMany({
      where: {
        stock: {
          department: Department.PHARMACY
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

    // แปลงข้อมูลให้ตรงกับ interface - ใช้ type assertion เพื่อความปลอดภัย
    const mappedTransactions = transactions.map((transaction: StockTransactionWithRelations) => ({
      id: transaction.id,
      type: transaction.type,
      quantity: transaction.quantity,
      beforeQty: transaction.beforeQty,
      afterQty: transaction.afterQty,
      unitCost: transaction.unitCost,
      totalCost: transaction.totalCost,
      reference: transaction.reference || '',
      note: transaction.note || '',
      batchNumber: '', // Empty string for now
      createdAt: transaction.createdAt.toISOString(),
      drug: {
        hospitalDrugCode: transaction.stock.drug.hospitalDrugCode,
        name: transaction.stock.drug.name,
        genericName: transaction.stock.drug.genericName || '',
        dosageForm: transaction.stock.drug.dosageForm as DosageForm,
        strength: transaction.stock.drug.strength || '',
        unit: transaction.stock.drug.unit,
        packageSize: transaction.stock.drug.packageSize || '',
        category: (transaction.stock.drug.category as DrugCategory) || 'GENERAL'
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