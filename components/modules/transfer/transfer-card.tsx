// 📄 File: components/modules/transfer/transfer-card.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/modules/transfer/status-badge'
import { Transfer } from '@/types/dashboard'
import { 
  getTransferPerspectiveText, 
  getAvailableActions, 
  formatDate, 
  formatCurrency 
} from '@/lib/utils/dashboard'
import { ArrowRight, ArrowLeft, Eye } from 'lucide-react'

interface TransferCardProps {
  transfer: Transfer
  userDepartment: 'PHARMACY' | 'OPD'
  onAction?: (transferId: string, action: string) => void
  onViewDetail?: (transfer: Transfer) => void
}

export function TransferCard({ 
  transfer, 
  userDepartment, 
  onAction, 
  onViewDetail 
}: TransferCardProps) {
  const perspective = getTransferPerspectiveText(transfer, userDepartment)
  const availableActions = getAvailableActions(transfer, userDepartment)
  
  const DirectionIcon = perspective.actionType === 'outgoing' ? ArrowRight : ArrowLeft

  const getActionButton = (action: string) => {
    const buttonConfigs = {
      approve: {
        label: 'อนุมัติ',
        className: 'bg-green-600 hover:bg-green-700',
        variant: 'default' as const,
        icon: undefined
      },
      reject: {
        label: 'ปฏิเสธ',
        className: '',
        variant: 'outline' as const,
        icon: undefined
      },
      send: {
        label: 'ส่งยา',
        className: 'bg-blue-600 hover:bg-blue-700',
        variant: 'default' as const,
        icon: undefined
      },
      receive: {
        label: 'ยืนยันรับยา',
        className: 'bg-green-600 hover:bg-green-700',
        variant: 'default' as const,
        icon: undefined
      },
      cancel: {
        label: 'ยกเลิกการเบิก',
        className: '',
        variant: 'outline' as const,
        icon: undefined
      },
      view: {
        label: 'ดูรายละเอียด',
        className: '',
        variant: 'outline' as const,
        icon: Eye
      }
    }

    const config = buttonConfigs[action as keyof typeof buttonConfigs]
    if (!config) return null

    const Icon = config.icon
    
    return (
      <Button
        key={action}
        size="sm"
        variant={config.variant}
        className={config.className}
        onClick={(e) => {
          e.stopPropagation()
          if (action === 'view') {
            onViewDetail?.(transfer)
          } else {
            onAction?.(transfer.id, action)
          }
        }}
      >
        {Icon && <Icon className="h-4 w-4 mr-1" />}
        {config.label}
      </Button>
    )
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onViewDetail?.(transfer)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">
              {transfer.transferNumber}
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              <DirectionIcon className="h-4 w-4 mx-2" />
              {perspective.direction} {perspective.counterpart}
            </CardDescription>
          </div>
          <StatusBadge status={transfer.status} />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-gray-600">จำนวนรายการ</p>
            <p className="font-semibold">{transfer.totalItems} รายการ</p>
          </div>
          <div>
            <p className="text-gray-600">มูลค่า</p>
            <p className="font-semibold">{formatCurrency(transfer.totalValue)}</p>
          </div>
          <div>
            <p className="text-gray-600">ผู้ร้องขอ</p>
            <p className="font-semibold">{transfer.requestedBy}</p>
          </div>
          <div>
            <p className="text-gray-600">วันที่ร้องขอ</p>
            <p className="font-semibold">{formatDate(transfer.requestedAt)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableActions.map(action => getActionButton(action))}
        </div>
      </CardContent>
    </Card>
  )
}