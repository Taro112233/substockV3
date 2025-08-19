// 📄 File: app/transfers/[id]/action/page.tsx (Fixed)

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import type { TransferDetails } from '@/types/transfer'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  CheckCircle,
  Package,
  AlertTriangle,
  Save,
  Eye
} from 'lucide-react'

interface TransferActionPageProps {
  params: { id: string }
}

interface ActionFormData {
  note?: string
  items: Array<{
    id: string
    drugId: string
    requestedQty: number
    approvedQty?: number
    dispensedQty?: number
    receivedQty?: number
    
    // Batch info for dispensing
    lotNumber?: string
    expiryDate?: string
    manufacturer?: string
    unitPrice?: number
    
    itemNote?: string
    
    drug: {
      hospitalDrugCode: string
      name: string
      genericName?: string
      dosageForm: string
      strength?: string
      unit: string
      packageSize?: string
      pricePerBox: number
    }
  }>
}

// Define valid action types
type ActionType = 'approve' | 'prepare' | 'receive'

// Define action config type
interface ActionConfig {
  title: string
  description: string
  icon: LucideIcon
  color: string
  submitLabel: string
  showQuantityEdit: boolean
  showBatchInfo?: boolean
  quantityField: string
  quantityLabel: string
}

export default function TransferActionPage({ params }: TransferActionPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const actionType = searchParams.get('type') as ActionType | null
  const [transfer, setTransfer] = useState<TransferDetails | null>(null)
  const [formData, setFormData] = useState<ActionFormData>({ items: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const fetchTransferDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/transfers/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch transfer details')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch transfer details')
      }
      
      setTransfer(result.data)
      
      // Initialize form data
      setFormData({
        note: '',
        items: result.data.items.map((item: TransferDetails['items'][0]) => ({
          ...item,
          approvedQty: item.approvedQty || item.requestedQty,
          dispensedQty: item.dispensedQty || 0,
          receivedQty: item.receivedQty || 0,
          unitPrice: item.unitPrice || item.drug.pricePerBox,
          expiryDate: item.expiryDate || '',
          lotNumber: item.lotNumber || '',
          manufacturer: item.manufacturer || ''
        }))
      })
      
    } catch (error) {
      console.error('Failed to fetch transfer details:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลใบเบิกได้",
        variant: "destructive",
      })
      router.push(`/transfers/${params.id}`)
    } finally {
      setLoading(false)
    }
  }, [params.id, toast, router])
  
  useEffect(() => {
    fetchTransferDetails()
  }, [fetchTransferDetails])
  
  const getActionConfig = (): ActionConfig => {
    const configs: Record<ActionType, ActionConfig> = {
      approve: {
        title: 'อนุมัติใบเบิก',
        description: 'ตรวจสอบและอนุมัติรายการยาที่ขอเบิก',
        icon: CheckCircle,
        color: 'text-blue-600',
        submitLabel: 'อนุมัติใบเบิก',
        showQuantityEdit: true,
        quantityField: 'approvedQty',
        quantityLabel: 'จำนวนอนุมัติ'
      },
      prepare: {
        title: 'เตรียมจ่ายยา',
        description: 'กรอกข้อมูล Lot, Exp และจำนวนจ่ายจริง',
        icon: Package,
        color: 'text-purple-600',
        submitLabel: 'เตรียมจ่ายเสร็จ',
        showQuantityEdit: true,
        showBatchInfo: true,
        quantityField: 'dispensedQty',
        quantityLabel: 'จำนวนจ่าย'
      },
      receive: {
        title: 'รับยา',
        description: 'ยืนยันการรับยาและตัดสต็อก',
        icon: CheckCircle,
        color: 'text-green-600',
        submitLabel: 'รับยาและตัดสต็อก',
        showQuantityEdit: true,
        quantityField: 'receivedQty',
        quantityLabel: 'จำนวนรับจริง'
      }
    }
    return configs[actionType || 'approve']
  }
  
  const updateItemQuantity = (itemId: string, field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              [field]: value,
              // Auto-calculate total value for dispensing
              ...(field === 'dispensedQty' && {
                totalValue: value * (item.unitPrice || 0)
              })
            }
          : item
      )
    }))
  }
  
  const updateItemBatchInfo = (itemId: string, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, [field]: value }
          : item
      )
    }))
  }
  
  const handleSubmit = async () => {
    try {
      setSaving(true)
      
      // Validate form
      if (actionType === 'prepare') {
        const hasInvalidBatch = formData.items.some(item => {
          const dispensedQty = item.dispensedQty || 0
          return dispensedQty > 0 && (!item.lotNumber || !item.expiryDate)
        })
        
        if (hasInvalidBatch) {
          toast({
            title: "ข้อมูลไม่ครบถ้วน",
            description: "กรุณากรอก Lot Number และวันหมดอายุสำหรับยาที่จ่าย",
            variant: "destructive",
          })
          return
        }
      }
      
      const response = await fetch(`/api/transfers/${params.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: actionType,
          note: formData.note,
          items: formData.items
        })
      })
      
      if (!response.ok) {
        throw new Error(`Action failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Action failed')
      }
      
      toast({
        title: "ดำเนินการสำเร็จ",
        description: getSuccessMessage(),
      })
      
      // Redirect back to transfer detail
      router.push(`/transfers/${params.id}`)
      
    } catch (error) {
      console.error('Action failed:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดำเนินการได้",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }
  
  const getSuccessMessage = () => {
    const messages: Record<ActionType, string> = {
      approve: 'อนุมัติใบเบิกเรียบร้อยแล้ว',
      prepare: 'เตรียมจ่ายยาเรียบร้อยแล้ว',
      receive: 'รับยาและตัดสต็อกเรียบร้อยแล้ว'
    }
    return messages[actionType || 'approve']
  }
  
  const getTotalValue = () => {
    const actionConfig = getActionConfig()
    return formData.items.reduce((sum, item) => {
      const fieldValue = item[actionConfig.quantityField as keyof typeof item]
      const qty = typeof fieldValue === 'number' ? fieldValue : 0
      const price = item.unitPrice || 0
      return sum + (qty * price)
    }, 0)
  }
  
  if (loading || !transfer) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
  
  if (!actionType || !['approve', 'prepare', 'receive'].includes(actionType)) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            การดำเนินการไม่ถูกต้อง
          </h2>
          <Button onClick={() => router.push(`/transfers/${params.id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับไปรายละเอียดใบเบิก
          </Button>
        </div>
      </div>
    )
  }
  
  const actionConfig = getActionConfig()
  const ActionIcon = actionConfig.icon
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/transfers/${params.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          
          <div>
            <div className="flex items-center gap-2">
              <ActionIcon className={`h-6 w-6 ${actionConfig.color}`} />
              <h1 className="text-2xl font-bold text-gray-900">
                {actionConfig.title}
              </h1>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              ใบเบิก {transfer.requisitionNumber} • {actionConfig.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/transfers/${params.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            ดูรายละเอียด
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'กำลังบันทึก...' : actionConfig.submitLabel}
          </Button>
        </div>
      </div>
      
      {/* Transfer Summary */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลใบเบิก</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">จาก:</span>
              <p className="font-medium">
                {transfer.fromDept === 'PHARMACY' ? 'แผนกเภสัชกรรม' : 'แผนก OPD'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">ไปยัง:</span>
              <p className="font-medium">
                {transfer.toDept === 'PHARMACY' ? 'แผนกเภสัชกรรม' : 'แผนก OPD'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">ผู้เบิก:</span>
              <p className="font-medium">
                {transfer.requester.firstName} {transfer.requester.lastName}
              </p>
            </div>
            <div>
              <span className="text-gray-500">วันที่เบิก:</span>
              <p className="font-medium">
                {new Date(transfer.requestedAt).toLocaleDateString('th-TH')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Action Form */}
      <Card>
        <CardHeader>
          <CardTitle>รายการยา</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium">รหัสยา</th>
                  <th className="text-left p-3 font-medium">ชื่อยา</th>
                  <th className="text-right p-3 font-medium">จำนวนขอ</th>
                  {actionConfig.showQuantityEdit && (
                    <th className="text-right p-3 font-medium">{actionConfig.quantityLabel}</th>
                  )}
                  {actionConfig.showBatchInfo && (
                    <>
                      <th className="text-left p-3 font-medium">Lot Number</th>
                      <th className="text-left p-3 font-medium">วันหมดอายุ</th>
                      <th className="text-left p-3 font-medium">บริษัท</th>
                      <th className="text-right p-3 font-medium">ราคา/หน่วย</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs">
                      {item.drug.hospitalDrugCode}
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{item.drug.name}</div>
                        <div className="text-gray-500 text-xs">
                          {item.drug.dosageForm} {item.drug.strength}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {item.requestedQty.toLocaleString()} {item.drug.unit}
                    </td>
                    
                    {actionConfig.showQuantityEdit && (
                      <td className="p-3">
                        <Input
                          type="number"
                          min="0"
                          max={item.requestedQty}
                          value={item[actionConfig.quantityField as keyof typeof item] as number || 0}
                          onChange={(e) => updateItemQuantity(
                            item.id, 
                            actionConfig.quantityField, 
                            parseInt(e.target.value) || 0
                          )}
                          className="w-20 text-right"
                        />
                      </td>
                    )}
                    
                    {actionConfig.showBatchInfo && (
                      <>
                        <td className="p-3">
                          <Input
                            placeholder="Lot Number"
                            value={item.lotNumber || ''}
                            onChange={(e) => updateItemBatchInfo(item.id, 'lotNumber', e.target.value)}
                            className="w-24"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="date"
                            value={item.expiryDate || ''}
                            onChange={(e) => updateItemBatchInfo(item.id, 'expiryDate', e.target.value)}
                            className="w-32"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            placeholder="บริษัท"
                            value={item.manufacturer || ''}
                            onChange={(e) => updateItemBatchInfo(item.id, 'manufacturer', e.target.value)}
                            className="w-24"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice || 0}
                            onChange={(e) => updateItemBatchInfo(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-20 text-right"
                          />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
              
              {actionConfig.showBatchInfo && (
                <tfoot>
                  <tr className="border-t-2 bg-gray-50">
                    <td colSpan={7} className="p-3 text-right font-medium">
                      มูลค่ารวม:
                    </td>
                    <td className="p-3 text-right font-bold">
                      ฿{getTotalValue().toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          
          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">หมายเหตุ</Label>
            <Textarea
              id="note"
              placeholder={`หมายเหตุการ${actionConfig.title}...`}
              value={formData.note || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              rows={3}
            />
          </div>
          
          <Separator />
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.push(`/transfers/${params.id}`)}
            >
              ยกเลิก
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'กำลังบันทึก...' : actionConfig.submitLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}