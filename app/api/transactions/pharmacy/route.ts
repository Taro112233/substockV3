// 📄 File: app/api/transactions/pharmacy/route.ts
// ✅ Fixed to follow Stock API pattern - NO AUTHENTICATION REQUIRED

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // ดึงประวัติ transactions ของแผนก PHARMACY
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
                pricePerBox: true,  // ✅ เพิ่ม pricePerBox
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // แสดง 100 รายการล่าสุด
    })

    // คำนวณสถิติ
    const totalTransactions = transactions.length
    
    // ✅ คำนวณมูลค่าจริงด้วย pricePerBox
    const totalValue = transactions.reduce((sum, transaction) => {
      const pricePerBox = transaction.stock.drug.pricePerBox || 0
      const actualCost = Math.abs(transaction.quantity) * pricePerBox
      return sum + actualCost
    }, 0)
    
    const recentTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return transactionDate >= sevenDaysAgo
    }).length

    // ✅ แปลงข้อมูลให้ตรงกับ interface พร้อม pricePerBox
    const mappedTransactions = transactions.map((transaction) => {
      const pricePerBox = transaction.stock.drug.pricePerBox || 0
      const calculatedTotalCost = Math.abs(transaction.quantity) * pricePerBox
      
      return {
        id: transaction.id,
        type: transaction.type,
        quantity: transaction.quantity,
        beforeQty: transaction.beforeQty,
        afterQty: transaction.afterQty,
        reference: transaction.reference,
        note: transaction.note,
        batchNumber: transaction.batchId,
        createdAt: transaction.createdAt,
        drug: {
          hospitalDrugCode: transaction.stock.drug.hospitalDrugCode,
          name: transaction.stock.drug.name,
          genericName: transaction.stock.drug.genericName,
          dosageForm: transaction.stock.drug.dosageForm,
          strength: transaction.stock.drug.strength || '',  // ✅ Handle null
          unit: transaction.stock.drug.unit,
          packageSize: transaction.stock.drug.packageSize,
          pricePerBox: pricePerBox,  // ✅ เพิ่ม pricePerBox ใน response
          category: transaction.stock.drug.category
        },
        user: {
          firstName: transaction.user.firstName,
          lastName: transaction.user.lastName
        },
        // ✅ เพิ่ม calculated cost สำหรับ reference
        calculatedCost: calculatedTotalCost
      }
    })

    const responseData = {
      transactions: mappedTransactions,
      stats: {
        totalTransactions,
        totalValue,  // ✅ มูลค่าที่คำนวณจาก pricePerBox
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
  } finally {
    // ตรวจสอบการเชื่อมต่อ Prisma
    await prisma.$disconnect()
  }
}

// ✅ OPTIONS method สำหรับ CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}