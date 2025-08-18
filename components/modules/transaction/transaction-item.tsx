// 📄 File: components/modules/transaction/transaction-item.tsx

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Transaction } from '@/types/dashboard'
import {
  TrendingUp,
  TrendingDown,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  AlertTriangle,
  Trash2
} from 'lucide-react'

interface TransactionItemProps {
  transaction: Transaction
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  
  // กำหนดไอคอนและสีตามประเภท transaction
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'RECEIVE':
        return { icon: TrendingUp, color: 'text-green-600' }
      case 'DISPENSE':
        return { icon: TrendingDown, color: 'text-red-600' }
      case 'ADJUST_IN':
        return { icon: ArrowUpRight, color: 'text-blue-600' }
      case 'ADJUST_OUT':
        return { icon: ArrowDownLeft, color: 'text-orange-600' }
      case 'TRANSFER_IN':
        return { icon: Package, color: 'text-green-600' }
      case 'TRANSFER_OUT':
        return { icon: Package, color: 'text-red-600' }
      case 'EXPIRE':
        return { icon: AlertTriangle, color: 'text-yellow-600' }
      case 'DAMAGED':
        return { icon: Trash2, color: 'text-red-600' }
      default:
        return { icon: RefreshCw, color: 'text-gray-600' }
    }
  }

  // แปลประเภท transaction เป็นภาษาไทย
  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'RECEIVE':
        return 'รับเข้า'
      case 'DISPENSE':
        return 'จ่ายออก'
      case 'ADJUST_IN':
        return 'ปรับเพิ่ม'
      case 'ADJUST_OUT':
        return 'ปรับลด'
      case 'TRANSFER_IN':
        return 'โอนเข้า'
      case 'TRANSFER_OUT':
        return 'โอนออก'
      case 'EXPIRE':
        return 'หมดอายุ'
      case 'DAMAGED':
        return 'เสียหาย'
      default:
        return type
    }
  }

  // กำหนดสี badge ตามประเภท
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'RECEIVE':
      case 'ADJUST_IN':
      case 'TRANSFER_IN':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'DISPENSE':
      case 'ADJUST_OUT':
      case 'TRANSFER_OUT':
      case 'DAMAGED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'EXPIRE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const { icon: Icon, color } = getTransactionIcon(transaction.type)
  const isIncoming = ['RECEIVE', 'ADJUST_IN', 'TRANSFER_IN'].includes(transaction.type)

  return (
    <Card className="hover:shadow-sm transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Transaction Icon */}
          <div className={`p-2 rounded-full bg-gray-50 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Transaction Details */}
          <div className="flex-1 space-y-1">
            {/* Drug Info */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">{transaction.drug.name}</h4>
                <div className="text-xs text-gray-500">
                  {transaction.drug.hospitalDrugCode}
                  {transaction.drug.strength && ` • ${transaction.drug.strength}`}
                </div>
              </div>
              
              {/* Type Badge */}
              <Badge 
                className={`text-xs ${getBadgeColor(transaction.type)}`}
              >
                {getTransactionTypeText(transaction.type)}
              </Badge>
            </div>

            {/* Quantity & Stock Info */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className={`font-medium ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
                  {isIncoming ? '+' : ''}{transaction.quantity.toLocaleString()} {transaction.drug.unit}
                </div>
                <div className="text-gray-500 text-xs">
                  {transaction.beforeQty.toLocaleString()} → {transaction.afterQty.toLocaleString()}
                </div>
              </div>

              {/* Cost */}
              {transaction.totalCost > 0 && (
                <div className="text-sm text-gray-600">
                  ฿{transaction.totalCost.toLocaleString()}
                </div>
              )}
            </div>

            {/* Reference & Note */}
            {(transaction.reference || transaction.note) && (
              <div className="text-xs text-gray-500 space-y-1">
                {transaction.reference && (
                  <div>อ้างอิง: {transaction.reference}</div>
                )}
                {transaction.note && (
                  <div>หมายเหตุ: {transaction.note}</div>
                )}
              </div>
            )}

            {/* User & Timestamp */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t">
              <div>โดย: {transaction.user.name}</div>
              <div>{new Date(transaction.createdAt).toLocaleString('th-TH')}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}