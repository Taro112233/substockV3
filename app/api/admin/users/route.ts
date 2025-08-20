// 📄 File: app/api/admin/users/route.ts (Fixed ESLint warnings)
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server' // ✅ ลบ NextRequest ที่ไม่ได้ใช้
import { getServerUser } from '@/lib/auth-server'

const prisma = new PrismaClient()

export async function GET() { // ✅ ลบ request parameter ที่ไม่ได้ใช้
  try {
    // Check authentication ด้วย function ที่มีอยู่แล้ว
    const currentUser = await getServerUser()
    if (!currentUser) {
      return NextResponse.json({ 
        success: false,
        error: 'ไม่พบข้อมูลการยืนยันตัวตน' 
      }, { status: 401 })
    }

    // Get all users with their information
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        position: true,
        status: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      },
      orderBy: [
        { status: 'asc' }, // UNAPPROVED first
        { createdAt: 'desc' }
      ]
    })

    // Transform data to include fullName
    const transformedUsers = users.map(user => ({
      ...user,
      fullName: `${user.firstName} ${user.lastName}`,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString()
    }))

    return NextResponse.json({
      success: true,
      users: transformedUsers
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ 
      success: false,
      error: 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}