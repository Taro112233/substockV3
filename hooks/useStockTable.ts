// 📄 File: hooks/useStockTable.ts
// ✅ Custom Hook สำหรับ Stock Table Logic

import { useState, useMemo, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Stock } from '@/types/dashboard'
import {
  calculateAvailableStock,
  isLowStock,
} from '@/lib/utils/dashboard'

type SortField = 'name' | 'dosageForm' | 'strength' | 'packageSize' | 'quantity' | 'totalValue' | 'lastUpdated'
type SortDirection = 'asc' | 'desc' | null

interface SortConfig {
  field: SortField | null
  direction: SortDirection
}

type DrugCategory = 
  | 'REFER' | 'HAD' | 'NARCOTIC' | 'REFRIGERATED' | 'PSYCHIATRIC' 
  | 'FLUID' | 'GENERAL' | 'TABLET' | 'SYRUP' | 'INJECTION' | 'EXTEMP' | 'ALERT'

type DosageForm = 
  | 'APP' | 'BAG' | 'CAP' | 'CR' | 'DOP' | 'ENE' | 'GEL' | 'HAN' | 'IMP' 
  | 'INJ' | 'LIQ' | 'LOT' | 'LVP' | 'MDI' | 'MIX' | 'NAS' | 'NB' | 'OIN' 
  | 'PAT' | 'POW' | 'PWD' | 'SAC' | 'SOL' | 'SPR' | 'SUP' | 'SUS' | 'SYR' 
  | 'TAB' | 'TUR'

interface FilterConfig {
  category: DrugCategory | 'all'
  dosageForm: DosageForm | 'all'
}

interface FilteredStatsData {
  totalDrugs: number
  totalValue: number
  lowStockCount: number
}

type SortableValue = string | number | Date

interface UseStockTableProps {
  stocks: Stock[]
  department: 'PHARMACY' | 'OPD'
  onFilteredStatsChange?: (stats: FilteredStatsData, filteredStocks?: Stock[]) => void
}

