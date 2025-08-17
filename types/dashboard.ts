// 📄 File: types/dashboard.ts

export interface Drug {
  hospitalDrugCode: string
  name: string
  genericName?: string
  dosageForm: string
  strength?: string
  unit: string
  category: string
}

export interface Stock {
  id: string
  drugId: string
  department: 'PHARMACY' | 'OPD'
  totalQuantity: number
  reservedQty: number
  minimumStock: number
  totalValue: number
  drug: Drug
}

export interface TransferItem {
  id: string
  drugCode: string
  drugName: string
  requestedQty: number
  approvedQty?: number
  sentQty?: number
  receivedQty?: number
  unit: string
}

export interface Transfer {
  id: string
  transferNumber: string
  fromDept: 'PHARMACY' | 'OPD'
  toDept: 'PHARMACY' | 'OPD'
  status: 'PENDING' | 'APPROVED' | 'SENT' | 'RECEIVED' | 'CANCELLED'
  totalItems: number
  totalValue: number
  requestedAt: string
  requestedBy: string
  approvedAt?: string
  sentAt?: string
  receivedAt?: string
  items: TransferItem[]
}

export interface Transaction {
  id: string
  type: 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'DISPENSING'
  drugCode: string
  drugName: string
  quantity: number
  unit: string
  reference?: string
  createdAt: string
  createdBy: string
}

export interface User {
  id: string
  firstName: string
  lastName: string
  position: string
  department: 'PHARMACY' | 'OPD'
  role: string
}

export interface DashboardStats {
  totalItems: number
  totalValue: number
  lowStockCount: number
  transferCount: number
}