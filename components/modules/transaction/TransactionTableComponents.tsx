// 📄 File: components/modules/transaction/TransactionTableComponents.tsx
// ✅ Modular components สำหรับ Transaction Table พร้อม Export Button Dropdown

import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  TableHead,
} from '@/components/ui/table'
import { 
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  History,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { Transaction } from '@/types/dashboard'
import { ExportButton, TransactionExportFormat } from '@/components/ui/ExcelExportButton'

// Types
type SortField = 'drug' | 'dosageForm' | 'strength' | 'packageSize' | 'type' | 'quantity' | 'createdAt' | 'user' | 'totalCost'
type SortDirection = 'asc' | 'desc' | null

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

// Transaction Type Options
export const transactionTypeOptions = [
  { value: 'all', label: 'ทุกประเภท' },
  { value: 'RECEIVE_EXTERNAL', label: 'รับจากภายนอก' },
  { value: 'DISPENSE_EXTERNAL', label: 'จ่ายให้ผู้ป่วย' },
  { value: 'TRANSFER_IN', label: 'รับโอนจากแผนกอื่น' },
  { value: 'TRANSFER_OUT', label: 'ส่งโอนให้แผนกอื่น' },
  { value: 'ADJUST_INCREASE', label: 'ปรับเพิ่มสต็อก' },
  { value: 'ADJUST_DECREASE', label: 'ปรับลดสต็อก' },
  { value: 'RESERVE', label: 'จองยา' },
  { value: 'UNRESERVE', label: 'ยกเลิกจอง' },
  { value: 'MIN_STOCK_INCREASE', label: 'ปรับเพิ่มขั้นต่ำ' },
  { value: 'MIN_STOCK_DECREASE', label: 'ปรับลดขั้นต่ำ' },
  { value: 'MIN_STOCK_RESET', label: 'กำหนดจำนวนขั้นต่ำใหม่' },
  { value: 'DATA_UPDATE', label: 'อัปเดตข้อมูล' },
  { value: 'PRICE_UPDATE', label: 'อัปเดตราคา' },
  { value: 'INFO_CORRECTION', label: 'แก้ไขข้อมูล' }
]

export const dateRangeOptions = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'today', label: 'วันนี้' },
  { value: 'week', label: '7 วันที่ผ่านมา' },
  { value: 'month', label: '30 วันที่ผ่านมา' }
]

// Export Controls Component - ใช้ ExportButton จาก ui/ExcelExportButton.tsx
interface ExportControlsProps {
  exportStats: FilteredStatsData
  currentViewStats: { count: number; totalValue: number }
  hiddenSelectedCount: number
  filteredTransactionsLength: number
  onExport: (format: TransactionExportFormat) => void
  onCancel: () => void
  exporting: boolean
  department: 'PHARMACY' | 'OPD'
}

