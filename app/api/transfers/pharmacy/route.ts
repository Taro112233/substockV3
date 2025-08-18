// 📄 File: app/api/transfers/pharmacy/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // ดึงข้อมูล transfer ที่เกี่ยวข้องกับแผนกเภสัชกรรม
    // ใช้ชื่อ field ที่ถูกต้องตาม schema: fromDept, toDept
    const transfers = await prisma.transfer.findMany({
      where: {
        OR: [
          { fromDept: 'PHARMACY' },
          { toDept: 'PHARMACY' }
        ]
      },
      include: {
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
        },
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
        }
      },
      orderBy: {
        requestedAt: 'desc'
      },
      take: 20 // แสดง 20 รายการล่าสุด
    })

    // คำนวณสถิติ
    const totalTransfers = transfers.length
    const pendingTransfers = transfers.filter(transfer => 
      transfer.status === 'PENDING'
    ).length
    const approvedTransfers = transfers.filter(transfer => 
      transfer.status === 'APPROVED'
    ).length

    // แปลงข้อมูลให้ตรงกับ interface
    const mappedTransfers = transfers.map(transfer => ({
      id: transfer.id,
      transferNumber: transfer.requisitionNumber, // ใช้ requisitionNumber แทน transferNumber
      fromDepartment: transfer.fromDept,
      toDepartment: transfer.toDept,
      status: transfer.status,
      priority: 'MEDIUM' as const, // ใส่ default priority เนื่องจากไม่มีใน schema
      requestedAt: transfer.requestedAt.toISOString(),
      approvedAt: transfer.approvedAt?.toISOString() || null,
      sentAt: transfer.dispensedAt?.toISOString() || null, // ใช้ dispensedAt แทน sentAt
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
        sentQty: item.dispensedQty || 0, // ใช้ dispensedQty แทน sentQty
        receivedQty: item.receivedQty || 0,
        drug: {
          hospitalDrugCode: item.drug.hospitalDrugCode,
          name: item.drug.name,
          strength: item.drug.strength || '',
          unit: item.drug.unit
        }
      })),
      notes: transfer.title || '', // ใช้ title แทน notes
      totalItems: transfer.items.length,
      totalValue: transfer.totalValue || 0
    }))

    const responseData = {
      transfers: mappedTransfers,
      stats: {
        totalTransfers,
        pendingTransfers,
        approvedTransfers
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Pharmacy transfers API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'ไม่สามารถดึงข้อมูลใบเบิกแผนกเภสัชกรรมได้',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500 
    })
  }
}