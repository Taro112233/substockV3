// 📄 File: hooks/useSimpleServerStatus.ts  
'use client'
import { useState, useEffect } from 'react'

type ServerStatus = 'connected' | 'connecting' | 'disconnected'

interface SimpleServerStatus {
  status: ServerStatus
  responseTime: number
  lastCheck: Date | null
}

export function useSimpleServerStatus(checkInterval = 30000) {
  const [serverStatus, setServerStatus] = useState<SimpleServerStatus>({
    status: 'connecting',
    responseTime: 0,
    lastCheck: null
  })

  const checkServerStatus = async () => {
    try {
      const startTime = Date.now()
      
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache'
      })
      
      const endTime = Date.now()
      const responseTime = endTime - startTime

      if (response.ok) {
        setServerStatus({
          status: responseTime > 1000 ? 'connecting' : 'connected',
          responseTime,
          lastCheck: new Date()
        })
      } else {
        setServerStatus({
          status: 'disconnected',
          responseTime,
          lastCheck: new Date()
        })
      }
    } catch (error) {
      setServerStatus({
        status: 'disconnected',
        responseTime: 0,
        lastCheck: new Date()
      })
    }
  }

  useEffect(() => {
    // เช็คทันทีเมื่อ component mount
    checkServerStatus()
    
    // เช็คตามช่วงเวลาที่กำหนด
    const interval = setInterval(checkServerStatus, checkInterval)
    
    return () => clearInterval(interval)
  }, [checkInterval])

  return { serverStatus, checkServerStatus }
}