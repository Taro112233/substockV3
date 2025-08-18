// 📄 File: components/modules/dashboard/stock-management-tab.tsx

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StockTable } from '@/components/modules/stock/stock-table'
import { Stock } from '@/types/dashboard'
import { 
  Package, 
  Plus, 
  Upload, 
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface StockData {
  stocks: Stock[]
  stats: {
    totalDrugs: number
    totalValue: number
    lowStockCount: number
    totalQuantity: number
  }
}

interface StockManagementTabProps {
  department: 'PHARMACY' | 'OPD'
}

export function StockManagementTab({ 
  department
}: StockManagementTabProps) {
  const [data, setData] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchStockData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true)
      }

      const apiEndpoint = department === 'PHARMACY' 
        ? '/api/stocks/pharmacy' 
        : '/api/stocks/opd'

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
        throw new Error(result.error || 'Failed to fetch stock data')
      }

      setData(result.data)

      if (showRefreshToast) {
        toast({
          title: "ข้อมูลสต็อกได้รับการอัปเดต",
          description: "ข้อมูลล่าสุดแล้ว",
          duration: 2000
        })
      }

    } catch (error) {
      console.error('Failed to fetch stock data:', error)
      
      const errorMessage = error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลสต็อกได้"
      
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
    fetchStockData()
  }, [department])

  const handleRefresh = () => {
    fetchStockData(true)
  }

  const handleAddStock = () => {
    // TODO: เปิด modal เพิ่มสต็อก
    console.log('Add new stock')
  }

  const handleImportStock = () => {
    // TODO: เปิด dialog import
    console.log('Import stock data')
  }

  const handleExportStock = () => {
    // TODO: Export ข้อมูลสต็อก
    console.log('Export stock data')
  }

  const handleAdjustStock = (stock: Stock) => {
    // TODO: เปิด modal ปรับสต็อก
    console.log('Adjust stock:', stock.drug.name)
  }

  const handleViewStock = (stock: Stock) => {
    // TODO: เปิด modal รายละเอียดสต็อก
    console.log('View stock details:', stock.drug.name)
  }

  // กรณี loading หรือไม่มีข้อมูล
  if (loading || !data) {
    return (
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              จัดการสต็อกยา - {department === 'PHARMACY' ? 'แผนกเภสัชกรรม' : 'แผนก OPD'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              กำลังโหลดข้อมูลสต็อกยา...
            </p>
          </div>
        </div>

        {/* Loading State */}
        <Card>
          <CardContent>
            <StockTable
              stocks={[]}
              department={department}
              loading={true}
              onAdjust={handleAdjustStock}
              onView={handleViewStock}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            จัดการสต็อกยา - {department === 'PHARMACY' ? 'แผนกเภสัชกรรม' : 'แผนก OPD'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            ข้อมูลสต็อกยาแบบเรียลไทม์ • อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}
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
            onClick={handleExportStock}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            ส่งออก
          </Button>
          
          {department === 'PHARMACY' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportStock}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                นำเข้า
              </Button>
              
              <Button
                size="sm"
                onClick={handleAddStock}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                เพิ่มยาใหม่
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {data.stats.totalDrugs.toLocaleString()}
                </div>
                <div className="text-sm text-blue-600">รายการยา</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {data.stats.totalQuantity.toLocaleString()}
                </div>
                <div className="text-sm text-green-600">จำนวนรวม</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${data.stats.lowStockCount > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
              <div>
                <div className={`text-2xl font-bold ${data.stats.lowStockCount > 0 ? 'text-orange-900' : 'text-gray-900'}`}>
                  {data.stats.lowStockCount.toLocaleString()}
                </div>
                <div className={`text-sm ${data.stats.lowStockCount > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                  สต็อกต่ำ
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-900">
                  ฿{(data.stats.totalValue / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-purple-600">มูลค่ารวม</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {data.stats.lowStockCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-orange-900">
                  แจ้งเตือนสต็อกต่ำ
                </div>
                <div className="text-sm text-orange-700">
                  มียา {data.stats.lowStockCount} รายการที่มีสต็อกต่ำกว่าระดับขั้นต่ำ 
                  ควร{department === 'PHARMACY' ? 'สั่งซื้อ' : 'เบิก'}เพิ่มเติม
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                ดูรายการ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            รายการสต็อกยา ({data.stocks.length} รายการ)
          </h3>
        </div>
        <StockTable
          stocks={data.stocks}
          department={department}
          loading={false}
          onAdjust={handleAdjustStock}
          onView={handleViewStock}
        />
      </div>
    </div>
  )
}