// 📄 File: components/modules/transaction/transaction-detail-modal.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Transaction } from '@/types/dashboard'
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Hash,
  Pill,
  User,
  FileText,
  DollarSign,
  X,
  ArrowRight,
  RotateCcw
} from 'lucide-react'

interface TransactionDetailModalProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
}

// Helper functions
const getTransactionTypeIcon = (type: string) => {
  switch (type) {
    case 'RECEIVE_EXTERNAL':
    case 'TRANSFER_IN':
    case 'ADJUST_INCREASE':
    case 'UNRESERVE':
      return <TrendingUp className="h-5 w-5 text-green-600" />
    case 'DISPENSE_EXTERNAL':
    case 'TRANSFER_OUT':
    case 'ADJUST_DECREASE':
    case 'RESERVE':
      return <TrendingDown className="h-5 w-5 text-red-600" />
    default:
      return <RotateCcw className="h-5 w-5 text-blue-600" />
  }
}

const getTransactionTypeInfo = (type: string) => {
  const config = {
    'RECEIVE_EXTERNAL': { 
      label: 'รับยาจากภายนอก', 
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'การรับยาเข้าสต็อกจากแหล่งภายนอก เช่น ซัพพลายเออร์ หรือ โรงพยาบาลอื่น'
    },
    'DISPENSE_EXTERNAL': { 
      label: 'จ่ายยาให้ผู้ป่วย', 
      color: 'bg-red-100 text-red-800 border-red-200',
      description: 'การจ่ายยาให้กับผู้ป่วยหรือหน่วยงานภายนอก'
    },
    'TRANSFER_IN': { 
      label: 'รับโอนยาเข้า', 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'การรับยาที่โอนมาจากแผนกอื่นภายในโรงพยาบาล'
    },
    'TRANSFER_OUT': { 
      label: 'โอนยาออก', 
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      description: 'การโอนยาไปยังแผนกอื่นภายในโรงพยาบาล'
    },
    'ADJUST_INCREASE': { 
      label: 'ปรับเพิ่มสต็อก', 
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'การปรับเพิ่มจำนวนสต็อก เช่น การนับสต็อก หรือ การแก้ไขข้อมูล'
    },
    'ADJUST_DECREASE': { 
      label: 'ปรับลดสต็อก', 
      color: 'bg-red-100 text-red-800 border-red-200',
      description: 'การปรับลดจำนวนสต็อก เช่น การหมดอายุ การเสียหาย หรือ การแก้ไขข้อมูล'
    },
    'RESERVE': { 
      label: 'จองยา', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      description: 'การจองยาสำหรับการใช้งานในอนาคต'
    },
    'UNRESERVE': { 
      label: 'ยกเลิกการจอง', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      description: 'การยกเลิกการจองยาที่เคยจองไว้'
    }
  }
  
  return config[type as keyof typeof config] || { 
    label: type, 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'ประเภทการเคลื่อนไหวอื่นๆ'
  }
}

const getCategoryColor = (category: string) => {
  const colors = {
    'HIGH_ALERT': 'bg-red-100 text-red-800 border-red-200',
    'NARCOTIC': 'bg-purple-100 text-purple-800 border-purple-200',
    'REFRIGERATED': 'bg-blue-100 text-blue-800 border-blue-200',
    'PSYCHIATRIC': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'FLUID': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'GENERAL': 'bg-gray-100 text-gray-800 border-gray-200'
  }
  return colors[category as keyof typeof colors] || colors.GENERAL
}

const getCategoryLabel = (category: string) => {
  const labels = {
    'HIGH_ALERT': 'ยาเสี่ยงสูง',
    'NARCOTIC': 'ยาเสพติด',
    'REFRIGERATED': 'ยาแช่เย็น',
    'PSYCHIATRIC': 'ยาจิตเวช',
    'FLUID': 'สารน้ำ',
    'GENERAL': 'ยาทั่วไป'
  }
  return labels[category as keyof typeof labels] || category
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2
  }).format(amount)
}

