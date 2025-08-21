// 📄 File: lib/utils/dashboard.ts
// Updated with complete category mapping including PSYCHIATRIC

import { Stock, Transfer, Transaction } from '@/types/dashboard'

// ✅ Export all utility functions for use across components

// Calculate available stock (total - reserved)
export function calculateAvailableStock(stock: Stock): number {
  return Math.max(0, (stock.totalQuantity || 0) - (stock.reservedQty || 0))
}

// Check if stock is low
export function isLowStock(stock: Stock): boolean {
  const available = calculateAvailableStock(stock)
  const minimum = stock.minimumStock || 0
  return available <= minimum && minimum > 0
}

// Get transfer status color
export function getTransferStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'APPROVED': 'bg-blue-100 text-blue-800',
    'SENT': 'bg-purple-100 text-purple-800',
    'RECEIVED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// Get priority color
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    'LOW': 'bg-gray-100 text-gray-800',
    'MEDIUM': 'bg-blue-100 text-blue-800',
    'HIGH': 'bg-orange-100 text-orange-800',
    'URGENT': 'bg-red-100 text-red-800'
  }
  return colors[priority] || 'bg-gray-100 text-gray-800'
}

// Enhanced Drug category colors with complete mapping
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    // Primary Categories
    'GENERAL': 'bg-blue-100 text-blue-800 border-blue-200',
    'TABLET': 'bg-gray-100 text-gray-800 border-gray-200',
    'SYRUP': 'bg-pink-100 text-pink-800 border-pink-200',
    'INJECTION': 'bg-teal-100 text-teal-800 border-teal-200',
    'EXTEMP': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    
    // Special Categories
    'HAD': 'bg-red-100 text-red-800 border-red-200',
    'NARCOTIC': 'bg-purple-100 text-purple-800 border-purple-200',
    'PSYCHIATRIC': 'bg-indigo-100 text-indigo-800 border-indigo-200', // ✅ Added PSYCHIATRIC
    'REFRIGERATED': 'bg-blue-100 text-blue-800 border-blue-200',
    'FLUID': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    
    // Additional Categories
    'ANTIBIOTICS': 'bg-red-100 text-red-800 border-red-200',
    'CONTROLLED': 'bg-purple-100 text-purple-800 border-purple-200',
    'VACCINE': 'bg-green-100 text-green-800 border-green-200',
    'REFER': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'ALERT': 'bg-red-200 text-red-900 border-red-300'
  }
  return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200'
}

// Enhanced Drug category labels with complete Thai mapping
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    // Primary Categories
    'GENERAL': 'ยาทั่วไป',
    'TABLET': 'ยาเม็ด',
    'SYRUP': 'ยาน้ำ',
    'INJECTION': 'ยาฉีด',
    'EXTEMP': 'ยาใช้ภายนอก/สมุนไพร',
    
    // Special Categories
    'HAD': 'ยาเสี่ยงสูง',
    'NARCOTIC': 'ยาเสพติด',
    'PSYCHIATRIC': 'ยาจิตเวช', // ✅ Added PSYCHIATRIC with Thai label
    'REFRIGERATED': 'ยาเย็น',
    'FLUID': 'สารน้ำ',
    
    // Additional Categories
    'ANTIBIOTICS': 'ยาปฏิชีวนะ',
    'CONTROLLED': 'ยาควบคุม',
    'VACCINE': 'วัคซีน',
    'REFER': 'ยาส่งต่อ',
    'ALERT': 'ยาเฝ้าระวัง'
  }
  return labels[category] || category
}

// Get dosage form label in Thai
export function getDosageFormLabel(dosageForm: string): string {
  const labels: Record<string, string> = {
    'TAB': 'เม็ด',
    'CAP': 'แคปซูล',
    'SYR': 'น้ำเชื่อม',
    'SUS': 'ยาแขวนตะกอน',
    'INJ': 'ยาฉีด',
    'SOL': 'สารละลาย',
    'OIN': 'ครีม/ยาทา',
    'GEL': 'เจล',
    'LOT': 'โลชั่น',
    'SPR': 'สเปรย์',
    'SUP': 'ยาเหน็บ',
    'ENE': 'ยาสวนลำไส้',
    'POW': 'ผง',
    'PWD': 'แป้ง',
    'CR': 'ครีม',
    'BAG': 'ถุง',
    'APP': 'เครื่องมือ',
    'LVP': 'ถุงใส่เลือด',
    'MDI': 'พ่นสูดดม',
    'NAS': 'พ่นจมูก',
    'SAC': 'ซอง',
    'LIQ': 'ของเหลว',
    'MIX': 'ผสม'
  }
  return labels[dosageForm] || dosageForm
}

