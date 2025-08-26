// สร้างไฟล์ lib/utils/print-utils.ts
import { Stock } from '@/types/dashboard'
import { StockPrintData } from '@/types/print'

export function convertStocksToPrintData(stocks: Stock[]): StockPrintData[] {
  return stocks.map(stock => ({
    id: stock.id,
    drug: {
      hospitalDrugCode: stock.drug?.hospitalDrugCode || '',
      name: stock.drug?.name || '',
      genericName: stock.drug?.genericName,
      dosageForm: stock.drug?.dosageForm,
      strength: stock.drug?.strength,
      unit: stock.drug?.unit,
      packageSize: stock.drug?.packageSize
    },
    totalQuantity: stock.totalQuantity,
    minimumStock: stock.minimumStock || 0,
    lastUpdated: stock.lastUpdated ? new Date(stock.lastUpdated) : undefined,
    cost: stock.drug?.pricePerBox || 0
  }))
}

export function filterStocksForPrint(
  stocks: StockPrintData[], 
  format: 'stock-summary' | 'requisition-form' | 'low-stock-report' | 'inventory-check'
): StockPrintData[] {
  switch (format) {
    case 'low-stock-report':
      return stocks.filter(stock => stock.totalQuantity <= stock.minimumStock)
    default:
      return stocks
  }
}