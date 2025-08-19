// 📄 File: components/modules/dashboard/history-tab.tsx (Updated with Stock-like Table)

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Transaction } from '@/types/dashboard'
import { TransactionDetailModal } from '@/components/modules/transaction/transaction-detail-modal'
import { 
  History, 
  RefreshCw,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Search,
  Calendar,
  Package,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TransactionData {
  transactions: Transaction[]
  stats: {
    totalTransactions: number
    totalValue: number
    recentTransactions: number
  }
}

interface HistoryTabProps {
  department: 'PHARMACY' | 'OPD'
}

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

export function HistoryTab({ 
  department
}: HistoryTabProps) {
  const [data, setData] = useState<TransactionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  const fetchTransactionData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true)
      }

      const apiEndpoint = department === 'PHARMACY' 
        ? '/api/transactions/pharmacy' 
        : '/api/transactions/opd'

      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch transaction data')
      }

      setData(result.data)

      if (showRefreshToast) {
        toast({
          title: "ประวัติการเคลื่อนไหวได้รับการอัปเดต",
          description: "ข้อมูลล่าสุดแล้ว",
          duration: 2000
        })
      }

    } catch (error) {
      console.error('Failed to fetch transaction data:', error)
      
      const errorMessage = error instanceof Error ? error.message : "ไม่สามารถโหลดประวัติการเคลื่อนไหวได้"
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
        duration: 4000
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTransactionData()
  }, [department])

  const handleRefresh = () => {
    fetchTransactionData(true)
  }

  const handleExport = () => {
    toast({
      title: "ฟีเจอร์กำลังพัฒนา",
      description: "การส่งออกประวัติจะพร้อมใช้งานในเร็วๆ นี้",
      variant: "default"
    })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setTypeFilter('all')
    setDateFilter('all')
  }

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedTransaction(null)
  }

  // Filter transactions
  const filteredTransactions = data?.transactions?.filter(transaction => {
    // Search filter
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
      transaction.drug?.name?.toLowerCase().includes(searchLower) ||
      transaction.drug?.hospitalDrugCode?.toLowerCase().includes(searchLower) ||
      transaction.drug?.genericName?.toLowerCase().includes(searchLower) ||
      transaction.reference?.toLowerCase().includes(searchLower) ||
      transaction.note?.toLowerCase().includes(searchLower)

    // Type filter
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter

    // Date filter
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
  }) || []

  // Loading state
  if (loading || !data) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              ประวัติการเคลื่อนไหว - {department === 'PHARMACY' ? 'แผนกเภสัชกรรม' : 'แผนก OPD'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              กำลังโหลดประวัติการเคลื่อนไหว...
            </p>
          </div>
        </div>

        {/* Loading Table */}
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
              {[...Array(8)].map((_, i) => (
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

  // Calculate stats from filtered data
  const filteredInTransactions = filteredTransactions.filter(t => 
    ['RECEIVE_EXTERNAL', 'ADJUST_INCREASE', 'TRANSFER_IN', 'UNRESERVE'].includes(t.type)
  )
  const filteredOutTransactions = filteredTransactions.filter(t => 
    ['DISPENSE_EXTERNAL', 'ADJUST_DECREASE', 'TRANSFER_OUT', 'RESERVE'].includes(t.type)
  )
  
  // Calculate recent transactions from filtered data (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const filteredRecentTransactions = filteredTransactions.filter(t => 
    t.createdAt && new Date(t.createdAt) >= sevenDaysAgo
  )

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            ประวัติการเคลื่อนไหว - {department === 'PHARMACY' ? 'แผนกเภสัชกรรม' : 'แผนก OPD'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            ประวัติการเคลื่อนไหวสต็อกยา • อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            ล้างตัวกรอง
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            ส่งออก
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {filteredTransactions.length.toLocaleString()}
                </div>
                <div className="text-sm text-blue-600">
                  {searchTerm || typeFilter !== 'all' || dateFilter !== 'all' ? 'ที่กรองแล้ว' : 'รายการทั้งหมด'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {filteredInTransactions.length.toLocaleString()}
                </div>
                <div className="text-sm text-green-600">รับเข้า</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-900">
                  {filteredOutTransactions.length.toLocaleString()}
                </div>
                <div className="text-sm text-red-600">จ่ายออก</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-900">
                  {filteredRecentTransactions.length.toLocaleString()}
                </div>
                <div className="text-sm text-purple-600">7 วันที่ผ่านมา</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="ค้นหา (ชื่อยา, รหัส, ชื่อสามัญ, เอกสารอ้างอิง)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
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

        {/* Date Filter */}
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[140px]">
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

      {/* Transaction Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[250px]">ชื่อยา</TableHead>
                <TableHead className="w-[120px]">รูปแบบ</TableHead>
                <TableHead className="w-[120px]">ความแรง</TableHead>
                <TableHead className="w-[120px]">ขนาดบรรจุ</TableHead>
                <TableHead className="w-[140px]">ประเภท</TableHead>
                <TableHead className="w-[120px] text-center">จำนวน</TableHead>
                <TableHead className="w-[140px] text-center">วันเวลา</TableHead>
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
                            <>1 x {transaction.drug.packageSize}'s</>
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
                          
                          {/* Reference & Transfer */}
                          {transaction.reference && (
                            <div className="text-xs text-gray-500 font-mono">
                              อ้างอิง: {transaction.reference}
                            </div>
                          )}
                          
                          {transaction.transfer && (
                            <div className="text-xs text-blue-600 font-mono">
                              ใบโอน: {transaction.transfer.requisitionNumber}
                            </div>
                          )}
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

                          {/* มูลค่า */}
                          <div className="text-xs text-gray-500 font-mono">
                            ฿{Math.abs(transaction.totalCost).toLocaleString()}
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

      {/* Footer Info */}
      {filteredTransactions.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
          <div>
            แสดง {filteredTransactions.length} รายการจากทั้งหมด {data.transactions.length} รายการ
            {searchTerm && ` | ค้นหา: "${searchTerm}"`}
            {typeFilter !== 'all' && ` | ประเภท: ${typeFilter}`}
            {dateFilter !== 'all' && ` | ช่วงเวลา: ${dateFilter}`}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span>รับเข้า</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-500" />
              <span>จ่ายออก</span>
            </div>
            <div className="flex items-center gap-1">
              <RotateCcw className="w-3 h-3 text-blue-500" />
              <span>ปรับสต็อก</span>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  )
}