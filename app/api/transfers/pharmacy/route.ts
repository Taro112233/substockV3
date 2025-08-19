// 📄 File: app/api/transfers/pharmacy/route.ts

import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { Department, TransferStatus } from '@prisma/client'

export async function GET() {
  try {
    // ตรวจสอบ authentication
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // ดึงข้อมูล transfers สำหรับ pharmacy perspective
    const transfers = await prisma.transfer.findMany({
      where: {
        OR: [
          { fromDept: Department.PHARMACY }, // ส่งจากคลังยา
          { toDept: Department.PHARMACY }    // รับเข้าคลังยา
        ]
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        },
        items: {
          include: {
            drug: {
              select: {
                hospitalDrugCode: true,
                name: true,
                strength: true,
                unit: true,
                pricePerBox: true
              }
            }
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      },
      take: 50 // จำกัดผลลัพธ์
    })

    // คำนวณ stats แบบ type-safe
    const stats = {
      totalTransfers: transfers.length,
      pendingTransfers: transfers.filter(t => t.status === TransferStatus.PENDING).length,
      approvedTransfers: transfers.filter(t => t.status === TransferStatus.APPROVED).length
    }

    // Transform data สำหรับ frontend
    const transformedTransfers = transfers.map(transfer => ({
      id: transfer.id,
      transferNumber: transfer.requisitionNumber,
      fromDepartment: transfer.fromDept,
      toDepartment: transfer.toDept,
      status: transfer.status,
      priority: 'MEDIUM' as const, // Type-safe constant
      requestedAt: transfer.requestedAt.toISOString(),
      approvedAt: transfer.approvedAt?.toISOString() || null,
      sentAt: transfer.dispensedAt?.toISOString() || null,
      receivedAt: transfer.receivedAt?.toISOString() || null,
      requestedBy: {
        id: transfer.requester.id,
        name: `${transfer.requester.firstName} ${transfer.requester.lastName}`
      },
      approvedBy: transfer.approver ? {
        id: transfer.approver.id,
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

    return NextResponse.json({
      success: true,
      data: {
        transfers: transformedTransfers,
        stats
      }
    })

  } catch (error) {
    console.error('Pharmacy transfers API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transfer data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}