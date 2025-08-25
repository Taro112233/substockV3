// 📄 File: components/modules/stock/stock-table-enhanced.tsx
// ✅ FIXED: Export Selection Memory - จำการเลือกข้าม Filter
// ✅ แก้ปัญหาการเลือก export ที่หายไปเมื่อเปลี่ยน filter

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
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Stock } from '@/types/dashboard'
import {
  calculateAvailableStock,
  isLowStock,
  getCategoryColor,
  getCategoryLabel
} from '@/lib/utils/dashboard'
import { 
  AlertTriangle,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Package,
  CheckCircle2,
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { StockDetailModalEnhanced } from './stock-detail-modal'

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

interface StockTableProps {
  stocks: Stock[]
  department: 'PHARMACY' | 'OPD'
  onView?: (stock: Stock) => void
  onUpdate?: (updatedStock: Stock) => void
  onFilteredStatsChange?: (stats: FilteredStatsData, filteredStocks?: Stock[]) => void
  loading?: boolean
}

export function StockTableEnhanced({ 
  stocks,
  department,
  onUpdate,
  onFilteredStatsChange,
  loading = false 
}: StockTableProps) {
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', direction: 'asc' })
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({ 
    category: 'all', 
    dosageForm: 'all' 
  })

  // ✅ FIXED: Export Selection State - จำการเลือกข้าม Filter
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set())
  const [exportFormat, setExportFormat] = useState<'summary' | 'detailed'>('summary')
  const [showExportMode, setShowExportMode] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Category options
  const categoryOptions = [
    { value: 'all', label: 'ทุกประเภท' },
    { value: 'GENERAL', label: 'ยาทั่วไป' },
    { value: 'TABLET', label: 'ยาเม็ด' },
    { value: 'SYRUP', label: 'ยาน้ำ' },
    { value: 'INJECTION', label: 'ยาฉีด' },
    { value: 'EXTEMP', label: 'ยาใช้ภายนอก/สมุนไพร' },
    { value: 'FLUID', label: 'สารน้ำ' },
    { value: 'NARCOTIC', label: 'ยาเสพติด' },
    { value: 'PSYCHIATRIC', label: 'ยาจิตเวช' },
    { value: 'REFRIGERATED', label: 'ยาเย็น' },
    { value: 'HAD', label: 'ยา HAD' },
    { value: 'REFER', label: 'ยาส่งต่อ' },
    { value: 'ALERT', label: 'ยาเฝ้าระวัง' }
  ]

  // Dosage form options
  const dosageFormOptions = [
    { value: 'all', label: 'ทุกรูปแบบ' },
    { value: 'TAB', label: 'TAB' },
    { value: 'CAP', label: 'CAP' },
    { value: 'SYR', label: 'SYR' },
    { value: 'SUS', label: 'SUS' },
    { value: 'INJ', label: 'INJ' },
    { value: 'SOL', label: 'SOL' },
    { value: 'OIN', label: 'OIN' },
    { value: 'GEL', label: 'GEL' },
    { value: 'LOT', label: 'LOT' },
    { value: 'SPR', label: 'SPR' },
    { value: 'SUP', label: 'SUP' },
    { value: 'ENE', label: 'ENE' },
    { value: 'POW', label: 'POW' },
    { value: 'PWD', label: 'PWD' },
    { value: 'CR', label: 'CR' },
    { value: 'BAG', label: 'BAG' },
    { value: 'APP', label: 'APP' },
    { value: 'LVP', label: 'LVP' },
    { value: 'MDI', label: 'MDI' },
    { value: 'NAS', label: 'NAS' },
    { value: 'SAC', label: 'SAC' },
    { value: 'LIQ', label: 'LIQ' },
    { value: 'MIX', label: 'MIX' }
  ]

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

  // Filter sorted stocks
  const filteredStocks = useMemo(() => {
    return sortedStocks.filter(stock => {
      const drugName = stock.drug?.name?.toLowerCase() || ''
      const hospitalCode = stock.drug?.hospitalDrugCode?.toLowerCase() || ''
      const genericName = stock.drug?.genericName?.toLowerCase() || ''
      const searchLower = searchTerm.toLowerCase()
      
      const matchesSearch = 
        drugName.includes(searchLower) ||
        hospitalCode.includes(searchLower) ||
        genericName.includes(searchLower)
      
      const matchesLowStock = showLowStockOnly ? isLowStock(stock) : true
      
      const matchesCategory = filterConfig.category === 'all' || 
        stock.drug?.category === filterConfig.category
      
      const matchesDosageForm = filterConfig.dosageForm === 'all' || 
        stock.drug?.dosageForm === filterConfig.dosageForm
      
      return matchesSearch && matchesLowStock && matchesCategory && matchesDosageForm
    })
  }, [sortedStocks, searchTerm, showLowStockOnly, filterConfig])

  // Calculate filtered stats and notify parent
  const filteredStats = useMemo(() => {
    const totalDrugs = filteredStocks.length
    const totalValue = filteredStocks.reduce((sum, stock) => sum + calculateStockValue(stock), 0)
    const lowStockCount = filteredStocks.filter(stock => isLowStock(stock)).length

    return { totalDrugs, totalValue, lowStockCount }
  }, [filteredStocks])

  useEffect(() => {
    if (onFilteredStatsChange) {
      onFilteredStatsChange(filteredStats, filteredStocks)
    }
  }, [filteredStats, filteredStocks, onFilteredStatsChange])

  // ✅ FIXED: Export Selection Functions - ใช้ stocks แทน filteredStocks
  const handleToggleExportMode = () => {
    setShowExportMode(!showExportMode)
    if (showExportMode) {
      setSelectedForExport(new Set())
    }
  }

  // ✅ FIXED: Select All - เลือกเฉพาะที่แสดงใน current view
  const handleSelectAll = () => {
    const currentlyVisibleSelected = filteredStocks.filter(stock => selectedForExport.has(stock.id))
    
    if (currentlyVisibleSelected.length === filteredStocks.length) {
      // ถ้าเลือกครบแล้ว ให้ยกเลิกการเลือกเฉพาะที่แสดงอยู่
      const newSelected = new Set(selectedForExport)
      filteredStocks.forEach(stock => newSelected.delete(stock.id))
      setSelectedForExport(newSelected)
    } else {
      // เลือกทั้งหมดที่แสดงอยู่
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

  // ✅ FIXED: คำนวณ Export Stats จาก ALL stocks ที่เลือก
  const calculateExportStats = () => {
    // ใช้ stocks ทั้งหมด ไม่ใช่ filteredStocks
    const selectedStocks = stocks.filter(stock => selectedForExport.has(stock.id))
    const totalValue = selectedStocks.reduce((sum, stock) => sum + calculateStockValue(stock), 0)
    return {
      count: selectedStocks.length,
      totalValue,
      stocks: selectedStocks
    }
  }

  // ✅ FIXED: คำนวณ Selected ใน Current View
  const calculateCurrentViewStats = () => {
    const currentlyVisibleSelected = filteredStocks.filter(stock => selectedForExport.has(stock.id))
    const totalValue = currentlyVisibleSelected.reduce((sum, stock) => sum + calculateStockValue(stock), 0)
    return {
      count: currentlyVisibleSelected.length,
      totalValue
    }
  }

  // ✅ NEW: Handle Export
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
          drugInfo: true,
          stockLevels: true,
          costInfo: true,
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
      const filename = `สต็อกยา_${departmentName}_${timestamp}.xlsx`
      
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

  // Component methods
  const handleView = (stock: Stock) => {
    if (showExportMode) return // ป้องกันเปิด modal ตอนเลือก export
    setSelectedStock(stock)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedStock(null)
  }

  const handleStockUpdate = (updatedStock: Stock) => {
    if (onUpdate) {
      onUpdate(updatedStock)
    }
    setSelectedStock(updatedStock)
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

  // Calculate stats for display
  const exportStats = calculateExportStats()
  const currentViewStats = calculateCurrentViewStats()
  const hiddenSelectedCount = exportStats.count - currentViewStats.count

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
                <TableHead>คงเหลือ</TableHead>
                <TableHead>มูลค่ารวม</TableHead>
                <TableHead>อัปเดตล่าสุด</TableHead>
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
        {/* ✅ IMPROVED: Export Controls with Memory Display */}
        {showExportMode && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-medium text-green-900 flex items-center gap-2">
                      โหมดเลือก Export ({exportStats.count} รายการ)
                      {hiddenSelectedCount > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          +{hiddenSelectedCount} นอกมุมมอง
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      ในมุมมองนี้: {currentViewStats.count}/{filteredStocks.length} รายการ • 
                      รวมทั้งหมด: {exportStats.count} รายการ (฿{exportStats.totalValue.toLocaleString()})
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="summary"
                        checked={exportFormat === 'summary'}
                        onChange={(e) => setExportFormat(e.target.value as 'summary' | 'detailed')}
                      />
                      <span>สรุป</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="detailed" 
                        checked={exportFormat === 'detailed'}
                        onChange={(e) => setExportFormat(e.target.value as 'summary' | 'detailed')}
                      />
                      <span>รายละเอียด</span>
                    </label>
                  </div>
                  
                  <Button
                    onClick={handleExport}
                    disabled={exportStats.count === 0 || exporting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exporting ? 'กำลัง Export...' : 'Export Excel'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleToggleExportMode}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Search and Filter Bar */}
        <div className="space-y-3">
          {/* Large Screen Layout */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหายา (ชื่อ, รหัส, ชื่อสามัญ)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="w-48">
              <Select
                value={filterConfig.category}
                onValueChange={(value) => setFilterConfig(prev => ({ 
                  ...prev, 
                  category: value as DrugCategory | 'all' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภทยา" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Select
                value={filterConfig.dosageForm}
                onValueChange={(value) => setFilterConfig(prev => ({ 
                  ...prev, 
                  dosageForm: value as DosageForm | 'all' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกรูปแบบยา" />
                </SelectTrigger>
                <SelectContent>
                  {dosageFormOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button
                variant={showLowStockOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                สต็อกต่ำ
              </Button>

              <Button
                variant={showExportMode ? "default" : "outline"}
                size="sm"
                onClick={handleToggleExportMode}
                className={`flex items-center gap-2 ${showExportMode ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                <Download className="h-4 w-4" />
                {showExportMode ? 'ยกเลิก Export' : 'Excel'}
              </Button>

              {(filterConfig.category !== 'all' || 
                filterConfig.dosageForm !== 'all' || 
                searchTerm || 
                showLowStockOnly ||
                sortConfig.field !== 'name' || 
                sortConfig.direction !== 'asc') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setShowLowStockOnly(false)
                    setFilterConfig({ category: 'all', dosageForm: 'all' })
                    setSortConfig({ field: 'name', direction: 'asc' })
                  }}
                  className="flex items-center gap-2 text-xs bg-red-500 text-white hover:bg-red-600"
                >
                  ✕ ล้าง
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหายา (ชื่อ, รหัส, ชื่อสามัญ)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={filterConfig.category}
                  onValueChange={(value) => setFilterConfig(prev => ({ 
                    ...prev, 
                    category: value as DrugCategory | 'all' 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ทุกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Select
                  value={filterConfig.dosageForm}
                  onValueChange={(value) => setFilterConfig(prev => ({ 
                    ...prev, 
                    dosageForm: value as DosageForm | 'all' 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ทุกรูปแบบ" />
                  </SelectTrigger>
                  <SelectContent>
                    {dosageFormOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant={showLowStockOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className="flex items-center justify-center shrink-0 w-10 h-10"
                title="สต็อกต่ำ"
              >
                <AlertTriangle className="h-4 w-4" />
              </Button>

              <Button
                variant={showExportMode ? "default" : "outline"}
                size="sm"
                onClick={handleToggleExportMode}
                className={`flex items-center justify-center shrink-0 w-10 h-10 ${
                  showExportMode ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : ''
                }`}
                title="Export Excel"
              >
                <Download className="h-4 w-4" />
              </Button>

              {(filterConfig.category !== 'all' || 
                filterConfig.dosageForm !== 'all' || 
                searchTerm || 
                showLowStockOnly ||
                sortConfig.field !== 'name' || 
                sortConfig.direction !== 'asc') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setShowLowStockOnly(false)
                    setFilterConfig({ category: 'all', dosageForm: 'all' })
                    setSortConfig({ field: 'name', direction: 'asc' })
                  }}
                  className="flex items-center justify-center shrink-0 w-10 h-10 bg-red-500 text-white hover:bg-red-600 border-red-500"
                  title="ล้างตัวกรอง"
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Table with Export Checkboxes */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {/* ✅ FIXED: Select Column with Smart Status */}
                  {showExportMode && (
                    <TableHead className="w-[50px]">
                      <div 
                        className="flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded p-1"
                        onClick={handleSelectAll}
                        title={
                          currentViewStats.count === filteredStocks.length 
                            ? "ยกเลิกเลือกทั้งหมดในหน้านี้" 
                            : "เลือกทั้งหมดในหน้านี้"
                        }
                      >
                        {currentViewStats.count === filteredStocks.length && filteredStocks.length > 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : currentViewStats.count > 0 ? (
                          <div className="h-4 w-4 border-2 border-blue-600 rounded flex items-center justify-center">
                            <div className="h-2 w-2 bg-blue-600 rounded-sm" />
                          </div>
                        ) : (
                          <div className="h-4 w-4 border-2 border-gray-400 rounded" />
                        )}
                      </div>
                    </TableHead>
                  )}
                  
                  <SortableHeader field="name" className="w-[250px]">
                    ชื่อยา
                  </SortableHeader>
                  <SortableHeader field="dosageForm" className="w-[120px]">
                    รูปแบบ
                  </SortableHeader>
                  <SortableHeader field="strength" className="w-[120px]">
                    ความแรง
                  </SortableHeader>
                  <SortableHeader field="packageSize" className="w-[120px]">
                    ขนาดบรรจุ
                  </SortableHeader>
                  <SortableHeader field="quantity" className="w-[120px]" align="center">
                    คงเหลือ
                  </SortableHeader>
                  <SortableHeader field="totalValue" className="w-[130px]" align="right">
                    มูลค่ารวม
                  </SortableHeader>
                  <SortableHeader field="lastUpdated" className="w-[140px]" align="center">
                    อัปเดตล่าสุด
                  </SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStocks.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={showExportMode ? 8 : 7} 
                      className="h-24 text-center text-gray-500"
                    >
                      {searchTerm || showLowStockOnly ? 'ไม่พบรายการที่ค้นหา' : 'ไม่มีข้อมูลสต็อก'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStocks.map((stock) => {
                    const availableStock = calculateAvailableStock(stock) || 0
                    const lowStock = isLowStock(stock)
                    const categoryColor = getCategoryColor(stock.drug?.category)
                    const categoryLabel = getCategoryLabel(stock.drug?.category)
                    const reorderPoint = stock.minimumStock || 0
                    const stockValue = calculateStockValue(stock)
                    const lastUpdatedColor = getLastUpdatedColor(stock.lastUpdated)
                    const isSelected = selectedForExport.has(stock.id)

                    return (
                      <TableRow 
                        key={stock.id} 
                        className={`border-b transition-all ${
                          showExportMode 
                            ? (isSelected ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50')
                            : 'hover:bg-gray-50/50 cursor-pointer'
                        }`}
                        onClick={showExportMode ? () => handleToggleStock(stock.id) : () => handleView(stock)}
                      >
                        {/* ✅ FIXED: Checkbox Column */}
                        {showExportMode && (
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleStock(stock.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                        )}

                        {/* ชื่อยา */}
                        <TableCell className="font-medium">
                          <div className="space-y-2">
                            <div className="font-medium text-gray-900 leading-tight">
                              {stock.drug?.name || 'ไม่ระบุชื่อยา'}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${categoryColor} shrink-0`}
                              >
                                {categoryLabel}
                              </Badge>
                              <span className="text-sm text-gray-600 font-mono">
                                {stock.drug?.hospitalDrugCode || '-'}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* รูปแบบ */}
                        <TableCell>
                          <div className="text-sm text-gray-700">
                            {stock.drug?.dosageForm || '-'}
                          </div>
                        </TableCell>

                        {/* ความแรง */}
                        <TableCell>
                          <div className="text-sm text-gray-700">
                            {stock.drug?.strength || ''} {stock.drug?.unit || ''}
                          </div>
                        </TableCell>

                        {/* ขนาดบรรจุ */}
                        <TableCell>
                          <div className="text-sm text-gray-700">
                            {stock.drug?.packageSize ? (
                              <>1 x {stock.drug.packageSize}&apos;s</>
                            ) : (
                              '-'
                            )}
                          </div>
                        </TableCell>

                        {/* คงเหลือ */}
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <div className={`font-medium ${
                              lowStock 
                                ? 'text-red-600' 
                                : availableStock > 0 
                                  ? 'text-green-600' 
                                  : 'text-gray-400'
                            }`}>
                              {availableStock.toLocaleString()}
                              {lowStock && (
                                <AlertTriangle className="inline h-4 w-4 ml-1" />
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              ขั้นต่ำ: {reorderPoint.toLocaleString()}
                            </div>
                            {stock.reservedQty > 0 && (
                              <div className="text-xs text-orange-600">
                                จอง: {stock.reservedQty.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* มูลค่ารวม */}
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <div className="font-medium text-purple-600">
                              {stockValue.toFixed(2).toLocaleString()} ฿
                            </div>
                            <div className="text-xs text-gray-500">
                              กล่องละ {(stock.drug?.pricePerBox || 0).toFixed(2)} ฿
                            </div>
                          </div>
                        </TableCell>

                        {/* อัปเดตล่าสุด */}
                        <TableCell className="text-center">
                          {stock.lastUpdated ? (
                            <div className="space-y-1">
                              <div className={`text-sm font-medium ${lastUpdatedColor}`}>
                                {new Date(stock.lastUpdated).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className={`text-xs ${lastUpdatedColor}`}>
                                {new Date(stock.lastUpdated).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ✅ IMPROVED: Enhanced Footer Info with Export Memory */}
        {filteredStocks.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
            <div className="flex flex-col sm:flex-row gap-2 text-center sm:text-left">
              <span>
                แสดง <strong className="text-gray-700">{filteredStocks.length}</strong> รายการ
                จากทั้งหมด <strong className="text-gray-700">{stocks.length}</strong> รายการ
              </span>
              <span className="text-purple-600 font-medium">
                มูลค่ารวม ฿{filteredStats.totalValue.toLocaleString()}
              </span>
              {showExportMode && (
                <div className="flex flex-col sm:flex-row gap-1">
                  <span className="text-green-600 font-medium">
                    • เลือกใน view: {currentViewStats.count} รายการ
                  </span>
                  {hiddenSelectedCount > 0 && (
                    <span className="text-blue-600 font-medium">
                      • จำไว้นอก view: {hiddenSelectedCount} รายการ
                    </span>
                  )}
                  <span className="text-green-700 font-bold">
                    • รวม Export: {exportStats.count} รายการ (฿{exportStats.totalValue.toLocaleString()})
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>อัปเดต {'>'}14 วัน</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>อัปเดต 7-13 วัน</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>อัปเดต {'<'}7 วัน</span>
              </div>
            </div>
          </div>
        )}

        {/* ✅ IMPROVED: Export Instructions */}
        {showExportMode && filteredStocks.length > 0 && (
          <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p>
              💡 <strong>วิธีใช้:</strong> คลิกเพื่อเลือกรายการยาที่ต้องการ Export 
              • ระบบจะจำการเลือกข้ามตัวกรองต่างๆ 
              • ใช้ checkbox ด้านบนเพื่อเลือก/ยกเลิกทั้งหมดในหน้าปัจจุบัน
            </p>
            {hiddenSelectedCount > 0 && (
              <p className="text-blue-700 font-medium mt-1">
                🔍 คุณได้เลือก {hiddenSelectedCount} รายการที่ไม่ได้แสดงในตัวกรองปัจจุบัน
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stock Detail Modal */}
      <StockDetailModalEnhanced
        stock={selectedStock}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleStockUpdate}
      />
    </>
  )
}