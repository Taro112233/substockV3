// 📄 File: components/modules/dashboard/history-tab.tsx

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionItem } from '@/components/modules/transaction/transaction-item'
import { Transaction } from '@/types/dashboard'
import { 
  History, 
  RefreshCw,
  Download,
  Filter,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TransactionData {
  transactions: Transaction[]
  stats: {
    totalTransactions: number
    recentTransactions: number
  }
}

interface HistoryTabProps {
  department: 'PHARMACY' | 'OPD'
}

export function HistoryTab({ 
  department
}: HistoryTabProps) {
  const [data, setData] = useState<TransactionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
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
    // TODO: Export ประวัติการเคลื่อนไหว
    console.log('Export transaction history')
  }

  const handleFilter = () => {
    // TODO: เปิด dialog กรองข้อมูล
    console.log('Filter transactions')
  }

  // กรณี loading หรือไม่มีข้อมูล
  if (loading || !data) {
    return (
      <div className="space-y-6">
        {/* Header Actions */}
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

        {/* Loading State */}
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-4 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // คำนวณสถิติเพิ่มเติม
  const inTransactions = data.transactions.filter(t => 
    ['RECEIVE', 'ADJUST_IN', 'TRANSFER_IN'].includes(t.type)
  )
  const outTransactions = data.transactions.filter(t => 
    ['DISPENSE', 'ADJUST_OUT', 'TRANSFER_OUT', 'EXPIRE', 'DAMAGED'].includes(t.type)
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
            onClick={handleFilter}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            กรอง
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
                  {data.stats.totalTransactions.toLocaleString()}
                </div>
                <div className="text-sm text-blue-600">รายการทั้งหมด</div>
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
                  {inTransactions.length.toLocaleString()}
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
                  {outTransactions.length.toLocaleString()}
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
                  {data.stats.recentTransactions.toLocaleString()}
                </div>
                <div className="text-sm text-purple-600">7 วันที่ผ่านมา</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            ประวัติการเคลื่อนไหว ({data.transactions.length} รายการล่าสุด)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <div className="text-lg font-medium mb-2">ไม่มีประวัติการเคลื่อนไหว</div>
              <div className="text-sm">ยังไม่มีการบันทึกการเคลื่อนไหวสต็อกในระบบ</div>
            </div>
          ) : (
            <div className="space-y-3">
              {data.transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}