// Get transaction type info
export function getTransactionTypeInfo(type: string) {
  const config = {
    'RECEIVE_EXTERNAL': { 
      label: 'รับยาจากภายนอก', 
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'การรับยาจากผู้จำหน่าย หรือแหล่งภายนอกอื่นๆ'
    },
    'DISPENSE': { 
      label: 'จ่ายยา', 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'การจ่ายยาให้แก่ผู้ป่วยตามใบสั่งยา'
    },
    'TRANSFER_IN': { 
      label: 'รับยาโอน', 
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'การรับยาที่โอนมาจากแผนกอื่นภายในโรงพยาบาล'
    },
    'TRANSFER_OUT': { 
      label: 'โอนยาออก', 
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      description: 'การโอนยาไปยังแผนกอื่นภายในโรงพยาบาล'
    },
    'ADJUST_INCREASE': { 
      label: 'ปรับเพิ่มสต็อก', 
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'การปรับเพิ่มจำนวนสต็อก เช่น การนับสต็อก หรือ การแก้ไขข้อมูล'
    },
    'ADJUST_DECREASE': { 
      label: 'ปรับลดสต็อก', 
      color: 'bg-red-100 text-red-800 border-red-200',
      description: 'การปรับลดจำนวนสต็อก เช่น การหมดอายุ การเสียหาย หรือ การแก้ไขข้อมูล'
    },
    'RESERVE': { 
      label: 'จองยา', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      description: 'การจองยาสำหรับการใช้งานในอนาคต'
    },
    'UNRESERVE': { 
      label: 'ยกเลิกการจอง', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      description: 'การยกเลิกการจองยาที่เคยจองไว้'
    }
  }
  
  return config[type as keyof typeof config] || { 
    label: type, 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'ประเภทการเคลื่อนไหวอื่นๆ'
  }
}

// Format currency in Thai Baht
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2
  }).format(amount)
}

// Format date in Thai format
export function formatThaiDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Format date and time in Thai format
export function formatThaiDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Format percentage with sign
export function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// Get stock status
export function getStockStatus(stock: Stock): 'normal' | 'low' | 'empty' {
  const available = calculateAvailableStock(stock)
  if (available === 0) return 'empty'
  if (isLowStock(stock)) return 'low'
  return 'normal'
}

// Get stock status color
export function getStockStatusColor(status: 'normal' | 'low' | 'empty'): string {
  const colors = {
    'normal': 'text-green-600',
    'low': 'text-orange-600',
    'empty': 'text-red-600'
  }
  return colors[status]
}

// Check if user can perform action based on department and role
export function canPerformAction(
  userDepartment: string,
  userRole: string,
  requiredDepartment?: string,
  requiredRole?: string
): boolean {
  // Admin can do everything
  if (userRole === 'ADMIN') return true
  
  // Check department permission
  if (requiredDepartment && userDepartment !== requiredDepartment) {
    return false
  }
  
  // Check role permission
  if (requiredRole && userRole !== requiredRole) {
    return false
  }
  
  return true
}

// Validate drug code format
export function isValidDrugCode(code: string): boolean {
  // Format: AAA000 (3 letters + 3 numbers)
  const pattern = /^[A-Z]{3}\d{3}$/
  return pattern.test(code)
}

// Generate next drug code
export function generateNextDrugCode(prefix: string, existingCodes: string[]): string {
  const codePattern = new RegExp(`^${prefix}(\\d{3})$`)
  const numbers = existingCodes
    .filter(code => codePattern.test(code))
    .map(code => parseInt(code.replace(prefix, ''), 10))
    .sort((a, b) => b - a)
  
  const nextNumber = numbers.length > 0 ? numbers[0] + 1 : 1
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`
}