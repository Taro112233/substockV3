// 📄 File: components/modules/dashboard/history-tab-enhanced.tsx
// ✅ Enhanced History Tab with Filtering Stats Cards (Updated to Match Stock Pattern)

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Transaction } from '@/types/dashboard'
import { TransactionDisplayResponsive, useTransactionViewMode } from '../transaction/transaction-display-responsive'
import { 
  History, 
  RefreshCw,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Package,
  BarChart3
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

interface FilteredStatsData {
  totalTransactions: number
  totalValue: number
  incomingCount: number
  outgoingCount: number
}

interface HistoryTabEnhancedProps {
  department: 'PHARMACY' | 'OPD'
}

export function HistoryTabEnhanced({ 
  department
}: HistoryTabEnhancedProps) {
  const [data, setData] = useState<TransactionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filteredStats, setFilteredStats] = useState<FilteredStatsData | null>(null)
  const [isFiltered, setIsFiltered] = useState(false)
  const [hasInitialLoad, setHasInitialLoad] = useState(false)
  const { toast } = useToast()
  
  // Get view mode info for display
  const { viewMode, screenSize, isCardsView, setViewMode } = useTransactionViewMode()

  // ✅ Fixed: Calculate transaction cost using pricePerBox
  const calculateTransactionCost = (transaction: Transaction) => {
    const pricePerBox = transaction.drug?.pricePerBox || 0
    return Math.abs(transaction.quantity) * pricePerBox
  }

  // ✅ Fixed: Calculate total value using pricePerBox
  const calculateTotalValue = (transactions: Transaction[]) => {
    return transactions.reduce((sum, transaction) => sum + calculateTransactionCost(transaction), 0)
  }

  // Calculate original stats from data (used for comparison when filtered)
  const calculateOriginalStats = useCallback(() => {
    if (!data) return null
    
    const originalTotalValue = calculateTotalValue(data.transactions)
    const originalIncomingCount = data.transactions.filter(t => 
      ['RECEIVE_EXTERNAL', 'ADJUST_INCREASE', 'TRANSFER_IN', 'UNRESERVE'].includes(t.type)
    ).length
    const originalOutgoingCount = data.transactions.filter(t => 
      ['DISPENSE_EXTERNAL', 'ADJUST_DECREASE', 'TRANSFER_OUT', 'RESERVE'].includes(t.type)
    ).length
    
    return {
      totalTransactions: data.stats.totalTransactions,
      totalValue: originalTotalValue,
      incomingCount: originalIncomingCount,
      outgoingCount: originalOutgoingCount
    }
  }, [data, calculateTotalValue])

  const fetchTransactionData = useCallback(async (showRefreshToast = false) => {
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
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch transaction data')
      }

      // ✅ Fixed: Recalculate total value using pricePerBox instead of relying on API
      const recalculatedData = {
        ...result.data,
        stats: {
          ...result.data.stats,
          totalValue: calculateTotalValue(result.data.transactions)
        }
      }

      setData(recalculatedData)
      setHasInitialLoad(true)

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
  }, [department, toast, calculateTotalValue])

  // ✅ ดึงข้อมูลแค่ครั้งเดียวตอน mount
  useEffect(() => {
    if (!hasInitialLoad) {
      fetchTransactionData()
    }
  }, [fetchTransactionData, hasInitialLoad])

  // ✅ Manual refresh function เฉพาะเมื่อผู้ใช้กดปุ่ม
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

  // ✅ Enhanced: Handle filtered stats from responsive component (similar to stock pattern)
  const handleFilteredStatsChange = useCallback((stats: FilteredStatsData) => {
    setFilteredStats(stats)
    
    // Check if filters are active (different from original data)
    if (data) {
      const originalStats = calculateOriginalStats()
      if (originalStats) {
        const isCurrentlyFiltered = 
          stats.totalTransactions !== originalStats.totalTransactions ||
          Math.abs(stats.totalValue - originalStats.totalValue) > 0.01 ||
          stats.incomingCount !== originalStats.incomingCount ||
          stats.outgoingCount !== originalStats.outgoingCount
        
        setIsFiltered(isCurrentlyFiltered)
      }
    }
  }, [data, calculateOriginalStats])

  // Loading state
  if (loading || !data) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              ประวัติการเคลื่อนไหว
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              กำลังโหลดประวัติการเคลื่อนไหว...
            </p>
          </div>
        </div>

        {/* Loading Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Content */}
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 border-b animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ✅ Enhanced: Calculate display stats similar to stock pattern
  const originalStats = calculateOriginalStats()
  const displayStats = filteredStats || originalStats || {
    totalTransactions: data.stats.totalTransactions,
    totalValue: data.stats.totalValue,
    incomingCount: data.transactions.filter(t => 
      ['RECEIVE_EXTERNAL', 'ADJUST_INCREASE', 'TRANSFER_IN', 'UNRESERVE'].includes(t.type)
    ).length,
    outgoingCount: data.transactions.filter(t => 
      ['DISPENSE_EXTERNAL', 'ADJUST_DECREASE', 'TRANSFER_OUT', 'RESERVE'].includes(t.type)
    ).length
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              ประวัติการเคลื่อนไหว
            </h2>
          </div>
          
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-gray-600">
              อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}
            </p>
          </div>
        </div>

        {/* Right-aligned Action Buttons */}
        <div className="flex gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "กำลังอัปเดต..." : "รีเฟรช"}
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

      {/* ✅ Enhanced Statistics Cards - Updated with Stock Pattern */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Transactions Card */}
        <Card className={`transition-all duration-200 hover:shadow-md ${
          isFiltered ? (department === 'PHARMACY' ? 'border-blue-300 bg-blue-50' : 'border-green-300 bg-green-50') : 'border-gray-200'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">
                  รายการทั้งหมด{isFiltered ? ' (กรองแล้ว)' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-blue-900">
                    {displayStats.totalTransactions.toLocaleString()}
                  </p>
                  {isFiltered && originalStats && (
                    <span className="text-sm text-blue-600">
                      / {originalStats.totalTransactions.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <History className={`h-8 w-8 shrink-0 ${isFiltered ? 'text-blue-500' : 'text-gray-500'}`} />
            </div>
          </CardContent>
        </Card>

        {/* Incoming Transactions Card */}
        <Card className={`transition-all duration-200 hover:shadow-md ${
          isFiltered ? 'border-green-300 bg-green-50' : 'border-gray-200'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">
                  รับเข้า{isFiltered ? ' (กรองแล้ว)' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-green-900">
                    {displayStats.incomingCount.toLocaleString()}
                  </p>
                  {isFiltered && originalStats && (
                    <span className="text-sm text-green-600">
                      / {originalStats.incomingCount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <TrendingUp className={`h-8 w-8 shrink-0 ${isFiltered ? 'text-green-500' : 'text-gray-500'}`} />
            </div>
          </CardContent>
        </Card>

        {/* Outgoing Transactions Card */}
        <Card className={`transition-all duration-200 hover:shadow-md ${
          isFiltered ? 'border-red-300 bg-red-50' : 'border-gray-200'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">
                  จ่ายออก{isFiltered ? ' (กรองแล้ว)' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-red-900">
                    {displayStats.outgoingCount.toLocaleString()}
                  </p>
                  {isFiltered && originalStats && (
                    <span className="text-sm text-red-600">
                      / {originalStats.outgoingCount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <TrendingDown className={`h-8 w-8 shrink-0 ${isFiltered ? 'text-red-500' : 'text-gray-500'}`} />
            </div>
          </CardContent>
        </Card>

        {/* Total Value Card - ✅ Enhanced without comparison in value */}
        <Card className={`transition-all duration-200 hover:shadow-md ${
          isFiltered ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">
                  มูลค่าการเคลื่อนไหว{isFiltered ? ' (กรองแล้ว)' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-purple-600">
                    ฿{displayStats.totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
              <DollarSign className={`h-8 w-8 shrink-0 ${isFiltered ? 'text-purple-500' : 'text-gray-500'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Responsive Transaction Display */}
      <TransactionDisplayResponsive
        transactions={data.transactions}
        department={department}
        loading={loading}
        onFilteredStatsChange={handleFilteredStatsChange}
      />

      {/* Mobile Bottom Spacing for FAB and Navigation */}
      <div className="h-16 sm:h-0" />
    </div>
  )
}