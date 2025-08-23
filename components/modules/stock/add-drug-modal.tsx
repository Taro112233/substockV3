// 📄 File: components/modules/stock/add-drug-modal.tsx
// Modal สำหรับเพิ่มยาใหม่ with Sonner Toast

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Stock } from '@/types/dashboard'
import { 
  Package, 
  Pill,
  Save,
  X,
  RotateCcw,
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface AddDrugModalProps {
  isOpen: boolean
  onClose: () => void
  onDrugAdded?: (newStock: Stock) => void
  department: 'PHARMACY' | 'OPD'
}

interface NewDrugData {
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
  // Stock data
  initialQuantity: number
  minimumStock: number
}

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

// Initial form data
const initialFormData: NewDrugData = {
  hospitalDrugCode: '',
  name: '',
  genericName: null,
  dosageForm: 'TAB',
  strength: null,
  unit: 'mg',
  packageSize: null,
  pricePerBox: 0,
  category: 'GENERAL',
  notes: null,
  initialQuantity: 0,
  minimumStock: 10
}

export function AddDrugModal({ 
  isOpen, 
  onClose, 
  onDrugAdded,
  department 
}: AddDrugModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<NewDrugData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes
  const handleClose = () => {
    setFormData(initialFormData)
    setErrors({})
    onClose()
    
    // Show toast when closing without saving
    if (!loading) {
      toast.info('ยกเลิกการเพิ่มยา', {
        description: 'การเพิ่มยาใหม่ถูกยกเลิก',
        duration: 2000,
      })
    }
  }

  const handleReset = () => {
    setFormData(initialFormData)
    setErrors({})
    
    toast.info('รีเซ็ตฟอร์มแล้ว', {
      description: 'ข้อมูลทั้งหมดถูกล้างเรียบร้อยแล้ว',
      icon: <RotateCcw className="w-4 h-4" />,
      duration: 2000,
    })
  }

  // Validation with detailed toast messages
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    let firstErrorField = ''

    if (!formData.hospitalDrugCode.trim()) {
      newErrors.hospitalDrugCode = 'รหัสยาโรงพยาบาลเป็นข้อมูลที่จำเป็น'
      if (!firstErrorField) firstErrorField = 'hospitalDrugCode'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'ชื่อยาเป็นข้อมูลที่จำเป็น'
      if (!firstErrorField) firstErrorField = 'name'
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'หน่วยเป็นข้อมูลที่จำเป็น'
      if (!firstErrorField) firstErrorField = 'unit'
    }

    if (formData.pricePerBox < 0) {
      newErrors.pricePerBox = 'ราคาต้องไม่น้อยกว่า 0'
      if (!firstErrorField) firstErrorField = 'pricePerBox'
    }

    if (formData.initialQuantity < 0) {
      newErrors.initialQuantity = 'จำนวนเริ่มต้นต้องไม่น้อยกว่า 0'
      if (!firstErrorField) firstErrorField = 'initialQuantity'
    }

    if (formData.minimumStock < 0) {
      newErrors.minimumStock = 'จำนวนขั้นต่ำต้องไม่น้อยกว่า 0'
      if (!firstErrorField) firstErrorField = 'minimumStock'
    }

    setErrors(newErrors)
    
    // Show validation toast with specific error
    if (Object.keys(newErrors).length > 0) {
      const errorCount = Object.keys(newErrors).length
      const firstError = newErrors[firstErrorField]
      
      toast.error('ข้อมูลไม่ถูกต้อง', {
        description: errorCount === 1 ? firstError : `พบข้อผิดพลาด ${errorCount} รายการ กรุณาตรวจสอบ`,
        icon: <AlertTriangle className="w-4 h-4" />,
        duration: 5000,
        action: {
          label: "แก้ไข",
          onClick: () => {
            // Focus on first error field
            const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement
            element?.focus()
          },
        },
      })
      
      return false
    }

    return true
  }

  // Handle form submission with enhanced toast feedback
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)

    // Show loading toast
    const loadingToast = toast.loading('กำลังเพิ่มยาใหม่', {
      description: `เพิ่มยา "${formData.name}" เข้าสู่ระบบ...`,
    })

    try {
      const response = await fetch('/api/drugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          department
        }),
      })

      // Dismiss loading toast
      toast.dismiss(loadingToast)

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle specific error cases
        if (errorData.error?.includes('รหัสยา') || errorData.error?.includes('duplicate')) {
          toast.error('รหัสยาซ้ำ!', {
            description: `รหัสยา "${formData.hospitalDrugCode}" มีอยู่ในระบบแล้ว`,
            icon: <XCircle className="w-4 h-4" />,
            duration: 6000,
            action: {
              label: "แก้ไขรหัส",
              onClick: () => {
                const element = document.querySelector('[name="hospitalDrugCode"]') as HTMLInputElement
                element?.focus()
                element?.select()
              },
            },
          })
        } else {
          toast.error('ไม่สามารถเพิ่มยาได้', {
            description: errorData.error || 'เกิดข้อผิดพลาดในการเพิ่มยา',
            icon: <XCircle className="w-4 h-4" />,
            duration: 5000,
            action: {
              label: "ลองอีกครั้ง",
              onClick: () => handleSubmit(),
            },
          })
        }
        
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการเพิ่มยา')
      }

      const { data: newStock } = await response.json()

      // Success toast with drug details
      toast.success('เพิ่มยาสำเร็จ!', {
        description: `เพิ่ม "${formData.name}" (${formData.hospitalDrugCode}) เรียบร้อยแล้ว`,
        icon: <CheckCircle2 className="w-4 h-4" />,
        duration: 4000,
      })

      // Show stock info if initial quantity > 0
      if (formData.initialQuantity > 0) {
        setTimeout(() => {
          toast.info('ข้อมูลสต็อกเริ่มต้น', {
            description: `จำนวน ${formData.initialQuantity} หน่วย มูลค่า ฿${(formData.initialQuantity * formData.pricePerBox).toLocaleString()}`,
            icon: <Package className="w-4 h-4" />,
            duration: 3000,
          })
        }, 500)
      }

      onDrugAdded?.(newStock)
      handleClose()
      
    } catch (error) {
      console.error('Error adding drug:', error)
      
      // Only show connection error toast if no specific error was shown above
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage.includes('รหัสยา')) {
        toast.error('เชื่อมต่อไม่ได้', {
          description: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต',
          icon: <XCircle className="w-4 h-4" />,
          duration: 6000,
          action: {
            label: "ลองอีกครั้ง",
            onClick: () => handleSubmit(),
          },
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle input changes with real-time validation feedback
  const handleInputChange = (field: keyof NewDrugData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
      
      // Show success toast when fixing required fields
      if (['hospitalDrugCode', 'name', 'unit'].includes(field) && value?.toString().trim()) {
        toast.dismiss() // Dismiss any existing validation toasts
        toast.success('ข้อมูลถูกต้อง', {
          description: `${field === 'hospitalDrugCode' ? 'รหัสยา' : 
                        field === 'name' ? 'ชื่อยา' : 'หน่วย'} ได้รับการแก้ไขแล้ว`,
          icon: <CheckCircle2 className="w-4 h-4" />,
          duration: 2000,
        })
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />
            เพิ่มยาใหม่ - {department === 'PHARMACY' ? 'แผนกคลังยา' : 'แผนก OPD'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Drug Information Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="h-4 w-4" />
                ข้อมูลยา
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* รหัสยาโรงพยาบาล */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    รหัสยาโรงพยาบาล *
                  </label>
                  <Input
                    name="hospitalDrugCode"
                    value={formData.hospitalDrugCode}
                    onChange={(e) => handleInputChange('hospitalDrugCode', e.target.value)}
                    placeholder="ระบุรหัสยา เช่น TAB001"
                    className={errors.hospitalDrugCode ? 'border-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.hospitalDrugCode && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.hospitalDrugCode}
                    </p>
                  )}
                </div>

                {/* ชื่อยา */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">ชื่อยา *</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="ระบุชื่อยา"
                    className={errors.name ? 'border-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* ชื่อสามัญ */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">ชื่อสามัญ</label>
                  <Input
                    value={formData.genericName || ''}
                    onChange={(e) => handleInputChange('genericName', e.target.value || null)}
                    placeholder="ระบุชื่อสามัญ"
                    disabled={loading}
                  />
                </div>

                {/* รูปแบบยา */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">รูปแบบยา</label>
                  <Select
                    value={formData.dosageForm}
                    onValueChange={(value) => handleInputChange('dosageForm', value)}
                    disabled={loading}
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

                {/* ความแรง */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">ความแรง</label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.strength || ''}
                      onChange={(e) => handleInputChange('strength', e.target.value || null)}
                      placeholder="เช่น 500"
                      className="flex-1"
                      disabled={loading}
                    />
                    <Input
                      name="unit"
                      value={formData.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      placeholder="หน่วย"
                      className={`w-20 ${errors.unit ? 'border-red-500' : ''}`}
                      disabled={loading}
                    />
                  </div>
                  {errors.unit && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.unit}
                    </p>
                  )}
                </div>

                {/* ขนาดบรรจุ */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">ขนาดบรรจุ</label>
                  <Input
                    value={formData.packageSize || ''}
                    onChange={(e) => handleInputChange('packageSize', e.target.value || null)}
                    placeholder="เช่น 100"
                    disabled={loading}
                  />
                </div>

                {/* ราคาต่อกล่อง */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">ราคาต่อกล่อง</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.pricePerBox}
                    onChange={(e) => handleInputChange('pricePerBox', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={errors.pricePerBox ? 'border-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.pricePerBox && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.pricePerBox}
                    </p>
                  )}
                </div>
              </div>

              {/* ประเภทยา */}
              <div className="space-y-2">
                <label className="text-sm font-medium">ประเภทยา</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                  disabled={loading}
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

              {/* หมายเหตุ */}
              <div className="space-y-2">
                <label className="text-sm font-medium">หมายเหตุ</label>
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value || null)}
                  placeholder="หมายเหตุเพิ่มเติม..."
                  className="min-h-[80px]"
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stock Information Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                ข้อมูลสต็อกเริ่มต้น
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* จำนวนเริ่มต้น */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">จำนวนเริ่มต้น</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.initialQuantity}
                    onChange={(e) => handleInputChange('initialQuantity', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className={errors.initialQuantity ? 'border-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.initialQuantity && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.initialQuantity}
                    </p>
                  )}
                </div>

                {/* จำนวนขั้นต่ำ */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">จำนวนขั้นต่ำ</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.minimumStock}
                    onChange={(e) => handleInputChange('minimumStock', parseInt(e.target.value) || 0)}
                    placeholder="10"
                    className={errors.minimumStock ? 'border-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.minimumStock && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.minimumStock}
                    </p>
                  )}
                </div>
              </div>

              {/* มูลค่าเริ่มต้น */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">มูลค่าเริ่มต้น:</span>
                  <span className="text-lg font-medium text-purple-600">
                    ฿{(formData.initialQuantity * formData.pricePerBox).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              รีเซ็ต
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              ยกเลิก
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.hospitalDrugCode.trim() || !formData.name.trim() || !formData.unit.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  บันทึก
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}