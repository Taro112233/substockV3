// 📄 File: components/modules/dashboard/history-tab-enhanced.tsx
// ✅ Enhanced History Tab with Fixed Price Calculation using pricePerBox

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
  Smartphone,
  Monitor,
  Grid3X3,
  List,
  DollarSign,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
// ✅ ลบ debug utility import เพราะไม่ต้องใช้แล้ว

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
  const [hasInitialLoad, setHasInitialLoad] = useState(false) // ✅ เพิ่ม flag สำหรับ track initial load
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

  const fetchTransactionData = useCallback(async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true)
      }

      const apiEndpoint = department === 'PHARMACY' 
        ? '/api/transactions/pharmacy' 
        : '/api/transactions/opd'

      // ✅ ใช้ fetch ปกติไม่ต้อง authentication
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
      setHasInitialLoad(true) // ✅ Mark ว่าได้ดึงข้อมูลแล้ว

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

  // Handle filtered stats from responsive component
  const handleFilteredStatsChange = useCallback((stats: FilteredStatsData) => {
    setFilteredStats(stats)
    
    // Check if filters are active
    if (data) {
      const isCurrentlyFiltered = 
        stats.totalTransactions !== data.stats.totalTransactions ||
        Math.abs(stats.totalValue - data.stats.totalValue) > 0.01 ||
        stats.incomingCount + stats.outgoingCount !== stats.totalTransactions
      
      setIsFiltered(isCurrentlyFiltered)
    }
  }, [data])

  // Handle view mode toggle for mobile
  const handleViewModeToggle = () => {
    setViewMode(isCardsView ? 'table' : 'cards')
  }

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

  // ✅ Fixed: Use filtered stats if available, otherwise calculate original stats with correct pricing
  const displayStats = filteredStats || {
    totalTransactions: data.stats.totalTransactions,
    totalValue: data.stats.totalValue, // Already recalculated above with pricePerBox
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
              ประวัติการเคลื่อนไหว - {department === 'PHARMACY' ? 'แผนกเภสัชกรรม' : 'แผนก OPD'}
            </h2>
            
            {/* View mode indicator for mobile */}
            {screenSize === 'mobile' && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs">
                {isCardsView ? (
                  <>
                    <Grid3X3 className="h-3 w-3" />
                    <span>การ์ด</span>
                  </>
                ) : (
                  <>
                    <List className="h-3 w-3" />
                    <span>ตาราง</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-gray-600">
              ประวัติการเคลื่อนไหวสต็อกยา • อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}
            </p>
          </div>
        </div>

        {/* Right-aligned Action Buttons */}
        <div className="flex gap-2 flex-wrap justify-end">
          {/* View mode toggle for mobile */}
          {screenSize === 'mobile' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewModeToggle}
              className="flex items-center gap-2"
            >
              {isCardsView ? (
                <>
                  <List className="h-4 w-4" />
                  <span>ตาราง</span>
                </>
              ) : (
                <>
                  <Grid3X3 className="h-4 w-4" />
                  <span>การ์ด</span>
                </>
              )}
            </Button>
          )}

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

      {/* Filter Indicator */}
      {isFiltered && filteredStats && (
        <div className={`${department === 'PHARMACY' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'} border rounded-lg p-3`}>
          <div className={`flex items-center gap-2 ${department === 'PHARMACY' ? 'text-blue-600' : 'text-green-600'}`}>
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">
              กำลังแสดงข้อมูลที่กรองแล้ว - สถิติด้านล่างแสดงเฉพาะรายการที่ผ่านการกรอง
            </span>
          </div>
        </div>
      )}

      {/* Enhanced Statistics Cards */}
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
                  {isFiltered && (
                    <span className="text-sm text-blue-600">
                      / {data.stats.totalTransactions.toLocaleString()}
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
                  {isFiltered && (
                    <span className="text-sm text-green-600">
                      / {data.transactions.filter(t => 
                        ['RECEIVE_EXTERNAL', 'ADJUST_INCREASE', 'TRANSFER_IN', 'UNRESERVE'].includes(t.type)
                      ).length.toLocaleString()}
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
                  {isFiltered && (
                    <span className="text-sm text-red-600">
                      / {data.transactions.filter(t => 
                        ['DISPENSE_EXTERNAL', 'ADJUST_DECREASE', 'TRANSFER_OUT', 'RESERVE'].includes(t.type)
                      ).length.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <TrendingDown className={`h-8 w-8 shrink-0 ${isFiltered ? 'text-red-500' : 'text-gray-500'}`} />
            </div>
          </CardContent>
        </Card>

        {/* Total Value Card - ✅ Fixed with pricePerBox calculation */}
        <Card className={`transition-all duration-200 hover:shadow-md ${
          isFiltered ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">
                  มูลค่ารวม{isFiltered ? ' (กรองแล้ว)' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-purple-600">
                    ฿{displayStats.totalValue.toLocaleString()}
                  </p>
                  {isFiltered && (
                    <span className="text-sm text-purple-600">
                      / ฿{data.stats.totalValue.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  คำนวณจาก pricePerBox
                </p>
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

      {/* Additional Info Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>อัปเดต: {new Date().toLocaleString('th-TH')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>เชื่อมต่อแล้ว</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>ใช้ pricePerBox</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>รับเข้า</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>จ่ายออก</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>ปรับสต็อก</span>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Spacing for FAB and Navigation */}
      <div className="h-16 sm:h-0" />
    </div>
  )
}