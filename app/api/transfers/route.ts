// 📄 File: app/api/transfers/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { Prisma, Department, TransferStatus } from '@prisma/client'

// Define proper types for better type safety using Prisma types
interface TransferItem {
  drugId: string
  requestedQty: number
  unitPrice?: number
  itemNote?: string
}

interface CreateTransferRequest {
  requisitionNumber: string
  title: string
  fromDept: Department
  toDept: Department
  purpose: string
  requestNote?: string
  items: TransferItem[]
  requesterId: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const department = searchParams.get('department') as Department | null
    const status = searchParams.get('status') as TransferStatus | null

    // Use Prisma-generated types for where clause
    const where: Prisma.TransferWhereInput = {}
    
    if (department) {
      // Show transfers related to the department
      where.OR = [
        { fromDept: department },
        { toDept: department }
      ]
    }

    if (status) {
      where.status = status as TransferStatus
    }

    const transfers = await prisma.transfer.findMany({
      where,
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
        dispenser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        },
        receiver: {
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
                genericName: true,
                unit: true,
                dosageForm: true,
                strength: true
              }
            }
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    })

    return NextResponse.json(transfers)

  } catch (error) {
    console.error('Transfers fetch error:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลการโอนได้' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTransferRequest = await request.json()
    const { 
      requisitionNumber, 
      title, 
      fromDept,
      toDept, 
      purpose, 
      requestNote, 
      items,
      requesterId
    } = body

    // Validate required fields
    if (!requisitionNumber || !title || !fromDept || !toDept || !purpose || !items || !requesterId) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'ต้องมีรายการยาอย่างน้อย 1 รายการ' },
        { status: 400 }
      )
    }

    // Check if requisition number already exists
    const existingTransfer = await prisma.transfer.findUnique({
      where: { requisitionNumber }
    })

    if (existingTransfer) {
      return NextResponse.json(
        { error: 'เลขที่ใบเบิกซ้ำ' },
        { status: 400 }
      )
    }

    // Calculate totals
    const totalItems = items.length
    const totalValue = items.reduce((sum: number, item: TransferItem) => 
      sum + (item.requestedQty * (item.unitPrice || 0)), 0
    )

    // Create transfer with items
    const transfer = await prisma.transfer.create({
      data: {
        requisitionNumber,
        title,
        fromDept,
        toDept,
        requesterId,
        purpose,
        requestNote,
        totalItems,
        totalValue,
        items: {
          create: items.map((item: TransferItem) => ({
            drugId: item.drugId,
            requestedQty: item.requestedQty,
            unitPrice: item.unitPrice || 0,
            totalValue: item.requestedQty * (item.unitPrice || 0),
            itemNote: item.itemNote
          }))
        }
      },
      include: {
        items: {
          include: {
            drug: {
              select: {
                hospitalDrugCode: true,
                name: true,
                genericName: true,
                unit: true,
                dosageForm: true,
                strength: true
              }
            }
          }
        },
        requester: {
          select: {
            firstName: true,
            lastName: true,
            position: true
          }
        }
      }
    })

    return NextResponse.json(transfer)

  } catch (error) {
    console.error('Transfer creation error:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถสร้างใบโอนได้' },
      { status: 500 }
    )
  }
}