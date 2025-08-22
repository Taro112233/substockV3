// 📄 File: components/modules/stock/stock-detail-modal.tsx (ปรับปรุงแล้ว - ปุ่มกดได้ตลอด + เหตุผลอัตโนมัติ)
// =====================================================

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  FileText,
  RotateCcw,
  Plus,
  Minus,
  Target,
  Info
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

interface DrugUpdateData {
  hospitalDrugCode: string
  name: string
  genericName: string | null
  dosageForm: string
  strength: string | null
  unit: string
  packageSize: string | null
  pricePerBox: number
  category: string
  notes: string | null
}

// Quick adjustment options
const QUICK_ADJUSTMENTS = [
  { label: '+1', value: 1 },
  { label: '+5', value: 5 },
  { label: '+10', value: 10 },
  { label: '+50', value: 50 },
  { label: '-1', value: -1 },
  { label: '-5', value: -5 },
  { label: '-10', value: -10 },
  { label: '-50', value: -50 }
]

// Common adjustment reasons
const ADJUSTMENT_REASONS = [
  'นับสต็อก',
  'รับยาใหม่',
  'แก้ไขข้อมูล',
  'สูญหาย',
  'หมดอายุ',
  'เสียหาย',
  'ส่งคืน',
  'ปรับปรุงข้อมูล'
]

// Drug categories
const DRUG_CATEGORIES = [
  { value: 'GENERAL', label: 'ยาทั่วไป' },
  { value: 'TABLET', label: 'ยาเม็ด' },
  { value: 'SYRUP', label: 'ยาน้ำ' },
  { value: 'INJECTION', label: 'ยาฉีด' },
  { value: 'EXTEMP', label: 'ยาใช้ภายนอก/สมุนไพร' },
  { value: 'HAD', label: 'ยาเสี่ยงสูง' },
  { value: 'NARCOTIC', label: 'ยาเสพติด' },
  { value: 'PSYCHIATRIC', label: 'ยาจิตเวช' },
  { value: 'REFRIGERATED', label: 'ยาเย็น' },
  { value: 'FLUID', label: 'สารน้ำ' },
  { value: 'REFER', label: 'ยาส่งต่อ' },
  { value: 'ALERT', label: 'ยาเฝ้าระวัง' }
]

// Dosage forms
const DOSAGE_FORMS = [
  'TAB', 'CAP', 'SYR', 'SUS', 'INJ', 'SOL', 'OIN', 'GEL', 'LOT', 'SPR', 
  'SUP', 'ENE', 'POW', 'PWD', 'CR', 'BAG', 'APP', 'LVP', 'MDI', 'NAS', 
  'SAC', 'LIQ', 'MIX'
]

