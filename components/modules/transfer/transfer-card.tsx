// 📄 File: components/modules/transfer/transfer-card.tsx

'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRight,
  Package,
  Truck,
  AlertTriangle
} from 'lucide-react'

interface TransferCardProps {
  transfer: {
    id: string
    requisitionNumber: string
    title?: string
    purpose?: string
    fromDept: 'PHARMACY' | 'OPD'
    toDept: 'PHARMACY' | 'OPD'
    status: 'PENDING' | 'APPROVED' | 'PREPARED' | 'DELIVERED' | 'CANCELLED'
    totalItems: number
    totalValue: number
    requestedAt: string
    requester: { 
      firstName: string
      lastName: string
      position?: string
    }
    items: Array<{
      id: string
      requestedQty: number
      dispensedQty?: number
      receivedQty?: number
      drug: { 
        name: string
        unit: string
      }
    }>
  }
  onQuickAction?: (action: string) => void // For simple actions like cancel/reject
}

export function TransferCard({ transfer, onQuickAction }: TransferCardProps) {
  const router = useRouter()
  const { user } = useAuth()

  // Navigate to detail page
  const handleViewDetail = () => {
    router.push(`/transfers/${transfer.id}`)
  }

  // Navigate to action page
  const handleActionNavigate = (action: string) => {
    router.push(`/transfers/${transfer.id}?action=${action}`)
  }

  // Handle quick actions that don't need navigation
  const handleQuickAction = (action: string) => {
    if (onQuickAction) {
      onQuickAction(action)
    }
  }

  // Get user perspective
  const getPerspective = () => {
    if (!user) return { type: 'view', label: 'ดูข้อมูล', action: 'ระหว่าง' }
    
    const isRequester = transfer.fromDept === user.department
    const isReceiver = transfer.toDept === user.department
    
    if (isRequester && isReceiver) {
      return { type: 'internal', label: 'โอนภายใน', action: 'ภายในแผนก' }
    } else if (isRequester) {
      return { type: 'outgoing', label: 'เบิกออก', action: 'จ่ายให้' }
    } else if (isReceiver) {
      return { type: 'incoming', label: 'รับเข้า', action: 'รับจาก' }
    }
    
    return { type: 'view', label: 'ดูข้อมูล', action: 'ระหว่าง' }
  }

  // Get available actions based on status and perspective
  const getAvailableActions = () => {
    if (!user) return []
    
    const perspective = getPerspective()
    const actions: Array<{
      label: string
      action: string
      variant: 'default' | 'destructive' | 'outline'
      icon: any
      type: 'navigate' | 'quick' // navigate = go to action page, quick = immediate action
    }> = []

    // Actions based on status and perspective
    if (perspective.type === 'incoming') {
      // Receiving department (คลังยา) perspective
      switch (transfer.status) {
        case 'PENDING':
          actions.push({
            label: 'อนุมัติ',
            action: 'approve',
            variant: 'default',
            icon: CheckCircle,
            type: 'navigate'
          })
          actions.push({
            label: 'ปฏิเสธ',
            action: 'reject',
            variant: 'destructive',
            icon: XCircle,
            type: 'quick'
          })
          break
        case 'APPROVED':
          actions.push({
            label: 'เตรียมจ่าย',
            action: 'prepare',
            variant: 'default',
            icon: Package,
            type: 'navigate'
          })
          break
      }
    } else if (perspective.type === 'outgoing') {
      // Requesting department (OPD) perspective
      switch (transfer.status) {
        case 'PENDING':
          actions.push({
            label: 'ยกเลิก',
            action: 'cancel',
            variant: 'destructive',
            icon: XCircle,
            type: 'quick'
          })
          break
        case 'PREPARED':
          actions.push({
            label: 'รับยา',
            action: 'receive',
            variant: 'default',
            icon: CheckCircle,
            type: 'navigate'
          })
          break
        case 'DELIVERED':
          // No actions available - completed
          break
      }
    }

    return actions
  }

  // Get status configuration
  const getStatusConfig = () => {
    const configs = {
      'PENDING': { 
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        text: 'รออนุมัติ',
        icon: Clock,
        description: 'รอแผนกเภสัชกรรมอนุมัติ'
      },
      'APPROVED': { 
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        text: 'อนุมัติแล้ว',
        icon: CheckCircle,
        description: 'รอเตรียมจ่ายยา'
      },
      'PREPARED': { 
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        text: 'เตรียมจ่ายแล้ว',
        icon: Package,
        description: 'พร้อมมารับยา'
      },
      'DELIVERED': { 
        color: 'bg-green-100 text-green-700 border-green-200',
        text: 'ส่งมอบแล้ว',
        icon: CheckCircle,
        description: 'ดำเนินการเสร็จสิ้น'
      },
      'CANCELLED': { 
        color: 'bg-red-100 text-red-700 border-red-200',
        text: 'ยกเลิก',
        icon: XCircle,
        description: 'ใบเบิกถูกยกเลิก'
      }
    }
    return configs[transfer.status] || configs.PENDING
  }

  const getDepartmentLabel = (dept: string) => {
    return dept === 'PHARMACY' ? 'เภสัชกรรม' : 'OPD'
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH')
  }

  const perspective = getPerspective()
  const availableActions = getAvailableActions()
  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500 cursor-pointer"
          onClick={handleViewDetail}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            {/* Transfer Number & Type */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-gray-700">
                {transfer.requisitionNumber}
              </span>
              <Badge variant="outline" className="text-xs">
                {perspective.label}
              </Badge>
            </div>
            
            {/* Title */}
            <h3 className="font-semibold text-sm leading-tight text-gray-900">
              {transfer.title || `ใบเบิกยา - ${perspective.action}`}
            </h3>
            
            {/* Department Flow */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                {getDepartmentLabel(transfer.fromDept)}
              </span>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                {getDepartmentLabel(transfer.toDept)}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-end gap-2">
            <Badge className={`text-xs ${statusConfig.color}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.text}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Transfer Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">จำนวนรายการ:</span>
            <p className="font-medium">{transfer.totalItems} รายการ</p>
          </div>
          
          <div>
            <span className="text-gray-500">มูลค่า:</span>
            <p className="font-medium">฿{transfer.totalValue?.toLocaleString() || '0'}</p>
          </div>

          <div>
            <span className="text-gray-500">ผู้เบิก:</span>
            <p className="font-medium">
              {transfer.requester.firstName} {transfer.requester.lastName}
            </p>
          </div>

          <div>
            <span className="text-gray-500">วันที่เบิก:</span>
            <p className="font-medium">
              {formatDateTime(transfer.requestedAt)}
            </p>
          </div>
        </div>

        {/* Status Description */}
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <AlertTriangle className="h-3 w-3 inline mr-1" />
          {statusConfig.description}
        </div>

        {/* Items Preview */}
        {transfer.items && transfer.items.length > 0 && (
          <div className="border-t pt-3">
            <div className="text-xs text-gray-600 mb-2">รายการยา:</div>
            <div className="space-y-1">
              {transfer.items.slice(0, 2).map((item, index) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="truncate flex-1 mr-2">{item.drug.name}</span>
                  <span className="text-gray-500">
                    {item.requestedQty.toLocaleString()} {item.drug.unit}
                  </span>
                </div>
              ))}
              {transfer.items.length > 2 && (
                <div className="text-xs text-gray-500">
                  และอีก {transfer.items.length - 2} รายการ
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetail}
            className="flex items-center gap-1 flex-1"
          >
            <Eye className="h-3 w-3" />
            ดูรายละเอียด
          </Button>

          {availableActions.length > 0 && (
            <div className="flex gap-1">
              {availableActions.map((action) => {
                const ActionIcon = action.icon
                return (
                  <Button
                    key={action.action}
                    variant={action.variant}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (action.type === 'navigate') {
                        handleActionNavigate(action.action)
                      } else {
                        handleQuickAction(action.action)
                      }
                    }}
                    className="text-xs px-3 flex items-center gap-1"
                  >
                    <ActionIcon className="h-3 w-3" />
                    {action.label}
                  </Button>
                )
              })}
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          อัปเดตล่าสุด: {formatDateTime(transfer.requestedAt)}
        </div>
      </CardContent>
    </Card>
  )
}