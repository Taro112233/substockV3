// 📄 File: app/dashboard/pharmacy/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardStatsCards } from '@/components/modules/dashboard/dashboard-stats'
import { StockManagementTab } from '@/components/modules/dashboard/stock-management-tab'
import { TransferTab } from '@/components/modules/dashboard/transfer-tab'
import { HistoryTab } from '@/components/modules/dashboard/history-tab'
import { TransferDetailModal } from '@/components/modules/transfer/transfer-detail-modal'
import { DashboardLoading, EmptyState } from '@/components/error-boundary'
import { Transfer, DashboardStats, Stock, Transaction } from '@/types/dashboard'
import { Package, FileText, History, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface DashboardData {
  stocks: Stock[]
  transfers: Transfer[]
  transactions: Transaction[]
  stats: {
    totalDrugs: number
    totalValue: number
    lowStockCount: number
    totalTransfers: number
    pendingTransfers: number
    approvedTransfers: number
  }
}

export default function PharmacyDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTransfer, setActiveTransfer] = useState<Transfer | null>(null)
  const { toast } = useToast()

  // Mock user data - ในระบบจริงจะดึงจาก authentication context
  const user = {
    firstName: 'สมชาย',
    lastName: 'เภสัชกร',
    position: 'เภสัชกรรมคลินิก',
    department: 'PHARMACY' as const
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true)
      }

      const response = await fetch('/api/dashboard/pharmacy', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // ป้องกัน cache เพื่อให้ได้ข้อมูลล่าสุด
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      setData(result.data)
      setError(null)

      if (showRefreshToast) {
        toast({
          title: "ข้อมูลได้รับการอัปเดต",
          description: "ข้อมูลสต็อกและใบเบิกล่าสุดแล้ว",
          duration: 2000
        })
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      
      const errorMessage = error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลได้"
      setError(errorMessage)
      
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

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  const handleTransferUpdate = () => {
    fetchDashboardData()
    setActiveTransfer(null)
  }

  // แสดง Loading State
  if (loading && !data) {
    return (
      <DashboardLoading message="กำลังโหลดข้อมูลสต็อกยา..." />
    )
  }

  // แสดง Error State
  if (error && !data) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <EmptyState 
          title="ไม่สามารถโหลดข้อมูลได้"
          description={error}
          action={
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              ลองใหม่
            </Button>
          }
        />
      </div>
    )
  }

  // แสดง Empty State
  if (!data) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <EmptyState 
          title="ไม่มีข้อมูลในระบบ"
          description="กรุณาติดต่อผู้ดูแลระบบ"
        />
      </div>
    )
  }

  // คำนวณ stats สำหรับแสดงผล
  const dashboardStats: DashboardStats = {
    totalDrugs: data.stats.totalDrugs,
    totalValue: data.stats.totalValue,
    lowStockItems: data.stats.lowStockCount,
    pendingTransfers: data.stats.pendingTransfers,
    recentTransactions: data.transactions.length,
    department: 'PHARMACY'
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ระบบจัดการสต็อกยา - แผนกเภสัชกรรม
          </h1>
          <p className="text-gray-600 mt-1">
            ยินดีต้อนรับ คุณ{user.firstName} {user.lastName} ({user.position})
          </p>
          <p className="text-xs text-gray-500 mt-1">
            อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6">
        <DashboardStatsCards 
          stats={dashboardStats}
          department="PHARMACY"
        />
      </div>

      {/* แสดงแจ้งเตือนหากมีข้อมูลที่ต้องให้ความสนใจ */}
      {data.stats.lowStockCount > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>แจ้งเตือน:</strong> มียาสต็อกต่ำ {data.stats.lowStockCount} รายการ ควรสั่งซื้อเพิ่มเติม
              </p>
            </div>
          </div>
        </div>
      )}

      {data.stats.pendingTransfers > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>รอดำเนินการ:</strong> มีใบเบิกรอการอนุมัติ {data.stats.pendingTransfers} ใบ
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">จัดการสต็อก</span>
            <span className="sm:hidden">สต็อก</span>
            {data.stats.lowStockCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {data.stats.lowStockCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">ใบเบิกของ</span>
            <span className="sm:hidden">เบิกของ</span>
            {data.stats.pendingTransfers > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-xs rounded-full px-2 py-0.5">
                {data.stats.pendingTransfers}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">ประวัติ</span>
            <span className="sm:hidden">ประวัติ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <StockManagementTab 
            stocks={data.stocks}
            department="PHARMACY"
          />
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <TransferTab 
            transfers={data.transfers}
            department="PHARMACY"
            onTransferAction={handleTransferUpdate}
            onViewDetail={setActiveTransfer}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <HistoryTab 
            transactions={data.transactions}
          />
        </TabsContent>
      </Tabs>

      {/* Transfer Detail Modal */}
      {activeTransfer && (
        <TransferDetailModal
          transfer={activeTransfer}
          isOpen={!!activeTransfer}
          onClose={() => setActiveTransfer(null)}
        />
      )}

      {/* Footer Information */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
          <div>
            Hospital Pharmacy Management System V3.0
          </div>
          <div className="mt-2 sm:mt-0">
            ระบบอัปเดตข้อมูลแบบเรียลไทม์
          </div>
        </div>
      </div>
    </div>
  )
}