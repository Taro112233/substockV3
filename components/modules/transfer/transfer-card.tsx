// 📄 File: lib/utils/dashboard.ts

import { Transfer, DashboardStats, Transaction } from '@/types/dashboard'

export function calculateDashboardStats(
  stocks: any[], 
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