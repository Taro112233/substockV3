// 📄 File: components/SimpleStatusIndicator.tsx
'use client'
import { useSimpleServerStatus } from '@/hooks/useSimpleServerStatus'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'

export function SimpleStatusIndicator() {
  const { serverStatus, checkServerStatus } = useSimpleServerStatus()

  const getStatusConfig = () => {
    switch (serverStatus.status) {
      case 'connected':
        return {
          icon: <Wifi className="w-4 h-4" />,
          text: 'เชื่อมต่อแล้ว (คลิกเพื่อเช็คสถานะ)',
          color: 'text-green-600 hover:text-green-700',
          bg: 'hover:bg-green-50'
        }
      case 'connecting':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'กำลังเชื่อมต่อ (คลิกเพื่อลองใหม่)',
          color: 'text-yellow-600 hover:text-yellow-700',
          bg: 'hover:bg-yellow-50'
        }
      case 'disconnected':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          text: 'ไม่เชื่อมต่อ (คลิกเพื่อลองใหม่)',
          color: 'text-red-600 hover:text-red-700',
          bg: 'hover:bg-red-50'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={checkServerStatus}
      className={`${config.color} ${config.bg} flex items-center gap-2 px-3 py-2`}
    >
      {config.icon}
      <span className="text-sm font-medium">{config.text}</span>
      {serverStatus.responseTime > 0 && (
        <span className="text-xs opacity-75">
          ({serverStatus.responseTime}ms)
        </span>
      )}
    </Button>
  )
}