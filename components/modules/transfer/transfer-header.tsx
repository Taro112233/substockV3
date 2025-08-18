// 📄 File: components/modules/transfer/transfer-header.tsx

'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import type { TransferDetails } from '@/types/transfer'

interface TransferHeaderProps {
  transfer: TransferDetails
  statusConfig: {
    text: string
    color: string
    icon: any
  }
  onBack: () => void
}

export function TransferHeader({ transfer, statusConfig, onBack }: TransferHeaderProps) {
  const StatusIcon = statusConfig.icon
  
  const getPerspectiveLabel = () => {
    // This would come from transfer utils
    return 'ดูข้อมูล' // Simplified for now
  }
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
        
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              ใบเบิก {transfer.requisitionNumber}
            </h1>
            <Badge className={statusConfig.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.text}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {transfer.title} • {getPerspectiveLabel()}
          </p>
        </div>
      </div>
    </div>
  )
}