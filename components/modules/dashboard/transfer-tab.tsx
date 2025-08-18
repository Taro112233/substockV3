// 📄 File: components/modules/dashboard/transfer-tab.tsx

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransferCard } from '@/components/modules/transfer/transfer-card'
import { Transfer } from '@/types/dashboard'
import { 
  FileText, 
  Plus, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TransferData {
  transfers: Transfer[]
  stats: {
    totalTransfers: number
    pendingTransfers: number
    approvedTransfers: number
  }
}

interface TransferTabProps {
  department: 'PHARMACY' | 'OPD'
  onViewDetail?: (transfer: Transfer) => void
}

export function TransferTab({ 
  department,
  onViewDetail
}: TransferTabProps) {
  const [data, setData] = useState<TransferData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchTransferData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true)
      }

      const apiEndpoint = department === 'PHARMACY' 
        ? '/api/transfers/pharmacy' 
        : '/api/transfers/opd'

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
        throw new Error(result.error || 'Failed to fetch transfer data')
      }

      setData(result.data)

      if (showRefreshToast) {
        toast({
          title: "ข้อมูลใบเบิกได้รับการอัปเดต",
          description: "ข้อมูลล่าสุดแล้ว",
          duration: 2000
        })
      }

    } catch (error) {
      console.error('Failed to fetch transfer data:', error)
      
      const errorMessage = error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลใบเบิกได้"
      
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
    fetchTransferData()
  }, [department])

  const handleRefresh = () => {
    fetchTransferData(true)
  }

  const handleCreateTransfer = () => {
    // TODO: เปิด modal สร้างใบเบิกใหม่
    console.log('Create new transfer')
  }

  const handleTransferAction = (transfer: Transfer, action: string) => {
    // TODO: จัดการ action ต่างๆ (อนุมัติ, ปฏิเสธ, ส่ง, รับ)
    console.log('Transfer action:', action, transfer.transferNumber)
    
    toast({
      title: "ดำเนินการสำเร็จ",
      description: `${action} ใบเบิก ${transfer.transferNumber} แล้ว`,
      duration: 2000
    })
    
    // Refresh data after action
    fetchTransferData()
  }

  const handleViewDetail = (transfer: Transfer) => {
    if (onViewDetail) {
      onViewDetail(transfer)
    } else {
      console.log('View transfer details:', transfer.transferNumber)
    }
  }

  // กรณี loading หรือไม่มีข้อมูล
  if (loading || !data) {
    return (
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              จัดการใบเบิกของ - {department === 'PHARMACY' ? 'แผนกเภสัชกรรม' : 'แผนก OPD'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              กำลังโหลดข้อมูลใบเบิก...
            </p>
          </div>
        </div>

        {/* Loading State */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            จัดการใบเบิกของ - {department === 'PHARMACY' ? 'แผนกเภสัชกรรม' : 'แผนก OPD'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            ข้อมูลใบเบิกแบบเรียลไทม์ • อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}
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
            size="sm"
            onClick={handleCreateTransfer}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            สร้างใบเบิกใหม่
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {data.stats.totalTransfers.toLocaleString()}
                </div>
                <div className="text-sm text-blue-600">ใบเบิกทั้งหมด</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-900">
                  {data.stats.pendingTransfers.toLocaleString()}
                </div>
                <div className="text-sm text-orange-600">รออนุมัติ</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {data.stats.approvedTransfers.toLocaleString()}
                </div>
                <div className="text-sm text-green-600">อนุมัติแล้ว</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transfers Alert */}
      {data.stats.pendingTransfers > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-orange-900">
                  มีใบเบิกรอดำเนินการ
                </div>
                <div className="text-sm text-orange-700">
                  มีใบเบิก {data.stats.pendingTransfers} ใบ ที่รอการอนุมัติ
                  {department === 'PHARMACY' ? ' กรุณาตรวจสอบและอนุมัติ' : ' รอแผนกเภสัชกรรมอนุมัติ'}
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

      {/* Transfer List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            รายการใบเบิกของ ({data.transfers.length} รายการ)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.transfers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <div className="text-lg font-medium mb-2">ไม่มีใบเบิกในระบบ</div>
              <div className="text-sm">เริ่มต้นด้วยการสร้างใบเบิกใหม่</div>
              <Button 
                className="mt-4" 
                onClick={handleCreateTransfer}
              >
                <Plus className="h-4 w-4 mr-2" />
                สร้างใบเบิกใหม่
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.transfers.map((transfer) => (
                <TransferCard
                  key={transfer.id}
                  transfer={transfer}
                  department={department}
                  onAction={(action: string) => handleTransferAction(transfer, action)}
                  onViewDetail={() => handleViewDetail(transfer)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}