// lib/utils/type-guards.ts - Type Guards และ Converters (Fixed TypeScript errors)

import type { Stock as DashboardStock } from '@/types/dashboard'
import type { Stock as IndexStock, Drug, DosageForm, DrugCategory } from '@/types/index'

// Type guard เพื่อตรวจสอบว่าเป็น stock type แบบไหน
export function isDashboardStock(stock: unknown): stock is DashboardStock {
  return stock !== null && 
         stock !== undefined && 
         typeof stock === 'object' &&
         'lastUpdated' in stock && 
         typeof (stock as DashboardStock).lastUpdated === 'string'
}

export function isIndexStock(stock: unknown): stock is IndexStock {
  return stock !== null && 
         stock !== undefined && 
         typeof stock === 'object' &&
         'lastUpdated' in stock && 
         (stock as IndexStock).lastUpdated instanceof Date
}

// Helper function เพื่อแปลง dosage form string เป็น enum
function parseDosageForm(dosageForm: string): DosageForm {
  // ตรวจสอบว่า dosageForm เป็น valid enum value
  const validDosageForms: DosageForm[] = [
    'APP', 'BAG', 'CAP', 'CR', 'DOP', 'ENE', 'GEL', 'HAN', 'IMP',
    'INJ', 'LIQ', 'LOT', 'LVP', 'MDI', 'MIX', 'NAS', 'NB', 'OIN',
    'PAT', 'POW', 'PWD', 'SAC', 'SOL', 'SPR', 'SUP', 'SUS', 'SYR',
    'TAB', 'TUR'
  ]
  
  if (validDosageForms.includes(dosageForm as DosageForm)) {
    return dosageForm as DosageForm
  }
  
  // Default fallback ถ้าไม่พบ
  return 'TAB'
}

// Helper function เพื่อแปลง category string เป็น enum
function parseDrugCategory(category: string): DrugCategory {
  const validCategories: DrugCategory[] = [
    'REFER', 'HAD', 'NARCOTIC', 'REFRIGERATED', 'PSYCHIATRIC',
    'FLUID', 'GENERAL', 'TABLET', 'SYRUP', 'INJECTION', 'EXTEMP', 'ALERT'
  ]
  
  if (validCategories.includes(category as DrugCategory)) {
    return category as DrugCategory
  }
  
  // Default fallback ถ้าไม่พบ
  return 'GENERAL'
}

// Converter function สำหรับแปลง DashboardStock เป็น IndexStock
export function convertDashboardStockToIndexStock(dashboardStock: DashboardStock): IndexStock & { drug: Drug } {
  return {
    id: dashboardStock.id,
    drugId: dashboardStock.drugId,
    department: dashboardStock.department,
    totalQuantity: dashboardStock.totalQuantity,
    reservedQty: dashboardStock.reservedQty,
    minimumStock: dashboardStock.minimumStock,
    totalValue: dashboardStock.totalValue,
    lastUpdated: dashboardStock.lastUpdated ? new Date(dashboardStock.lastUpdated) : new Date(),
    drug: {
      id: dashboardStock.drugId, // ใช้ drugId เป็น id ชั่วคราว
      hospitalDrugCode: dashboardStock.drug.hospitalDrugCode,
      name: dashboardStock.drug.name,
      genericName: dashboardStock.drug.genericName || undefined,
      dosageForm: parseDosageForm(dashboardStock.drug.dosageForm), // ใช้ parser function
      strength: dashboardStock.drug.strength || undefined,
      unit: dashboardStock.drug.unit,
      packageSize: dashboardStock.drug.packageSize || undefined, // ดึงจาก dashboard type
      pricePerBox: dashboardStock.drug.pricePerBox || 0, // ดึงจาก dashboard type
      category: parseDrugCategory(dashboardStock.drug.category), // ใช้ parser function
      isActive: dashboardStock.drug.isActive ?? true, // ใช้ nullish coalescing
      notes: dashboardStock.drug.notes || undefined,
      createdAt: new Date(), // default value
      updatedAt: new Date()  // default value
    }
  }
}

// Converter สำหรับ array ของ stocks
export function convertDashboardStocksToIndexStocks(
  dashboardStocks: DashboardStock[]
): (IndexStock & { drug: Drug })[] {
  return dashboardStocks.map(convertDashboardStockToIndexStock)
}

// Type-safe props interface สำหรับ StockTable
export interface UnifiedStockTableProps {
  stocks: DashboardStock[] | (IndexStock & { drug: Drug })[]
  onStockAdjust?: (stockId: string, adjustment: number, reason: string) => void
  loading?: boolean
  className?: string
}

// Helper function เพื่อ normalize stocks ให้เป็น format ที่ StockTable คาดหวัง
export function normalizeStocksForTable(
  stocks: DashboardStock[] | (IndexStock & { drug: Drug })[]
): (IndexStock & { drug: Drug })[] {
  if (!stocks.length) return []
  
  // ตรวจสอบ type ของ stock แรก
  const firstStock = stocks[0]
  
  if (isDashboardStock(firstStock)) {
    // Convert DashboardStock[] เป็น IndexStock[]
    return convertDashboardStocksToIndexStocks(stocks as DashboardStock[])
  } else {
    // ใช้ as-is ถ้าเป็น IndexStock แล้ว
    return stocks as (IndexStock & { drug: Drug })[]
  }
}

// Type guard สำหรับตรวจสอบ unified stock type
export function isUnifiedStock(stock: unknown): stock is DashboardStock | (IndexStock & { drug: Drug }) {
  return isDashboardStock(stock) || isIndexStock(stock)
}

// Helper สำหรับดึง drug information จาก unified stock
export function getDrugFromStock(stock: DashboardStock | (IndexStock & { drug: Drug })): Drug | DashboardStock['drug'] {
  if (isDashboardStock(stock)) {
    return stock.drug
  } else {
    return stock.drug
  }
}

// Helper สำหรับดึง available quantity จาก unified stock
export function getAvailableQuantity(stock: DashboardStock | (IndexStock & { drug: Drug })): number {
  return stock.totalQuantity - stock.reservedQty
}

// Helper สำหรับตรวจสอบ low stock
export function isStockLow(stock: DashboardStock | (IndexStock & { drug: Drug })): boolean {
  const availableQty = getAvailableQuantity(stock)
  return availableQty <= stock.minimumStock
}

// Helper สำหรับตรวจสอบ out of stock
export function isOutOfStock(stock: DashboardStock | (IndexStock & { drug: Drug })): boolean {
  return getAvailableQuantity(stock) <= 0
}