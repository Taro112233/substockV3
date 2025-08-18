// 📄 File: types/transfer.ts

export interface TransferBase {
  id: string
  requisitionNumber: string
  title: string
  purpose: string
  fromDept: 'PHARMACY' | 'OPD'
  toDept: 'PHARMACY' | 'OPD'
  status: TransferStatusType
  totalItems: number
  totalValue: number
  requestedAt: string
  approvedAt?: string
  dispensedAt?: string
  receivedAt?: string
  requestNote?: string
  approvalNote?: string
}

export interface TransferUser {
  id: string
  firstName: string
  lastName: string
  position?: string
}

export interface TransferDrug {
  hospitalDrugCode: string
  name: string
  genericName?: string
  dosageForm: string
  strength?: string
  unit: string
  packageSize?: string
  pricePerBox: number
  category: string
}

export interface TransferItem {
  id: string
  drugId: string
  requestedQty: number
  approvedQty?: number
  dispensedQty?: number
  receivedQty?: number
  
  // Batch info (filled during dispensing)
  lotNumber?: string
  expiryDate?: string
  manufacturer?: string
  
  // Pricing
  unitPrice: number
  totalValue: number
  
  itemNote?: string
  drug: TransferDrug
}

export interface TransferDetails extends TransferBase {
  requester: TransferUser
  approver?: TransferUser
  dispenser?: TransferUser
  receiver?: TransferUser
  items: TransferItem[]
}

export type TransferStatusType = 'PENDING' | 'APPROVED' | 'PREPARED' | 'DELIVERED' | 'CANCELLED'