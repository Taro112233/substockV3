// lib/utils/type-guards.ts - Type Guards และ Converters

import type { Stock as DashboardStock } from '@/types/dashboard'
import type { Stock as IndexStock, Drug } from '@/types/index'

// Type guard เพื่อตรวจสอบว่าเป็น stock type แบบไหน
export function isDashboardStock(stock: any): stock is DashboardStock {
  return stock && typeof stock.lastUpdated === 'string'
}

export function isIndexStock(stock: any): stock is IndexStock {
  return stock && stock.lastUpdated instanceof Date
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
      dosageForm: dashboardStock.drug.dosageForm as any, // Type assertion for enum
      strength: dashboardStock.drug.strength || undefined,
      unit: dashboardStock.drug.unit,
      packageSize: undefined, // ไม่มีใน dashboard type
      pricePerBox: 0, // ไม่มีใน dashboard type
      category: dashboardStock.drug.category as any, // Type assertion for enum
      isActive: true, // default value
      notes: undefined,
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