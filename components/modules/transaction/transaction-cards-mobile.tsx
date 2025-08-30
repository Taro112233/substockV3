// 📄 File: components/modules/transaction/transaction-cards-mobile.tsx
// ⭐ ENHANCED: Mobile transaction cards with minimum stock support - FIXED LAYOUT

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Transaction } from '@/types/dashboard'
import { 
  TrendingUp, 
  TrendingDown,
  Search,
  ChevronRight,
  History,
  RotateCcw,
  User,
  DollarSign,
  ShoppingCart,
  Users,
  Bookmark,
  Settings,
  Edit,
  Target
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { TransactionDetailModal } from './transaction-detail-modal'

interface FilteredStatsData {
  totalTransactions: number
  totalValue: number
  incomingCount: number
  outgoingCount: number
}

interface TransactionCardsMobileProps {
  transactions: Transaction[]
  department: 'PHARMACY' | 'OPD'
  onView?: (transaction: Transaction) => void
  onFilteredStatsChange?: (stats: FilteredStatsData) => void
  loading?: boolean
}

export function TransactionCardsMobile({ 
  transactions,
  onFilteredStatsChange,
  loading = false 
}: TransactionCardsMobileProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // ✅ Helper functions รองรับ enum ใหม่
  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'RECEIVE_EXTERNAL':
        return <ShoppingCart className="h-4 w-4 text-green-600" />
      case 'DISPENSE_EXTERNAL':
        return <Users className="h-4 w-4 text-red-600" />
      case 'TRANSFER_IN':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'TRANSFER_OUT':
        return <TrendingDown className="h-4 w-4 text-orange-600" />
      case 'ADJUST_INCREASE':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'ADJUST_DECREASE':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'RESERVE':
        return <Bookmark className="h-4 w-4 text-yellow-600" />
      case 'UNRESERVE':
        return <RotateCcw className="h-4 w-4 text-gray-600" />
      case 'MIN_STOCK_INCREASE':
        return <Target className="h-4 w-4 text-blue-600" />
      case 'MIN_STOCK_DECREASE':
        return <Target className="h-4 w-4 text-blue-400" />
      case 'MIN_STOCK_RESET':
        return <Target className="h-4 w-4 text-indigo-600" />
      case 'DATA_UPDATE':
        return <Settings className="h-4 w-4 text-gray-600" />
      case 'PRICE_UPDATE':
        return <DollarSign className="h-4 w-4 text-purple-600" />
      case 'INFO_CORRECTION':
        return <Edit className="h-4 w-4 text-orange-600" />
      default:
        return <Settings className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionTypeBadge = (type: string) => {
    const config = {
      'RECEIVE_EXTERNAL': { 
        label: 'รับจากภายนอก', 
        color: 'bg-green-100 text-green-800 border-green-200' 
      },
      'DISPENSE_EXTERNAL': { 
        label: 'จ่ายให้ผู้ป่วย', 
        color: 'bg-red-100 text-red-800 border-red-200' 
      },
      'TRANSFER_IN': { 
        label: 'รับโอนจากแผนกอื่น', 
        color: 'bg-blue-100 text-blue-800 border-blue-200' 
      },
      'TRANSFER_OUT': { 
        label: 'ส่งโอนให้แผนกอื่น', 
        color: 'bg-orange-100 text-orange-800 border-orange-200' 
      },
      'ADJUST_INCREASE': { 
        label: 'ปรับเพิ่มสต็อก', 
        color: 'bg-green-100 text-green-800 border-green-200' 
      },
      'ADJUST_DECREASE': { 
        label: 'ปรับลดสต็อก', 
        color: 'bg-red-100 text-red-800 border-red-200' 
      },
      'RESERVE': { 
        label: 'จองยา', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      },
      'UNRESERVE': { 
        label: 'ยกเลิกจอง', 
        color: 'bg-gray-100 text-gray-800 border-gray-200' 
      },
      'MIN_STOCK_INCREASE': {
        label: 'ปรับเพิ่มขั้นต่ำ',
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      'MIN_STOCK_DECREASE': {
        label: 'ปรับลดขั้นต่ำ', 
        color: 'bg-orenge-100 text-orenge-700 border-orenge-200'
      },
      'MIN_STOCK_RESET': {
        label: 'กำหนดจำนวนขั้นต่ำใหม่',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
      },
      'DATA_UPDATE': {
        label: 'อัปเดตข้อมูล',
        color: 'bg-gray-100 text-gray-800 border-gray-200'
      },
      'PRICE_UPDATE': {
        label: 'อัปเดตราคา',
        color: 'bg-purple-100 text-purple-800 border-purple-200'
      },
      'INFO_CORRECTION': {
        label: 'แก้ไขข้อมูล',
        color: 'bg-orange-100 text-orange-800 border-orange-200'
      }
    }
    
    const typeConfig = config[type as keyof typeof config] || { 
      label: type, 
      color: 'bg-gray-100 text-gray-800 border-gray-200' 
    }
    
    return (
      <Badge variant="outline" className={`text-xs ${typeConfig.color}`}>
        {typeConfig.label}
      </Badge>
    )
  }

  const formatTransactionAmount = (type: string, quantity: number, transaction: Transaction) => {
    const isIncoming = ['RECEIVE_EXTERNAL', 'TRANSFER_IN', 'ADJUST_INCREASE', 'UNRESERVE'].includes(type)
    const isMinStockChange = ['MIN_STOCK_INCREASE', 'MIN_STOCK_DECREASE', 'MIN_STOCK_RESET'].includes(type)
    const isDataUpdate = ['DATA_UPDATE', 'PRICE_UPDATE', 'INFO_CORRECTION'].includes(type)
    
    if (isDataUpdate) {
      return <span className="text-gray-500 text-xs">ไม่เปลี่ยนแปลง</span>
    }
    
    if (isMinStockChange) {
      // ⭐ ใช้ minStockChange ถ้ามี หรือใช้ quantity แทน
      const changeAmount = transaction.minStockChange ?? quantity
      return (
        <span className="font-medium text-blue-600">
          {changeAmount >= 0 ? '+' : ''}{changeAmount.toLocaleString()} ขั้นต่ำ
        </span>
      )
    }
    
    return (
      <span className={`font-medium ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
        {isIncoming ? '+' : '-'}{Math.abs(quantity).toLocaleString()}
      </span>
    )
  }

  const calculateTransactionCost = (transaction: Transaction) => {
    const pricePerBox = transaction.drug?.pricePerBox || 0
    return Math.abs(transaction.quantity) * pricePerBox
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

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const transactionDate = new Date(dateString)
    const diffMs = now.getTime() - transactionDate.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) {
      return `${diffMins} นาทีที่แล้ว`
    } else if (diffHours < 24) {
      return `${diffHours} ชั่วโมงที่แล้ว`
    } else if (diffDays < 7) {
      return `${diffDays} วันที่แล้ว`
    } else {
      return transactionDate.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || 
        transaction.drug?.name?.toLowerCase().includes(searchLower) ||
        transaction.drug?.hospitalDrugCode?.toLowerCase().includes(searchLower) ||
        transaction.drug?.genericName?.toLowerCase().includes(searchLower) ||
        transaction.reference?.toLowerCase().includes(searchLower) ||
        transaction.note?.toLowerCase().includes(searchLower)

      const matchesType = typeFilter === 'all' || transaction.type === typeFilter

      let matchesDate = true
      if (dateFilter !== 'all' && transaction.createdAt) {
        const transactionDate = new Date(transaction.createdAt)
        const now = new Date()
        switch (dateFilter) {
          case 'today':
            matchesDate = transactionDate.toDateString() === now.toDateString()
            break
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesDate = transactionDate >= weekAgo
            break
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            matchesDate = transactionDate >= monthAgo
            break
        }
      }

      return matchesSearch && matchesType && matchesDate
    })
  }, [transactions, searchTerm, typeFilter, dateFilter])

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    const totalTransactions = filteredTransactions.length
    const totalValue = filteredTransactions.reduce((sum, t) => sum + calculateTransactionCost(t), 0)
    const incomingCount = filteredTransactions.filter(t => 
      ['RECEIVE_EXTERNAL', 'ADJUST_INCREASE', 'TRANSFER_IN', 'UNRESERVE'].includes(t.type)
    ).length
    const outgoingCount = filteredTransactions.filter(t => 
      ['DISPENSE_EXTERNAL', 'ADJUST_DECREASE', 'TRANSFER_OUT', 'RESERVE'].includes(t.type)
    ).length

    return { totalTransactions, totalValue, incomingCount, outgoingCount }
  }, [filteredTransactions])

  useEffect(() => {
    if (onFilteredStatsChange) {
      onFilteredStatsChange(filteredStats)
    }
  }, [filteredStats, onFilteredStatsChange])

  // Handlers
  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsModalOpen(true)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setTypeFilter('all')
    setDateFilter('all')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Mobile Search and Filter Section */}
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ค้นหา (ชื่อยา, รหัส, ชื่อสามัญ, เอกสารอ้างอิง)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filter Row */}
          <div className="flex items-center gap-2">
            {/* Type Filter - ✅ Updated: รวม enum ใหม่ */}
            <div className="flex-1">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="ประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  <SelectItem value="RECEIVE_EXTERNAL">รับจากภายนอก</SelectItem>
                  <SelectItem value="DISPENSE_EXTERNAL">จ่ายให้ผู้ป่วย</SelectItem>
                  <SelectItem value="TRANSFER_IN">รับโอนจากแผนกอื่น</SelectItem>
                  <SelectItem value="TRANSFER_OUT">ส่งโอนให้แผนกอื่น</SelectItem>
                  <SelectItem value="ADJUST_INCREASE">ปรับเพิ่มสต็อก</SelectItem>
                  <SelectItem value="ADJUST_DECREASE">ปรับลดสต็อก</SelectItem>
                  <SelectItem value="RESERVE">จองยา</SelectItem>
                  <SelectItem value="UNRESERVE">ยกเลิกจอง</SelectItem>
                  <SelectItem value="MIN_STOCK_INCREASE">ปรับเพิ่มขั้นต่ำ</SelectItem>
                  <SelectItem value="MIN_STOCK_DECREASE">ปรับลดขั้นต่ำ</SelectItem>
                  <SelectItem value="MIN_STOCK_RESET">กำหนดจำนวนขั้นต่ำใหม่</SelectItem>
                  <SelectItem value="DATA_UPDATE">อัปเดตข้อมูล</SelectItem>
                  <SelectItem value="PRICE_UPDATE">อัปเดตราคา</SelectItem>
                  <SelectItem value="INFO_CORRECTION">แก้ไขข้อมูล</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="flex-1">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="ช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="today">วันนี้</SelectItem>
                  <SelectItem value="week">7 วันที่ผ่านมา</SelectItem>
                  <SelectItem value="month">30 วันที่ผ่านมา</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || typeFilter !== 'all' || dateFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center justify-center shrink-0 w-10 h-10 bg-red-500 text-white hover:bg-red-600 border-red-500"
                title="ล้างตัวกรอง"
              >
                ✕
              </Button>
            )}
          </div>
        </div>

        {/* Transaction Cards */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm || typeFilter !== 'all' || dateFilter !== 'all' ? (
                <div className="space-y-3">
                  <History className="h-12 w-12 mx-auto text-gray-400" />
                  <div className="text-gray-500">ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</div>
                  <Button variant="link" size="sm" onClick={clearFilters}>
                    ล้างตัวกรอง
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <History className="h-12 w-12 mx-auto text-gray-400" />
                  <div className="text-gray-500">ไม่มีประวัติการเคลื่อนไหว</div>
                  <div className="text-sm text-gray-400">ยังไม่มีการบันทึกการเคลื่อนไหวสต็อกในระบบ</div>
                </div>
              )}
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const categoryColor = getCategoryColor(transaction.drug?.category)
              const categoryLabel = getCategoryLabel(transaction.drug?.category)
              const transactionCost = calculateTransactionCost(transaction)
              
              // ⭐ Check transaction types
              const isStockMovement = ['RECEIVE_EXTERNAL', 'DISPENSE_EXTERNAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUST_INCREASE', 'ADJUST_DECREASE', 'RESERVE', 'UNRESERVE'].includes(transaction.type)
              const isMinStockAdjustment = ['MIN_STOCK_INCREASE', 'MIN_STOCK_DECREASE', 'MIN_STOCK_RESET'].includes(transaction.type)
              const isDataUpdate = ['DATA_UPDATE', 'PRICE_UPDATE', 'INFO_CORRECTION'].includes(transaction.type)

              return (
                <Card 
                  key={transaction.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewTransaction(transaction)}
                >
                  <CardContent className="p-4">
                    {/* Header Row: Drug Name + Transaction Type */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="font-medium text-gray-900 leading-tight mb-1">
                          {transaction.drug?.name || 'ยาไม่ระบุ'}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${categoryColor} shrink-0`}
                          >
                            {categoryLabel}
                          </Badge>
                          <span className="text-xs text-gray-600 font-mono">
                            {transaction.drug?.hospitalDrugCode || '-'}
                          </span>
                        </div>
                      </div>

                      {/* Transaction Type Badge */}
                      <div className="flex items-center gap-1 shrink-0">
                        {getTransactionTypeIcon(transaction.type)}
                        {getTransactionTypeBadge(transaction.type)}
                      </div>
                    </div>

                    {/* Drug Details Row */}
                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <span className="text-gray-600">รูปแบบ:</span>
                        <div className="font-medium">{transaction.drug?.dosageForm || '-'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">ความแรง:</span>
                        <div className="font-medium">
                          {transaction.drug?.strength || ''} {transaction.drug?.unit || ''}
                        </div>
                      </div>
                    </div>

                    {/* Quantity and Value Row */}
                    <div className="flex justify-between items-center mb-3">
                      {/* Quantity Change */}
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-600">จำนวน:</div>
                        <div className="flex items-center gap-1">
                          {getTransactionTypeIcon(transaction.type)}
                          {formatTransactionAmount(transaction.type, transaction.quantity, transaction)}
                        </div>
                      </div>

                      {/* Transaction Value - แสดงเฉพาะ stock movement */}
                      {transactionCost > 0 && isStockMovement && (
                        <div className="text-right">
                          <div className="font-bold text-sm text-purple-600">
                            ฿{transactionCost.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            @฿{(transaction.drug?.pricePerBox || 0).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ⭐ ENHANCED Stock/Minimum Change Display */}
                    <div className="flex justify-between items-center mb-3 text-sm">
                      {isStockMovement && (
                        <>
                          <div className="text-gray-600">
                            สต็อก: {transaction.beforeQty.toLocaleString()} → {transaction.afterQty.toLocaleString()}
                          </div>
                          {transaction.batchNumber && (
                            <div className="text-xs text-gray-500 font-mono">
                              LOT: {transaction.batchNumber}
                            </div>
                          )}
                        </>
                      )}

                      {isMinStockAdjustment && (
                        <div className="flex-1 bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">การปรับระดับขั้นต่ำ</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <div className="text-blue-600">ขั้นต่ำเดิม</div>
                              <div className="font-semibold text-blue-900">
                                {transaction.beforeMinStock?.toLocaleString() || 'N/A'}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-blue-600">เปลี่ยน</div>
                              <div className={`font-semibold ${
                                (transaction.minStockChange ?? transaction.quantity) >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {(transaction.minStockChange ?? transaction.quantity) >= 0 ? '+' : ''}
                                {Math.abs(transaction.minStockChange ?? transaction.quantity)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-blue-600">ขั้นต่ำใหม่</div>
                              <div className="font-semibold text-blue-900">
                                {transaction.afterMinStock?.toLocaleString() || 'N/A'}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-blue-600 mt-2 pt-2 border-t border-blue-200">
                            สต็อกปัจจุบัน: {transaction.beforeQty.toLocaleString()} (ไม่เปลี่ยน)
                          </div>
                        </div>
                      )}

                      {isDataUpdate && (
                        <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Settings className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-900">อัปเดตข้อมูล</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            ไม่มีการเปลี่ยนแปลงจำนวนสต็อกหรือระดับขั้นต่ำ
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: User + Time + View Button */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <User className="h-3 w-3" />
                        <span>{transaction.user.firstName} {transaction.user.lastName}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="text-xs text-gray-500">
                          {transaction.createdAt ? getTimeAgo(transaction.createdAt) : '-'}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Footer Info */}
        {filteredTransactions.length > 0 && (
          <div className="flex flex-col gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span>
                แสดง <strong className="text-gray-700">{filteredTransactions.length}</strong> รายการ
                จากทั้งหมด <strong className="text-gray-700">{transactions.length}</strong> รายการ
              </span>
              <span className="text-purple-600 font-medium">
                ฿{filteredStats.totalValue.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-center items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span>รับเข้า ({filteredStats.incomingCount})</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-500" />
                <span>จ่ายออก ({filteredStats.outgoingCount})</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}