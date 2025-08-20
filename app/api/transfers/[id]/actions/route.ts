// 📄 File: app/api/transfers/[id]/actions/route.ts (FIXED FOR NEXT.JS 15)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerUser } from '@/lib/auth-server'
import { transferActionService } from '@/services/transfer-action-service'
import type { JWTUser } from '@/lib/auth-server'
import { Department } from '@prisma/client'

// ✅ FIX: RouteContext interface สำหรับ Next.js 15
interface RouteContext {
  params: Promise<{ id: string }>
}

// ✅ FIX: UserWithDepartment interface (ลบ duplicate)
interface UserWithDepartment extends JWTUser {
  department: Department
}

// ✅ FIX: Helper function สำหรับเพิ่ม department context
function addDepartmentContext(user: JWTUser): UserWithDepartment {
  // V3.0: กำหนด department จาก position
  let department: Department = Department.OPD // default
  
  if (user.position) {
    if (user.position.includes('คลัง') || user.position.includes('Pharmacy')) {
      department = Department.PHARMACY
    } else if (user.position.includes('OPD') || user.position.includes('ผู้ป่วยนอก')) {
      department = Department.OPD
    }
  }
  
  return {
    ...user,
    department
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext // ✅ ใช้ RouteContext แทน inline type
) {
  try {
    // ✅ FIX: await params สำหรับ Next.js 15
    const { id } = await context.params

    // ใช้ getServerUser แทนการ verify token เอง
    const user = await getServerUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, note, items } = body

    console.log(`🎬 Transfer action: ${action} by ${user.username} on transfer ${id}`)

    // Fetch current transfer
    const transfer = await prisma.transfer.findUnique({
      where: { id }, // ✅ ใช้ id ที่ await แล้ว
      include: {
        items: {
          include: {
            drug: true
          }
        }
      }
    })

    if (!transfer) {
      return NextResponse.json({ success: false, error: 'Transfer not found' }, { status: 404 })
    }

    // เพิ่ม department info ให้ user
    const userWithDept = addDepartmentContext(user)

    let updatedTransfer

    switch (action) {
      case 'approve':
        console.log(`📝 Approving transfer ${transfer.id}`)
        updatedTransfer = await transferActionService.handleApprove(transfer, userWithDept, note, items)
        break
      case 'prepare':
        console.log(`📦 Preparing transfer ${transfer.id}`)
        updatedTransfer = await transferActionService.handlePrepare(transfer, userWithDept, note, items)
        break
      case 'receive':
        console.log(`✅ Receiving transfer ${transfer.id}`)
        updatedTransfer = await transferActionService.handleReceive(transfer, userWithDept, note, items)
        break
      case 'reject':
      case 'cancel':
        console.log(`❌ Cancelling/rejecting transfer ${transfer.id}`)
        updatedTransfer = await transferActionService.handleCancel(transfer, userWithDept, note)
        break
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    console.log(`🎉 Transfer action completed successfully`)
    return NextResponse.json({
      success: true,
      data: updatedTransfer
    })

  } catch (error) {
    console.error('❌ Transfer action failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}