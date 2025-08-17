// 📄 File: components/modules/dashboard/transfer-tab.tsx

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Transfer } from '@/types/dashboard'
import { 
  getTransferPerspective, 
  formatDateTime, 
  getStatusColor, 
  getDepartmentLabel 
} from '@/lib/utils/dashboard'
import { 
  Plus, 
  FileText, 
  Package, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Send, 
  Clock,
  ArrowRight
} from 'lucide-react'

interface TransferTabProps {
  transfers: Transfer[]
  department: 'PHARMACY' | 'OPD'
  onTransferAction: () => void
  onViewDetail: (transfer: Transfer) => void
}

interface TransferCardProps {
  transfer: Transfer
  userDepartment: 'PHARMACY' | 'OPD'
  onViewDetail: (transfer: Transfer) => void
  onAction: (action: string, transfer: Transfer) => void
}

// Transfer Card Component
function TransferCard({ 
  transfer, 
  userDepartment, 
  onViewDetail, 
  onAction 
}: TransferCardProps) {
  const perspective = getTransferPerspective(transfer, userDepartment)
  
  // คำนวณจำนวนรายการและมูลค่า
  const totalItems = transfer.items.length
  const totalValue = transfer.items.reduce((sum, item) => {
    const qty = item.receivedQty || item.sentQty || item.approvedQty || item.requestedQty
    return sum + (qty * 50) // ประมาณราคาเฉลี่ย 50 บาท/หน่วย
  }, 0)

  // กำหนด actions ตาม perspective และ status
  const getAvailableActions = () => {
    const actions = []

    if (perspective.type === 'OUTGOING') {
      // Pharmacy perspective - ผู้จ่าย
      if (transfer.status === 'PENDING') {
        actions.push({ 
          label: 'อนุมัติ', 
          action: 'APPROVE', 
          icon: CheckCircle, 
          variant: 'default' as const,
          color: 'text-green-600'
        })
        actions.push({ 
          label: 'ปฏิเสธ', 
          action: 'REJECT', 
          icon: XCircle, 
          variant: 'outline' as const,
          color: 'text-red-600'
        })
      } else if (transfer.status === 'APPROVED') {
        actions.push({ 
          label: 'ส่งของ', 
          action: 'SEND', 
          icon: Send, 
          variant: 'default' as const,
          color: 'text-blue-600'
        })
      }
    } else {
      // OPD perspective - ผู้รับ
      if (transfer.status === 'SENT') {
        actions.push({ 
          label: 'รับของ', 
          action: 'RECEIVE', 
          icon: Package, 
          variant: 'default' as const,
          color: 'text-green-600'
        })
      }
      if (transfer.status === 'PENDING') {
        actions.push({ 
          label: 'ยกเลิก', 
          action: 'CANCEL', 
          icon: XCircle, 
          variant: 'outline' as const,
          color: 'text-red-600'
        })
      }
    }

    return actions
  }

  const availableActions = getAvailableActions()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">
                {transfer.transferNumber}
              </h3>
              <Badge className={getStatusColor(transfer.status)}>
                {transfer.status === 'PENDING' && 'รอดำเนินการ'}
                {transfer.status === 'APPROVED' && 'อนุมัติแล้ว'}
                {transfer.status === 'SENT' && 'ส่งแล้ว'}
                {transfer.status === 'RECEIVED' && 'รับแล้ว'}
                {transfer.status === 'CANCELLED' && 'ยกเลิก'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">
                {perspective.action}
              </span>
              <ArrowRight className="h-3 w-3" />
              <span>
                {getDepartmentLabel(perspective.counterpart)}
              </span>
            </div>
          </div>

          <div className="text-right text-sm text-gray-500">
            <Clock className="h-4 w-4 inline mr-1" />
            {formatDateTime(transfer.requestedAt)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Transfer Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">รายการ:</span>
            <span className="ml-2 font-medium">{totalItems} รายการ</span>
          </div>
          <div>
            <span className="text-gray-500">มูลค่า:</span>
            <span className="ml-2 font-medium">{formatCurrency(totalValue)}</span>
          </div>
        </div>

        {/* Requester Info */}
        <div className="text-sm">
          <span className="text-gray-500">ผู้ขอ:</span>
          <span className="ml-2">{transfer.requestedBy.name}</span>
        </div>

        {/* Notes */}
        {transfer.notes && (
          <div className="text-sm">
            <span className="text-gray-500">หมายเหตุ:</span>
            <p className="mt-1 text-gray-700 bg-gray-50 p-2 rounded text-xs">
              {transfer.notes}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetail(transfer)}
            className="flex items-center gap-1"
          >
            <Eye className="h-3 w-3" />
            ดูรายละเอียด
          </Button>

          {availableActions.map((action) => (
            <Button
              key={action.action}
              variant={action.variant}
              size="sm"
              onClick={() => onAction(action.action, transfer)}
              className={`flex items-center gap-1 ${action.color}`}
            >
              <action.icon className="h-3 w-3" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Main Transfer Tab Component
export function TransferTab({ 
  transfers, 
  department, 
  onTransferAction, 
  onViewDetail 
}: TransferTabProps) {
  const [activeTab, setActiveTab] = useState('all')

  // แยกใบเบิกตาม perspective
  const outgoingTransfers = transfers.filter(transfer => 
    transfer.fromDepartment === department
  )
  
  const incomingTransfers = transfers.filter(transfer => 
    transfer.toDepartment === department
  )

  const handleAction = async (action: string, transfer: Transfer) => {
    console.log(`Performing ${action} on transfer ${transfer.id}`)
    
    // TODO: Implement actual API calls
    switch (action) {
      case 'APPROVE':
        // await approveTransfer(transfer.id)
        break
      case 'REJECT':
        // await rejectTransfer(transfer.id)
        break
      case 'SEND':
        // await sendTransfer(transfer.id)
        break
      case 'RECEIVE':
        // await receiveTransfer(transfer.id)
        break
      case 'CANCEL':
        // await cancelTransfer(transfer.id)
        break
    }
    
    onTransferAction()
  }

  const getDepartmentLabel = (dept: 'PHARMACY' | 'OPD') => {
    return dept === 'PHARMACY' ? 'เภสัชกรรม' : 'OPD'
  }

  const getTabLabel = (type: string) => {
    if (department === 'PHARMACY') {
      return {
        'outgoing': 'ใบเบิก (จ่าย)',
        'incoming': 'ใบเบิก (รับ)',
        'all': 'ทั้งหมด'
      }[type]
    } else {
      return {
        'outgoing': 'ใบเบิก (ขอ)',
        'incoming': 'ใบรับของ',
        'all': 'ทั้งหมด'
      }[type]
    }
  }

  if (transfers.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          ไม่มีใบเบิกในระบบ
        </h3>
        <p className="text-gray-600 mb-6">
          เริ่มต้นสร้างใบเบิกใหม่เพื่อจัดการการโอนยา
        </p>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          สร้างใบเบิกใหม่
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with New Transfer Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          การจัดการใบเบิก - {getDepartmentLabel(department)}
        </h2>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          สร้างใบเบิกใหม่
        </Button>
      </div>

      {/* Transfer Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {getTabLabel('all')} ({transfers.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            {getTabLabel('outgoing')} ({outgoingTransfers.length})
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {getTabLabel('incoming')} ({incomingTransfers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {transfers.map((transfer) => (
              <TransferCard
                key={transfer.id}
                transfer={transfer}
                userDepartment={department}
                onViewDetail={onViewDetail}
                onAction={handleAction}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-4">
          {outgoingTransfers.length > 0 ? (
            <div className="grid gap-4">
              {outgoingTransfers.map((transfer) => (
                <TransferCard
                  key={transfer.id}
                  transfer={transfer}
                  userDepartment={department}
                  onViewDetail={onViewDetail}
                  onAction={handleAction}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Send className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">ไม่มีใบเบิกประเภทนี้</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="incoming" className="space-y-4">
          {incomingTransfers.length > 0 ? (
            <div className="grid gap-4">
              {incomingTransfers.map((transfer) => (
                <TransferCard
                  key={transfer.id}
                  transfer={transfer}
                  userDepartment={department}
                  onViewDetail={onViewDetail}
                  onAction={handleAction}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">ไม่มีใบเบิกประเภทนี้</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Transfer Statistics */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-lg text-blue-600">
              {transfers.filter(t => t.status === 'PENDING').length}
            </div>
            <div className="text-gray-600">รอดำเนินการ</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-lg text-green-600">
              {transfers.filter(t => t.status === 'APPROVED').length}
            </div>
            <div className="text-gray-600">อนุมัติแล้ว</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-lg text-purple-600">
              {transfers.filter(t => t.status === 'SENT').length}
            </div>
            <div className="text-gray-600">ส่งแล้ว</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-lg text-gray-900">
              {transfers.filter(t => t.status === 'RECEIVED').length}
            </div>
            <div className="text-gray-600">เสร็จสิ้น</div>
          </div>
        </div>
      </div>
    </div>
  )
}