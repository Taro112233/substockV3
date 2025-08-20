// 📄 File: lib/utils/dashboard.ts

import { Transfer, DashboardStats, Transaction, Stock } from '@/types/dashboard'

export function calculateDashboardStats(
  stocks: Stock[], 
  transfers: Transfer[], 
  transactions: Transaction[],
  department: 'PHARMACY' | 'OPD'
): DashboardStats {
  return {
    totalDrugs: stocks.length,
    totalValue: stocks.reduce((sum, stock) => sum + (stock.totalValue || 0), 0),
    lowStockItems: stocks.filter(stock => 
      stock.totalQuantity <= stock.minimumStock
    ).length,
    pendingTransfers: transfers.filter(t => t.status === 'PENDING').length,
    recentTransactions: transactions.length,
    department
  }
}

export function getTransferPerspective(
  transfer: Transfer, 
  userDept: 'PHARMACY' | 'OPD'
) {
  if (userDept === transfer.fromDepartment) {
    return { 
      type: 'OUTGOING' as const, 
      action: 'จ่ายให้',
      counterpart: transfer.toDepartment 
    }
  } else {
    return { 
      type: 'INCOMING' as const, 
      action: 'รับจาก',
      counterpart: transfer.fromDepartment 
    }
  }
}

// Stock utility functions
export function isLowStock(stock: Stock): boolean {
  return stock.totalQuantity <= stock.minimumStock
}

export function calculateAvailableStock(stock: Stock): number {
  return stock.totalQuantity - stock.reservedQty
}

export function getStockStatusColor(stock: Stock): string {
  if (isLowStock(stock)) {
    return 'bg-red-100 text-red-800'
  } else if (stock.totalQuantity <= stock.minimumStock * 1.5) {
    return 'bg-yellow-100 text-yellow-800'
  }
  return 'bg-green-100 text-green-800'
}

// Label functions
export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'RECEIVE': 'รับเข้า',
    'DISPENSE': 'จ่ายออก',
    'ADJUST_IN': 'ปรับเพิ่ม',
    'ADJUST_OUT': 'ปรับลด',
    'TRANSFER_IN': 'โอนเข้า',
    'TRANSFER_OUT': 'โอนออก',
    'EXPIRE': 'หมดอายุ',
    'DAMAGED': 'เสียหาย'
  }
  return labels[type] || type
}

export function getTransferStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'PENDING': 'รอดำเนินการ',
    'APPROVED': 'อนุมัติแล้ว',
    'SENT': 'ส่งแล้ว',
    'RECEIVED': 'รับแล้ว',
    'CANCELLED': 'ยกเลิก'
  }
  return labels[status] || status
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    'LOW': 'ต่ำ',
    'MEDIUM': 'ปกติ',
    'HIGH': 'สูง',
    'URGENT': 'เร่งด่วน'
  }
  return labels[priority] || priority
}

export function getDepartmentLabel(department: 'PHARMACY' | 'OPD'): string {
  const labels = {
    'PHARMACY': 'เภสัชกรรม',
    'OPD': 'OPD'
  }
  return labels[department]
}

// Formatting functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

// Color functions
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'APPROVED': 'bg-blue-100 text-blue-800',
    'SENT': 'bg-purple-100 text-purple-800',
    'RECEIVED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    'LOW': 'bg-gray-100 text-gray-800',
    'MEDIUM': 'bg-blue-100 text-blue-800',
    'HIGH': 'bg-orange-100 text-orange-800',
    'URGENT': 'bg-red-100 text-red-800'
  }
  return colors[priority] || 'bg-gray-100 text-gray-800'
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'GENERAL': 'bg-blue-100 text-blue-800',
    'ANTIBIOTICS': 'bg-red-100 text-red-800',
    'CONTROLLED': 'bg-purple-100 text-purple-800',
    'HAD': 'bg-orange-100 text-orange-800',
    'VACCINE': 'bg-green-100 text-green-800',
    'REFER': 'bg-yellow-100 text-yellow-800',
    'TABLET' : 'bg-gray-200 text-gray-800',
    'SYRUP': 'bg-pink-100 text-pink-800',
    'INJECTION': 'bg-teal-100 text-teal-800',
    'EXTERNAL': 'bg-indigo-100 text-indigo-800',
    'ALERT': 'bg-red-200 text-red-900'
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

// Drug category labels
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'GENERAL': 'ยาทั่วไป',
    'ANTIBIOTICS': 'ยาปฏิชีวนะ',
    'CONTROLLED': 'ยาควบคุม',
    'HAD': 'ยาเสี่ยงสูง',
    'VACCINE': 'วัคซีน',
    'REFER': 'ยาส่งต่อ',
    'TABLET': 'ยาเม็ด',
    'SYRUP': 'ยาแบบน้ำ',
    'INJECTION': 'ยาฉีด',
    'EXTERNAL': 'ยาภายนอก',
    'ALERT': 'ระวังพิเศษ'
  }
  return labels[category] || category
}