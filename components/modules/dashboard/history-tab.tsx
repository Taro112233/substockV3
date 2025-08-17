// 📄 File: components/modules/dashboard/history-tab.tsx

import { Button } from '@/components/ui/button'
import { TransactionItem } from '@/components/modules/transaction/transaction-item'
import { Transaction } from '@/types/dashboard'
import { ArrowRightLeft } from 'lucide-react'

interface HistoryTabProps {
  transactions: Transaction[]
  onExport?: () => void
}

export function HistoryTab({ transactions, onExport }: HistoryTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">ประวัติการเคลื่อนไหว</h2>
        <Button variant="outline" onClick={onExport}>
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          ส่งออก Excel
        </Button>
      </div>

      <div className="space-y-3">
        {transactions.map((transaction) => (
          <TransactionItem 
            key={transaction.id} 
            transaction={transaction} 
          />
        ))}
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>ยังไม่มีประวัติการเคลื่อนไหว</p>
        </div>
      )}
    </div>
  )
}