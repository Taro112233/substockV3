// 📄 File: app/api/health/route.ts (Vercel-Optimized)
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Lightweight cache
let lastHealthCheck = {
  timestamp: 0,
  status: 'unknown' as 'ok' | 'error' | 'unknown'
}

const CACHE_DURATION = 60000 // 1 นาที cache
const VERCEL_PATTERNS = [
  'vercel',
  'function-monitor', 
  'edge-monitor',
  'cdn-warming',
  'health-check',
  'monitoring',
  'pingdom',
  'uptimerobot',
  'newrelic',
  'datadog'
]

export async function GET() {
  const startTime = Date.now()
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const xForwardedFor = headersList.get('x-forwarded-for')
  const xRealIp = headersList.get('x-real-ip')
  const source = headersList.get('X-Source') || 'unknown'
  
  // ตรวจสอบ Vercel monitoring calls
  const isVercelMonitoring = VERCEL_PATTERNS.some(pattern => 
    userAgent.toLowerCase().includes(pattern)
  )
  
  const isVercelInternal = xForwardedFor?.includes('vercel') || 
                          xRealIp?.includes('vercel') ||
                          userAgent.includes('Vercel')

  if (isVercelMonitoring || isVercelInternal) {
    console.log('🔧 Vercel internal monitoring - lightweight response')
    
    // ส่งค่าง่ายๆ สำหรับ Vercel monitoring
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      source: 'vercel-monitoring'
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60', // Cache 1 นาที
        'X-Health-Source': 'vercel-optimized'
      }
    })
  }

  // สำหรับ bot monitoring อื่นๆ
  const isExternalBot = /bot|crawler|spider|monitor|ping/i.test(userAgent) && 
                       !userAgent.includes('Chrome') && 
                       !userAgent.includes('Firefox') &&
                       !userAgent.includes('Safari')

  if (isExternalBot) {
    console.log(`🤖 External bot detected: ${userAgent.substring(0, 50)}`)
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      source: 'bot'
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache 5 นาที
      }
    })
  }

  // สำหรับ user requests - ใช้ cache
  const now = Date.now()
  if (now - lastHealthCheck.timestamp < CACHE_DURATION && lastHealthCheck.status !== 'unknown') {
    console.log(`📦 Serving cached response to user (${source})`)
    return NextResponse.json({
      status: lastHealthCheck.status,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      cached: true,
      age: Math.round((now - lastHealthCheck.timestamp) / 1000),
      source: `user-${source}`
    })
  }

  // Full health check สำหรับ user requests
  console.log(`🔄 Full health check for user (${source})`)
  
  try {
    // ไม่ต้องเชื่อมต่อ database สำหรับ basic health check
    // เพียงแค่ตรวจสอบว่า API ทำงานได้
    const responseTime = Date.now() - startTime
    
    // อัปเดต cache
    lastHealthCheck = {
      timestamp: now,
      status: 'ok'
    }
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime,
      server: 'healthy',
      cached: false,
      source: `user-${source}`
    }, {
      headers: {
        'Cache-Control': 'private, no-cache', // ไม่ cache สำหรับ user
      }
    })
    
  } catch (error) {
    console.error('❌ Health check failed:', error)
    
    lastHealthCheck = {
      timestamp: now,
      status: 'error'
    }
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: 'Service unavailable',
      cached: false,
      source: `user-${source}`
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'private, no-cache',
      }
    })
  }
}