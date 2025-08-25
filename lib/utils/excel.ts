// 📄 File: lib/utils/excel.ts
// ✅ FIXED: Excel Export Utility Functions - แก้ TypeScript errors

import * as XLSX from 'xlsx'
import type { Stock, Drug, Department } from '@/types/index'

// Base interfaces for Excel operations
export interface ExcelExportOptions {
  filename?: string
  sheetName?: string
  autoWidth?: boolean
  freezePanes?: { row: number; col: number }
  headers?: Record<string, unknown>
  footers?: Record<string, unknown>
}

export interface ExcelColumn {
  key: string
  header: string
  width?: number
  type?: 'string' | 'number' | 'date' | 'currency'
  format?: string
}

// ✅ FIXED: Stock-specific interfaces with index signature
export interface StockExportData extends Record<string, unknown> {
  drugCode: string
  drugName: string
  genericName?: string
  category: string
  dosageForm: string
  strength?: string
  unit: string
  packageSize?: string
  totalQuantity: number
  reservedQty: number
  availableStock: number
  minimumStock: number
  pricePerBox: number
  stockValue: number
  status: string
  lastUpdated: Date | string
}

export interface StockSummaryData extends Record<string, unknown> {
  รายการ: string
  แผนก?: string
  รายการยา?: number
  มูลค่ารวม?: number
  สต็อกต่ำ?: number | string
  'วันที่ Export'?: string
}

export interface CategoryStats {
  [category: string]: {
    count: number
    value: number
  }
}

// ✅ FIXED: Generic function with proper constraints
export function createExcelFromData<T extends Record<string, unknown>>(
  data: T[],
  columns: ExcelColumn[],
  options: ExcelExportOptions = {}
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()
  
  // สร้าง worksheet
  const worksheet = createWorksheetFromData(data, columns, options)
  
  // เพิ่ม worksheet ลงใน workbook
  const sheetName = options.sheetName || 'Sheet1'
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  
  return workbook
}

// ✅ FIXED: Worksheet creation with proper typing
function createWorksheetFromData<T extends Record<string, unknown>>(
  data: T[],
  columns: ExcelColumn[],
  options: ExcelExportOptions = {}
): XLSX.WorkSheet {
  // เตรียม headers
  const headers = columns.map(col => col.header)
  
  // เตรียม data rows
  const rows = data.map(item => 
    columns.map(col => formatCellValue(item[col.key], col))
  )
  
  // รวม headers กับ data
  const wsData = [headers, ...rows]
  
  // สร้าง worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(wsData)
  
  // ตั้งค่าความกว้างคอลัมน์
  if (options.autoWidth || columns.some(col => col.width)) {
    worksheet['!cols'] = columns.map(col => ({
      wch: col.width || calculateAutoWidth(data, col.key, col.header)
    }))
  }
  
  // ตั้งค่า freeze panes
  if (options.freezePanes) {
    worksheet['!freeze'] = {
      xSplit: options.freezePanes.col,
      ySplit: options.freezePanes.row,
      topLeftCell: XLSX.utils.encode_cell({
        r: options.freezePanes.row,
        c: options.freezePanes.col
      })
    }
  }
  
  return worksheet
}

// จัดรูปแบบค่าใน cell ตามประเภท
function formatCellValue(value: unknown, column: ExcelColumn): string | number | Date {
  if (value === null || value === undefined) {
    return ''
  }
  
  switch (column.type) {
    case 'number':
      return typeof value === 'number' ? value : parseFloat(String(value)) || 0
    
    case 'currency':
      const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
      return numValue
    
    case 'date':
      if (value instanceof Date) {
        return value
      } else if (typeof value === 'string') {
        const date = new Date(value)
        return isNaN(date.getTime()) ? value : date
      }
      return String(value)
    
    case 'string':
    default:
      return String(value)
  }
}

