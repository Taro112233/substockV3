// 📄 File: app/api/stock/export/route.ts
// ✅ FIXED: แก้ TypeScript errors โดยปรับ interface และ type handling

import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import type { Department, Drug } from '@/types/index'

// ✅ FIXED: สร้าง interface ที่รองรับทั้ง Date และ string สำหรับ lastUpdated
export interface ExportStock {
  id: string
  drugId: string
  department: Department
  totalQuantity: number
  reservedQty: number
  minimumStock: number
  totalValue: number
  lastUpdated: string | Date | null // ✅ รองรับทั้ง string และ Date
  drug: Drug
}

// Export request interface
interface ExportRequest {
  currentView: ExportStock[] // ✅ ใช้ ExportStock แทน StockWithDrug
  additionalStocks: string[]
  format: 'summary' | 'detailed'
  fields: {
    drugInfo: boolean
    stockLevels: boolean
    batchInfo: boolean
    costInfo: boolean
    lastUpdated: boolean
  }
  department: Department
  timestamp: string
  stats: {
    totalSelected: number
    currentViewCount: number
    additionalCount: number
    totalValue: number
  }
}

// Export row interface for Excel data
interface ExportRow {
  [key: string]: string | number | Date | null | undefined
}

// Category statistics interface
interface CategoryStats {
  [category: string]: {
    count: number
    value: number
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Export API called')

    const body: ExportRequest = await request.json()
    console.log('📋 Export request:', {
      format: body.format,
      department: body.department,
      totalSelected: body.stats.totalSelected,
      currentViewCount: body.stats.currentViewCount
    })

    // รวบรวมข้อมูลสำหรับ Export
    const exportStocks = collectExportData(body)
    
    if (exportStocks.length === 0) {
      console.log('❌ No data to export')
      return NextResponse.json(
        { success: false, error: 'No data to export' },
        { status: 400 }
      )
    }

    console.log(`📦 Processing ${exportStocks.length} stocks for export`)

    // สร้าง Excel Workbook
    const workbook = createExcelWorkbook(exportStocks, body)
    
    // Convert เป็น Buffer
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true 
    })

    // สร้างชื่อไฟล์
    const departmentName = body.department === 'PHARMACY' ? 'คลังยา' : 'OPD'
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const filename = `สต็อกยา_${departmentName}_${timestamp}.xlsx`

    console.log(`✅ Export successful: ${filename} (${buffer.length} bytes)`)

    // ส่ง Response พร้อมไฟล์ Excel
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      }
    })

  } catch (error) {
    console.error('❌ Export error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Export failed' 
      },
      { status: 500 }
    )
  }
}

// ✅ FIXED: รวบรวมข้อมูล Stock สำหรับ Export
function collectExportData(body: ExportRequest): ExportStock[] {
  const allStocks: ExportStock[] = []

  // เพิ่มข้อมูลจาก Current View
  if (body.currentView && body.currentView.length > 0) {
    console.log(`📋 Adding ${body.currentView.length} stocks from current view`)
    allStocks.push(...body.currentView)
  }

  console.log(`📊 Total stocks for export: ${allStocks.length}`)
  return allStocks
}

// สร้าง Excel Workbook
function createExcelWorkbook(stocks: ExportStock[], config: ExportRequest): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()

  // สร้าง Main Sheet
  const mainData = stocks.map(stock => createExportRow(stock, config))
  const mainSheet = XLSX.utils.json_to_sheet(mainData)
  
  // จัดรูปแบบ Column Width
  const columnWidths = getColumnWidths(config.format)
  mainSheet['!cols'] = columnWidths

  // เพิ่ม Sheet ลงใน Workbook
  const departmentName = config.department === 'PHARMACY' ? 'คลังยา' : 'OPD'
  XLSX.utils.book_append_sheet(workbook, mainSheet, `สต็อก_${departmentName}`)

  // สร้าง Summary Sheet (ถ้าเป็น detailed format)
  if (config.format === 'detailed') {
    const summaryData = createSummaryData(stocks, config)
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุป')
  }

  return workbook
}

// ✅ FIXED: สร้าง utility function สำหรับแปลง date
function formatLastUpdated(lastUpdated: string | Date | null): string {
  if (!lastUpdated) return '-'
  
  const date = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated
  return date.toLocaleString('th-TH')
}

// ✅ FIXED: ปรับ utility functions สำหรับ ExportStock
function calculateAvailableStockForExport(stock: ExportStock): number {
  return Math.max(0, (stock.totalQuantity || 0) - (stock.reservedQty || 0))
}

function isLowStockForExport(stock: ExportStock): boolean {
  const available = calculateAvailableStockForExport(stock)
  return available <= (stock.minimumStock || 0)
}

function getCategoryLabelForExport(category: string): string {
  const categoryMap: Record<string, string> = {
    'REFER': 'ยาส่งต่อ',
    'HAD': 'ยา HAD',
    'NARCOTIC': 'ยาเสพติด',
    'REFRIGERATED': 'ยาเก็บเย็น',
    'PSYCHIATRIC': 'ยาจิตเวช',
    'FLUID': 'น้ำเกลือ/สารน้ำ',
    'GENERAL': 'ยาทั่วไป',
    'TABLET': 'ยาเม็ด',
    'SYRUP': 'ยาน้ำ',
    'INJECTION': 'ยาฉีด',
    'EXTEMP': 'ยาผสมชั่วคราว',
    'ALERT': 'ยาต้องระวัง'
  }
  return categoryMap[category] || category
}

