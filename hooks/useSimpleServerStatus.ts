// 📄 File: hooks/useSimpleServerStatus.ts (FIXED - No Auto Polling)
'use client'
import { useState, useCallback } from 'react'

type ServerStatus = 'connected' | 'connecting' | 'disconnected' | 'idle'

interface SimpleServerStatus {
  status: ServerStatus
  responseTime: number
  lastCheck: Date | null
}

// Singleton cache เพื่อแชร์สถานะระหว่าง components
const statusCache = {
  status: 'idle' as ServerStatus,
  responseTime: 0,
  lastCheck: null as Date | null,
  lastCheckTime: 0
}

const CACHE_DURATION = 30000 // 30 วินาที cache

export function useSimpleServerStatus() {
  const [serverStatus, setServerStatus] = useState<SimpleServerStatus>(() => ({
    status: statusCache.status,
    responseTime: statusCache.responseTime,
    lastCheck: statusCache.lastCheck
  }))

  const checkServerStatus = useCallback(async () => {
    const now = Date.now()
    
    // ใช้ cached result ถ้ายังไม่หมดอายุ
    if (now - statusCache.lastCheckTime < CACHE_DURATION && statusCache.status !== 'idle') {
      console.log('📦 Using cached server status')
      const cachedStatus = {
        status: statusCache.status,
        responseTime: statusCache.responseTime,
        lastCheck: statusCache.lastCheck
      }
      setServerStatus(cachedStatus)
      return cachedStatus
    }

    // แสดงสถานะ connecting ขณะเช็ค
    const connectingStatus = {
      status: 'connecting' as ServerStatus,
      responseTime: 0,
      lastCheck: statusCache.lastCheck
    }
    setServerStatus(connectingStatus)

    try {
      console.log('🔄 Checking server status...')
      const startTime = Date.now()
      
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'X-Source': 'manual-check'
        }
      })
      
      const endTime = Date.now()
      const responseTime = endTime - startTime

      let status: ServerStatus
      if (response.ok) {
        status = responseTime > 1000 ? 'connecting' : 'connected'
        console.log(`✅ Server is ${status} (${responseTime}ms)`)
      } else {
        status = 'disconnected'
        console.log(`❌ Server disconnected (${responseTime}ms)`)
      }

      const newStatus = {
        status,
        responseTime,
        lastCheck: new Date()
      }

      // อัปเดต cache
      statusCache.status = status
      statusCache.responseTime = responseTime
      statusCache.lastCheck = newStatus.lastCheck
      statusCache.lastCheckTime = now

      setServerStatus(newStatus)
      return newStatus

    } catch (error) {
      console.error('❌ Server status check failed:', error)
      
      const errorStatus = {
        status: 'disconnected' as ServerStatus,
        responseTime: 0,
        lastCheck: new Date()
      }

      // อัปเดต cache
      statusCache.status = 'disconnected'
      statusCache.responseTime = 0
      statusCache.lastCheck = errorStatus.lastCheck
      statusCache.lastCheckTime = now

      setServerStatus(errorStatus)
      return errorStatus
    }
  }, [])

  return { 
    serverStatus, 
    checkServerStatus,
    isOnline: serverStatus.status === 'connected',
    isChecking: serverStatus.status === 'connecting'
  }
}