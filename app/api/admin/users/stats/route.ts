// 📄 File: app/api/admin/users/stats/route.ts (Fixed ESLint warnings)
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

    // Get user statistics
    const [
      totalPending,
      totalApproved,
      totalSuspended,
      recentRegistrations
    ] = await Promise.all([
      prisma.user.count({ where: { status: 'UNAPPROVED' } }),
      prisma.user.count({ where: { status: 'APPROVED' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ 
        where: { 
          createdAt: { 
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          } 
        } 
      })
    ])

    const stats = {
      totalPending,
      totalApproved,
      totalSuspended,
      recentRegistrations
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json({ 
      success: false,
      error: 'เกิดข้อผิดพลาดในการโหลดสถิติ' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}