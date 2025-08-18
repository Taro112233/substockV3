// 📄 File: components/modules/transfer/transfer-card.tsx

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Transfer } from '@/types/dashboard'
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRight,
  Package
} from 'lucide-react'

interface TransferCardProps {
  transfer: Transfer
  department: 'PHARMACY' | 'OPD'
  onAction: (action: string) => void
  onViewDetail: () => void
}

export function TransferCard({ 
  transfer, 
  department, 
  onAction, 
  onViewDetail 
}: TransferCardProps) {
  
  // กำหนดสีสถานะ
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'SENT':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'RECEIVED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // แปลสถานะเป็นภาษาไทย
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'รออนุมัติ'
      case 'APPROVED':
        return 'อนุมัติแล้ว'
      case 'SENT':
        return 'ส่งแล้ว'
      case 'RECEIVED':
        return 'รับแล้ว'
      case 'CANCELLED':
        return 'ยกเลิก'
      default:
        return status
    }
  }

  // กำหนด action ที่สามารถทำได้ตามแผนกและสถานะ
  const getAvailableActions = () => {
    const actions = []

    if (transfer.status === 'PENDING') {
      if (department === 'PHARMACY' && transfer.toDepartment === 'PHARMACY') {
        // แผนกเภสัชกรรมสามารถอนุมัติใบเบิกที่เข้ามา
        actions.push({ label: 'อนุมัติ', action: 'approve', variant: 'default' as const })
        actions.push({ label: 'ปฏิเสธ', action: 'reject', variant: 'destructive' as const })
      }
    } else if (transfer.status === 'APPROVED') {
      if (department === 'PHARMACY' && transfer.fromDepartment === 'PHARMACY') {
        // แผนกเภสัชกรรมสามารถส่งยาที่อนุมัติแล้ว
        actions.push({ label: 'ส่งยา', action: 'send', variant: 'default' as const })
      }
    } else if (transfer.status === 'SENT') {
      if (department === 'OPD' && transfer.toDepartment === 'OPD') {
        // แผนก OPD สามารถรับยาที่ส่งมาแล้ว
        actions.push({ label: 'รับยา', action: 'receive', variant: 'default' as const })
      }
    }

    return actions
  }

  const availableActions = getAvailableActions()

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            {/* Transfer Number */}
            <div className="font-mono text-sm text-gray-500">
              {transfer.transferNumber}
            </div>
            
            {/* Title/Notes */}
            <h3 className="font-semibold text-sm leading-tight">
              {transfer.notes || 'ใบเบิกยา'}
            </h3>
            
            {/* Department Flow */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {transfer.fromDepartment === 'PHARMACY' ? 'เภสัชกรรม' : 'OPD'}
              </span>
              <ArrowRight className="h-3 w-3" />
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                {transfer.toDepartment === 'PHARMACY' ? 'เภสัชกรรม' : 'OPD'}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <Badge 
            className={`text-xs ${getStatusColor(transfer.status)}`}
          >
            {getStatusText(transfer.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Transfer Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">จำนวนรายการ:</span>
            <span className="font-medium">{transfer.totalItems || transfer.items.length} รายการ</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">มูลค่า:</span>
            <span className="font-medium">฿{transfer.totalValue?.toLocaleString() || '0'}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">ผู้เบิก:</span>
            <span className="font-medium">{transfer.requestedBy.name}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">วันที่เบิก:</span>
            <span className="font-medium">
              {new Date(transfer.requestedAt).toLocaleDateString('th-TH')}
            </span>
          </div>
        </div>

        {/* Items Preview */}
        {transfer.items && transfer.items.length > 0 && (
          <div className="border-t pt-3">
            <div className="text-xs text-gray-600 mb-2">รายการยา:</div>
            <div className="space-y-1">
              {transfer.items.slice(0, 2).map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="truncate flex-1 mr-2">{item.drug.name}</span>
                  <span className="text-gray-500">{item.requestedQty} {item.drug.unit}</span>
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
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetail}
            className="flex items-center gap-1 flex-1"
          >
            <Eye className="h-3 w-3" />
            ดูรายละเอียด
          </Button>

          {availableActions.length > 0 && (
            <div className="flex gap-1">
              {availableActions.map((action) => (
                <Button
                  key={action.action}
                  variant={action.variant}
                  size="sm"
                  onClick={() => onAction(action.action)}
                  className="text-xs px-3"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          อัปเดตล่าสุด: {new Date(transfer.requestedAt).toLocaleString('th-TH')}
        </div>
      </CardContent>
    </Card>
  )
}