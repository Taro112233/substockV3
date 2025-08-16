// 📄 File: types/index.ts

// ===== USER TYPES =====
export interface User {
  id: string
  username: string
  firstName: string
  lastName: string
  position?: string
  status: 'APPROVED' | 'UNAPPROVED' | 'SUSPENDED' | 'INACTIVE'
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

// ===== DRUG TYPES =====
export type DosageForm = 
  | 'APP' | 'BAG' | 'CAP' | 'CR' | 'DOP' | 'ENE' | 'GEL' | 'HAN' | 'IMP' 
  | 'INJ' | 'LIQ' | 'LOT' | 'LVP' | 'MDI' | 'MIX' | 'NAS' | 'NB' | 'OIN' 
  | 'PAT' | 'POW' | 'PWD' | 'SAC' | 'SOL' | 'SPR' | 'SUP' | 'SUS' | 'SYR' 
  | 'TAB' | 'TUR'

export type DrugCategory = 
  | 'REFER' | 'HIGH_ALERT' | 'NARCOTIC' | 'REFRIGERATED' | 'PSYCHIATRIC' 
  | 'FLUID' | 'GENERAL'

export interface Drug {
  id: string
  hospitalDrugCode: string
  name: string
  genericName?: string
  dosageForm: DosageForm
  strength?: string
  unit: string
  packageSize?: string
  pricePerBox: number
  category: DrugCategory
  isActive: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// ===== STOCK TYPES =====
export type Department = 'PHARMACY' | 'OPD'

export interface Stock {
  id: string
  drugId: string
  department: Department
  totalQuantity: number
  reservedQty: number
  minimumStock: number
  totalValue: number
  lastUpdated: Date
  drug: Drug
}

export type TransactionType = 
  | 'RECEIVE_EXTERNAL' | 'DISPENSE_EXTERNAL' | 'TRANSFER_OUT' | 'TRANSFER_IN'
  | 'ADJUST_INCREASE' | 'ADJUST_DECREASE' | 'RESERVE' | 'UNRESERVE'

export interface StockTransaction {
  id: string
  stockId: string
  userId: string
  batchId?: string
  transferId?: string
  type: TransactionType
  quantity: number
  beforeQty: number
  afterQty: number
  unitCost: number
  totalCost: number
  reference?: string
  note?: string
  createdAt: Date
}

// ===== TRANSFER TYPES =====
export type TransferStatus = 
  | 'PENDING' | 'APPROVED' | 'PREPARED' | 'DELIVERED' | 'PARTIAL' | 'CANCELLED'

export interface Transfer {
  id: string
  requisitionNumber: string
  title: string
  fromDept: Department
  toDept: Department
  requesterId: string
  approverId?: string
  dispenserId?: string
  receiverId?: string
  status: TransferStatus
  purpose: string
  requestNote?: string
  approvalNote?: string
  totalItems: number
  totalValue: number
  requestedAt: Date
  approvedAt?: Date
  dispensedAt?: Date
  deliveredAt?: Date
  receivedAt?: Date
  requester: Pick<User, 'id' | 'firstName' | 'lastName' | 'position'>
  approver?: Pick<User, 'id' | 'firstName' | 'lastName' | 'position'>
  dispenser?: Pick<User, 'id' | 'firstName' | 'lastName' | 'position'>
  receiver?: Pick<User, 'id' | 'firstName' | 'lastName' | 'position'>
  items: TransferItem[]
}

export interface TransferItem {
  id: string
  transferId: string
  drugId: string
  requestedQty: number
  approvedQty?: number
  dispensedQty?: number
  receivedQty?: number
  lotNumber?: string
  expiryDate?: Date
  manufacturer?: string
  unitPrice: number
  totalValue: number
  itemNote?: string
  drug: Pick<Drug, 'hospitalDrugCode' | 'name' | 'genericName' | 'unit' | 'dosageForm' | 'strength'>
}

// ===== BATCH TYPES =====
export interface DrugBatch {
  id: string
  drugId: string
  department: Department
  lotNumber: string
  expiryDate: Date
  manufacturer?: string
  quantity: number
  costPerUnit: number
  receivedDate: Date
}

// ===== API RESPONSE TYPES =====
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ===== FORM TYPES =====
export interface CreateDrugForm {
  hospitalDrugCode: string
  name: string
  genericName?: string
  dosageForm: DosageForm
  strength?: string
  unit: string
  packageSize?: string
  pricePerBox?: number
  category?: DrugCategory
  notes?: string
}

export interface CreateTransferForm {
  requisitionNumber: string
  title: string
  fromDept: Department
  toDept: Department
  purpose: string
  requestNote?: string
  items: {
    drugId: string
    requestedQty: number
    unitPrice?: number
    itemNote?: string
  }[]
}

export interface StockAdjustmentForm {
  drugId: string
  department: Department
  quantity: number
  type: TransactionType
  note?: string
  reference?: string
}

// ===== FILTER TYPES =====
export interface StockFilters {
  department?: Department
  category?: DrugCategory
  lowStock?: boolean
  search?: string
}

export interface TransferFilters {
  department?: Department
  status?: TransferStatus
  dateFrom?: Date
  dateTo?: Date
}

export interface DrugFilters {
  category?: DrugCategory
  dosageForm?: DosageForm
  isActive?: boolean
  search?: string
}