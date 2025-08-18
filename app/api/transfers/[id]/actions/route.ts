// 📄 File: app/api/transfers/[id]/actions/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma, updateStockAfterTransfer } from '@/lib/prisma'
import { verifyToken, isUserActive } from '@/lib/auth'
import { transferActionService } from '@/services/transfer-action-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await verifyToken(token)
    
    if (!user || !isUserActive(user)) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
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
    const userWithDept = {
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

function getUserDepartmentFromRole(user: any): 'PHARMACY' | 'OPD' {
  if (user.role && user.role.includes('PHARMACY')) {
    return 'PHARMACY'
  }
  return 'OPD'
}