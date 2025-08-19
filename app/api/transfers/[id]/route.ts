// 📄 File: app/api/transfers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerUser } from '@/lib/auth-server'
import type { JWTUser } from '@/lib/auth-server'
import { Department } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ใช้ getServerUser จาก auth-server แทนการ verify token เอง
    const user = await getServerUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
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

    // Check permissions - ใช้ type-safe functions
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

// Helper functions with proper typing
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

function isAdmin(user: JWTUser): boolean {
  // ใน V3.0 ไม่มี role แต่ใช้ position แทน
  return user.position === 'ผู้จัดการ' || 
         user.position === 'หัวหน้าแผนก' ||
         user.position?.includes('ผู้จัดการ') ||
         false
}