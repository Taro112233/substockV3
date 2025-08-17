// 📄 File: lib/utils/dashboard.ts

import { Transfer, Stock, Transaction } from '@/types/dashboard'

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatCurrency = (amount: number) => {
  return `฿${amount.toLocaleString()}`
}

export const calculateAvailableStock = (stock: Stock) => {
  return stock.totalQuantity - stock.reservedQty
}

export const isLowStock = (stock: Stock) => {
  return calculateAvailableStock(stock) <= stock.minimumStock
}

export const getStockStatusColor = (stock: Stock) => {
  if (isLowStock(stock)) {
    return 'border-orange-200 bg-orange-50'
  }
  return ''
}

export const calculateDashboardStats = (stocks: Stock[], transfers: Transfer[]) => {
  const totalItems = stocks.reduce((sum, stock) => sum + stock.totalQuantity, 0)
  const totalValue = stocks.reduce((sum, stock) => sum + stock.totalValue, 0)
  const lowStockCount = stocks.filter(isLowStock).length
  const transferCount = transfers.length

  return {
    totalItems,
    totalValue,
    lowStockCount,
    transferCount
  }
}

export const getTransferPerspectiveText = (
  transfer: Transfer, 
  userDepartment: 'PHARMACY' | 'OPD'
) => {
  if (userDepartment === 'PHARMACY') {
    return {
      direction: 'ส่งไป',
      counterpart: transfer.toDept === 'OPD' ? 'แผนก OPD' : 'คลังยา',
      actionType: 'outgoing'
    }
  } else {
    return {
      direction: 'รับจาก',
      counterpart: transfer.fromDept === 'PHARMACY' ? 'คลังยา' : 'แผนก OPD',
      actionType: 'incoming'
    }
  }
}

export const getTransactionTypeLabel = (type: Transaction['type']) => {
  const labels = {
    ADJUSTMENT: 'ปรับสต็อก',
    TRANSFER_IN: 'รับเข้า',
    TRANSFER_OUT: 'จ่ายออก',
    DISPENSING: 'จ่ายยา'
  }
  return labels[type]
}

export const getAvailableActions = (
  transfer: Transfer, 
  userDepartment: 'PHARMACY' | 'OPD'
) => {
  const actions = []
  
  if (userDepartment === 'PHARMACY') {
    switch (transfer.status) {
      case 'PENDING':
        actions.push('approve', 'reject')
        break
      case 'APPROVED':
        actions.push('send')
        break
    }
  } else if (userDepartment === 'OPD') {
    switch (transfer.status) {
      case 'PENDING':
        actions.push('cancel')
        break
      case 'SENT':
        actions.push('receive')
        break
    }
  }
  
  actions.push('view')
  return actions
}