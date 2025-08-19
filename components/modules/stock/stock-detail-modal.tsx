// 📄 File: components/modules/stock/stock-detail-modal.tsx

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Stock } from '@/types/dashboard'
import {
  calculateAvailableStock,
  isLowStock,
  formatCurrency,
  getCategoryColor,
  getCategoryLabel
} from '@/lib/utils/dashboard'
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Building,
  Hash,
  Pill,
  Save,
  X,
  Edit3,
  DollarSign,
  FileText
} from 'lucide-react'

interface StockDetailModalProps {
  stock: Stock | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: (updatedStock: Stock) => void
}

interface StockUpdateData {
  totalQuantity: number
  minimumStock: number
  adjustmentReason: string
}

// Helper functions
const getStockStatusIcon = (stock: Stock) => {
  const availableStock = calculateAvailableStock(stock)
  const lowStock = isLowStock(stock)
  
  if (lowStock) {
    return <AlertTriangle className="h-5 w-5 text-red-600" />
  } else if (availableStock > stock.minimumStock * 2) {
    return <TrendingUp className="h-5 w-5 text-green-600" />
  } else {
    return <TrendingDown className="h-5 w-5 text-orange-600" />
  }
}

const getStockStatusInfo = (stock: Stock) => {
  const availableStock = calculateAvailableStock(stock)
  const lowStock = isLowStock(stock)
  
  if (lowStock) {
    return {
      label: 'สต็อกต่ำ',
      color: 'bg-red-100 text-red-800 border-red-200',
      description: 'สต็อกคงเหลือต่ำกว่าจำนวนขั้นต่ำที่กำหนด ควรเติมสต็อก'
    }
  } else if (availableStock > stock.minimumStock * 2) {
    return {
      label: 'สต็อกเพียงพอ',
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'สต็อกคงเหลือเพียงพอสำหรับการใช้งาน'
    }
  } else {
    return {
      label: 'สต็อกปานกลาง',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      description: 'สต็อกคงเหลือใกล้จำนวนขั้นต่ำ ควรติดตามและวางแผนเติมสต็อก'
    }
  }
}

export function StockDetailModal({ 
  stock, 
  isOpen, 
  onClose, 
  onUpdate 
}: StockDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<StockUpdateData>({
    totalQuantity: 0,
    minimumStock: 0,
    adjustmentReason: ''
  })

  const { toast } = useToast()

  // Reset form เมื่อเปิด modal ใหม่
  useEffect(() => {
    if (stock && isOpen) {
      setFormData({
        totalQuantity: stock.totalQuantity,
        minimumStock: stock.minimumStock,
        adjustmentReason: ''
      })
      setIsEditing(false)
    }
  }, [stock, isOpen])

  if (!stock) return null

  const availableStock = calculateAvailableStock(stock)
  const lowStock = isLowStock(stock)
  const stockStatusInfo = getStockStatusInfo(stock)
  const categoryColor = getCategoryColor(stock.drug.category)
  const categoryLabel = getCategoryLabel(stock.drug.category)

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      totalQuantity: stock.totalQuantity,
      minimumStock: stock.minimumStock,
      adjustmentReason: ''
    })
  }

  const handleSave = async () => {
    if (!formData.adjustmentReason.trim() && formData.totalQuantity !== stock.totalQuantity) {
      toast({
        title: "กรุณาระบุเหตุผล",
        description: "กรุณาระบุเหตุผลในการปรับสต็อก",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/stocks/${stock.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          totalQuantity: formData.totalQuantity,
          minimumStock: formData.minimumStock,
          adjustmentReason: formData.adjustmentReason,
          department: stock.department
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการอัปเดต')
      }

      const { data: updatedStock } = await response.json()

      toast({
        title: "อัปเดตสำเร็จ",
        description: "ข้อมูลสต็อกถูกอัปเดตเรียบร้อยแล้ว",
        variant: "default"
      })

      setIsEditing(false)
      onUpdate?.(updatedStock)
      
    } catch (error) {
      console.error('Error updating stock:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : 'ไม่สามารถอัปเดตข้อมูลได้',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            รายละเอียดสต็อกยา
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stock Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStockStatusIcon(stock)}
                  <span>สถานะสต็อก</span>
                </div>
                <Badge className={stockStatusInfo.color}>
                  {stockStatusInfo.label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{stockStatusInfo.description}</p>
            </CardContent>
          </Card>

          {/* Drug Information Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>ข้อมูลยา</span>
                <Badge className={categoryColor}>
                  {categoryLabel}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <Pill className="h-4 w-4" />
                    ชื่อยา
                  </label>
                  <p className="font-medium">{stock.drug.name}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    รหัสยา
                  </label>
                  <p className="font-mono text-sm">{stock.drug.hospitalDrugCode}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">ชื่อสามัญ</label>
                  <p className="text-sm">{stock.drug.genericName || '-'}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">รูปแบบ</label>
                  <p className="text-sm">{stock.drug.dosageForm}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">ความแรง</label>
                  <p className="text-sm">{stock.drug.strength} {stock.drug.unit}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">ขนาดบรรจุ</label>
                  <p className="text-sm">{stock.drug.packageSize || '-'}</p>
                </div>
              </div>

              {/* Department */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  แผนก
                </label>
                <p className="text-sm mt-1">
                  {stock.department === 'PHARMACY' ? 'แผนกเภสัชกรรม' : 'แผนก OPD'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stock Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>รายละเอียดสต็อก</span>
                {!isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEdit}
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    แก้ไข
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stock Quantities */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">
                    จำนวนคงเหลือ
                    {lowStock && <AlertTriangle className="inline h-4 w-4 ml-1 text-red-500" />}
                  </label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0"
                      value={formData.totalQuantity}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        totalQuantity: Math.max(0, parseInt(e.target.value) || 0)
                      }))}
                      className="text-center"
                    />
                  ) : (
                    <p className={`text-2xl font-bold ${
                      lowStock ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {stock.totalQuantity.toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">จำนวนจอง</label>
                  <p className="text-xl font-medium text-orange-600">
                    {stock.reservedQty.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">จำนวนที่ใช้ได้</label>
                  <p className="text-xl font-medium text-blue-600">
                    {availableStock.toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Minimum Stock and Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">จำนวนขั้นต่ำ</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0"
                      value={formData.minimumStock}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        minimumStock: Math.max(0, parseInt(e.target.value) || 0)
                      }))}
                    />
                  ) : (
                    <p className="text-lg font-medium">
                      {stock.minimumStock.toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    มูลค่าสต็อก
                  </label>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(stock.totalValue)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Adjustment Reason for Editing */}
              {isEditing && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    เหตุผลในการปรับสต็อก *
                  </label>
                  <Textarea
                    value={formData.adjustmentReason}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      adjustmentReason: e.target.value
                    }))}
                    placeholder="ระบุเหตุผลในการปรับสต็อก เช่น รับยาเพิ่ม, นับสต็อก, แก้ไขข้อมูล"
                    className="min-h-[80px]"
                  />
                </div>
              )}

              {/* Last Updated */}
              <div className="space-y-2">
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  อัปเดตล่าสุด
                </label>
                <p className="text-sm">
                  {stock.lastUpdated ? (
                    new Date(stock.lastUpdated).toLocaleString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })
                  ) : (
                    '-'
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || (!formData.adjustmentReason.trim() && formData.totalQuantity !== stock.totalQuantity)}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={onClose}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                ปิด
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}