// 📄 File: components/modules/transaction/transaction-item.tsx (ปรับปรุงแล้ว)
// ✅ Updated Transaction Item with New TransactionType Enum

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
  Trash2,
  ShoppingCart,
  Users,
  Bookmark
} from 'lucide-react'

interface TransactionItemProps {
  transaction: Transaction
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  
  // ✅ Updated: กำหนดไอคอนและสีตามประเภท transaction ใหม่
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'RECEIVE_EXTERNAL':
        return { icon: ShoppingCart, color: 'text-green-600' }
      case 'DISPENSE_EXTERNAL':
        return { icon: Users, color: 'text-red-600' }
      case 'TRANSFER_IN':
        return { icon: TrendingUp, color: 'text-blue-600' }
      case 'TRANSFER_OUT':
        return { icon: TrendingDown, color: 'text-orange-600' }
      case 'ADJUST_INCREASE':
        return { icon: ArrowUpRight, color: 'text-green-600' }
      case 'ADJUST_DECREASE':
        return { icon: ArrowDownLeft, color: 'text-red-600' }
      case 'RESERVE':
        return { icon: Bookmark, color: 'text-yellow-600' }
      case 'UNRESERVE':
        return { icon: RefreshCw, color: 'text-gray-600' }
      default:
        return { icon: Package, color: 'text-gray-600' }
    }
  }

  // ✅ Updated: แปลประเภท transaction เป็นภาษาไทย
  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'RECEIVE_EXTERNAL':
        return 'รับจากภายนอก'
      case 'DISPENSE_EXTERNAL':
        return 'จ่ายให้ผู้ป่วย'
      case 'TRANSFER_IN':
        return 'รับโอนจากแผนกอื่น'
      case 'TRANSFER_OUT':
        return 'ส่งโอนให้แผนกอื่น'
      case 'ADJUST_INCREASE':
        return 'ปรับเพิ่ม'
      case 'ADJUST_DECREASE':
        return 'ปรับลด'
      case 'RESERVE':
        return 'จองยา'
      case 'UNRESERVE':
        return 'ยกเลิกจอง'
      default:
        return type
    }
  }

  // ✅ Updated: กำหนดสี badge ตามประเภท
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'RECEIVE_EXTERNAL':
      case 'ADJUST_INCREASE':
      case 'TRANSFER_IN':
      case 'UNRESERVE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'DISPENSE_EXTERNAL':
      case 'ADJUST_DECREASE':
      case 'TRANSFER_OUT':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'RESERVE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const { icon: Icon, color } = getTransactionIcon(transaction.type)
  const isIncoming = ['RECEIVE_EXTERNAL', 'ADJUST_INCREASE', 'TRANSFER_IN', 'UNRESERVE'].includes(transaction.type)

  // ✅ Calculate transaction cost using pricePerBox
  const transactionCost = Math.abs(transaction.quantity) * (transaction.drug?.pricePerBox || 0)

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
                <h4 className="font-medium text-sm">{transaction.drug?.name || 'ยาไม่ระบุ'}</h4>
                <div className="text-xs text-gray-500">
                  {transaction.drug?.hospitalDrugCode}
                  {transaction.drug?.strength && ` • ${transaction.drug.strength}`}
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
                  {isIncoming ? '+' : ''}{transaction.quantity.toLocaleString()} {transaction.drug?.unit || 'หน่วย'}
                </div>
                <div className="text-gray-500 text-xs">
                  {transaction.beforeQty.toLocaleString()} → {transaction.afterQty.toLocaleString()}
                </div>
              </div>

              {/* Cost - ✅ Fixed with pricePerBox */}
              {transactionCost > 0 && (
                <div className="text-sm text-gray-600">
                  ฿{transactionCost.toLocaleString()}
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
              <div>โดย: {transaction.user.firstName} {transaction.user.lastName}</div>
              <div>{new Date(transaction.createdAt).toLocaleString('th-TH')}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}