// 📄 File: app/api/health/route.ts (UPDATED - Better Logging)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Health check response interface
interface HealthData {
  status: 'ok' | 'error'
  responseTime: number
  timestamp: string
  database: 'connected' | 'disconnected'
  cached: boolean
  error?: string
  source?: string
  age?: number
}

// Cache interface
interface HealthCache {
  timestamp: number
  data: HealthData | null
}

// Simple cache
let lastCheck: HealthCache = {
  timestamp: 0,
  data: null
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
    const botResponse: HealthData = { 
      status: 'ok', 
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      database: 'connected',
      cached: false,
      source: 'bot'
    }
    return NextResponse.json(botResponse)
  }
  
  // ใช้ cache ถ้ายังไม่หมดอายุ
  const now = Date.now()
  if (lastCheck.data && (now - lastCheck.timestamp) < CACHE_DURATION) {
    console.log('📦 Serving cached health data')
    const cachedResponse: HealthData = {
      ...lastCheck.data,
      cached: true,
      age: Math.round((now - lastCheck.timestamp) / 1000)
    }
    return NextResponse.json(cachedResponse)
  }
  
  try {
    // เช็คการเชื่อมต่อฐานข้อมูลแบบง่าย
    await prisma.$queryRaw`SELECT 1`
    
    const responseTime = Date.now() - startTime
    
    const healthData: HealthData = {
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
    
    const errorData: HealthData = {
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