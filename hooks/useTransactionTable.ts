// hooks/useTransactionTable.ts - ✅ FIXED: Export format selection
import { useState, useMemo, useEffect, useCallback } from 'react'
import { Transaction } from '@/types/dashboard'
import { useToast } from '@/hooks/use-toast'

// Types
type SortField = 'drug' | 'dosageForm' | 'strength' | 'packageSize' | 'type' | 'quantity' | 'createdAt' | 'user' | 'totalCost'
type SortDirection = 'asc' | 'desc' | null
type SortValue = string | number

interface SortConfig {
  field: SortField | null
  direction: SortDirection
}

type TransactionType = 
  | 'RECEIVE_EXTERNAL' | 'DISPENSE_EXTERNAL' | 'TRANSFER_IN' | 'TRANSFER_OUT' 
  | 'ADJUST_INCREASE' | 'ADJUST_DECREASE' | 'RESERVE' | 'UNRESERVE'
  | 'MIN_STOCK_INCREASE' | 'MIN_STOCK_DECREASE' | 'MIN_STOCK_RESET'
  | 'DATA_UPDATE' | 'PRICE_UPDATE' | 'INFO_CORRECTION'

interface FilterConfig {
  type: TransactionType | 'all'
  dateRange: 'all' | 'today' | 'week' | 'month'
}

interface FilteredStatsData {
  totalTransactions: number
  totalValue: number
  incomingCount: number
  outgoingCount: number
  transactions: Transaction[]
}

interface UseTransactionTableProps {
  transactions: Transaction[]
  department: 'PHARMACY' | 'OPD'
  onFilteredStatsChange?: (stats: FilteredStatsData, filteredTransactions?: Transaction[]) => void
}

