
// 📄 File: app/transfers/[id]/page.tsx (Fixed)

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { TransferRequestTab } from '@/components/modules/transfer/transfer-request-tab'
import { TransferDeliveryTab } from '@/components/modules/transfer/transfer-delivery-tab'
import { TransferHeader } from '@/components/modules/transfer/transfer-header'
import { TransferActions } from '@/components/modules/transfer/transfer-actions'
import { WorkflowProgress } from '@/components/modules/transfer/workflow-progress'
import { transferService } from '@/services/transfer-service'
import { getStatusConfig } from '@/lib/utils/transfer-status'
import type { TransferDetails } from '@/types/transfer'
import {
  ArrowLeft,
  AlertTriangle,
  Download
} from 'lucide-react'

interface TransferDetailPageProps {
  params: { id: string }
}

export default function TransferDetailPage({ params }: TransferDetailPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [transfer, setTransfer] = useState<TransferDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  
  // Get active tab from URL params or default to 'request'
  const activeTab = searchParams.get('tab') || 'request'
  
  const fetchTransferDetails = useCallback(async () => {
    try {
      setLoading(true)
      const result = await transferService.getTransferDetails(params.id)
      setTransfer(result)
    } catch (error) {
      console.error('Failed to fetch transfer details:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดรายละเอียดใบเบิกได้",
        variant: "destructive",
      })
      router.push('/transfers')
    } finally {
      setLoading(false)
    }
  }, [params.id, toast, router])
  
  useEffect(() => {
    fetchTransferDetails()
  }, [fetchTransferDetails])
  
  const handleQuickAction = async (action: string) => {
    if (!transfer) return
    
    try {
      setProcessing(true)
      await transferService.performAction(transfer.id, action, {
        note: action === 'cancel' ? 'ยกเลิกโดยผู้เบิก' : 'ปฏิเสธโดยผู้อนุมัติ'
      })
      
      toast({
        title: "ดำเนินการสำเร็จ",
        description: getActionSuccessMessage(action),
      })
      
      // Refresh data
      fetchTransferDetails()
      
    } catch (error) {
      console.error('Action failed:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดำเนินการได้",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }
  
  const handleNavigateAction = (action: string) => {
    router.push(`/transfers/${params.id}/action?type=${action}`)
  }
  
  const getActionSuccessMessage = (action: string) => {
    const messages: Record<string, string> = {
      cancel: 'ยกเลิกใบเบิกแล้ว',
      reject: 'ปฏิเสธใบเบิกแล้ว',
    }
    return messages[action] || 'ดำเนินการสำเร็จ'
  }
  
  const handleTabChange = (value: string) => {
    router.replace(`/transfers/${params.id}?tab=${value}`)
  }
  
  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
  
  if (!transfer) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            ไม่พบข้อมูลใบเบิก
          </h2>
          <p className="text-gray-600 mb-4">
            ไม่สามารถโหลดข้อมูลใบเบิกได้
          </p>
          <Button onClick={() => router.push('/transfers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับไปรายการใบเบิก
          </Button>
        </div>
      </div>
    )
  }
  
  const statusConfig = getStatusConfig(transfer.status)
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <TransferHeader 
        transfer={transfer}
        statusConfig={statusConfig}
        onBack={() => router.back()}
      />
      
      {/* Actions */}
      <TransferActions 
        transfer={transfer}
        user={user}
        processing={processing}
        onQuickAction={handleQuickAction}
        onNavigateAction={handleNavigateAction}
      />
      
      {/* Workflow Progress */}
      <WorkflowProgress transfer={transfer} />
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="request">ใบเบิก</TabsTrigger>
            <TabsTrigger value="delivery">ใบรับของ</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            ดาวน์โหลด PDF
          </Button>
        </div>
        
        {/* Request Tab */}
        <TabsContent value="request" className="space-y-6">
          <TransferRequestTab transfer={transfer} />
        </TabsContent>
        
        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-6">
          <TransferDeliveryTab transfer={transfer} />
        </TabsContent>
      </Tabs>
    </div>
  )
}