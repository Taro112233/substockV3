// 📄 File: components/modules/stock/stock-table-enhanced.tsx
// Enhanced Stock Table with Total Value Display and Date Color Coding
// ✅ Fixed TypeScript and ESLint errors - removed unused variables

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
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { StockDetailModalEnhanced } from './stock-detail-modal'

// Type สำหรับ sorting
type SortField = 'name' | 'dosageForm' | 'strength' | 'packageSize' | 'quantity' | 'totalValue' | 'lastUpdated'
type SortDirection = 'asc' | 'desc' | null

interface SortConfig {
  field: SortField | null
  direction: SortDirection
}

// Type สำหรับ filtering
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

// ✅ Fixed: Type-safe comparison value types
type SortableValue = string | number | Date

interface StockTableProps {
  stocks: Stock[]
  department: 'PHARMACY' | 'OPD'
  onView?: (stock: Stock) => void
  onUpdate?: (updatedStock: Stock) => void
  onFilteredStatsChange?: (stats: FilteredStatsData) => void
  loading?: boolean
}

export function StockTableEnhanced({ 
  stocks,
  onUpdate,
  onFilteredStatsChange,
  loading = false 
}: StockTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: null })
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({ 
    category: 'all', 
    dosageForm: 'all' 
  })

  // Category options with Thai labels
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

  // Dosage form options with Thai labels
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

  // ✅ Fixed: Type-safe sorting function
  const handleSort = (field: SortField) => {
    let direction: SortDirection = 'asc'
    
    if (sortConfig.field === field) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc'
      } else if (sortConfig.direction === 'desc') {
        direction = null // ยกเลิก sort
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

  // ✅ Fixed: Type-safe sorting logic
  const sortedStocks = useMemo(() => {
    if (!sortConfig.field || !sortConfig.direction) {
      return stocks
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
          // สำหรับความแรง ใช้ตัวเลขถ้าเป็นไปได้
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

      // ✅ Fixed: Type-safe comparison with explicit type checking
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
        // Fallback for mixed types - convert to string for comparison
        const aStr = String(aValue).toLowerCase()
        const bStr = String(bValue).toLowerCase()
        return sortConfig.direction === 'asc' 
          ? aStr.localeCompare(bStr, 'th') 
          : bStr.localeCompare(aStr, 'th')
      }
    })
  }, [stocks, sortConfig])

  // Filter sorted stocks with enhanced filtering
  const filteredStocks = useMemo(() => {
    return sortedStocks.filter(stock => {
      // ป้องกัน undefined/null ใน search
      const drugName = stock.drug?.name?.toLowerCase() || ''
      const hospitalCode = stock.drug?.hospitalDrugCode?.toLowerCase() || ''
      const genericName = stock.drug?.genericName?.toLowerCase() || ''
      const searchLower = searchTerm.toLowerCase()
      
      const matchesSearch = 
        drugName.includes(searchLower) ||
        hospitalCode.includes(searchLower) ||
        genericName.includes(searchLower)
      
      const matchesLowStock = showLowStockOnly ? isLowStock(stock) : true
      
      // Category filter
      const matchesCategory = filterConfig.category === 'all' || 
        stock.drug?.category === filterConfig.category
      
      // Dosage form filter
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

  // Use useEffect to notify parent component about stats change
  useEffect(() => {
    if (onFilteredStatsChange) {
      onFilteredStatsChange(filteredStats)
    }
  }, [filteredStats, onFilteredStatsChange])

  // Component methods
  const handleView = (stock: Stock) => {
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
        {/* Enhanced Search and Filter Bar */}
        <div className="space-y-3">
          {/* Large Screen: Everything in one row */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหายา (ชื่อ, รหัส, ชื่อสามัญ)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
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

            {/* Dosage Form Filter */}
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

            {/* Action Buttons */}
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

              {/* Clear Filters Button */}
              {(filterConfig.category !== 'all' || 
                filterConfig.dosageForm !== 'all' || 
                searchTerm || 
                showLowStockOnly ||
                sortConfig.field) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setShowLowStockOnly(false)
                    setFilterConfig({ category: 'all', dosageForm: 'all' })
                    setSortConfig({ field: null, direction: null })
                  }}
                  className="flex items-center gap-2 text-xs bg-red-500 text-white hover:bg-red-600"
                >
                  ✕ ล้าง
                </Button>
              )}
            </div>
          </div>

          {/* Small Screen: Mobile Layout */}
          <div className="lg:hidden">
            {/* Row 1: Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหายา (ชื่อ, รหัส, ชื่อสามัญ)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Row 2: Filters and Buttons */}
            <div className="flex items-center gap-2">
              {/* Category Filter */}
              <div className="flex-1">
                <Select
                  value={filterConfig.category}
                  onValueChange={(value) => setFilterConfig(prev => ({ 
                    ...prev, 
                    category: value as DrugCategory | 'all' 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ยาใช้ภายนอก/สมุนไพร" />
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

              {/* Dosage Form Filter */}
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

              {/* Action Buttons - Icon only */}
              <Button
                variant={showLowStockOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className="flex items-center justify-center shrink-0 w-10 h-10"
                title="สต็อกต่ำ"
              >
                <AlertTriangle className="h-4 w-4" />
              </Button>

              {/* Clear Filters Button - Icon only */}
              {(filterConfig.category !== 'all' || 
                filterConfig.dosageForm !== 'all' || 
                searchTerm || 
                showLowStockOnly ||
                sortConfig.field) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setShowLowStockOnly(false)
                    setFilterConfig({ category: 'all', dosageForm: 'all' })
                    setSortConfig({ field: null, direction: null })
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

        {/* Enhanced Table with Sortable Headers */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
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
                    <TableCell colSpan={7} className="h-24 text-center text-gray-500">
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

                    return (
                      <TableRow 
                        key={stock.id} 
                        className="border-b hover:bg-gray-50/50 cursor-pointer"
                        onClick={() => handleView(stock)}
                      >
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
                              ฿{stockValue.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              @฿{(stock.drug?.pricePerBox || 0).toFixed(2)}/กล่อง
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

        {/* Enhanced Footer Info with Comprehensive Filter Status */}
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