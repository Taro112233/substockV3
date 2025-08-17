// 📄 File: lib/types/api.ts
// API Response Types สำหรับ Dashboard

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  details?: string
}

export interface DashboardApiData {
  stocks: ApiStock[]
  transfers: ApiTransfer[]
  transactions: ApiTransaction[]
  stats: DashboardApiStats
}

export interface ApiStock {
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
    genericName: string
    dosageForm: string
    strength: string
    unit: string
    category: string
  }
}

export interface ApiTransfer {
  id: string
  transferNumber: string
  fromDepartment: 'PHARMACY' | 'OPD'
  toDepartment: 'PHARMACY' | 'OPD'
  status: 'PENDING' | 'APPROVED' | 'SENT' | 'RECEIVED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  requestedAt: string
  approvedAt: string | null
  sentAt: string | null
  receivedAt: string | null
  requestedBy: {
    name: string
  }
  approvedBy: {
    name: string
  } | null
  items: ApiTransferItem[]
  notes: string
}

export interface ApiTransferItem {
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
  }
}

export interface ApiTransaction {
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

export interface DashboardApiStats {
  totalDrugs: number
  totalValue: number
  lowStockCount: number
  totalTransfers: number
  pendingTransfers: number
  approvedTransfers: number
}

// Error Response Types
export interface ApiError {
  success: false
  error: string
  details?: string
  code?: string
}

// Request Types
export interface StockUpdateRequest {
  drugId: string
  quantity: number
  type: 'ADJUST_IN' | 'ADJUST_OUT'
  note?: string
  reference?: string
}

export interface TransferActionRequest {
  transferId: string
  action: 'APPROVE' | 'REJECT' | 'SEND' | 'RECEIVE' | 'CANCEL'
  items?: {
    itemId: string
    quantity: number
  }[]
  note?: string
}