// ✅ ฟังก์ชันสำหรับสร้างเหตุผลอัตโนมัติ
const generateAdjustmentReason = (
  currentQty: number, 
  newQty: number, 
  currentMin: number, 
  newMin: number
): string => {
  const qtyChange = newQty - currentQty
  const minChange = newMin - currentMin

  // กรณีจำนวนคงเหลือเท่าเดิม
  if (qtyChange === 0) {
    if (minChange === 0) return 'อัพเดทข้อมูล'
    if (minChange > 0) return 'ปรับเพิ่มขั้นต่ำ'
    if (minChange < 0) return 'ปรับลดขั้นต่ำ'
  }
  
  // กรณีจำนวนคงเหลือเพิ่มขึ้น
  if (qtyChange > 0) {
    return 'ปรับเพิ่มสต็อก'
  }
  
  // กรณีจำนวนคงเหลือลดลง
  if (qtyChange < 0) {
    return 'ปรับลดสต็อก'
  }

  return 'อัพเดทข้อมูล'
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

// ✅ Fixed: getStockStatusInfo function with minimumStock > 0 check
const getStockStatusInfo = (stock: Stock) => {
  const availableStock = calculateAvailableStock(stock)
  // ✅ Fixed: Low stock check with minimumStock > 0
  const isLow = stock.totalQuantity < stock.minimumStock && stock.minimumStock > 0
  
  if (isLow) {
    return {
      label: 'สต็อกต่ำ',
      color: 'bg-red-100 text-red-800 border-red-200',
      description: 'สต็อกคงเหลือต่ำกว่าจำนวนขั้นต่ำ ต้องเติมสต็อก'
    }
  } else if (stock.minimumStock === 0) {
    return {
      label: 'ไม่ได้ใช้งาน',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      description: 'ยาไม่ได้กำหนดระดับขั้นต่ำ อาจไม่ได้ใช้งาน'
    }
  } else if (availableStock > stock.minimumStock * 2) {
    return {
      label: 'สต็อกเพียงพอ',
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'สต็อกคงเหลือเพียงพอ'
    }
  } else {
    return {
      label: 'สต็อกปานกลาง',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      description: 'สต็อกใกล้ขั้นต่ำ ควรติดตาม'
    }
  }
}

export function StockDetailModalEnhanced({ 
  stock, 
  isOpen, 
  onClose, 
  onUpdate 
}: StockDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'stock' | 'drug'>('stock')
  const [loading, setLoading] = useState(false)
  
  // Stock data states
  const [stockFormData, setStockFormData] = useState<StockUpdateData>({
    totalQuantity: 0,
    minimumStock: 0,
    adjustmentReason: 'อัพเดทข้อมูล'
  })

  // Drug data states  
  const [drugFormData, setDrugFormData] = useState<DrugUpdateData>({
    hospitalDrugCode: '',
    name: '',
    genericName: null,
    dosageForm: '',
    strength: null,
    unit: '',
    packageSize: null,
    pricePerBox: 0,
    category: 'GENERAL',
    notes: null
  })

  const { toast } = useToast()

  // Reset form เมื่อเปิด modal ใหม่
  useEffect(() => {
    if (stock && isOpen) {
      setStockFormData({
        totalQuantity: stock.totalQuantity,
        minimumStock: stock.minimumStock,
        adjustmentReason: 'อัพเดทข้อมูล'
      })
      
      setDrugFormData({
        hospitalDrugCode: stock.drug.hospitalDrugCode,
        name: stock.drug.name,
        genericName: stock.drug.genericName || null,
        dosageForm: stock.drug.dosageForm,
        strength: stock.drug.strength || null,
        unit: stock.drug.unit,
        packageSize: stock.drug.packageSize || null,
        pricePerBox: stock.drug.pricePerBox,
        category: stock.drug.category,
        notes: stock.drug.notes || null
      })

      // Default to stock tab for primary use case
      setActiveTab('stock')
    }
  }, [stock, isOpen])

  // ✅ อัปเดตเหตุผลอัตโนมัติเมื่อมีการเปลี่ยนแปลงข้อมูล
  useEffect(() => {
    if (stock) {
      const autoReason = generateAdjustmentReason(
        stock.totalQuantity,
        stockFormData.totalQuantity,
        stock.minimumStock,
        stockFormData.minimumStock
      )
      
      setStockFormData(prev => ({
        ...prev,
        adjustmentReason: autoReason
      }))
    }
  }, [stock, stockFormData.totalQuantity, stockFormData.minimumStock])

  if (!stock) return null

  const availableStock = calculateAvailableStock(stock)
  const lowStock = isLowStock(stock)
  const stockStatusInfo = getStockStatusInfo(stock)
  const categoryColor = getCategoryColor(stock.drug.category)
  const categoryLabel = getCategoryLabel(stock.drug.category)

  // Quick stock adjustment handlers
  const handleQuickAdjustment = (delta: number) => {
    const newQuantity = Math.max(0, stockFormData.totalQuantity + delta)
    setStockFormData(prev => ({
      ...prev,
      totalQuantity: newQuantity
    }))
  }

  const handleSetMinimumStock = () => {
    setStockFormData(prev => ({
      ...prev,
      minimumStock: prev.totalQuantity
    }))
  }

  const handleResetStock = () => {
    setStockFormData({
      totalQuantity: stock.totalQuantity,
      minimumStock: stock.minimumStock,
      adjustmentReason: 'อัพเดทข้อมูล'
    })
  }

  const handleResetDrug = () => {
    setDrugFormData({
      hospitalDrugCode: stock.drug.hospitalDrugCode,
      name: stock.drug.name,
      genericName: stock.drug.genericName || null,
      dosageForm: stock.drug.dosageForm,
      strength: stock.drug.strength || null,
      unit: stock.drug.unit,
      packageSize: stock.drug.packageSize || null,
      pricePerBox: stock.drug.pricePerBox,
      category: stock.drug.category,
      notes: stock.drug.notes || null
    })
  }

  // ✅ Save stock changes - ปรับให้กดได้ตลอด ไม่มีเงื่อนไข
  const handleSaveStock = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/stocks/${stock.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          totalQuantity: stockFormData.totalQuantity,
          minimumStock: stockFormData.minimumStock,
          adjustmentReason: stockFormData.adjustmentReason,
          department: stock.department
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการอัปเดต')
      }

      const { data: updatedStock, message } = await response.json()

      toast({
        title: "อัปเดตสต็อกสำเร็จ",
        description: message || "ข้อมูลสต็อกถูกอัปเดตเรียบร้อยแล้ว",
        variant: "default"
      })

      onUpdate?.(updatedStock)
      onClose() // ✅ ปิด modal อัตโนมัติหลังบันทึกสำเร็จ
      
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

  // Save drug changes
  const handleSaveDrug = async () => {
    if (!drugFormData.name.trim()) {
      toast({
        title: "กรุณาระบุชื่อยา",
        description: "ชื่อยาเป็นข้อมูลที่จำเป็น",
        variant: "destructive"
      })
      return
    }

    if (!drugFormData.hospitalDrugCode.trim()) {
      toast({
        title: "กรุณาระบุรหัสยา",
        description: "รหัสยาโรงพยาบาลเป็นข้อมูลที่จำเป็น",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/drugs/${stock.drugId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(drugFormData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการอัปเดต')
      }

      const { data: updatedDrug, message, priceChanged, oldPrice, newPrice } = await response.json()

      // แสดงข้อความที่เหมาะสม
      let toastDescription = "ข้อมูลยาถูกอัปเดตเรียบร้อยแล้ว"
      if (priceChanged) {
        toastDescription += `\nราคาเปลี่ยนจาก ฿${oldPrice?.toFixed(2)} เป็น ฿${newPrice?.toFixed(2)}`
      }

      toast({
        title: "อัปเดตข้อมูลยาสำเร็จ",
        description: toastDescription,
        variant: "default"
      })

      // Update stock with new drug info and recalculated values
      const updatedStock = { 
        ...stock, 
        drug: {
          ...updatedDrug,
          hospitalDrugCode: updatedDrug.hospitalDrugCode,
          name: updatedDrug.name,
          genericName: updatedDrug.genericName,
          dosageForm: updatedDrug.dosageForm,
          strength: updatedDrug.strength,
          unit: updatedDrug.unit,
          packageSize: updatedDrug.packageSize,
          pricePerBox: updatedDrug.pricePerBox,
          category: updatedDrug.category,
          isActive: updatedDrug.isActive,
          notes: updatedDrug.notes
        },
        // อัปเดตมูลค่าสต็อกถ้าราคาเปลี่ยน
        ...(priceChanged && {
          totalValue: stock.totalQuantity * newPrice
        })
      }
      
      onUpdate?.(updatedStock)
      onClose() // ✅ ปิด modal อัตโนมัติหลังบันทึกสำเร็จ
      
      // Reset form ให้ตรงกับข้อมูลใหม่
      setDrugFormData({
        hospitalDrugCode: updatedDrug.hospitalDrugCode,
        name: updatedDrug.name,
        genericName: updatedDrug.genericName || null,
        dosageForm: updatedDrug.dosageForm,
        strength: updatedDrug.strength || null,
        unit: updatedDrug.unit,
        packageSize: updatedDrug.packageSize || null,
        pricePerBox: updatedDrug.pricePerBox,
        category: updatedDrug.category,
        notes: updatedDrug.notes || null
      })
      
    } catch (error) {
      console.error('Error updating drug:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : 'ไม่สามารถอัปเดตข้อมูลได้',
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  // ✅ ตรวจสอบการเปลี่ยนแปลงข้อมูล
  const hasStockChanges = stockFormData.totalQuantity !== stock.totalQuantity || 
                        stockFormData.minimumStock !== stock.minimumStock

  const hasDrugChanges = drugFormData.hospitalDrugCode !== stock.drug.hospitalDrugCode ||
                        drugFormData.name !== stock.drug.name ||
                        drugFormData.genericName !== stock.drug.genericName ||
                        drugFormData.dosageForm !== stock.drug.dosageForm ||
                        drugFormData.strength !== stock.drug.strength ||
                        drugFormData.unit !== stock.drug.unit ||
                        drugFormData.packageSize !== stock.drug.packageSize ||
                        drugFormData.pricePerBox !== stock.drug.pricePerBox ||
                        drugFormData.category !== stock.drug.category ||
                        drugFormData.notes !== stock.drug.notes

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            จัดการข้อมูลยา
          </DialogTitle>
        </DialogHeader>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'stock' | 'drug')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              จัดการสต็อก
            </TabsTrigger>
            <TabsTrigger value="drug" className="flex items-center gap-2">
              <Pill className="h-4 w-4" />
              ข้อมูลยา
            </TabsTrigger>
          </TabsList>

          {/* Stock Management Tab */}
          <TabsContent value="stock" className="space-y-4">
            {/* Quick Adjustments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    ปรับสต็อก
                  </div>
                  
                  {/* Status Info ข้างๆ หัวข้อ */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="text-sm font-medium text-blue-600">
                        {stock.minimumStock.toLocaleString()}
                      </div>
                      <span className="text-xs text-gray-500">ขั้นต่ำ</span>
                    </div>
                    <Badge className={stockStatusInfo.color}>
                      {stockStatusInfo.label}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Stock Display */}
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stockFormData.totalQuantity.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">จำนวนปัจจุบัน</div>
                </div>

                {/* Quick Adjustment Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_ADJUSTMENTS.map((adj) => (
                    <Button
                      key={adj.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdjustment(adj.value)}
                      className={`${adj.value > 0 ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                    >
                      {adj.label}
                    </Button>
                  ))}
                </div>

                {/* Manual Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">ระบุจำนวนที่ต้องการ</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={stockFormData.totalQuantity}
                      onChange={(e) => setStockFormData(prev => ({
                        ...prev,
                        totalQuantity: Math.max(0, parseInt(e.target.value) || 0)
                      }))}
                      className="text-center text-lg font-medium"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleResetStock}
                      title="รีเซ็ต"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Minimum Stock */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">จำนวนขั้นต่ำ</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={stockFormData.minimumStock}
                      onChange={(e) => setStockFormData(prev => ({
                        ...prev,
                        minimumStock: Math.max(0, parseInt(e.target.value) || 0)
                      }))}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSetMinimumStock}
                      className="shrink-0"
                    >
                      ใช้ปัจจุบัน
                    </Button>
                  </div>
                </div>

                {/* ✅ แสดงเหตุผลที่ถูกสร้างอัตโนมัติ */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">เหตุผล (อัตโนมัติ)</label>
                  <div className="flex gap-2">
                    <Input
                      value={stockFormData.adjustmentReason}
                      readOnly
                      className="bg-gray-50 text-gray-700"
                    />
                    <Select
                      value={stockFormData.adjustmentReason}
                      onValueChange={(value) => setStockFormData(prev => ({ ...prev, adjustmentReason: value }))}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="เปลี่ยน" />
                      </SelectTrigger>
                      <SelectContent>
                        {ADJUSTMENT_REASONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500">
                    เหตุผลถูกสร้างอัตโนมัติตามการเปลี่ยนแปลง หรือเลือกเปลี่ยนเองได้
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons for Stock */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleResetStock}
                disabled={loading}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                รีเซ็ต
              </Button>
              {/* ✅ ปุ่มบันทึกกดได้ตลอด ไม่มีเงื่อนไข */}
              <Button
                onClick={handleSaveStock}
                disabled={loading}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </TabsContent>

          {/* Drug Information Tab */}
          <TabsContent value="drug" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  ข้อมูลยา
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Drug Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* รหัสยาโรงพยาบาล */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">รหัสยาโรงพยาบาล *</label>
                    <Input
                      value={drugFormData.hospitalDrugCode}
                      onChange={(e) => setDrugFormData(prev => ({ ...prev, hospitalDrugCode: e.target.value }))}
                      placeholder="ระบุรหัสยา"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">ชื่อยา *</label>
                    <Input
                      value={drugFormData.name}
                      onChange={(e) => setDrugFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="ระบุชื่อยา"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">ชื่อสามัญ</label>
                    <Input
                      value={drugFormData.genericName || ''}
                      onChange={(e) => setDrugFormData(prev => ({ ...prev, genericName: e.target.value || null }))}
                      placeholder="ระบุชื่อสามัญ"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">รูปแบบยา</label>
                    <Select
                      value={drugFormData.dosageForm}
                      onValueChange={(value) => setDrugFormData(prev => ({ ...prev, dosageForm: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกรูปแบบ" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOSAGE_FORMS.map((form) => (
                          <SelectItem key={form} value={form}>
                            {form}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">ความแรง</label>
                    <div className="flex gap-2">
                      <Input
                        value={drugFormData.strength || ''}
                        onChange={(e) => setDrugFormData(prev => ({ ...prev, strength: e.target.value || null }))}
                        placeholder="เช่น 500"
                        className="flex-1"
                      />
                      <Input
                        value={drugFormData.unit}
                        onChange={(e) => setDrugFormData(prev => ({ ...prev, unit: e.target.value }))}
                        placeholder="หน่วย"
                        className="w-20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">ขนาดบรรจุ</label>
                    <Input
                      value={drugFormData.packageSize || ''}
                      onChange={(e) => setDrugFormData(prev => ({ ...prev, packageSize: e.target.value || null }))}
                      placeholder="เช่น 100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">ราคาต่อกล่อง</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={drugFormData.pricePerBox}
                      onChange={(e) => setDrugFormData(prev => ({ ...prev, pricePerBox: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">ประเภทยา</label>
                  <Select
                    value={drugFormData.category}
                    onValueChange={(value) => setDrugFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      {DRUG_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">หมายเหตุ</label>
                  <Textarea
                    value={drugFormData.notes || ''}
                    onChange={(e) => setDrugFormData(prev => ({ ...prev, notes: e.target.value || null }))}
                    placeholder="หมายเหตุเพิ่มเติม..."
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons for Drug */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleResetDrug}
                disabled={loading || !hasDrugChanges}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                รีเซ็ต
              </Button>
              <Button
                onClick={handleSaveDrug}
                disabled={loading || !hasDrugChanges || !drugFormData.name.trim() || !drugFormData.hospitalDrugCode.trim()}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div>
              อัปเดตล่าสุด: {stock.lastUpdated ? new Date(stock.lastUpdated).toLocaleString('th-TH') : '-'}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              ปิด
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}