export function useTransactionTable({
  transactions,
  department,
  onFilteredStatsChange
}: UseTransactionTableProps) {
  const { toast } = useToast()

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('')
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    type: 'all',
    dateRange: 'all'
  })
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: null
  })

  // Export State
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set())
  const [exportFormat, setExportFormat] = useState<'detailed' | 'summary' | 'financial'>('detailed')
  const [showExportMode, setShowExportMode] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Helper: Calculate transaction cost
  const calculateTransactionCost = useCallback((transaction: Transaction) => {
    const pricePerBox = transaction.drug?.pricePerBox || 0
    return Math.abs(transaction.quantity) * pricePerBox
  }, [])

  // Helper: Get transaction type badge styles
  const getTransactionTypeBadge = useCallback((type: string) => {
    const config = {
      'RECEIVE_EXTERNAL': { label: 'รับจากภายนอก', color: 'bg-green-100 text-green-800 border-green-200' },
      'DISPENSE_EXTERNAL': { label: 'จ่ายให้ผู้ป่วย', color: 'bg-red-100 text-red-800 border-red-200' },
      'TRANSFER_IN': { label: 'รับโอนจากแผนกอื่น', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'TRANSFER_OUT': { label: 'ส่งโอนให้แผนกอื่น', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      'ADJUST_INCREASE': { label: 'ปรับเพิ่มสต็อก', color: 'bg-green-100 text-green-800 border-green-200' },
      'ADJUST_DECREASE': { label: 'ปรับลดสต็อก', color: 'bg-red-100 text-red-800 border-red-200' },
      'RESERVE': { label: 'จองยา', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'UNRESERVE': { label: 'ยกเลิกจอง', color: 'bg-gray-100 text-gray-800 border-gray-200' },
      'MIN_STOCK_INCREASE': { label: 'ปรับเพิ่มขั้นต่ำ', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'MIN_STOCK_DECREASE': { label: 'ปรับลดขั้นต่ำ', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      'MIN_STOCK_RESET': { label: 'กำหนดจำนวนขั้นต่ำใหม่', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      'DATA_UPDATE': { label: 'อัปเดตข้อมูล', color: 'bg-gray-100 text-gray-800 border-gray-200' },
      'PRICE_UPDATE': { label: 'อัปเดตราคา', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      'INFO_CORRECTION': { label: 'แก้ไขข้อมูล', color: 'bg-orange-100 text-orange-800 border-orange-200' }
    }
    
    return config[type as keyof typeof config] || { 
      label: type, 
      color: 'bg-gray-100 text-gray-800 border-gray-200' 
    }
  }, [])

  // Helper: Format transaction amount
  const formatTransactionAmount = useCallback((type: string, quantity: number, transaction: Transaction) => {
    const isIncoming = ['RECEIVE_EXTERNAL', 'TRANSFER_IN', 'ADJUST_INCREASE', 'UNRESERVE'].includes(type)
    const isMinStockChange = ['MIN_STOCK_INCREASE', 'MIN_STOCK_DECREASE', 'MIN_STOCK_RESET'].includes(type)
    const isDataUpdate = ['DATA_UPDATE', 'PRICE_UPDATE', 'INFO_CORRECTION'].includes(type)
    
    if (isDataUpdate) {
      return { value: 0, formatted: 'ไม่เปลี่ยนแปลง', className: 'text-gray-500 text-xs' }
    }
    
    if (isMinStockChange) {
      const changeAmount = transaction.minStockChange ?? quantity
      return {
        value: changeAmount,
        formatted: `${changeAmount >= 0 ? '+' : ''}${changeAmount.toLocaleString()} ขั้นต่ำ`,
        className: changeAmount >= 0 ? 'text-blue-600' : 'text-orange-600'
      }
    }
    
    return {
      value: Math.abs(quantity),
      formatted: `${isIncoming ? '+' : '-'}${Math.abs(quantity).toLocaleString()}`,
      className: isIncoming ? 'text-green-600' : 'text-red-600'
    }
  }, [])

  // Sorting logic
  const sortedTransactions = useMemo(() => {
    if (!sortConfig.field || !sortConfig.direction) {
      return transactions
    }

    return [...transactions].sort((a, b) => {
      let aValue: SortValue
      let bValue: SortValue

      switch (sortConfig.field) {
        case 'drug':
          aValue = a.drug?.name?.toLowerCase() || ''
          bValue = b.drug?.name?.toLowerCase() || ''
          break
        case 'dosageForm':
          aValue = a.drug?.dosageForm?.toLowerCase() || ''
          bValue = b.drug?.dosageForm?.toLowerCase() || ''
          break
        case 'strength':
          aValue = a.drug?.strength?.toLowerCase() || ''
          bValue = b.drug?.strength?.toLowerCase() || ''
          break
        case 'packageSize':
          aValue = parseInt(a.drug?.packageSize?.replace(/[^\d]/g, '') || '0') || 0
          bValue = parseInt(b.drug?.packageSize?.replace(/[^\d]/g, '') || '0') || 0
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
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      }
      
      return 0
    })
  }, [transactions, sortConfig, calculateTransactionCost])

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

      const matchesType = filterConfig.type === 'all' || transaction.type === filterConfig.type

      let matchesDate = true
      if (filterConfig.dateRange !== 'all' && transaction.createdAt) {
        const transactionDate = new Date(transaction.createdAt)
        const now = new Date()
        switch (filterConfig.dateRange) {
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
  }, [sortedTransactions, searchTerm, filterConfig])

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

    return { 
      totalTransactions, 
      totalValue, 
      incomingCount, 
      outgoingCount, 
      transactions: filteredTransactions 
    }
  }, [filteredTransactions, calculateTransactionCost])

  // Update parent component with filtered stats
  useEffect(() => {
    if (onFilteredStatsChange) {
      onFilteredStatsChange(filteredStats, filteredTransactions)
    }
  }, [filteredStats, filteredTransactions, onFilteredStatsChange])

  // Sort handler
  const handleSort = useCallback((field: SortField) => {
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
  }, [sortConfig])

  // Export handlers
  const handleToggleExportMode = useCallback(() => {
    setShowExportMode(prev => !prev)
    setSelectedForExport(new Set())
  }, [])

  const handleToggleTransaction = useCallback((transactionId: string) => {
    setSelectedForExport(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(transactionId)) {
        newSelected.delete(transactionId)
      } else {
        newSelected.add(transactionId)
      }
      return newSelected
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    const currentViewIds = filteredTransactions.map(t => t.id)
    const currentViewSelected = currentViewIds.filter(id => selectedForExport.has(id))
    
    if (currentViewSelected.length === currentViewIds.length && currentViewIds.length > 0) {
      // Unselect all in current view
      setSelectedForExport(prev => {
        const newSelected = new Set(prev)
        currentViewIds.forEach(id => newSelected.delete(id))
        return newSelected
      })
    } else {
      // Select all in current view
      setSelectedForExport(prev => {
        const newSelected = new Set(prev)
        currentViewIds.forEach(id => newSelected.add(id))
        return newSelected
      })
    }
  }, [filteredTransactions, selectedForExport])

  // ✅ FIXED: Handle Export with API call and correct format
  const handleExport = useCallback(async (selectedFormat?: 'detailed' | 'summary' | 'financial') => {
    // ใช้ format ที่ส่งมาจาก dropdown แทนที่ state
    const formatToUse = selectedFormat || exportFormat
    
    if (selectedForExport.size === 0) {
      toast({
        title: "ไม่มีรายการที่เลือก",
        description: "กรุณาเลือกรายการที่ต้องการส่งออกก่อน",
        variant: "destructive"
      })
      return
    }

    setExporting(true)

    try {
      console.log(`🔄 Exporting ${selectedForExport.size} transactions in ${formatToUse} format`)
      
      const selectedTransactions = transactions.filter(t => selectedForExport.has(t.id))
      const totalValue = selectedTransactions.reduce((sum, t) => sum + calculateTransactionCost(t), 0)

      // ✅ สร้าง export data สำหรับ API
      const exportData = {
        currentView: selectedTransactions,
        additionalTransactions: [],
        format: formatToUse, // ✅ ใช้ format ที่ถูกต้อง
        department,
        timestamp: new Date().toISOString(),
        stats: {
          totalSelected: selectedTransactions.length,
          currentViewCount: selectedTransactions.length,
          additionalCount: 0,
          totalValue
        }
      }

      toast({
        title: "กำลังส่งออกข้อมูล...",
        description: `กำลังสร้างไฟล์ Excel สำหรับ ${selectedForExport.size} รายการ (${formatToUse})`,
        variant: "default"
      })

      // ✅ เรียก API แทนการสร้าง Excel ใน client
      const response = await fetch('/api/transactions/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(exportData)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const departmentName = department === 'PHARMACY' ? 'คลังยา' : 'OPD'
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const formatName = formatToUse === 'financial' ? 'การเงิน' : 
                        formatToUse === 'detailed' ? 'รายละเอียด' : 'สรุป'
      const filename = `ประวัติการเคลื่อนไหว_${departmentName}_${formatName}_${timestamp}.xlsx`
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "ส่งออกสำเร็จ",
        description: `ส่งออกประวัติ ${selectedForExport.size} รายการ (${formatName}) เรียบร้อยแล้ว`,
        variant: "default"
      })

      // Reset export mode
      setShowExportMode(false)
      setSelectedForExport(new Set())

    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกไฟล์ได้ กรุณาลองใหม่",
        variant: "destructive"
      })
    } finally {
      setExporting(false)
    }
  }, [selectedForExport, transactions, exportFormat, calculateTransactionCost, department, toast])

  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    setFilterConfig({
      type: 'all',
      dateRange: 'all'
    })
    setSortConfig({ field: null, direction: null })
  }, [])

  // Calculate export stats
  const calculateExportStats = useCallback(() => {
    const selectedTransactions = transactions.filter(t => selectedForExport.has(t.id))
    const totalValue = selectedTransactions.reduce((sum, t) => sum + calculateTransactionCost(t), 0)
    const incomingCount = selectedTransactions.filter(t => 
      ['RECEIVE_EXTERNAL', 'ADJUST_INCREASE', 'TRANSFER_IN', 'UNRESERVE'].includes(t.type)
    ).length
    const outgoingCount = selectedTransactions.filter(t => 
      ['DISPENSE_EXTERNAL', 'ADJUST_DECREASE', 'TRANSFER_OUT', 'RESERVE'].includes(t.type)
    ).length

    return {
      totalTransactions: selectedTransactions.length,
      totalValue,
      incomingCount,
      outgoingCount,
      transactions: selectedTransactions
    }
  }, [transactions, selectedForExport, calculateTransactionCost])

  const calculateCurrentViewStats = useCallback(() => {
    const currentViewSelected = filteredTransactions.filter(t => selectedForExport.has(t.id))
    const totalValue = currentViewSelected.reduce((sum, t) => sum + calculateTransactionCost(t), 0)
    
    return {
      count: currentViewSelected.length,
      totalValue
    }
  }, [filteredTransactions, selectedForExport, calculateTransactionCost])

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' || 
           filterConfig.type !== 'all' || 
           filterConfig.dateRange !== 'all' || 
           sortConfig.field !== null
  }, [searchTerm, filterConfig, sortConfig])

  return {
    // State
    searchTerm,
    setSearchTerm,
    filterConfig,
    setFilterConfig,
    sortConfig,
    
    // Export state
    selectedForExport,
    exportFormat,
    setExportFormat,
    showExportMode,
    exporting,
    
    // Computed values
    filteredTransactions,
    filteredStats,
    
    // Utility functions
    calculateTransactionCost,
    getTransactionTypeBadge,
    formatTransactionAmount,
    
    // Handlers
    handleSort,
    handleToggleExportMode,
    handleSelectAll,
    handleToggleTransaction,
    handleExport, // ✅ แก้ไขแล้วรับ format parameter และเรียก API
    handleClearFilters,
    
    // Export stats
    calculateExportStats,
    calculateCurrentViewStats,
    
    // Flags
    hasActiveFilters,
  }
}