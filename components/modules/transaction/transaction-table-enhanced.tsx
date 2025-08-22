// 📄 File: components/modules/transaction/transaction-table-enhanced.tsx
// ✅ Enhanced Transaction Table with Fixed Price Calculation using pricePerBox

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { TransactionDetailModal } from './transaction-detail-modal'
import { 
  History, 
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Eye,
  Clock
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'

// Type สำหรับ sorting
type SortField = 'drug' | 'type' | 'quantity' | 'totalCost' | 'createdAt' | 'user'
type SortDirection = 'asc' | 'desc' | null

interface SortConfig {
  field: SortField | null
  direction: SortDirection
}

interface FilteredStatsData {
  totalTransactions: number
  totalValue: number
  incomingCount: number
  outgoingCount: number
}

interface TransactionTableProps {
  transactions: Transaction[]
  department: 'PHARMACY' | 'OPD'
  onView?: (transaction: Transaction) => void
  onFilteredStatsChange?: (stats: FilteredStatsData) => void
  loading?: boolean
}

export function TransactionTableEnhanced({ 
  transactions,
  onView,
  onFilteredStatsChange,
  loading = false 
}: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: null })

  // Helper functions
  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'RECEIVE_EXTERNAL':
      case 'TRANSFER_IN':
      case 'ADJUST_INCREASE':
      case 'UNRESERVE':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'DISPENSE_EXTERNAL':
      case 'TRANSFER_OUT':
      case 'ADJUST_DECREASE':
      case 'RESERVE':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <RotateCcw className="h-4 w-4 text-blue-600" />
    }
  }

  const getTransactionTypeBadge = (type: string) => {
    const config = {
      'RECEIVE_EXTERNAL': { label: 'รับเข้า', color: 'bg-green-100 text-green-800 border-green-200' },
      'DISPENSE_EXTERNAL': { label: 'จ่ายออก', color: 'bg-red-100 text-red-800 border-red-200' },
      'TRANSFER_IN': { label: 'โอนเข้า', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'TRANSFER_OUT': { label: 'โอนออก', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      'ADJUST_INCREASE': { label: 'ปรับเพิ่ม', color: 'bg-green-100 text-green-800 border-green-200' },
      'ADJUST_DECREASE': { label: 'ปรับลด', color: 'bg-red-100 text-red-800 border-red-200' },
      'RESERVE': { label: 'จอง', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'UNRESERVE': { label: 'ยกเลิกจอง', color: 'bg-gray-100 text-gray-800 border-gray-200' },
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

  const formatTransactionAmount = (type: string, quantity: number) => {
    const isIncoming = ['RECEIVE_EXTERNAL', 'TRANSFER_IN', 'ADJUST_INCREASE', 'UNRESERVE'].includes(type)
    return (
      <span className={`font-medium ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
        {isIncoming ? '+' : '-'}{Math.abs(quantity).toLocaleString()}
      </span>
    )
  }

  // ✅ Fixed: คำนวณต้นทุนด้วย pricePerBox แทน totalCost
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
      'GENERAL': 'bg-gray-100 text-gray-800 border-gray-200'
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
      'GENERAL': 'ยาทั่วไป'
    }
    return labels[category as keyof typeof labels] || category
  }

  // Sorting function
  const handleSort = (field: SortField) => {
    let direction: SortDirection = 'asc'
    
    if (sortConfig.field === field) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc'
      } else if (sortConfig.direction === 'desc') {
        direction = null
      } else {
        direction = 'asc'
      }
    }
    
    setSortConfig({ field: direction ? field : null, direction })
  }

  // Get sort icon for header
  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="h-4 w-4 text-blue-600" />
    } else if (sortConfig.direction === 'desc') {
      return <ArrowDown className="h-4 w-4 text-blue-600" />
    }
    
    return <ArrowUpDown className="h-4 w-4 text-gray-400" />
  }

  // Sorting logic
  const sortedTransactions = useMemo(() => {
    if (!sortConfig.field || !sortConfig.direction) {
      return transactions
    }

    return [...transactions].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortConfig.field) {
        case 'drug':
          aValue = a.drug?.name?.toLowerCase() || ''
          bValue = b.drug?.name?.toLowerCase() || ''
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'quantity':
          aValue = Math.abs(a.quantity)
          bValue = Math.abs(b.quantity)
          break
        case 'totalCost':
          // ✅ Fixed: Use pricePerBox for sorting
          aValue = calculateTransactionCost(a)
          bValue = calculateTransactionCost(b)
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'user':
          aValue = `${a.user.firstName} ${a.user.lastName}`.toLowerCase()
          bValue = `${b.user.firstName} ${b.user.lastName}`.toLowerCase()
          break
        default:
          return 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue, 'th') 
          : bValue.localeCompare(aValue, 'th')
      } else {
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      }
    })
  }, [transactions, sortConfig])

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter(transaction => {
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
  }, [sortedTransactions, searchTerm, typeFilter, dateFilter])

  // ✅ Fixed: คำนวณ filtered stats ด้วย pricePerBox
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
    setSortConfig({ field: null, direction: null })
  }

  // Sortable Header Component
  const SortableHeader = ({ 
    field, 
    children, 
    className = '',
    align = 'left' 
  }: { 
    field: SortField; 
    children: React.ReactNode; 
    className?: string;
    align?: 'left' | 'center' | 'right'
  }) => (
    <TableHead 
      className={`cursor-pointer hover:bg-gray-100 transition-colors ${className} ${
        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''
      }`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-2 ${
        align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''
      }`}>
        {children}
        {getSortIcon(field)}
      </div>
    </TableHead>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-32">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อยา</TableHead>
                <TableHead>รูปแบบ</TableHead>
                <TableHead>ความแรง</TableHead>
                <TableHead>ขนาดบรรจุ</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>จำนวน</TableHead>
                <TableHead>วันเวลา</TableHead>
                <TableHead>ดู</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-8 bg-gray-200 rounded animate-pulse" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Enhanced Search and Filter Section */}
        <div className="space-y-3">
          {/* Large Screen: Everything in one row */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหา (ชื่อยา, รหัส, ชื่อสามัญ, เอกสารอ้างอิง)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <div className="w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="ประเภทการเคลื่อนไหว" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  <SelectItem value="RECEIVE_EXTERNAL">รับเข้า</SelectItem>
                  <SelectItem value="DISPENSE_EXTERNAL">จ่ายออก</SelectItem>
                  <SelectItem value="TRANSFER_IN">โอนเข้า</SelectItem>
                  <SelectItem value="TRANSFER_OUT">โอนออก</SelectItem>
                  <SelectItem value="ADJUST_INCREASE">ปรับเพิ่ม</SelectItem>
                  <SelectItem value="ADJUST_DECREASE">ปรับลด</SelectItem>
                  <SelectItem value="RESERVE">จอง</SelectItem>
                  <SelectItem value="UNRESERVE">ยกเลิกจอง</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="w-40">
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
            {(searchTerm || typeFilter !== 'all' || dateFilter !== 'all' || sortConfig.field) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2 text-xs bg-red-500 text-white hover:bg-red-600"
              >
                ✕ ล้างตัวกรอง
              </Button>
            )}
          </div>

          {/* Small Screen: Mobile Layout */}
          <div className="lg:hidden">
            {/* Row 1: Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหา (ชื่อยา, รหัส, ชื่อสามัญ, เอกสารอ้างอิง)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Row 2: Filters and Buttons */}
            <div className="flex items-center gap-2">
              {/* Type Filter */}
              <div className="flex-1">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="ประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกประเภท</SelectItem>
                    <SelectItem value="RECEIVE_EXTERNAL">รับเข้า</SelectItem>
                    <SelectItem value="DISPENSE_EXTERNAL">จ่ายออก</SelectItem>
                    <SelectItem value="TRANSFER_IN">โอนเข้า</SelectItem>
                    <SelectItem value="TRANSFER_OUT">โอนออก</SelectItem>
                    <SelectItem value="ADJUST_INCREASE">ปรับเพิ่ม</SelectItem>
                    <SelectItem value="ADJUST_DECREASE">ปรับลด</SelectItem>
                    <SelectItem value="RESERVE">จอง</SelectItem>
                    <SelectItem value="UNRESERVE">ยกเลิกจอง</SelectItem>
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

              {/* Clear Filters Button - Icon only */}
              {(searchTerm || typeFilter !== 'all' || dateFilter !== 'all' || sortConfig.field) && (
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
        </div>

        {/* Enhanced Table with Sortable Headers */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <SortableHeader field="drug" className="w-[250px]">
                    ชื่อยา
                  </SortableHeader>
                  <TableHead className="w-[120px]">รูปแบบ</TableHead>
                  <TableHead className="w-[120px]">ความแรง</TableHead>
                  <TableHead className="w-[120px]">ขนาดบรรจุ</TableHead>
                  <SortableHeader field="type" className="w-[140px]">
                    ประเภท
                  </SortableHeader>
                  <SortableHeader field="quantity" className="w-[120px]" align="center">
                    จำนวน
                  </SortableHeader>
                  <SortableHeader field="createdAt" className="w-[140px]" align="center">
                    วันเวลา
                  </SortableHeader>
                  <TableHead className="w-[80px] text-center">ดู</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                      {searchTerm || typeFilter !== 'all' || dateFilter !== 'all' ? (
                        <div>
                          <History className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <div>ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</div>
                          <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                            ล้างตัวกรอง
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <History className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <div>ไม่มีประวัติการเคลื่อนไหว</div>
                          <div className="text-sm text-gray-400">ยังไม่มีการบันทึกการเคลื่อนไหวสต็อกในระบบ</div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const categoryColor = getCategoryColor(transaction.drug?.category)
                    const categoryLabel = getCategoryLabel(transaction.drug?.category)
                    // ✅ Fixed: Calculate transaction cost properly with pricePerBox
                    const transactionCost = calculateTransactionCost(transaction)

                    return (
                      <TableRow 
                        key={transaction.id} 
                        className="border-b hover:bg-gray-50/50 cursor-pointer"
                        onClick={() => handleViewTransaction(transaction)}
                      >
                        {/* ชื่อยา */}
                        <TableCell className="font-medium">
                          <div className="space-y-2">
                            {/* ชื่อยา */}
                            <div className="font-medium text-gray-900 leading-tight">
                              {transaction.drug?.name || 'ยาไม่ระบุ'}
                            </div>
                            
                            {/* Category Badge + Hospital Drug Code */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${categoryColor} shrink-0`}
                              >
                                {categoryLabel}
                              </Badge>
                              <span className="text-sm text-gray-600 font-mono">
                                {transaction.drug?.hospitalDrugCode || '-'}
                              </span>
                            </div>
                            
                            {/* Batch Number */}
                            {transaction.batchNumber && (
                              <div className="text-xs text-gray-500">
                                LOT: {transaction.batchNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* รูปแบบ */}
                        <TableCell>
                          <div className="text-sm text-gray-700">
                            {transaction.drug?.dosageForm || '-'}
                          </div>
                        </TableCell>

                        {/* ความแรง */}
                        <TableCell>
                          <div className="text-sm text-gray-700">
                            {transaction.drug?.strength || ''} {transaction.drug?.unit || ''}
                          </div>
                        </TableCell>

                        {/* ขนาดบรรจุ */}
                        <TableCell>
                          <div className="text-sm text-gray-700">
                            {transaction.drug?.packageSize ? (
                              <>1 x {transaction.drug.packageSize}&apos;s</>
                            ) : (
                              '-'
                            )}
                          </div>
                        </TableCell>

                        {/* ประเภท */}
                        <TableCell>
                          <div className="space-y-1">
                            {/* Transaction Type Badge */}
                            <div className="flex items-center gap-1">
                              {getTransactionTypeIcon(transaction.type)}
                              {getTransactionTypeBadge(transaction.type)}
                            </div>
                            
                            {/* ผู้ทำรายการ */}
                            <div className="text-xs text-gray-600">
                              โดย: {transaction.user.firstName} {transaction.user.lastName}
                            </div>
                          </div>
                        </TableCell>

                        {/* จำนวน */}
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            {/* จำนวนและทิศทาง */}
                            <div className="flex items-center justify-center gap-1">
                              {getTransactionTypeIcon(transaction.type)}
                              {formatTransactionAmount(transaction.type, transaction.quantity)}
                            </div>
                            
                            {/* Before → After */}
                            <div className="text-xs text-gray-500">
                              {transaction.beforeQty.toLocaleString()} → {transaction.afterQty.toLocaleString()}
                            </div>

                            {/* มูลค่า - ✅ Fixed calculation with pricePerBox */}
                            <div className="text-xs text-gray-500 font-mono">
                              ฿{transactionCost.toLocaleString()}
                            </div>
                          </div>
                        </TableCell>

                        {/* วันเวลา */}
                        <TableCell className="text-center">
                          {transaction.createdAt ? (
                            <div className="space-y-1">
                              <div className="text-sm text-gray-700">
                                {new Date(transaction.createdAt).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(transaction.createdAt).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>

                        {/* ดู */}
                        <TableCell>
                          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewTransaction(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Enhanced Footer Info */}
        {filteredTransactions.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
            <div className="flex flex-col sm:flex-row gap-2 text-center sm:text-left">
              <span>
                แสดง <strong className="text-gray-700">{filteredTransactions.length}</strong> รายการ
                จากทั้งหมด <strong className="text-gray-700">{transactions.length}</strong> รายการ
              </span>
              <span className="text-purple-600 font-medium">
                มูลค่ารวม ฿{filteredStats.totalValue.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span>รับเข้า ({filteredStats.incomingCount})</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-500" />
                <span>จ่ายออก ({filteredStats.outgoingCount})</span>
              </div>
              <div className="flex items-center gap-1">
                <RotateCcw className="w-3 h-3 text-blue-500" />
                <span>ปรับสต็อก</span>
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