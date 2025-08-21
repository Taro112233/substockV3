// types/index.ts - Updated Stock & Drug Types

// ===== DRUG TYPES =====
export type DosageForm = 
  | 'APP' | 'BAG' | 'CAP' | 'CR' | 'DOP' | 'ENE' | 'GEL' | 'HAN' | 'IMP' 
  | 'INJ' | 'LIQ' | 'LOT' | 'LVP' | 'MDI' | 'MIX' | 'NAS' | 'NB' | 'OIN' 
  | 'PAT' | 'POW' | 'PWD' | 'SAC' | 'SOL' | 'SPR' | 'SUP' | 'SUS' | 'SYR' 
  | 'TAB' | 'TUR'

export type DrugCategory = 
  | 'REFER' | 'HAD' | 'NARCOTIC' | 'REFRIGERATED' | 'PSYCHIATRIC' 
  | 'FLUID' | 'GENERAL' | 'TABLET' 
  | 'SYRUP' | 'INJECTION' | 'EXTEMP' | 'ALERT'

export interface Drug {
  id: string
  hospitalDrugCode: string
  name: string
  genericName?: string
  dosageForm: DosageForm
  strength?: string
  unit: string
  packageSize?: string  // ← เพิ่ม field นี้
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
  minimumStock: number  // ← ใช้ minimumStock แทน reorderPoint
  totalValue: number
  lastUpdated: Date
  drug: Drug  // ← Drug relation with packageSize
}

// ===== DRUG BATCH TYPES =====
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
  stock: Stock
  batch?: DrugBatch
}

// ===== UTILITY TYPES =====
export interface StockWithDrug extends Stock {
  drug: Drug
}

export interface StockSummary {
  total: number
  lowStock: number
  outOfStock: number
  totalValue: number
}

export interface StockFilter {
  searchTerm?: string
  showLowStockOnly?: boolean
  category?: DrugCategory
  department?: Department
}

// ===== API RESPONSE TYPES =====
export interface StockAdjustmentRequest {
  stockId: string
  adjustment: number
  reason: string
  reference?: string
}

export interface BulkStockUpdate {
  stockIds: string[]
  action: 'adjust' | 'reserve' | 'unreserve'
  value: number
  reason: string
}