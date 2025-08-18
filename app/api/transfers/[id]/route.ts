// 📄 File: app/api/transfers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, isUserActive } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ดึง token จาก cookie (middleware จะส่งมาให้แล้วถ้า valid)
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await verifyToken(token)
    
    if (!user || !isUserActive(user)) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    console.log(`🔍 Transfer detail request by: ${user.username} (${user.userId})`)

    // Fetch transfer details
    const transfer = await prisma.transfer.findUnique({
      where: { id: params.id },
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
                dosageForm: true,
                strength: true,
                unit: true,
                packageSize: true,
                pricePerBox: true,
                category: true
              }
            }
          },
          orderBy: {
            drug: {
              name: 'asc'
            }
          }
        }
      }
    })

    if (!transfer) {
      return NextResponse.json({ success: false, error: 'Transfer not found' }, { status: 404 })
    }

    // Check permissions - ใช้ department จาก JWT payload
    const userDepartment = getUserDepartmentFromRole(user)
    const canView = (
      transfer.fromDept === userDepartment ||
      transfer.toDept === userDepartment ||
      isAdmin(user)
    )

    if (!canView) {
      console.log(`❌ Access denied for user ${user.username} to transfer ${transfer.id}`)
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    console.log(`✅ Transfer ${transfer.id} accessed successfully`)
    return NextResponse.json({
      success: true,
      data: transfer
    })

  } catch (error) {
    console.error('❌ Failed to fetch transfer:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Helper functions
function getUserDepartmentFromRole(user: any): 'PHARMACY' | 'OPD' {
  // สมมติว่า role บอกได้ว่าอยู่แผนกไหน
  if (user.role && user.role.includes('PHARMACY')) {
    return 'PHARMACY'
  }
  return 'OPD'
}

function isAdmin(user: any): boolean {
  return user.role === 'ADMIN' || user.role === 'PHARMACY_MANAGER'
}