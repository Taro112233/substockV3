// 📄 File: app/api/transfers/pharmacy/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, isUserActive } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await verifyToken(token)
    
    if (!user || !isUserActive(user)) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // Check if user can access pharmacy data
    const userDepartment = getUserDepartmentFromRole(user)
    if (userDepartment !== 'PHARMACY' && !isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    console.log(`📋 Fetching pharmacy transfers for ${user.username}`)

    // Fetch transfers relevant to pharmacy
    const transfers = await prisma.transfer.findMany({
      where: {
        OR: [
          { fromDept: 'PHARMACY' }, // Outgoing from pharmacy
          { toDept: 'PHARMACY' }    // Incoming to pharmacy
        ]
      },
      include: {
        requester: {
          select: {
            firstName: true,
            lastName: true,
            position: true
          }
        },
        items: {
          include: {
            drug: {
              select: {
                name: true,
                unit: true
              }
            }
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    })

    // Calculate stats
    const stats = {
      totalTransfers: transfers.length,
      pendingTransfers: transfers.filter(t => t.status === 'PENDING').length,
      approvedTransfers: transfers.filter(t => t.status === 'APPROVED').length,
      preparedTransfers: transfers.filter(t => t.status === 'PREPARED').length,
      deliveredTransfers: transfers.filter(t => t.status === 'DELIVERED').length,
      cancelledTransfers: transfers.filter(t => t.status === 'CANCELLED').length,
    }

    console.log(`📊 Pharmacy stats: ${stats.totalTransfers} total, ${stats.pendingTransfers} pending`)

    return NextResponse.json({
      success: true,
      data: {
        transfers,
        stats
      }
    })

  } catch (error) {
    console.error('❌ Failed to fetch pharmacy transfers:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

function getUserDepartmentFromRole(user: any): 'PHARMACY' | 'OPD' {
  if (user.role && user.role.includes('PHARMACY')) {
    return 'PHARMACY'
  }
  return 'OPD'
}

function isAdmin(user: any): boolean {
  return user.role === 'ADMIN' || user.role === 'PHARMACY_MANAGER'
}