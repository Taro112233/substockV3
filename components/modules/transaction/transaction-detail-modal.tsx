// 📄 File: components/modules/transaction/transaction-detail-modal.tsx
// ⭐ ENHANCED VERSION: Supports new minimum stock fields

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
  RotateCcw,
  Target,
  Settings,
  Edit,
  ShoppingCart,
  Users,
  Bookmark
} from 'lucide-react'

interface TransactionDetailModalProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
}

// ✅ Updated Helper functions รองรับ enum ใหม่
const getTransactionTypeIcon = (type: string) => {
  switch (type) {
    case 'RECEIVE_EXTERNAL':
      return <ShoppingCart className="h-5 w-5 text-green-600" />
    case 'DISPENSE_EXTERNAL':
      return <Users className="h-5 w-5 text-red-600" />
    case 'TRANSFER_IN':
      return <TrendingUp className="h-5 w-5 text-blue-600" />
    case 'TRANSFER_OUT':
      return <TrendingDown className="h-5 w-5 text-orange-600" />
    case 'ADJUST_INCREASE':
      return <TrendingUp className="h-5 w-5 text-green-600" />
    case 'ADJUST_DECREASE':
      return <TrendingDown className="h-5 w-5 text-red-600" />
    case 'RESERVE':
      return <Bookmark className="h-5 w-5 text-yellow-600" />
    case 'UNRESERVE':
      return <RotateCcw className="h-5 w-5 text-gray-600" />
    
    // ⭐ New enum icons
    case 'MIN_STOCK_INCREASE':
      return <Target className="h-5 w-5 text-blue-600" />
    case 'MIN_STOCK_DECREASE':
      return <Target className="h-5 w-5 text-blue-400" />
    case 'MIN_STOCK_RESET':
      return <Target className="h-5 w-5 text-indigo-600" />
    case 'DATA_UPDATE':
      return <Settings className="h-5 w-5 text-gray-600" />
    case 'PRICE_UPDATE':
      return <DollarSign className="h-5 w-5 text-purple-600" />
    case 'INFO_CORRECTION':
      return <Edit className="h-5 w-5 text-orange-600" />
      
    default:
      return <Package className="h-5 w-5 text-gray-600" />
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
    },
    
    // ⭐ New enum configurations
    'MIN_STOCK_INCREASE': {
      label: 'ปรับเพิ่มขั้นต่ำ',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'การปรับเพิ่มระดับสต็อกขั้นต่ำ เพื่อให้เหมาะสมกับการใช้งาน'
    },
    'MIN_STOCK_DECREASE': {
      label: 'ปรับลดขั้นต่ำ', 
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      description: 'การปรับลดระดับสต็อกขั้นต่ำ เพื่อให้เหมาะสมกับการใช้งาน'
    },
    'MIN_STOCK_RESET': {
      label: 'กำหนดจำนวนขั้นต่ำใหม่',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: 'การกำหนดระดับสต็อกขั้นต่ำใหม่ตามนโยบายหรือความต้องการ'
    },
    'DATA_UPDATE': {
      label: 'อัปเดตข้อมูล',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      description: 'การอัปเดตข้อมูลทั่วไป ไม่มีผลต่อจำนวนสต็อก'
    },
    'PRICE_UPDATE': {
      label: 'อัปเดตราคา',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'การอัปเดตราคายาตามข้อมูลล่าสุด'
    },
    'INFO_CORRECTION': {
      label: 'แก้ไขข้อมูล',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      description: 'การแก้ไขข้อมูลยาที่ไม่ถูกต้อง เช่น ชื่อ, รหัส, หรือรายละเอียด'
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
    'HAD': 'bg-red-100 text-red-800 border-red-200',
    'NARCOTIC': 'bg-purple-100 text-purple-800 border-purple-200',
    'REFRIGERATED': 'bg-blue-100 text-blue-800 border-blue-200',
    'PSYCHIATRIC': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'FLUID': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'REFER': 'bg-pink-100 text-pink-800 border-pink-200',
    'ALERT': 'bg-orange-100 text-orange-800 border-orange-200',
    'EXTEMP': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'GENERAL': 'bg-gray-100 text-gray-800 border-gray-200',
    'CANCELLED': 'bg-red-100 text-red-800 border-red-200'
  }
  return colors[category as keyof typeof colors] || colors.GENERAL
}

