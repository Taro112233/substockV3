// 📄 File: types/dashboard.ts (Updated Transaction type with pricePerBox)
// ✅ เพิ่ม pricePerBox ใน Transaction drug object

export interface DashboardStats {
  totalDrugs: number
  totalValue: number
  lowStockItems: number
  pendingTransfers: number
  recentTransactions: number
  department: 'PHARMACY' | 'OPD'
}

// Stock interface (existing)
export interface Stock {
  id: string
  drugId: string
  department: 'PHARMACY' | 'OPD'
  totalQuantity: number
  reservedQty: number
  minimumStock: number
  totalValue: number
  lastUpdated: string
  drug: {
    hospitalDrugCode: string
    name: string
    genericName?: string
    dosageForm: string
    strength?: string
    unit: string
    packageSize?: string
    pricePerBox: number
    category: string
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
    pricePerBox: number
  }
}

// ✅ Updated Transaction interface with pricePerBox in drug object
export interface Transaction {
  id: string
  type: 'RECEIVE_EXTERNAL' | 'DISPENSE_EXTERNAL' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUST_INCREASE' | 'ADJUST_DECREASE' | 'RESERVE' | 'UNRESERVE'
  quantity: number
  beforeQty: number
  afterQty: number
  unitCost: number
  totalCost: number
  reference?: string
  note?: string
  batchNumber?: string
  createdAt: string
  drug: {
    hospitalDrugCode: string
    name: string
    genericName?: string
    dosageForm: string
    strength?: string
    unit: string
    packageSize?: string
    pricePerBox: number  // ✅ เพิ่ม pricePerBox ใน Transaction drug object
    category: string
  }
  user: {
    firstName: string
    lastName: string
  }
  transfer?: {
    id: string
    requisitionNumber: string
  } | null
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