// ✅ FIXED: สร้างแถวข้อมูลสำหรับ Export
function createExportRow(stock: ExportStock, config: ExportRequest): ExportRow {
  const availableStock = calculateAvailableStockForExport(stock)
  const lowStock = isLowStockForExport(stock)
  const categoryLabel = getCategoryLabelForExport(stock.drug?.category as string)
  const stockValue = availableStock * (stock.drug?.pricePerBox || 0)

  const row: ExportRow = {}

  // ข้อมูลพื้นฐาน (แสดงเสมอ)
  row['รหัสยา'] = stock.drug?.hospitalDrugCode || '-'
  row['ชื่อยา'] = stock.drug?.name || '-'
  row['คงเหลือ'] = availableStock
  row['สถานะ'] = lowStock ? 'สต็อกต่ำ' : 'ปกติ'

  // ข้อมูลยา (ถ้าเลือกไว้)
  if (config.fields.drugInfo) {
    row['ชื่อสามัญ'] = stock.drug?.genericName || '-'
    row['ประเภท'] = categoryLabel
    row['รูปแบบ'] = stock.drug?.dosageForm || '-'
    row['ความแรง'] = stock.drug?.strength ? `${stock.drug.strength} ${stock.drug.unit || ''}` : '-'
    row['ขนาดบรรจุ'] = stock.drug?.packageSize ? `1 x ${stock.drug.packageSize}'s` : '-'
  }

  // ข้อมูลระดับสต็อก (ถ้าเลือกไว้)
  if (config.fields.stockLevels) {
    row['จำนวนขั้นต่ำ'] = stock.minimumStock || 0
    row['จำนวนจอง'] = stock.reservedQty || 0
    row['จำนวนรวม'] = stock.totalQuantity || 0
  }

  // ข้อมูลต้นทุน (ถ้าเลือกไว้)
  if (config.fields.costInfo) {
    row['ราคาต่อกล่อง'] = stock.drug?.pricePerBox || 0
    row['มูลค่ารวม'] = stockValue
  }

  // วันที่อัปเดต (ถ้าเลือกไว้)
  if (config.fields.lastUpdated) {
    row['อัปเดตล่าสุด'] = formatLastUpdated(stock.lastUpdated)
  }

  return row
}

// ✅ FIXED: สร้างข้อมูลสรุป
function createSummaryData(stocks: ExportStock[], config: ExportRequest): ExportRow[] {
  const totalStocks = stocks.length
  const totalValue = stocks.reduce((sum, stock) => 
    sum + (calculateAvailableStockForExport(stock) * (stock.drug?.pricePerBox || 0)), 0
  )
  const lowStockCount = stocks.filter(stock => isLowStockForExport(stock)).length
  
  // สรุปตามประเภทยา
  const categoryStats: CategoryStats = stocks.reduce((acc, stock) => {
    const category = stock.drug?.category || 'UNKNOWN'
    if (!acc[category]) {
      acc[category] = { count: 0, value: 0 }
    }
    acc[category].count++
    acc[category].value += calculateAvailableStockForExport(stock) * (stock.drug?.pricePerBox || 0)
    return acc
  }, {} as CategoryStats)

  const summaryData: ExportRow[] = [
    {
      'รายการ': 'สรุปรวม',
      'รายการยา': totalStocks,
      'มูลค่ารวม': totalValue.toFixed(2),
      'สต็อกต่ำ': lowStockCount,
      'แผนก': config.department === 'PHARMACY' ? 'คลังยา' : 'OPD',
      'วันที่ Export': new Date().toLocaleString('th-TH')
    },
    {
      'รายการ': '',
      'รายการยา': '',
      'มูลค่ารวม': '',
      'สต็อกต่ำ': '',
      'แผนก': '',
      'วันที่ Export': ''
    }, // Empty row
    {
      'รายการ': 'สรุปตามประเภท',
      'รายการยา': '',
      'มูลค่ารวม': '',
      'สต็อกต่ำ': '',
      'แผนก': '',
      'วันที่ Export': ''
    },
    ...Object.entries(categoryStats).map(([category, categoryData]) => {
      return {
        'รายการ': `ประเภท: ${getCategoryLabelForExport(category)}`,
        'รายการยา': categoryData.count,
        'มูลค่ารวม': categoryData.value.toFixed(2),
        'สต็อกต่ำ': '',
        'แผนก': '',
        'วันที่ Export': ''
      }
    })
  ]

  return summaryData
}

// กำหนดความกว้างคอลัมน์
function getColumnWidths(format: 'summary' | 'detailed'): XLSX.ColInfo[] {
  const baseWidths: XLSX.ColInfo[] = [
    { wch: 15 }, // รหัสยา
    { wch: 30 }, // ชื่อยา
    { wch: 12 }, // คงเหลือ
    { wch: 12 }, // สถานะ
  ]

  if (format === 'detailed') {
    return [
      ...baseWidths,
      { wch: 25 }, // ชื่อสามัญ
      { wch: 15 }, // ประเภท
      { wch: 12 }, // รูปแบบ
      { wch: 15 }, // ความแรง
      { wch: 15 }, // ขนาดบรรจุ
      { wch: 12 }, // ขั้นต่ำ
      { wch: 10 }, // จอง
      { wch: 12 }, // รวม
      { wch: 12 }, // ราคา
      { wch: 15 }, // มูลค่า
      { wch: 20 }, // อัปเดต
    ]
  }

  return baseWidths
}