// 📄 File: app/api/health/route.ts (UPDATED - Better Logging)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Simple cache
let lastCheck = {
  timestamp: 0,
  data: null as any
}
const CACHE_DURATION = 30000 // 30 วินาที

export async function GET() {
  const startTime = Date.now()
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const source = headersList.get('X-Source') || 'unknown'
  
  // Log การเรียกใช้
  console.log(`🏥 Health check called - Source: ${source}, UA: ${userAgent.substring(0, 50)}...`)
  
  // ตรวจสอบ bot traffic
  const isBot = /bot|crawler|spider|monitor|ping|vercel/i.test(userAgent)
  if (isBot) {
    console.log('🤖 Bot detected - serving lightweight response')
    return NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      source: 'bot'
    })
  }
  
  // ใช้ cache ถ้ายังไม่หมดอายุ
  const now = Date.now()
  if (lastCheck.data && (now - lastCheck.timestamp) < CACHE_DURATION) {
    console.log('📦 Serving cached health data')
    return NextResponse.json({
      ...lastCheck.data,
      cached: true,
      age: Math.round((now - lastCheck.timestamp) / 1000)
    })
  }
  
  try {
    // เช็คการเชื่อมต่อฐานข้อมูลแบบง่าย
    await prisma.$queryRaw`SELECT 1`
    
    const responseTime = Date.now() - startTime
    
    const healthData = {
      status: 'ok',
      responseTime,
      timestamp: new Date().toISOString(),
      database: 'connected',
      cached: false
    }
    
    // Cache ผลลัพธ์
    lastCheck = {
      timestamp: now,
      data: healthData
    }
    
    console.log(`✅ Health check OK - ${responseTime}ms`)
    return NextResponse.json(healthData)
    
  } catch (error) {
    console.error('❌ Health check failed:', error)
    
    const errorData = {
      status: 'error',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed',
      cached: false
    }
    
    return NextResponse.json(errorData, { status: 500 })
  }
}