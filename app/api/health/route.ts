// 📄 File: app/api/health/route.ts (Simple Version)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // เช็คการเชื่อมต่อฐานข้อมูลแบบง่าย
    await prisma.$queryRaw`SELECT 1`
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'ok',
      responseTime,
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    }, { status: 500 })
  }
}