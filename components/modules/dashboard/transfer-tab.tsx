// 📄 File: components/modules/dashboard/transfer-tab.tsx - Fixed

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

      // แก้ไข: ใช้ endpoint ที่ถูกต้อง
      const apiEndpoint = department === 'PHARMACY' 
        ? '/api/transfers/pharmacy' 
        : '/api/transfers/opd'

      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // ใช้ cookies สำหรับ authentication
        cache: 'no-store'
      })

      if (!response.ok) {
        // Detailed error handling
        const errorText = await response.text()
        console.error(`API Error Response:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        
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
      
      const errorMessage = error instanceof Error ? 
        error.message : 
        'ไม่สามารถโหลดข้อมูลใบเบิกได้'

      // แสดง error ที่เฉพาะเจาะจงมากขึ้น
      if (errorMessage.includes('403')) {
        toast({
          title: "ไม่มีสิทธิ์เข้าถึง",
          description: "กรุณาตรวจสอบการเข้าสู่ระบบ",
          variant: "destructive",
          duration: 5000
        })
      } else if (errorMessage.includes('401')) {
        toast({
          title: "กรุณาเข้าสู่ระบบ",
          description: "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่",
          variant: "destructive",
          duration: 5000
        })
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: errorMessage,
          variant: "destructive",
          duration: 5000
        })
      }

      // Set empty data instead of leaving null
      setData({
        transfers: [],
        stats: {
          totalTransfers: 0,
          pendingTransfers: 0,
          approvedTransfers: 0
        }
      })

    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTransferData()
  }, [department])

  const handleCreateTransfer = () => {
    // Navigate to create transfer page
    window.location.href = '/transfers/new'
  }

  const handleQuickAction = async (transferId: string, action: string) => {
    try {
      const response = await fetch(`/api/transfers/${transferId}/quick-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        throw new Error('Failed to perform action')
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "ดำเนินการสำเร็จ",
          description: `${action === 'cancel' ? 'ยกเลิก' : 'ปฏิเสธ'}ใบเบิกแล้ว`,
        })
        
        // Refresh data
        fetchTransferData()
      } else {
        throw new Error(result.error || 'Action failed')
      }

    } catch (error) {
      console.error('Quick action failed:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดำเนินการได้",
        variant: "destructive",
      })
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Loading */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Transfer Cards Loading */}
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
          <h2 className="text-xl font-semibold">
            การเบิกจ่ายยา - {department === 'PHARMACY' ? 'แผนกเภสัชกรรม' : 'แผนก OPD'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            จัดการใบเบิกจ่ายยาระหว่างแผนก
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTransferData(true)}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          
          <Button
            onClick={handleCreateTransfer}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            สร้างใบเบิกใหม่
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ใบเบิกทั้งหมด</p>
                <p className="text-2xl font-bold">{data?.stats.totalTransfers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">รอการอนุมัติ</p>
                <p className="text-2xl font-bold">{data?.stats.pendingTransfers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold">{data?.stats.approvedTransfers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            รายการใบเบิกล่าสุด
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!data?.transfers || data.transfers.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ยังไม่มีใบเบิก
              </h3>
              <p className="text-gray-600 mb-4">
                เริ่มต้นสร้างใบเบิกยาเพื่อจัดการสต็อกระหว่างแผนก
              </p>
              <Button onClick={handleCreateTransfer}>
                <Plus className="h-4 w-4 mr-2" />
                สร้างใบเบิกแรก
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {data.transfers.map((transfer) => (
                <TransferCard
                  key={transfer.id}
                  transfer={{
                    id: transfer.id,
                    requisitionNumber: transfer.transferNumber,
                    title: `ใบเบิกยา ${transfer.transferNumber}`,
                    fromDept: transfer.fromDepartment,
                    toDept: transfer.toDepartment,
                    status: transfer.status as any,
                    totalItems: transfer.items?.length || 0,
                    totalValue: transfer.items?.reduce((sum, item) => 
                      sum + (item.requestedQty * (item.drug?.pricePerBox || 0)), 0) || 0,
                    requestedAt: transfer.requestedAt,
                    requester: {
                      firstName: transfer.requestedBy?.name?.split(' ')[0] || '',
                      lastName: transfer.requestedBy?.name?.split(' ')[1] || '',
                    },
                    items: transfer.items?.map(item => ({
                      id: item.id,
                      requestedQty: item.requestedQty,
                      dispensedQty: item.sentQty,
                      receivedQty: item.receivedQty,
                      drug: {
                        name: item.drug.name,
                        unit: item.drug.unit
                      }
                    })) || []
                  }}
                  onQuickAction={(action) => handleQuickAction(transfer.id, action)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}