export function ExportControls({
  exportStats,
  currentViewStats,
  hiddenSelectedCount,
  filteredTransactionsLength,
  onExport,
  onCancel,
  exporting,
}: ExportControlsProps) {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-medium text-green-900 flex items-center gap-2">
                โหมดเลือก Export ({exportStats.totalTransactions} รายการ)
                {hiddenSelectedCount > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    +{hiddenSelectedCount} นอกมุมมอง
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-green-700 mt-1">
                ในมุมมองนี้: {currentViewStats.count}/{filteredTransactionsLength} รายการ • 
                รวมทั้งหมด: {exportStats.totalTransactions} รายการ (฿{exportStats.totalValue.toLocaleString()})
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* ใช้ ExportButton แบบ dropdown สำหรับ transaction */}
            <ExportButton
              selectedCount={exportStats.totalTransactions}
              exporting={exporting}
              onExport={onExport}
              variant="transaction"
              className=""
            />
            
            <Button
              variant="outline"
              onClick={onCancel}
              className="bg-red-500 text-white hover:bg-red-600 border-red-500 hover:border-red-600"
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Search and Filter Bar Component
interface SearchFilterBarProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterConfig: FilterConfig
  setFilterConfig: (config: FilterConfig | ((prev: FilterConfig) => FilterConfig)) => void
  showExportMode: boolean
  onToggleExportMode: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function SearchFilterBar({
  searchTerm,
  setSearchTerm,
  filterConfig,
  setFilterConfig,
  showExportMode,
  onToggleExportMode,
  hasActiveFilters,
  onClearFilters
}: SearchFilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Large Screen Layout */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="ค้นหา (ชื่อยา, รหัส, ชื่อสามัญ, เอกสารอ้างอิง)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="w-56">
          <Select
            value={filterConfig.type}
            onValueChange={(value) => setFilterConfig(prev => ({ 
              ...prev, 
              type: value as TransactionType | 'all' 
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกประเภทการเคลื่อนไหว" />
            </SelectTrigger>
            <SelectContent>
              {transactionTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <Select
            value={filterConfig.dateRange}
            onValueChange={(value) => setFilterConfig(prev => ({ 
              ...prev, 
              dateRange: value as 'all' | 'today' | 'week' | 'month' 
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกช่วงเวลา" />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 shrink-0">
          {!showExportMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleExportMode}
              className="flex items-center gap-2 bg-[#217346] text-white hover:bg-[#1e5f3a] border-[#217346] hover:border-[#1e5f3a]"
            >
              <Download className="h-4 w-4" />
              Excel
            </Button>
          )}

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
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
            placeholder="ค้นหา (ชื่อยา, รหัส, ชื่อสามัญ, เอกสารอ้างอิง)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select
              value={filterConfig.type}
              onValueChange={(value) => setFilterConfig(prev => ({ 
                ...prev, 
                type: value as TransactionType | 'all' 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent>
                {transactionTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select
              value={filterConfig.dateRange}
              onValueChange={(value) => setFilterConfig(prev => ({ 
                ...prev, 
                dateRange: value as 'all' | 'today' | 'week' | 'month' 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="ช่วงเวลา" />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!showExportMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleExportMode}
              className="flex items-center justify-center shrink-0 w-10 h-10 bg-[#217346] text-white hover:bg-[#1e5f3a] border-[#217346] hover:border-[#1e5f3a]"
              title="Export Excel"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center justify-center shrink-0 w-10 h-10 bg-red-500 text-white hover:bg-red-600 border-red-500"
              title="ล้างตัวกรอง"
            >
              ✕
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Sortable Header Component
interface SortableHeaderProps {
  field: SortField
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
  sortConfig: SortConfig
  onSort: (field: SortField) => void
}

export function SortableHeader({ 
  field, 
  children, 
  className = '',
  align = 'left',
  sortConfig,
  onSort
}: SortableHeaderProps) {
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

  return (
    <TableHead 
      className={`cursor-pointer hover:bg-gray-100 transition-colors ${className} ${
        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''
      }`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-2 ${
        align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''
      }`}>
        {children}
        {getSortIcon(field)}
      </div>
    </TableHead>
  )
}

// Select All Header Component
interface SelectAllHeaderProps {
  currentViewStats: { count: number }
  filteredTransactionsLength: number
  onSelectAll: () => void
}

export function SelectAllHeader({ currentViewStats, filteredTransactionsLength, onSelectAll }: SelectAllHeaderProps) {
  return (
    <TableHead className="w-[50px]">
      <div 
        className="flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded p-1"
        onClick={onSelectAll}
        title={
          currentViewStats.count === filteredTransactionsLength 
            ? "ยกเลิกเลือกทั้งหมดในหน้านี้" 
            : "เลือกทั้งหมดในหน้านี้"
        }
      >
        {currentViewStats.count === filteredTransactionsLength && filteredTransactionsLength > 0 ? (
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
  )
}

// Footer Info Component
interface FooterInfoProps {
  filteredTransactionsLength: number
  totalTransactionsLength: number
  totalValue: number
  showExportMode: boolean
  currentViewStats: { count: number; totalValue: number }
  hiddenSelectedCount: number
  exportStats: FilteredStatsData
}

export function FooterInfo({
  filteredTransactionsLength,
  totalTransactionsLength,
  totalValue,
  showExportMode,
  currentViewStats,
  hiddenSelectedCount,
  exportStats
}: FooterInfoProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
      <div className="flex flex-col sm:flex-row gap-2 text-center sm:text-left">
        <span>
          แสดง <strong className="text-gray-700">{filteredTransactionsLength}</strong> รายการ
          จากทั้งหมด <strong className="text-gray-700">{totalTransactionsLength}</strong> รายการ
        </span>
        <span className="text-purple-600 font-medium">
          มูลค่ารวม ฿{totalValue.toLocaleString()}
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
              • รวม Export: {exportStats.totalTransactions} รายการ (฿{exportStats.totalValue.toLocaleString()})
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-green-500" />
          <span>รับเข้า ({exportStats.incomingCount})</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingDown className="w-3 h-3 text-red-500" />
          <span>จ่ายออก ({exportStats.outgoingCount})</span>
        </div>
      </div>
    </div>
  )
}

// Export Instructions Component
interface ExportInstructionsProps {
  showExportMode: boolean
  filteredTransactionsLength: number
  hiddenSelectedCount: number
}

export function ExportInstructions({ showExportMode, filteredTransactionsLength, hiddenSelectedCount }: ExportInstructionsProps) {
  if (!showExportMode || filteredTransactionsLength === 0) return null

  return (
    <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
      <p>
        💡 <strong>วิธีใช้:</strong> คลิกเพื่อเลือกรายการที่ต้องการ Export 
        • ระบบจะจำการเลือกข้ามตัวกรองต่างๆ 
        • ใช้ checkbox ด้านบนเพื่อเลือก/ยกเลิกทั้งหมดในหน้าปัจจุบัน
      </p>
      {hiddenSelectedCount > 0 && (
        <p className="text-blue-700 font-medium mt-1">
          🔍 คุณได้เลือก {hiddenSelectedCount} รายการที่ไม่ได้แสดงในตัวกรองปัจจุบัน
        </p>
      )}
    </div>
  )
}