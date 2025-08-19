// 📄 File: types/dashboard.ts (Updated with pricePerBox)
// Fixed Dashboard Types - ตรงกับ database schema

export interface DashboardStats {
  totalDrugs: number
  totalValue: number
  lowStockItems: number
  pendingTransfers: number
  recentTransactions: number
  department: 'PHARMACY' | 'OPD'
}

export interface Stock {
  id: string
  drugId: any
  department: 'PHARMACY' | 'OPD'
  totalQuantity: number
  reservedQty: number
  minimumStock: number
  totalValue: number
  lastUpdated?: string
  drug: {
    hospitalDrugCode: string
    name: string
    genericName: string
    dosageForm: string
    strength: string
    unit: string
    category: string
    packageSize?: string
    pricePerBox: number     // ← เพิ่ม pricePerBox
    isActive: boolean
    notes?: string
  }
}

export interface Transfer {
  id: string
  transferNumber: string
  fromDepartment: 'PHARMACY' | 'OPD'
  toDepartment: 'PHARMACY' | 'OPD'
  status: 'PENDING' | 'APPROVED' | 'SENT' | 'RECEIVED' | 'CANCELLED'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  requestedAt: string
  approvedAt?: string | null
  sentAt?: string | null
  receivedAt?: string | null
  requestedBy: {
    name: string
  }
  approvedBy?: {
    name: string
  } | null
  items: TransferItem[]
  notes: string
  totalItems?: number
  totalValue?: number
}

export interface TransferItem {
  id: string
  drugId: string
  requestedQty: number
  approvedQty: number
  sentQty: number
  receivedQty: number
  drug: {
    hospitalDrugCode: string
    name: string
    strength: string
    unit: string
    pricePerBox: number // ← เพิ่ม pricePerBox
  }
}

export interface Transaction {
  id: string
  type: 'RECEIVE' | 'DISPENSE' | 'ADJUST_IN' | 'ADJUST_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'EXPIRE' | 'DAMAGED'
  quantity: number
  beforeQty: number
  afterQty: number
  unitCost: number
  totalCost: number
  reference: string
  note: string
  createdAt: string
  drug: {
    hospitalDrugCode: string
    name: string
    strength: string
    unit: string
  }
  user: {
    name: string
  }
}

// Component Props Types
export interface DashboardStatsProps {
  stats: DashboardStats
  department: 'PHARMACY' | 'OPD'
}

export interface StockManagementTabProps {
  stocks: Stock[]
  department: 'PHARMACY' | 'OPD'
}

export interface TransferTabProps {
  transfers: Transfer[]
  department: 'PHARMACY' | 'OPD'
  onTransferAction: () => void
  onViewDetail: (transfer: Transfer) => void
}

export interface HistoryTabProps {
  transactions: Transaction[]
}

export interface TransferDetailModalProps {
  transfer: Transfer
  isOpen: boolean
  onClose: () => void
}