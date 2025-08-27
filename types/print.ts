// types/print.ts - แก้ไข packageSize type
export interface StockPrintData {
  id: string
  drug: {
    hospitalDrugCode: string
    name: string
    genericName?: string
    dosageForm?: string
    strength?: string
    unit?: string
    packageSize?: number | string // แก้ไข: รองรับทั้ง number และ string
  }
  totalQuantity: number
  minimumStock: number
  lastUpdated?: Date
  cost?: number
}

export type PrintFormat = 
  | 'stock-summary'       // สรุปสต็อก
  | 'requisition-form'    // ใบเบิกยา
  | 'low-stock-report'    // รายงานยาใกล้หมด
  | 'inventory-check'     // ตรวจนับสต็อก

export type Department = 'PHARMACY' | 'OPD'

export interface PrintOptions {
  format: PrintFormat
  department: Department
  title?: string
  includeDate: boolean
  includeSignature: boolean
  selectedOnly: boolean
}