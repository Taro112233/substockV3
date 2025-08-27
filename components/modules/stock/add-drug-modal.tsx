// 📄 File: components/modules/stock/add-drug-modal.tsx (Updated with Real-time Validation)
// ✅ Added: Real-time duplicate checking for hospital drug code
// =====================================================

import { useEffect, useState } from 'react'
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Stock } from '@/types/dashboard'
import { useDrugCodeValidation } from '@/hooks/use-drug-code-validation'
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
  Loader2,
  Search,
  Clock,
  Info,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink
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
  unit: '',
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
  const [showSuggestions, setShowSuggestions] = useState(false)

  // ✅ Real-time validation hook
  const {
    code: drugCode,
    isChecking,
    isAvailable,
    isDuplicate,
    existingDrug,
    suggestions,
    error: validationError,
    updateCode,
    getValidationStatus,
    getMessage
  } = useDrugCodeValidation(formData.hospitalDrugCode)

  // Sync drug code with form data
  const handleDrugCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value.toUpperCase() // Auto uppercase
    setFormData(prev => ({ ...prev, hospitalDrugCode: newCode }))
    updateCode(newCode)
    
    // Clear hospital drug code error when typing
    if (errors.hospitalDrugCode) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.hospitalDrugCode
        return newErrors
      })
    }
  }

  // Copy code from suggestion
  const copySuggestionCode = (suggestedCode: string) => {
    const newCode = suggestedCode + '_NEW' // Add suffix to avoid duplicate
    setFormData(prev => ({ ...prev, hospitalDrugCode: newCode }))
    updateCode(newCode)
    
    toast.info('คัดลอกรหัสแล้ว', {
      description: `ใช้รหัส "${newCode}" (เพิ่ม _NEW เพื่อไม่ให้ซ้ำ)`,
      duration: 2000,
    })
  }

  const [wasFilledFromDuplicate, setWasFilledFromDuplicate] = useState(false) // ✅ Track if form was auto-filled
  const [userDataBeforeDuplicate, setUserDataBeforeDuplicate] = useState<NewDrugData | null>(null) // ✅ Backup user data

  // ✅ Auto-fill when duplicate is detected (but disable editing)
  useEffect(() => {
    if (isDuplicate && existingDrug && formData.hospitalDrugCode === drugCode.trim()) {
      if (!wasFilledFromDuplicate) {
        // ✅ Backup current form data before auto-filling
        setUserDataBeforeDuplicate({ ...formData })
        
        // Auto-fill immediately when duplicate is detected
        fillFromExistingDrug(existingDrug, false) // false = don't generate new code
        setWasFilledFromDuplicate(true) // ✅ Mark as filled from duplicate
      }
    } else if (!isDuplicate && wasFilledFromDuplicate && userDataBeforeDuplicate) {
      // ✅ Restore user data when no longer duplicate
      restoreUserData()
      setWasFilledFromDuplicate(false)
    }
  }, [isDuplicate, existingDrug, drugCode, wasFilledFromDuplicate])

  // ✅ Restore user data that was entered before duplicate
  const restoreUserData = () => {
    if (userDataBeforeDuplicate) {
      const restoredData: NewDrugData = {
        ...userDataBeforeDuplicate,
        hospitalDrugCode: formData.hospitalDrugCode // Keep the current (new) code
      }
      
      setFormData(restoredData)
      setUserDataBeforeDuplicate(null) // Clear backup
      setErrors({})
      
      toast.success('กู้คืนข้อมูลแล้ว', {
        description: 'นำข้อมูลที่กรอกไว้ก่อนหน้ากลับมาแล้ว',
        icon: <CheckCircle2 className="w-4 h-4" />,
        duration: 2000,
      })
    }
  }

  // ✅ Fill form with existing drug data (no new code generation)
  const fillFromExistingDrug = (drug: any, generateNewCode = true) => {
    const filledData: NewDrugData = {
      hospitalDrugCode: generateNewCode ? generateNewDrugCode(drug.hospitalDrugCode) : drug.hospitalDrugCode,
      name: drug.name,
      genericName: drug.genericName,
      dosageForm: drug.dosageForm,
      strength: drug.strength,
      unit: drug.unit,
      packageSize: drug.packageSize,
      pricePerBox: drug.pricePerBox || 0,
      category: drug.category,
      notes: drug.notes,
      // Keep stock data for display
      initialQuantity: 0,
      minimumStock: 10
    }

    setFormData(filledData)
    if (generateNewCode) {
      updateCode(filledData.hospitalDrugCode)
    }
    
    // Clear any existing errors
    setErrors({})
    
    if (generateNewCode) {
      // Show subtle success toast only when generating new code
      toast.success('คัดลอกข้อมูลแล้ว', {
        description: `ใช้รหัส "${filledData.hospitalDrugCode}" จากข้อมูลเดิม`,
        icon: <CheckCircle2 className="w-4 h-4" />,
        duration: 3000,
      })
    } else {
      // Show info toast when auto-filling from duplicate
      toast.info('แสดงข้อมูลยาเดิม', {
        description: `แสดงข้อมูลของ "${drug.name}" เพื่อเป็นข้อมูลอ้างอิง`,
        icon: <Info className="w-4 h-4" />,
        duration: 2000,
      })
    }
  }

  // Helper function to generate new drug code
  const generateNewDrugCode = (originalCode: string) => {
    const match = originalCode.match(/^([A-Z]+)(\d+)$/)
    if (match) {
      const prefix = match[1]
      const number = parseInt(match[2])
      return `${prefix}${String(number + 1).padStart(match[2].length, '0')}`
    }
    
    // If no pattern found, add suffix
    return `${originalCode}_V2`
  }

  // Reset form when modal opens/closes
  const handleClose = () => {
    setFormData(initialFormData)
    setErrors({})
    setWasFilledFromDuplicate(false) // ✅ Reset tracking
    setUserDataBeforeDuplicate(null) // ✅ Clear backup
    updateCode('')
    setShowSuggestions(false)
    onClose()
  }

  const handleReset = () => {
    setFormData(initialFormData)
    setErrors({})
    setWasFilledFromDuplicate(false) // ✅ Reset tracking
    setUserDataBeforeDuplicate(null) // ✅ Clear backup
    updateCode('')
    setShowSuggestions(false)
    
    toast.info('รีเซ็ตฟอร์มแล้ว', {
      description: 'ข้อมูลทั้งหมดถูกล้างเรียบร้อยแล้ว',
      icon: <RotateCcw className="w-4 h-4" />,
      duration: 2000,
    })
  }

  // Validation with real-time check integration
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    let firstErrorField = ''

    if (!formData.hospitalDrugCode.trim()) {
      newErrors.hospitalDrugCode = 'รหัสยาโรงพยาบาลเป็นข้อมูลที่จำเป็น'
      if (!firstErrorField) firstErrorField = 'hospitalDrugCode'
    } else if (isDuplicate) {
      newErrors.hospitalDrugCode = 'รหัสยานี้มีอยู่ในระบบแล้ว'
      if (!firstErrorField) firstErrorField = 'hospitalDrugCode'
    } else if (validationError) {
      newErrors.hospitalDrugCode = 'ไม่สามารถตรวจสอบรหัสได้'
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
    
    if (Object.keys(newErrors).length > 0) {
      const errorCount = Object.keys(newErrors).length
      const firstError = newErrors[firstErrorField]
      
      toast.error('ข้อมูลไม่ถูกต้อง', {
        description: errorCount === 1 ? 
          firstError : 
          `พบข้อผิดพลาด ${errorCount} รายการ โปรดตรวจสอบข้อมูล`,
        icon: <AlertTriangle className="w-4 h-4" />,
        duration: 5000,
      })
      
      return false
    }

    return true
  }

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return

    const progressToast = toast.loading('กำลังเพิ่มยา...', {
      description: `เพิ่ม "${formData.name}" (${formData.hospitalDrugCode}) ไปยัง ${department === 'PHARMACY' ? 'คลังยา' : 'OPD'}`,
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
    })

    setLoading(true)
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

      const responseData = await response.json()

      if (!response.ok) {
        toast.dismiss(progressToast)
        
        if (response.status === 409) {
          toast.error('รหัสยาซ้ำ!', {
            description: `รหัสยา "${formData.hospitalDrugCode}" มีอยู่ในระบบแล้ว`,
            icon: <AlertCircle className="w-4 h-4" />,
            duration: 5000,
          })
          return
        }
        
        throw new Error(responseData.error || 'เกิดข้อผิดพลาดในการเพิ่มยา')
      }

      const { data: newStock } = responseData
      
      toast.dismiss(progressToast)
      toast.success('เพิ่มยาสำเร็จ!', {
        description: `เพิ่ม "${formData.name}" (${formData.hospitalDrugCode}) เรียบร้อยแล้ว`,
        icon: <CheckCircle2 className="w-4 h-4" />,
        duration: 4000,
      })

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
      toast.dismiss(progressToast)
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage.includes('รหัสยา')) {
        toast.error('เชื่อมต่อไม่ได้', {
          description: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต',
          icon: <XCircle className="w-4 h-4" />,
          duration: 6000,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Helper functions for other form fields
  const handleInputChange = <K extends keyof NewDrugData>(
    field: K, 
    value: NewDrugData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleStringInputChange = (field: keyof NewDrugData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value
    if (field === 'genericName' || field === 'strength' || field === 'packageSize' || field === 'notes') {
      handleInputChange(field, value || null)
    } else {
      handleInputChange(field, value as NewDrugData[typeof field])
    }
  }

  const handleNumberInputChange = (field: 'pricePerBox' | 'initialQuantity' | 'minimumStock') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value) || 0
    handleInputChange(field, Math.max(0, value))
  }

  // Get validation status icon
  const getValidationIcon = () => {
    const status = getValidationStatus()
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'available':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'duplicate':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return null
    }
  }

  const hasFormData = Object.keys(formData).some(key => {
    const value = formData[key as keyof NewDrugData]
    if (key === 'dosageForm' && value === 'TAB') return false
    if (key === 'category' && value === 'GENERAL') return false
    if (key === 'minimumStock' && value === 10) return false
    if (typeof value === 'string') return value.trim() !== ''
    if (typeof value === 'number') return value > 0
    return value !== null
  })

  const canSubmit = !loading && 
                   !isChecking &&
                   !isDuplicate &&  // ✅ Can't submit if duplicate
                   formData.hospitalDrugCode.trim() !== '' &&
                   formData.name.trim() !== '' &&
                   formData.unit.trim() !== '' &&
                   isAvailable

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />
            เพิ่มยาใหม่ - {department === 'PHARMACY' ? 'คลังยา' : 'OPD'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Drug Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="h-4 w-4" />
                ข้อมูลยา
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ✅ รหัสยาโรงพยาบาล with Real-time Validation */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    รหัสยาโรงพยาบาล *
                    {getValidationIcon()}
                  </label>
                  <div className="relative">
                    <Input
                      name="hospitalDrugCode"
                      value={formData.hospitalDrugCode}
                      onChange={handleDrugCodeChange}
                      placeholder="ระบุรหัสยา (เช่น TAB001)"
                      className={`${
                        errors.hospitalDrugCode ? 'border-red-500' : 
                        isDuplicate ? 'border-red-500 focus:border-red-500 focus:ring-red-200' :
                        isAvailable ? 'border-green-500' : ''
                      } ${isChecking ? 'pr-8' : ''}`}
                      disabled={loading}  // ✅ Only disable when loading, NOT when duplicate
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* ชื่อยา */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">ชื่อยา *</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleStringInputChange('name')}
                    placeholder="ระบุชื่อยา"
                    className={`${errors.name ? 'border-red-500' : ''} ${isDuplicate ? 'bg-gray-100' : ''}`}
                    disabled={loading || isDuplicate}
                  />
                </div>

                {/* ชื่อสามัญ */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">ชื่อสามัญ</label>
                  <Input
                    value={formData.genericName || ''}
                    onChange={handleStringInputChange('genericName')}
                    placeholder="ระบุชื่อสามัญ"
                    className={isDuplicate ? 'bg-gray-100' : ''}
                    disabled={loading || isDuplicate}
                  />
                </div>

                {/* รูปแบบยา */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">รูปแบบยา</label>
                  <Select
                    value={formData.dosageForm}
                    onValueChange={(value) => handleInputChange('dosageForm', value)}
                    disabled={loading || isDuplicate}
                  >
                    <SelectTrigger className={isDuplicate ? 'bg-gray-100' : ''}>
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
                  <Input
                    value={formData.strength || ''}
                    onChange={handleStringInputChange('strength')}
                    placeholder="เช่น 500"
                    className={isDuplicate ? 'bg-gray-100' : ''}
                    disabled={loading || isDuplicate}
                  />
                </div>

                {/* หน่วย */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">หน่วยความแรง *</label>
                  <Input
                    name="unit"
                    value={formData.unit}
                    onChange={handleStringInputChange('unit')}
                    placeholder="เช่น mg, ml, tab"
                    className={`${errors.unit ? 'border-red-500' : ''} ${isDuplicate ? 'bg-gray-100' : ''}`}
                    disabled={loading || isDuplicate}
                  />
                  {errors.unit && !isDuplicate && (
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
                    onChange={handleStringInputChange('packageSize')}
                    placeholder="เช่น 100"
                    className={isDuplicate ? 'bg-gray-100' : ''}
                    disabled={loading || isDuplicate}
                  />
                </div>

                {/* ราคาต่อกล่อง */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">ราคาต่อกล่อง (บาท)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.pricePerBox}
                    onChange={handleNumberInputChange('pricePerBox')}
                    placeholder="0.00"
                    className={`${errors.pricePerBox ? 'border-red-500' : ''} ${isDuplicate ? 'bg-gray-100' : ''}`}
                    disabled={loading || isDuplicate}
                  />
                  {errors.pricePerBox && !isDuplicate && (
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
                  disabled={loading || isDuplicate}
                >
                  <SelectTrigger className={isDuplicate ? 'bg-gray-100' : ''}>
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
                  onChange={handleStringInputChange('notes')}
                  placeholder="หมายเหตุเพิ่มเติม..."
                  className={`min-h-[80px] ${isDuplicate ? 'bg-gray-100' : ''}`}
                  disabled={loading || isDuplicate}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stock Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                ข้อมูลสต็อก
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* จำนวนสต็อก */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">จำนวนสต็อกเริ่มต้น</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.initialQuantity}
                    onChange={handleNumberInputChange('initialQuantity')}
                    placeholder="0"
                    className={`${errors.initialQuantity ? 'border-red-500' : ''} ${isDuplicate ? 'bg-gray-100' : ''}`}
                    disabled={loading || isDuplicate}
                  />
                  {errors.initialQuantity && !isDuplicate && (
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
                    onChange={handleNumberInputChange('minimumStock')}
                    placeholder="10"
                    className={`${errors.minimumStock ? 'border-red-500' : ''} ${isDuplicate ? 'bg-gray-100' : ''}`}
                    disabled={loading || isDuplicate}
                  />
                  {errors.minimumStock && !isDuplicate && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.minimumStock}
                    </p>
                  )}
                </div>
              </div>

              {/* Stock Summary */}
              {(formData.initialQuantity > 0 || formData.pricePerBox > 0) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-800 mb-1">
                    สรุปสต็อกเริ่มต้น
                  </div>
                  <div className="text-xs text-blue-600 space-y-1">
                    <div>จำนวน: {formData.initialQuantity.toLocaleString()} หน่วย</div>
                    <div>มูลค่า: ฿{(formData.initialQuantity * formData.pricePerBox).toLocaleString()}</div>
                    <div>ขั้นต่ำ: {formData.minimumStock.toLocaleString()} หน่วย</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading || !hasFormData}
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
              disabled={!canSubmit}
              className="flex-2"
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