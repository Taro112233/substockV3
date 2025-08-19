// 📄 File: app/api/transfers/[id]/actions/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerUser } from '@/lib/auth-server'
import { transferActionService } from '@/services/transfer-action-service'
import type { JWTUser } from '@/lib/auth-server'
import { Department } from '@prisma/client'

// Define proper interface for user with department context
interface UserWithDepartment extends JWTUser {
  department: Department
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ใช้ getServerUser แทนการ verify token เอง
    const user = await getServerUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, note, items } = body

    console.log(`🎬 Transfer action: ${action} by ${user.username} on transfer ${params.id}`)

    // Fetch current transfer
    const transfer = await prisma.transfer.findUnique({
      where: { id: params.id },
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
    const userWithDept: UserWithDepartment = {
      ...user,
      department: getUserDepartmentFromRole(user)
    }

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

function getUserDepartmentFromRole(user: JWTUser): Department {
  // ในระบบ V3.0 ไม่มี fixed department ใน user profile
  // แต่เพื่อความเข้ากันได้ เราจะใช้ logic เดิม
  // จริงๆ แล้วควรส่ง department context มาจาก frontend
  
  // สมมติว่า position บอกได้ว่าอยู่แผนกไหน
  if (user.position && user.position.includes('คลัง')) {
    return Department.PHARMACY
  }
  return Department.OPD
}