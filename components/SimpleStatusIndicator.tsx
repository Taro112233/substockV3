// 📄 File: components/SimpleStatusIndicator.tsx (FIXED)
'use client'

import React from 'react' // ✅ เพิ่ม import React
import { useSimpleServerStatus } from '@/hooks/useSimpleServerStatus'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, Loader2, RotateCcw } from 'lucide-react'

interface SimpleStatusIndicatorProps {
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  autoCheckOnMount?: boolean
}

export function SimpleStatusIndicator({ 
  showText = true, 
  size = 'sm',
  autoCheckOnMount = false
}: SimpleStatusIndicatorProps) {
  const { serverStatus, checkServerStatus } = useSimpleServerStatus()

  // ✅ เพิ่ม isChecking derived state
  const isChecking = serverStatus.status === 'connecting'

  // เช็คเมื่อ mount เฉพาะเมื่อต้องการ
  React.useEffect(() => {
    if (autoCheckOnMount && serverStatus.status === 'idle') {
      checkServerStatus()
    }
  }, [autoCheckOnMount, serverStatus.status, checkServerStatus])

  const getStatusConfig = () => {
    switch (serverStatus.status) {
      case 'connected':
        return {
          icon: <Wifi className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'}`} />,
          text: showText ? 'เชื่อมต่อแล้ว' : '',
          shortText: 'เชื่อมต่อ',
          color: 'text-green-600 hover:text-green-700',
          bg: 'hover:bg-green-50'
        }
      case 'connecting':
        return {
          icon: <Loader2 className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'} animate-spin`} />,
          text: showText ? 'กำลังเช็ค...' : '',
          shortText: 'เช็ค...',
          color: 'text-yellow-600 hover:text-yellow-700',
          bg: 'hover:bg-yellow-50'
        }
      case 'disconnected':
        return {
          icon: <WifiOff className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'}`} />,
          text: showText ? 'ไม่เชื่อมต่อ' : '',
          shortText: 'ออฟไลน์',
          color: 'text-red-600 hover:text-red-700',
          bg: 'hover:bg-red-50'
        }
      case 'idle':
      default:
        return {
          icon: <RotateCcw className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'}`} />,
          text: showText ? 'คลิกเพื่อเช็คสถานะ' : '',
          shortText: 'เช็คสถานะ',
          color: 'text-gray-600 hover:text-gray-700',
          bg: 'hover:bg-gray-50'
        }
    }
  }

  const config = getStatusConfig()

  if (!showText) {
    // แสดงแค่ไอคอนเป็น dot indicator
    return (
      <button
        onClick={checkServerStatus}
        disabled={isChecking}
        className={`${config.color} ${config.bg} p-1 rounded-full transition-colors`}
        title={config.shortText}
      >
        {config.icon}
      </button>
    )
  }

  // ✅ แก้ size prop สำหรับ Button component (ไม่มี 'md' option)
  const buttonSize = size === 'md' ? 'sm' : size // แปลง 'md' เป็น 'sm'

  return (
    <Button
      variant="ghost"
      size={buttonSize} // ✅ ใช้ buttonSize แทน size
      onClick={checkServerStatus}
      disabled={isChecking}
      className={`${config.color} ${config.bg} flex items-center gap-2`}
    >
      {config.icon}
      <span className={`font-medium ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
        {config.text}
      </span>
      {serverStatus.responseTime > 0 && (
        <span className={`opacity-75 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          ({serverStatus.responseTime}ms)
        </span>
      )}
    </Button>
  )
}