const getCategoryLabel = (category: string) => {
  const labels = {
    'HAD': 'ยาเสี่ยงสูง',
    'NARCOTIC': 'ยาเสพติด',
    'REFRIGERATED': 'ยาแช่เย็น',
    'PSYCHIATRIC': 'ยาจิตเวช',
    'FLUID': 'สารน้ำ',
    'REFER': 'ยาส่งต่อ',
    'ALERT': 'ยาเฝ้าระวัง',
    'EXTEMP': 'ยาใช้ภายนอก',
    'GENERAL': 'ยาทั่วไป',
    'TABLET': 'ยาเม็ด',
    'SYRUP': 'ยาน้ำ',
    'INJECTION': 'ยาฉีด',
    'CANCELLED': 'ยกเลิกการใช้'
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
  
  // ⭐ ENHANCED: ตรวจสอบประเภท transaction ให้แม่นยำ
  const isStockMovement = ['RECEIVE_EXTERNAL', 'DISPENSE_EXTERNAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUST_INCREASE', 'ADJUST_DECREASE', 'RESERVE', 'UNRESERVE'].includes(transaction.type)
  const isMinStockAdjustment = ['MIN_STOCK_INCREASE', 'MIN_STOCK_DECREASE', 'MIN_STOCK_RESET'].includes(transaction.type)
  const isDataUpdate = ['DATA_UPDATE', 'PRICE_UPDATE', 'INFO_CORRECTION'].includes(transaction.type)
  
  const isPositive = ['RECEIVE_EXTERNAL', 'TRANSFER_IN', 'ADJUST_INCREASE', 'UNRESERVE', 'MIN_STOCK_INCREASE'].includes(transaction.type)

  // ✅ ใช้ pricePerBox จาก drug object
  const pricePerBox = transaction.drug.pricePerBox || 0
  const calculatedTotalCost = Math.abs(transaction.quantity) * pricePerBox

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
              
              {/* ⭐ ENHANCED: Stock Movement Details */}
              {isStockMovement && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">จำนวนสต็อกก่อนหน้า</label>
                      <p className="text-lg font-medium text-gray-700">
                        {transaction.beforeQty.toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">การเปลี่ยนแปลงสต็อก</label>
                      <div className="flex items-center gap-2">
                        {getTransactionTypeIcon(transaction.type)}
                        <p className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : '-'}{Math.abs(transaction.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">จำนวนสต็อกใหม่</label>
                      <p className="text-lg font-medium text-blue-600">
                        {transaction.afterQty.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Cost Information - แสดงเฉพาะกรณี stock movement */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600 flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ราคาต่อกล่อง
                      </label>
                      <p className="text-lg font-medium text-green-600">
                        {formatCurrency(pricePerBox)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">มูลค่ารวม</label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(calculatedTotalCost)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.abs(transaction.quantity).toLocaleString()} กล่อง × {formatCurrency(pricePerBox)}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* ⭐ ENHANCED: Minimum Stock Adjustment Details */}
              {isMinStockAdjustment && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-medium text-blue-900">การปรับระดับสต็อกขั้นต่ำ</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <label className="text-sm text-blue-600">ขั้นต่ำเดิม</label>
                        <p className="text-lg font-semibold text-blue-900 mt-1">
                          {/* ⭐ แสดงเฉพาะ beforeMinStock สำหรับ minimum stock adjustment */}
                          {transaction.beforeMinStock?.toLocaleString() || 'N/A'}
                        </p>
                      </div>

                      <div className="text-center">
                        <label className="text-sm text-blue-600">การเปลี่ยนแปลง</label>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <p className={`text-lg font-semibold ${
                            (transaction.minStockChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {/* ⭐ แสดงเฉพาะ minStockChange สำหรับ minimum stock adjustment */}
                            {(transaction.minStockChange ?? 0) >= 0 ? '+' : '-'}
                            {Math.abs(transaction.minStockChange ?? 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="text-center">
                        <label className="text-sm text-blue-600">ขั้นต่ำใหม่</label>
                        <p className="text-lg font-semibold text-blue-900 mt-1">
                          {/* ⭐ แสดงเฉพาะ afterMinStock สำหรับ minimum stock adjustment */}
                          {transaction.afterMinStock?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* หมายเหตุเพิ่มเติม */}
                    <div className="mt-4 pt-3 border-t border-blue-200">
                      <div className="bg-white p-3 rounded border text-sm">
                        <div className="text-blue-700 mb-2">
                          <span className="font-medium">หมายเหตุ:</span> การดำเนินการนี้ปรับเปลี่ยนระดับสต็อกขั้นต่ำเท่านั้น
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-blue-600">จำนวนสต็อกปัจจุบัน (ไม่เปลี่ยนแปลง):</span>
                          <span className="font-medium text-gray-700">
                            {/* ⭐ แสดงสต็อกปัจจุบันที่ไม่เปลี่ยนแปลง */}
                            {transaction.beforeQty.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ⭐ Data Update Details */}
              {isDataUpdate && (
                <>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="h-5 w-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">การอัปเดตข้อมูล</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">สต็อกปัจจุบัน:</span>
                        <span className="font-medium">{transaction.afterQty.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">การเปลี่ยนแปลงสต็อก:</span>
                        <span className="text-gray-500">0 (ไม่มีการเปลี่ยนแปลง)</span>
                      </div>

                      <div className="text-xs text-gray-500 bg-white p-3 rounded border">
                        <span className="font-medium">หมายเหตุ:</span> การดำเนินการนี้ไม่มีผลต่อจำนวนสต็อกยา เป็นการอัปเดตข้อมูลเท่านั้น
                      </div>
                    </div>
                  </div>
                </>
              )}

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