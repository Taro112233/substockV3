// 📄 File: app/api/dashboard/opd/route.ts (Fixed ESLint warnings)

import { NextResponse } from 'next/server' // ✅ Fixed: ลบ NextRequest ที่ไม่ได้ใช้
import { prisma } from '@/lib/prisma'
import { Department } from '@prisma/client'

export async function GET() { // ✅ Fixed: ลบ request parameter ที่ไม่ได้ใช้
  try {
    const department = Department.OPD

    // 1. ดึงข้อมูลสต็อกทั้งหมดของแผนก OPD
    const stocks = await prisma.stock.findMany({
      where: {
        department,
        totalQuantity: {
          gt: 0 // แสดงเฉพาะยาที่มีสต็อก
        }
      },
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
            isActive: true
          }
        }
      },
      orderBy: [
        { totalQuantity: 'asc' }, // สต็อกน้อยขึ้นก่อน
        { drug: { name: 'asc' } }
      ]
    })

    // 2. ดึงข้อมูล transfers ที่เกี่ยวข้องกับ OPD
    const transfers = await prisma.transfer.findMany({
      where: {
        OR: [
          { fromDept: department },
          { toDept: department }
        ]
      },
      include: {
        items: {
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
        requester: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        approver: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      },
      take: 20 // ล่าสุด 20 รายการ
    })

    // 3. ดึงประวัติ transactions ล่าสุด
    const transactions = await prisma.stockTransaction.findMany({
      where: {
        stock: {
          department
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
      take: 50 // ล่าสุด 50 รายการ
    })

    // 4. คำนวณ dashboard stats
    const stats = {
      totalDrugs: stocks.length,
      totalValue: stocks.reduce((sum, stock) => sum + stock.totalValue, 0),
      lowStockCount: stocks.filter(stock => 
        stock.totalQuantity < stock.minimumStock && stock.minimumStock > 0
      ).length,
      totalTransfers: transfers.length,
      pendingTransfers: transfers.filter(t => t.status === 'PENDING').length,
      approvedTransfers: transfers.filter(t => t.status === 'APPROVED').length
    }

    // 5. Transform data เพื่อให้ตรงกับ UI types
    const transformedStocks = stocks.map(stock => ({
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
        category: stock.drug.category
      }
    }))

    const transformedTransfers = transfers.map(transfer => ({
      id: transfer.id,
      transferNumber: transfer.requisitionNumber,
      fromDepartment: transfer.fromDept,
      toDepartment: transfer.toDept,
      status: transfer.status,
      priority: 'MEDIUM' as const, // default priority จาก schema ไม่มี field นี้
      requestedAt: transfer.requestedAt.toISOString(),
      approvedAt: transfer.approvedAt?.toISOString() || null,
      sentAt: transfer.dispensedAt?.toISOString() || null,
      receivedAt: transfer.receivedAt?.toISOString() || null,
      requestedBy: {
        name: `${transfer.requester.firstName} ${transfer.requester.lastName}`
      },
      approvedBy: transfer.approver ? {
        name: `${transfer.approver.firstName} ${transfer.approver.lastName}`
      } : null,
      items: transfer.items.map(item => ({
        id: item.id,
        drugId: item.drugId,
        requestedQty: item.requestedQty,
        approvedQty: item.approvedQty || 0,
        sentQty: item.dispensedQty || 0,
        receivedQty: item.receivedQty || 0,
        drug: {
          hospitalDrugCode: item.drug.hospitalDrugCode,
          name: item.drug.name,
          strength: item.drug.strength || '',
          unit: item.drug.unit
        }
      })),
      notes: transfer.requestNote || ''
    }))

    const transformedTransactions = transactions.map(transaction => ({
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

    return NextResponse.json({
      success: true,
      data: {
        stocks: transformedStocks,
        transfers: transformedTransfers,
        transactions: transformedTransactions,
        stats
      }
    })

  } catch (error) {
    console.error('OPD Dashboard API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch OPD dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}