export function useStockTable({ stocks, department, onFilteredStatsChange }: UseStockTableProps) {
  const { toast } = useToast()
  
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', direction: 'asc' })
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({ 
    category: 'all', 
    dosageForm: 'all' 
  })

  // Export states
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set())
  const [exportFormat, setExportFormat] = useState<'requisition' | 'detailed' | 'summary'>('requisition')
  const [showExportMode, setShowExportMode] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Utility functions
  const calculateStockValue = (stock: Stock) => {
    const availableStock = calculateAvailableStock(stock)
    const pricePerBox = stock.drug?.pricePerBox || 0
    return availableStock * pricePerBox
  }

  const getLastUpdatedColor = (lastUpdated: string | null) => {
    if (!lastUpdated) return 'text-gray-400'
    
    const now = new Date()
    const updatedDate = new Date(lastUpdated)
    const diffDays = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays >= 14) return 'text-red-600'
    if (diffDays >= 7) return 'text-yellow-600'
    return 'text-green-600'
  }

  // Sort handlers
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

  // Sorted stocks
  const sortedStocks = useMemo(() => {
    if (!sortConfig.field || !sortConfig.direction) {
      return [...stocks].sort((a, b) => 
        (a.drug?.name?.toLowerCase() || '').localeCompare(b.drug?.name?.toLowerCase() || '', 'th')
      )
    }

    return [...stocks].sort((a, b) => {
      let aValue: SortableValue
      let bValue: SortableValue

      switch (sortConfig.field) {
        case 'name':
          aValue = a.drug?.name?.toLowerCase() || ''
          bValue = b.drug?.name?.toLowerCase() || ''
          break
        case 'dosageForm':
          aValue = a.drug?.dosageForm?.toLowerCase() || ''
          bValue = b.drug?.dosageForm?.toLowerCase() || ''
          break
        case 'strength':
          const aStrengthNum = parseFloat(a.drug?.strength || '0')
          const bStrengthNum = parseFloat(b.drug?.strength || '0')
          aValue = !isNaN(aStrengthNum) ? aStrengthNum : (a.drug?.strength?.toLowerCase() || '')
          bValue = !isNaN(bStrengthNum) ? bStrengthNum : (b.drug?.strength?.toLowerCase() || '')
          break
        case 'packageSize':
          aValue = a.drug?.packageSize || 0
          bValue = b.drug?.packageSize || 0
          break
        case 'quantity':
          aValue = calculateAvailableStock(a)
          bValue = calculateAvailableStock(b)
          break
        case 'totalValue':
          aValue = calculateStockValue(a)
          bValue = calculateStockValue(b)
          break
        case 'lastUpdated':
          aValue = a.lastUpdated ? new Date(a.lastUpdated) : new Date(0)
          bValue = b.lastUpdated ? new Date(b.lastUpdated) : new Date(0)
          break
        default:
          return 0
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        const aTime = aValue.getTime()
        const bTime = bValue.getTime()
        return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue, 'th') 
          : bValue.localeCompare(aValue, 'th')
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      } else {
        const aStr = String(aValue).toLowerCase()
        const bStr = String(bValue).toLowerCase()
        return sortConfig.direction === 'asc' 
          ? aStr.localeCompare(bStr, 'th') 
          : bStr.localeCompare(aStr, 'th')
      }
    })
  }, [stocks, sortConfig])

  // Filtered stocks
  const filteredStocks = useMemo(() => {
    return sortedStocks.filter(stock => {
      const drugName = stock.drug?.name?.toLowerCase() || ''
      const hospitalCode = stock.drug?.hospitalDrugCode?.toLowerCase() || ''
      const genericName = stock.drug?.genericName?.toLowerCase() || ''
      const note = stock.drug?.notes?.toLowerCase() || ''
      const searchLower = searchTerm.toLowerCase()
      
      const matchesSearch = 
        drugName.includes(searchLower) ||
        hospitalCode.includes(searchLower) ||
        genericName.includes(searchLower) ||
        note.includes(searchLower)
      
      const matchesLowStock = showLowStockOnly ? isLowStock(stock) : true
      
      const matchesCategory = filterConfig.category === 'all' || 
        stock.drug?.category === filterConfig.category
      
      const matchesDosageForm = filterConfig.dosageForm === 'all' || 
        stock.drug?.dosageForm === filterConfig.dosageForm
      
      return matchesSearch && matchesLowStock && matchesCategory && matchesDosageForm
    })
  }, [sortedStocks, searchTerm, showLowStockOnly, filterConfig])

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    const totalDrugs = filteredStocks.length
    const totalValue = filteredStocks.reduce((sum, stock) => sum + calculateStockValue(stock), 0)
    const lowStockCount = filteredStocks.filter(stock => isLowStock(stock)).length

    return { totalDrugs, totalValue, lowStockCount }
  }, [filteredStocks])

  // Notify parent of filtered stats changes
  useEffect(() => {
    if (onFilteredStatsChange) {
      onFilteredStatsChange(filteredStats, filteredStocks)
    }
  }, [filteredStats, filteredStocks, onFilteredStatsChange])

  // Export functions
  const handleToggleExportMode = () => {
    setShowExportMode(!showExportMode)
    if (showExportMode) {
      setSelectedForExport(new Set())
    }
  }

  const handleSelectAll = () => {
    const currentlyVisibleSelected = filteredStocks.filter(stock => selectedForExport.has(stock.id))
    
    if (currentlyVisibleSelected.length === filteredStocks.length) {
      const newSelected = new Set(selectedForExport)
      filteredStocks.forEach(stock => newSelected.delete(stock.id))
      setSelectedForExport(newSelected)
    } else {
      const newSelected = new Set(selectedForExport)
      filteredStocks.forEach(stock => newSelected.add(stock.id))
      setSelectedForExport(newSelected)
    }
  }

  const handleToggleStock = (stockId: string) => {
    const newSelected = new Set(selectedForExport)
    if (newSelected.has(stockId)) {
      newSelected.delete(stockId)
    } else {
      newSelected.add(stockId)
    }
    setSelectedForExport(newSelected)
  }

  const calculateExportStats = () => {
    const selectedStocks = stocks.filter(stock => selectedForExport.has(stock.id))
    const totalValue = selectedStocks.reduce((sum, stock) => sum + calculateStockValue(stock), 0)
    return {
      count: selectedStocks.length,
      totalValue,
      stocks: selectedStocks
    }
  }

  const calculateCurrentViewStats = () => {
    const currentlyVisibleSelected = filteredStocks.filter(stock => selectedForExport.has(stock.id))
    const totalValue = currentlyVisibleSelected.reduce((sum, stock) => sum + calculateStockValue(stock), 0)
    return {
      count: currentlyVisibleSelected.length,
      totalValue
    }
  }

  // Handle Export
  const handleExport = async () => {
    const exportStats = calculateExportStats()
    
    if (exportStats.count === 0) {
      toast({
        title: 'ไม่สามารถ Export ได้',
        description: 'กรุณาเลือกรายการยาที่ต้องการ Export',
        variant: 'destructive',
      })
      return
    }

    setExporting(true)
    try {
      const exportData = {
        currentView: exportStats.stocks,
        additionalStocks: [],
        format: exportFormat,
        fields: {
          drugInfo: exportFormat === 'detailed',
          stockLevels: exportFormat === 'detailed',
          costInfo: exportFormat === 'detailed',
          lastUpdated: true,
        },
        department,
        timestamp: new Date().toISOString(),
        stats: {
          totalSelected: exportStats.count,
          currentViewCount: exportStats.count,
          additionalCount: 0,
          totalValue: exportStats.totalValue
        }
      }

      toast({
        title: 'กำลัง Export ข้อมูล...',
        description: `กำลังสร้างไฟล์ Excel สำหรับ ${exportStats.count} รายการ`,
        variant: 'default',
      })

      const response = await fetch('/api/stock/export', {
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
      const formatSuffix = exportFormat === 'requisition' ? 'ใบเบิก' : 
                          exportFormat === 'detailed' ? 'รายละเอียด' : 'สรุป'
      const filename = `สต็อกยา_${departmentName}_${formatSuffix}_${timestamp}.xlsx`
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Export สำเร็จ!',
        description: `ส่งออกข้อมูลสต็อก ${exportStats.count} รายการเรียบร้อย`,
        variant: 'default',
      })

      // Reset export mode
      setShowExportMode(false)
      setSelectedForExport(new Set())

    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถ Export ข้อมูลได้ กรุณาลองใหม่',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('')
    setShowLowStockOnly(false)
    setFilterConfig({ category: 'all', dosageForm: 'all' })
    setSortConfig({ field: 'name', direction: 'asc' })
  }

  // Check if filters are active
  const hasActiveFilters = Boolean(
    filterConfig.category !== 'all' || 
    filterConfig.dosageForm !== 'all' || 
    searchTerm || 
    showLowStockOnly ||
    sortConfig.field !== 'name' || 
    sortConfig.direction !== 'asc'
  )

  return {
    // State
    searchTerm,
    setSearchTerm,
    showLowStockOnly,
    setShowLowStockOnly,
    sortConfig,
    filterConfig,
    setFilterConfig,
    
    // Export state
    selectedForExport,
    exportFormat,
    setExportFormat,
    showExportMode,
    exporting,
    
    // Computed values
    filteredStocks,
    filteredStats,
    
    // Utility functions
    calculateStockValue,
    getLastUpdatedColor,
    
    // Handlers
    handleSort,
    handleToggleExportMode,
    handleSelectAll,
    handleToggleStock,
    handleExport,
    handleClearFilters,
    
    // Export stats
    calculateExportStats,
    calculateCurrentViewStats,
    
    // Flags
    hasActiveFilters,
  }
}