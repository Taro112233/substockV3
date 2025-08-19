// 📄 File: components/modules/transfer/status-badge.tsx

import { Badge } from '@/components/ui/badge'
import { Transfer } from '@/types/dashboard'
import { 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  XCircle
} from 'lucide-react'

interface StatusBadgeProps {
  status: Transfer['status']
  size?: 'sm' | 'md' | 'lg'
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const configs = {
    PENDING: { 
      variant: 'secondary' as const, 
      text: 'รออนุมัติ', 
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    APPROVED: { 
      variant: 'default' as const, 
      text: 'อนุมัติแล้ว', 
      icon: CheckCircle,
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    SENT: { 
      variant: 'outline' as const, 
      text: 'ส่งแล้ว', 
      icon: ArrowRight,
      className: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    RECEIVED: { 
      variant: 'default' as const, 
      text: 'รับแล้ว', 
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    CANCELLED: { 
      variant: 'destructive' as const, 
      text: 'ยกเลิก', 
      icon: XCircle,
      className: 'bg-red-100 text-red-800 border-red-200'
    }
  }
  
  const config = configs[status]
  const Icon = config.icon
  
  const iconSize = size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'
  const textSize = size === 'lg' ? 'text-sm' : 'text-xs'
  
  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${textSize} font-medium`}
    >
      <Icon className={`${iconSize} mr-1`} />
      {config.text}
    </Badge>
  )
}