// คำนวณความกว้างอัตโนมัติ
function calculateAutoWidth<T extends Record<string, unknown>>(
  data: T[], 
  key: string, 
  header: string
): number {
  const headerLength = header.length
  const maxDataLength = Math.max(
    ...data.map(item => String(item[key] || '').length),
    0
  )
  
  // ความกว้างขั้นต่ำ 8, ขั้นสูง 50
  return Math.min(Math.max(headerLength, maxDataLength, 8), 50)
}

// Export เป็นไฟล์ Excel (Browser)
export function downloadExcelFile(
  workbook: XLSX.WorkBook,
  filename: string = 'export.xlsx'
): void {
  // สร้าง buffer
  const buffer = XLSX.write(workbook, { 
    type: 'array', 
    bookType: 'xlsx',
    compression: true
  })
  
  // สร้าง blob
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  
  // สร้าง URL และดาวน์โหลด
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// แปลงข้อมูลสต็อกเป็นรูปแบบสำหรับ export
function convertStockToExportData(stock: Stock & { drug: Drug }): StockExportData {
  const availableStock = stock.totalQuantity - stock.reservedQty
  
  let status = 'ปกติ'
  if (availableStock <= 0) {
    status = 'หมด'
  } else if (availableStock <= stock.minimumStock) {
    status = 'สต็อกต่ำ'
  }
  
  return {
    drugCode: stock.drug.hospitalDrugCode,
    drugName: stock.drug.name,
    genericName: stock.drug.genericName,
    category: stock.drug.category,
    dosageForm: stock.drug.dosageForm,
    strength: stock.drug.strength,
    unit: stock.drug.unit,
    packageSize: stock.drug.packageSize,
    totalQuantity: stock.totalQuantity,
    reservedQty: stock.reservedQty,
    availableStock,
    minimumStock: stock.minimumStock,
    pricePerBox: stock.drug.pricePerBox,
    stockValue: stock.totalValue,
    status,
    lastUpdated: stock.lastUpdated
  }
}

// ✅ FIXED: สร้าง Excel สำหรับข้อมูลสต็อก (แบบ summary)
export function createStockSummaryExcel(
  stocks: (Stock & { drug: Drug })[],
  department: Department
): XLSX.WorkBook {
  const exportData: StockExportData[] = stocks.map(convertStockToExportData)
  
  const columns: ExcelColumn[] = [
    { key: 'drugCode', header: 'รหัสยา', width: 15 },
    { key: 'drugName', header: 'ชื่อยา', width: 30 },
    { key: 'category', header: 'ประเภท', width: 15 },
    { key: 'dosageForm', header: 'รูปแบบ', width: 10 },
    { key: 'strength', header: 'ความแรง', width: 15 },
    { key: 'availableStock', header: 'คงเหลือ', width: 12, type: 'number' },
    { key: 'minimumStock', header: 'ขั้นต่ำ', width: 12, type: 'number' },
    { key: 'stockValue', header: 'มูลค่า (บาท)', width: 15, type: 'currency' },
    { key: 'status', header: 'สถานะ', width: 12 },
    { key: 'lastUpdated', header: 'อัปเดตล่าสุด', width: 20, type: 'date' }
  ]
  
  const departmentName = department === 'PHARMACY' ? 'คลังยา' : 'OPD'
  
  return createExcelFromData(exportData, columns, {
    sheetName: `สต็อก_${departmentName}`,
    autoWidth: true,
    freezePanes: { row: 1, col: 0 }
  })
}

// ✅ FIXED: สร้าง Excel สำหรับข้อมูลสต็อก (แบบ detailed)
export function createStockDetailedExcel(
  stocks: (Stock & { drug: Drug })[],
  department: Department
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()
  const exportData: StockExportData[] = stocks.map(convertStockToExportData)
  
  // Sheet หลัก: ข้อมูลสต็อก
  const stockColumns: ExcelColumn[] = [
    { key: 'drugCode', header: 'รหัสยา', width: 15 },
    { key: 'drugName', header: 'ชื่อยา', width: 30 },
    { key: 'genericName', header: 'ชื่อสามัญ', width: 25 },
    { key: 'category', header: 'ประเภท', width: 15 },
    { key: 'dosageForm', header: 'รูปแบบ', width: 10 },
    { key: 'strength', header: 'ความแรง', width: 15 },
    { key: 'unit', header: 'หน่วย', width: 8 },
    { key: 'packageSize', header: 'ขนาดบรรจุ', width: 12 },
    { key: 'totalQuantity', header: 'จำนวนรวม', width: 12, type: 'number' },
    { key: 'reservedQty', header: 'จำนวนจอง', width: 12, type: 'number' },
    { key: 'availableStock', header: 'คงเหลือ', width: 12, type: 'number' },
    { key: 'minimumStock', header: 'ขั้นต่ำ', width: 12, type: 'number' },
    { key: 'pricePerBox', header: 'ราคา/กล่อง', width: 12, type: 'currency' },
    { key: 'stockValue', header: 'มูลค่ารวม', width: 15, type: 'currency' },
    { key: 'status', header: 'สถานะ', width: 12 },
    { key: 'lastUpdated', header: 'อัปเดตล่าสุด', width: 20, type: 'date' }
  ]
  
  const departmentName = department === 'PHARMACY' ? 'คลังยา' : 'OPD'
  const stockSheet = createWorksheetFromData(exportData, stockColumns, {
    autoWidth: true,
    freezePanes: { row: 1, col: 0 }
  })
  
  XLSX.utils.book_append_sheet(workbook, stockSheet, `สต็อก_${departmentName}`)
  
  // Sheet สรุป
  const summaryData = createStockSummary(exportData, department)
  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุป')
  
  return workbook
}

// ✅ FIXED: สร้างข้อมูลสรุป with proper typing
function createStockSummary(stocks: StockExportData[], department: Department): StockSummaryData[] {
  const totalStocks = stocks.length
  const totalValue = stocks.reduce((sum, stock) => sum + (Number(stock.stockValue) || 0), 0)
  const lowStockCount = stocks.filter(stock => stock.status === 'สต็อกต่ำ').length
  
  // สรุปตามประเภท
  const categoryStats: CategoryStats = stocks.reduce((acc, stock) => {
    const category = String(stock.category) || 'อื่นๆ'
    if (!acc[category]) {
      acc[category] = { count: 0, value: 0 }
    }
    acc[category].count++
    acc[category].value += Number(stock.stockValue) || 0
    return acc
  }, {} as CategoryStats)
  
  const departmentName = department === 'PHARMACY' ? 'คลังยา' : 'OPD'
  
  const summaryData: StockSummaryData[] = [
    {
      'รายการ': 'สรุปรวม',
      'แผนก': departmentName,
      'รายการยา': totalStocks,
      'มูลค่ารวม': totalValue,
      'สต็อกต่ำ': lowStockCount,
      'วันที่ Export': new Date().toLocaleString('th-TH')
    },
    {
      'รายการ': ''
    },
    { 
      'รายการ': 'สรุปตามประเภท' 
    }
  ]
  
  // เพิ่มข้อมูลแต่ละประเภท
  Object.entries(categoryStats).forEach(([category, data]) => {
    summaryData.push({
      'รายการ': category,
      'แผนก': '',
      'รายการยา': data.count,
      'มูลค่ารวม': data.value,
      'สต็อกต่ำ': '',
      'วันที่ Export': ''
    })
  })
  
  return summaryData
}

// ฟังก์ชัน helper สำหรับ format เวลา
export function formatDateForExcel(date: Date | string | null | undefined): Date | string {
  if (!date) return ''
  
  const d = date instanceof Date ? date : new Date(date)
  return isNaN(d.getTime()) ? String(date) : d
}

// ฟังก์ชัน helper สำหรับ format ตัวเลข
export function formatNumberForExcel(value: unknown): number {
  if (typeof value === 'number') return value
  const num = parseFloat(String(value))
  return isNaN(num) ? 0 : num
}

// ฟังก์ชัน helper สำหรับ format สกุลเงิน
export function formatCurrencyForExcel(value: unknown): number {
  return formatNumberForExcel(value)
}