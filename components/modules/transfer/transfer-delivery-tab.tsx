// 📄 File: components/modules/transfer/transfer-delivery-tab.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransferDeliveryInfo } from './transfer-delivery-info'
import { TransferItemsTable } from './transfer-items-table'
import type { TransferDetails } from '@/types/transfer'
import { Truck } from 'lucide-react'

interface TransferDeliveryTabProps {
  transfer: TransferDetails
}

export function TransferDeliveryTab({ transfer }: TransferDeliveryTabProps) {
  return (
    <div className="space-y-6">
      {/* Delivery Status */}
      <TransferDeliveryInfo transfer={transfer} />
      
      {/* Delivery Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            ใบส่งของจากคลังยา
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransferItemsTable 
            items={transfer.items}
            showColumns={['dispensed', 'batch', 'pricing']}
            showDeliveryFormat={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}