export function TransactionDetailModal({ 
  transaction, 
  isOpen, 
  onClose 
}: TransactionDetailModalProps) {
  if (!transaction) return null

  const transactionTypeInfo = getTransactionTypeInfo(transaction.type)
  const categoryColor = getCategoryColor(transaction.drug.category)
  const categoryLabel = getCategoryLabel(transaction.drug.category)
  const isPositive = ['RECEIVE_EXTERNAL', 'TRANSFER_IN', 'ADJUST_INCREASE', 'UNRESERVE'].includes(transaction.type)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            รายละเอียดการเคลื่อนไหวสต็อก
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Type Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTransactionTypeIcon(transaction.type)}
                  <span>ประเภทการเคลื่อนไหว</span>
                </div>
                <Badge className={transactionTypeInfo.color}>
                  {transactionTypeInfo.label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{transactionTypeInfo.description}</p>
            </CardContent>
          </Card>

          {/* Drug Information Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>ข้อมูลยา</span>
                <Badge className={categoryColor}>
                  {categoryLabel}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <Pill className="h-4 w-4" />
                    ชื่อยา
                  </label>
                  <p className="font-medium">{transaction.drug.name}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    รหัสยา
                  </label>
                  <p className="font-mono text-sm">{transaction.drug.hospitalDrugCode}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">ชื่อสามัญ</label>
                  <p className="text-sm">{transaction.drug.genericName || '-'}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">รูปแบบ</label>
                  <p className="text-sm">{transaction.drug.dosageForm}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">ความแรง</label>
                  <p className="text-sm">{transaction.drug.strength} {transaction.drug.unit}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">ขนาดบรรจุ</label>
                  <p className="text-sm">{transaction.drug.packageSize || '-'}</p>
                </div>
              </div>

              {/* Batch Number */}
              {transaction.batchNumber && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-600">LOT/Batch Number</label>
                  <p className="font-mono text-sm mt-1">{transaction.batchNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">รายละเอียดการเคลื่อนไหว</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quantity Change */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">จำนวนก่อนหน้า</label>
                  <p className="text-lg font-medium text-gray-700">
                    {transaction.beforeQty.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">การเปลี่ยนแปลง</label>
                  <div className="flex items-center gap-2">
                    {getTransactionTypeIcon(transaction.type)}
                    <p className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : '-'}{Math.abs(transaction.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">จำนวนหลังการเปลี่ยนแปลง</label>
                  <p className="text-lg font-medium text-blue-600">
                    {transaction.afterQty.toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Cost Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    ต้นทุนต่อหน่วย
                  </label>
                  <p className="text-lg font-medium text-green-600">
                    {formatCurrency(transaction.unitCost)}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">มูลค่ารวม</label>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(Math.abs(transaction.totalCost))}
                  </p>
                </div>
              </div>

              <Separator />

              {/* References */}
              <div className="space-y-3">
                {transaction.reference && (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600 flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      เลขที่อ้างอิง
                    </label>
                    <p className="font-mono text-sm bg-gray-50 p-2 rounded">
                      {transaction.reference}
                    </p>
                  </div>
                )}

                {transaction.transfer && (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600 flex items-center gap-1">
                      <ArrowRight className="h-4 w-4" />
                      เลขที่ใบโอน
                    </label>
                    <p className="font-mono text-sm bg-blue-50 p-2 rounded text-blue-800">
                      {transaction.transfer.requisitionNumber}
                    </p>
                  </div>
                )}

                {transaction.note && (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">หมายเหตุ</label>
                    <p className="text-sm bg-gray-50 p-3 rounded italic">
                      {transaction.note}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User & Timestamp Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">ข้อมูลการบันทึก</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <User className="h-4 w-4" />
                    ผู้ทำรายการ
                  </label>
                  <p className="font-medium">
                    {transaction.user.firstName} {transaction.user.lastName}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    วันที่และเวลา
                  </label>
                  <p className="text-sm">
                    {new Date(transaction.createdAt).toLocaleString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              ปิด
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}