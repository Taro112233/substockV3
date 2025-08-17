// 📄 File: components/modules/transaction/transaction-item.tsx

import { Card, CardContent } from '@/components/ui/card'
import { Transaction } from '@/types/dashboard'
import { getTransactionTypeLabel, formatDateTime } from '@/lib/utils/dashboard'
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle,
  RefreshCw,
  ArrowLeftRight 
} from 'lucide-react'

interface TransactionItemProps {
  transaction: Transaction
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RECEIVE':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'DISPENSE':
        return <TrendingDown className="h-4 w-4 text-blue-600" />
      case 'ADJUST_IN':
        return <TrendingUp className="h-4 w-4 text-purple-600" />
      case 'ADJUST_OUT':
        return <TrendingDown className="h-4 w-4 text-orange-600" />
      case 'TRANSFER_IN':
        return <ArrowLeftRight className="h-4 w-4 text-green-600" />
      case 'TRANSFER_OUT':
        return <ArrowLeftRight className="h-4 w-4 text-blue-600" />
      case 'EXPIRE':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'DAMAGED':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <RefreshCw className="h-4 w-4 text-gray-600" />
    }
  }

  const getQuantityColor = (type: string) => {
    if (['RECEIVE', 'ADJUST_IN', 'TRANSFER_IN'].includes(type)) {
      return 'text-green-600'
    } else if (['DISPENSE', 'ADJUST_OUT', 'TRANSFER_OUT', 'EXPIRE', 'DAMAGED'].includes(type)) {
      return 'text-red-600'
    }
    return 'text-gray-600'
  }

  const formatQuantity = (quantity: number, type: string) => {
    const prefix = ['RECEIVE', 'ADJUST_IN', 'TRANSFER_IN'].includes(type) ? '+' : '-'
    return `${prefix}${Math.abs(quantity).toLocaleString()}`
  }

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Icon */}
            <div className="mt-1">
              {getTypeIcon(transaction.type)}
            </div>

            {/* Transaction Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">
                    {transaction.drug.hospitalDrugCode} - {transaction.drug.name}
                  </h4>
                  {transaction.drug.strength && (
                    <p className="text-xs text-gray-500 mt-1">
                      {transaction.drug.strength}
                    </p>
                  )}
                </div>

                <div className="text-right ml-4">
                  <div className={`font-medium ${getQuantityColor(transaction.type)}`}>
                    {formatQuantity(transaction.quantity, transaction.type)} {transaction.drug.unit}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {transaction.beforeQty} → {transaction.afterQty}
                  </div>
                </div>
              </div>

              {/* Transaction Type and User */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="font-medium">
                    {getTransactionTypeLabel(transaction.type)}
                  </span>
                  <span>โดย {transaction.user.name}</span>
                </div>
                
                <div className="text-xs text-gray-500">
                  {formatDateTime(transaction.createdAt)}
                </div>
              </div>

              {/* Reference and Note */}
              {(transaction.reference || transaction.note) && (
                <div className="mt-2 text-xs">
                  {transaction.reference && (
                    <div className="text-gray-600">
                      <span className="font-medium">อ้างอิง:</span> {transaction.reference}
                    </div>
                  )}
                  {transaction.note && (
                    <div className="text-gray-600 mt-1">
                      <span className="font-medium">หมายเหตุ:</span> {transaction.note}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}