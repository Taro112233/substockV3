// 📄 File: app/api/admin/users/[userId]/status/route.ts (FIXED FOR NEXT.JS 15)
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-server'

const prisma = new PrismaClient()

// ✅ FIX: เปลี่ยน RouteParams interface สำหรับ Next.js 15
interface RouteContext {
  params: Promise<{ userId: string }> // ✅ params เป็น Promise ใน Next.js 15
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext // ✅ ใช้ RouteContext แทน inline destructuring
) {
  try {
    // ✅ FIX: await params สำหรับ Next.js 15
    const { userId } = await context.params

    // Check authentication ด้วย function ที่มีอยู่แล้ว
    const currentUser = await getServerUser()
    if (!currentUser) {
      return NextResponse.json({ 
        success: false,
        error: 'ไม่พบข้อมูลการยืนยันตัวตน' 
      }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { action } = body

    // Validate action
    if (!['approve', 'suspend', 'activate'].includes(action)) {
      return NextResponse.json({ 
        success: false,
        error: 'การดำเนินการไม่ถูกต้อง' 
      }, { status: 400 })
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }, // ✅ ใช้ userId ที่ await แล้ว
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        status: true,
        isActive: true
      }
    })

    if (!targetUser) {
      return NextResponse.json({ 
        success: false,
        error: 'ไม่พบผู้ใช้งาน' 
      }, { status: 404 })
    }

    // Prevent users from changing their own status
    if (targetUser.id === currentUser.userId) {
      return NextResponse.json({ 
        success: false,
        error: 'ไม่สามารถเปลี่ยนสถานะของตนเองได้' 
      }, { status: 400 })
    }

    // Determine new status based on action
    let newStatus: 'APPROVED' | 'SUSPENDED' | 'UNAPPROVED'
    let newIsActive: boolean
    let successMessage: string

    switch (action) {
      case 'approve':
        newStatus = 'APPROVED'
        newIsActive = true
        successMessage = `อนุมัติผู้ใช้งาน ${targetUser.firstName} ${targetUser.lastName} เรียบร้อยแล้ว`
        break
      case 'suspend':
        newStatus = 'SUSPENDED'
        newIsActive = false
        successMessage = `ระงับผู้ใช้งาน ${targetUser.firstName} ${targetUser.lastName} เรียบร้อยแล้ว`
        break
      case 'activate':
        newStatus = 'APPROVED'
        newIsActive = true
        successMessage = `เปิดใช้งานผู้ใช้ ${targetUser.firstName} ${targetUser.lastName} เรียบร้อยแล้ว`
        break
      default:
        return NextResponse.json({ 
          success: false,
          error: 'การดำเนินการไม่ถูกต้อง' 
        }, { status: 400 })
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId }, // ✅ ใช้ userId ที่ await แล้ว
      data: {
        status: newStatus,
        isActive: newIsActive,
        updatedAt: new Date()
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        status: true,
        isActive: true,
        updatedAt: true
      }
    })

    // Log the action for audit
    console.log(`User ${currentUser.username} ${action}d user ${targetUser.username} (${targetUser.firstName} ${targetUser.lastName})`)

    return NextResponse.json({
      success: true,
      message: successMessage,
      user: {
        ...updatedUser,
        fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
        updatedAt: updatedUser.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error updating user status:', error)
    return NextResponse.json({ 
      success: false,
      error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะผู้ใช้' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}