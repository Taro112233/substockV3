// 📄 File: components/modules/transfer/transfer-delivery-info.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from 'lucide-react'
import type { TransferDetails } from '@/types/transfer'

interface TransferDeliveryInfoProps {
  transfer: TransferDetails
}

export function TransferDeliveryInfo({ transfer }: TransferDeliveryInfoProps) {
  const getDepartmentLabel = (dept: string) => {
    return dept === 'PHARMACY' ? 'แผนกเภสัชกรรม' : 'แผนก OPD'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          ใบส่งของจากคลังยา
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">หน่วยงานที่เบิก</label>
              <p className="font-medium">{getDepartmentLabel(transfer.fromDept)}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">วันที่</label>
              <p className="font-medium">
                {formatDate(transfer.dispensedAt)}
              </p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">วัตถุประสงค์</label>
              <p className="font-medium">{transfer.purpose}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">เลขที่ใบเบิก</label>
              <p className="font-mono font-medium">{transfer.requisitionNumber}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">ผู้จ่าย</label>
              <p className="font-medium">
                {transfer.dispenser ? 
                  `${transfer.dispenser.firstName} ${transfer.dispenser.lastName}` : 
                  'รอการจ่าย'
                }
              </p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">ผู้รับ</label>
              <p className="font-medium">
                {transfer.receiver ? 
                  `${transfer.receiver.firstName} ${transfer.receiver.lastName}` : 
                  'รอการรับ'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}