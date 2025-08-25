// 📄 File: components/modules/stock/stock-table-enhanced.tsx
// ✅ REFACTORED: Main Stock Table Component (Clean & Modular)

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Stock } from '@/types/dashboard'
import { StockDetailModalEnhanced } from './stock-detail-modal'
import { useStockTable } from '@/hooks/useStockTable'
import {
  ExportControls,
  SearchFilterBar,
  SortableHeader,
  SelectAllHeader,
  FooterInfo,
  ExportInstructions
} from './StockTableComponents'
import { StockTableRow } from './StockTableRow'

interface FilteredStatsData {
  totalDrugs: number
  totalValue: number
  lowStockCount: number
}

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
  // Modal state
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Use custom hook for all table logic
  const {
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
  } = useStockTable({ stocks, department, onFilteredStatsChange })

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

  // Calculate stats for display
  const exportStats = calculateExportStats()
  const currentViewStats = calculateCurrentViewStats()
  const hiddenSelectedCount = exportStats.count - currentViewStats.count

  // Loading skeleton
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
        {/* Export Controls */}
        {showExportMode && (
          <ExportControls
            exportStats={exportStats}
            currentViewStats={currentViewStats}
            hiddenSelectedCount={hiddenSelectedCount}
            filteredStocksLength={filteredStocks.length}
            exportFormat={exportFormat}
            setExportFormat={setExportFormat}
            onExport={handleExport}
            onCancel={handleToggleExportMode}
            exporting={exporting}
          />
        )}

        {/* Search and Filter Bar */}
        <SearchFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterConfig={filterConfig}
          setFilterConfig={setFilterConfig}
          showLowStockOnly={showLowStockOnly}
          setShowLowStockOnly={setShowLowStockOnly}
          showExportMode={showExportMode}
          onToggleExportMode={handleToggleExportMode}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Main Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {/* Select All Column */}
                  {showExportMode && (
                    <SelectAllHeader
                      currentViewStats={currentViewStats}
                      filteredStocksLength={filteredStocks.length}
                      onSelectAll={handleSelectAll}
                    />
                  )}
                  
                  {/* Sortable Headers */}
                  <SortableHeader field="name" className="w-[250px]" sortConfig={sortConfig} onSort={handleSort}>
                    ชื่อยา
                  </SortableHeader>
                  <SortableHeader field="dosageForm" className="w-[120px]" sortConfig={sortConfig} onSort={handleSort}>
                    รูปแบบ
                  </SortableHeader>
                  <SortableHeader field="strength" className="w-[120px]" sortConfig={sortConfig} onSort={handleSort}>
                    ความแรง
                  </SortableHeader>
                  <SortableHeader field="packageSize" className="w-[120px]" sortConfig={sortConfig} onSort={handleSort}>
                    ขนาดบรรจุ
                  </SortableHeader>
                  <SortableHeader field="quantity" className="w-[120px]" align="center" sortConfig={sortConfig} onSort={handleSort}>
                    คงเหลือ
                  </SortableHeader>
                  <SortableHeader field="totalValue" className="w-[130px]" align="right" sortConfig={sortConfig} onSort={handleSort}>
                    มูลค่ารวม
                  </SortableHeader>
                  <SortableHeader field="lastUpdated" className="w-[140px]" align="center" sortConfig={sortConfig} onSort={handleSort}>
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
                  filteredStocks.map((stock) => (
                    <StockTableRow
                      key={stock.id}
                      stock={stock}
                      showExportMode={showExportMode}
                      isSelected={selectedForExport.has(stock.id)}
                      onView={handleView}
                      onToggleStock={handleToggleStock}
                      calculateStockValue={calculateStockValue}
                      getLastUpdatedColor={getLastUpdatedColor}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer Info */}
        {filteredStocks.length > 0 && (
          <FooterInfo
            filteredStocksLength={filteredStocks.length}
            totalStocksLength={stocks.length}
            totalValue={filteredStats.totalValue}
            showExportMode={showExportMode}
            currentViewStats={currentViewStats}
            hiddenSelectedCount={hiddenSelectedCount}
            exportStats={exportStats}
          />
        )}

        {/* Export Instructions */}
        <ExportInstructions
          showExportMode={showExportMode}
          filteredStocksLength={filteredStocks.length}
          hiddenSelectedCount={hiddenSelectedCount}
        />
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