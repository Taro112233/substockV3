// 📄 File: components/modules/transfer/transfer-request-tab.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransferInfoCard } from './transfer-info-card'
import { TransferSignatures } from './transfer-signatures'
import { TransferItemsTable } from './transfer-items-table'
import type { TransferDetails } from '@/types/transfer'
import { Package } from 'lucide-react'

interface TransferRequestTabProps {
  transfer: TransferDetails
}

export function TransferRequestTab({ transfer }: TransferRequestTabProps) {
  return (
    <div className="space-y-6">
      {/* Transfer Info */}
      <TransferInfoCard transfer={transfer} />
      
      {/* Signatures */}
      <TransferSignatures transfer={transfer} />
      
      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            รายการยาที่ขอเบิก ({transfer.items.length} รายการ)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransferItemsTable 
            items={transfer.items} 
            showColumns={['requested', 'dispensed']}
          />
        </CardContent>
      </Card>
    </div>
  )
}