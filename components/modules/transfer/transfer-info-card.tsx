// 📄 File: components/modules/transfer/transfer-info-card.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, FileText } from 'lucide-react'
import type { TransferDetails } from '@/types/transfer'

interface TransferInfoCardProps {
  transfer: TransferDetails
}

export function TransferInfoCard({ transfer }: TransferInfoCardProps) {
  const getDepartmentLabel = (dept: string) => {
    return dept === 'PHARMACY' ? 'แผนกคลังยา' : 'แผนก OPD'
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          ข้อมูลการเบิก
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">เลขที่ใบเบิก</label>
              <p className="font-mono font-medium text-lg">{transfer.requisitionNumber}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">ชื่อใบเบิก</label>
              <p className="font-medium">{transfer.title}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">วัตถุประสงค์</label>
              <p className="font-medium">{transfer.purpose}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">วันที่เบิก</label>
              <p className="font-medium">{formatDateTime(transfer.requestedAt)}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">หน่วยงานที่เบิก</label>
              <p className="font-medium">{getDepartmentLabel(transfer.fromDept)}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">หน่วยงานที่ขอเบิก</label>
              <p className="font-medium">{getDepartmentLabel(transfer.toDept)}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">จำนวนรายการ</label>
              <p className="font-medium">{transfer.totalItems} รายการ</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">มูลค่ารวม</label>
              <p className="font-medium text-lg">฿{transfer.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        {transfer.requestNote && (
          <div>
            <label className="text-sm text-gray-500 flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              หมายเหตุการขอเบิก
            </label>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
              {transfer.requestNote}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}