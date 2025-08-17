// 📄 File: components/modules/transaction/transaction-item.tsx

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Transaction } from '@/types/dashboard'
import { getTransactionTypeLabel, formatDate } from '@/lib/utils/dashboard'

interface TransactionItemProps {
  transaction: Transaction
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const isPositive = transaction.quantity > 0
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <Badge variant={isPositive ? 'default' : 'destructive'}>
                {getTransactionTypeLabel(transaction.type)}
              </Badge>
              {transaction.reference && (
                <span className="text-xs text-gray-500">{transaction.reference}</span>
              )}
            </div>
            
            <h3 className="font-semibold text-gray-900">
              {transaction.drugCode} - {transaction.drugName}
            </h3>
            
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                จำนวน: {isPositive ? '+' : ''}{transaction.quantity} {transaction.unit}
              </span>
              <span>โดย: {transaction.createdBy}</span>
            </div>
          </div>
          
          <div className="text-right text-sm text-gray-500">
            {formatDate(transaction.createdAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}