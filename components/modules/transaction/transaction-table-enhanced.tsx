// 📄 File: components/modules/transaction/transaction-table-enhanced.tsx
// ✅ Modular Transaction Table เหมือน Stock Table - แก้ไข interface props

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Transaction } from '@/types/dashboard'
import { TransactionDetailModal } from './transaction-detail-modal'
import { useTransactionTable } from '@/hooks/useTransactionTable'
import {
  ExportControls,
  SearchFilterBar,
  SortableHeader,
  SelectAllHeader,
  FooterInfo,
  ExportInstructions
} from './TransactionTableComponents'
import { TransactionTableRow } from './TransactionTableRow'
import { History } from 'lucide-react'

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
  onFilteredStatsChange?: (stats: FilteredStatsData, filteredTransactions?: Transaction[]) => void
  loading?: boolean
}

export function TransactionTableEnhanced({ 
  transactions,
  department,
  onFilteredStatsChange,
  loading = false 
}: TransactionTableProps) {
  // Modal state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Use custom hook for all table logic
  const {
    // State
    searchTerm,
    setSearchTerm,
    filterConfig,
    setFilterConfig,
    sortConfig,
    
    // Export state
    selectedForExport,
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
    handleExport,
    handleClearFilters,
    
    // Export stats
    calculateExportStats,
    calculateCurrentViewStats,
    
    // Flags
    hasActiveFilters,
  } = useTransactionTable({ transactions, department, onFilteredStatsChange })

  // Component methods
  const handleView = (transaction: Transaction) => {
    if (showExportMode) return // ป้องกันเปิด modal ตอนเลือก export
    setSelectedTransaction(transaction)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedTransaction(null)
  }

  // Calculate stats for display
  const exportStats = calculateExportStats()
  const currentViewStats = calculateCurrentViewStats()
  const hiddenSelectedCount = exportStats.totalTransactions - currentViewStats.count

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
                <TableHead>ประเภท</TableHead>
                <TableHead>จำนวน</TableHead>
                <TableHead>วันเวลา</TableHead>
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
            filteredTransactionsLength={filteredTransactions.length}
            onExport={handleExport}
            onCancel={handleToggleExportMode}
            exporting={exporting}
            department={department}
          />
        )}

        {/* Search and Filter Bar */}
        <SearchFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterConfig={filterConfig}
          setFilterConfig={setFilterConfig}
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
                      filteredTransactionsLength={filteredTransactions.length}
                      onSelectAll={handleSelectAll}
                    />
                  )}
                  
                  {/* Sortable Headers */}
                  <SortableHeader field="drug" className="w-[250px]" sortConfig={sortConfig} onSort={handleSort}>
                    ชื่อยา
                  </SortableHeader>
                  <SortableHeader field="dosageForm" className="w-[100px]" sortConfig={sortConfig} onSort={handleSort}>
                    รูปแบบ
                  </SortableHeader>
                  <SortableHeader field="strength" className="w-[120px]" sortConfig={sortConfig} onSort={handleSort}>
                    ความแรง
                  </SortableHeader>
                  <SortableHeader field="packageSize" className="w-[120px]" sortConfig={sortConfig} onSort={handleSort}>
                    ขนาดบรรจุ
                  </SortableHeader>
                  <SortableHeader field="type" className="w-[140px]" sortConfig={sortConfig} onSort={handleSort}>
                    ประเภท
                  </SortableHeader>
                  <SortableHeader field="quantity" className="w-[120px]" align="center" sortConfig={sortConfig} onSort={handleSort}>
                    จำนวน
                  </SortableHeader>
                  <SortableHeader field="createdAt" className="w-[140px]" align="center" sortConfig={sortConfig} onSort={handleSort}>
                    วันเวลา
                  </SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={showExportMode ? 8 : 7} 
                      className="h-24 text-center text-gray-500"
                    >
                      {searchTerm || hasActiveFilters ? (
                        <div>
                          <History className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <div>ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</div>
                          <button onClick={handleClearFilters} className="mt-2 text-blue-600 hover:underline">
                            ล้างตัวกรอง
                          </button>
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
                  filteredTransactions.map((transaction) => (
                    <TransactionTableRow
                      key={transaction.id}
                      transaction={transaction}
                      showExportMode={showExportMode}
                      isSelected={selectedForExport.has(transaction.id)}
                      onView={handleView}
                      onToggleTransaction={handleToggleTransaction}
                      calculateTransactionCost={calculateTransactionCost}
                      getTransactionTypeBadge={getTransactionTypeBadge}
                      formatTransactionAmount={formatTransactionAmount}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer Info */}
        {filteredTransactions.length > 0 && (
          <FooterInfo
            filteredTransactionsLength={filteredTransactions.length}
            totalTransactionsLength={transactions.length}
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
          filteredTransactionsLength={filteredTransactions.length}
          hiddenSelectedCount={hiddenSelectedCount}
        />
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </>
  )
}