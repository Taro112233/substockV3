// 📄 File: app/api/stock/export/route.ts
// ✅ FIXED: Type compatibility with utility functions
// API Endpoint for Excel Export - No Auth Required

import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// ✅ FIXED: Create local utility functions that work with StockData type
interface StockData {
  id: string
  totalQuantity: number
  reservedQty: number
  minimumStock: number
  lastUpdated: string | null
  department: 'PHARMACY' | 'OPD'
  drug: {
    hospitalDrugCode: string | null
    name: string
    genericName: string | null
    category: string | null
    dosageForm: string | null
    strength: string | null
    unit: string | null
    packageSize: number | null
    pricePerBox: number | null
  } | null
}

// ✅ LOCAL: Calculate available stock (works with StockData)
function calculateAvailableStockLocal(stock: StockData): number {
  return Math.max(0, (stock.totalQuantity || 0) - (stock.reservedQty || 0))
}

// ✅ LOCAL: Check if stock is low (works with StockData)
function isLowStockLocal(stock: StockData): boolean {
  const available = calculateAvailableStockLocal(stock)
  const minimum = stock.minimumStock || 0
  return available < minimum && minimum > 0
}

// ✅ LOCAL: Get category label (works with nullable string)
function getCategoryLabelLocal(category: string | null | undefined): string {
  if (!category) return 'ไม่ระบุ'
  
  const labels: Record<string, string> = {
    'REFER': 'ยาส่งต่อ',
    'HAD': 'ยา HAD',
    'NARCOTIC': 'ยาเสพติด',
    'REFRIGERATED': 'ยาเก็บเย็น',
    'PSYCHIATRIC': 'ยาจิต',
    'FLUID': 'น้ำเกล็อ',
    'GENERAL': 'ยาทั่วไป',
    'TABLET': 'ยาเม็ด',
    'SYRUP': 'ยาน้ำ',
    'INJECTION': 'ยาฉีด',
    'EXTEMP': 'ยาผสม',
    'ALERT': 'ยาแจ้งเตือน'
  }
  
  return labels[category] || category
}

interface ExportRequest {
  currentView: StockData[]
  additionalStocks: string[]
  format: 'summary' | 'detailed' | 'requisition'
  fields: {
    drugInfo: boolean
    stockLevels: boolean
    batchInfo: boolean
    costInfo: boolean
    lastUpdated: boolean
  }
  department: 'PHARMACY' | 'OPD'
  timestamp: string
  stats: {
    totalSelected: number
    currentViewCount: number
    additionalCount: number
    totalValue: number
  }
}

interface ExportRow {
  [key: string]: string | number | undefined
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
    const formatName = body.format === 'requisition' ? 'ใบเบิก' : 
                      body.format === 'detailed' ? 'รายละเอียด' : 'สรุป'
    const filename = `สต็อกยา_${departmentName}_${formatName}_${timestamp}.xlsx`

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

// รวบรวมข้อมูล Stock สำหรับ Export
function collectExportData(body: ExportRequest): StockData[] {
  const allStocks: StockData[] = []

  // เพิ่มข้อมูลจาก Current View
  if (body.currentView && body.currentView.length > 0) {
    console.log(`📋 Adding ${body.currentView.length} stocks from current view`)
    allStocks.push(...body.currentView)
  }

  console.log(`📊 Total stocks for export: ${allStocks.length}`)
  return allStocks
}

// สร้าง Excel Workbook
function createExcelWorkbook(stocks: StockData[], config: ExportRequest): XLSX.WorkBook {
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

  // สร้าง Header Sheet สำหรับใบเบิก
  if (config.format === 'requisition') {
    const headerData = createRequisitionHeader(config)
    const headerSheet = XLSX.utils.json_to_sheet(headerData)
    XLSX.utils.book_append_sheet(workbook, headerSheet, 'หัวใบเบิก')
  }

  return workbook
}

// สร้างแถวข้อมูลสำหรับ Export
function createExportRow(stock: StockData, config: ExportRequest): ExportRow {
  const availableStock = calculateAvailableStockLocal(stock)
  const lowStock = isLowStockLocal(stock)
  const categoryLabel = getCategoryLabelLocal(stock.drug?.category)
  const stockValue = availableStock * (stock.drug?.pricePerBox || 0)

  const row: ExportRow = {}

  // ใบเบิก Format
  if (config.format === 'requisition') {
    row['รหัส'] = stock.drug?.hospitalDrugCode || '-'
    row['ชื่อยา'] = stock.drug?.name || '-'
    row['รูปแบบ'] = stock.drug?.dosageForm || '-'
    row['ความแรง'] = stock.drug?.strength && stock.drug?.unit 
      ? `${stock.drug.strength} ${stock.drug.unit}` 
      : (stock.drug?.strength || '-')
    row['ขนาดบรรจุ'] = stock.drug?.packageSize ? `1 x ${stock.drug.packageSize}'s` : '-'
    row['ขั้นต่ำ'] = stock.minimumStock || 0
    row['คงเหลือ'] = availableStock
    row['อัปเดต'] = stock.lastUpdated 
      ? new Date(stock.lastUpdated).toLocaleString('th-TH', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '-'
    return row
  }

  // ข้อมูลพื้นฐาน (summary & detailed)
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
    row['อัปเดตล่าสุด'] = stock.lastUpdated 
      ? new Date(stock.lastUpdated).toLocaleString('th-TH')
      : '-'
  }

  return row
}

// สร้างข้อมูลสรุป
function createSummaryData(stocks: StockData[], config: ExportRequest): ExportRow[] {
  const totalStocks = stocks.length
  const totalValue = stocks.reduce((sum, stock) => 
    sum + (calculateAvailableStockLocal(stock) * (stock.drug?.pricePerBox || 0)), 0
  )
  const lowStockCount = stocks.filter(stock => isLowStockLocal(stock)).length
  
  // สรุปตามประเภทยา
  const categoryStats = stocks.reduce((acc, stock) => {
    const category = stock.drug?.category || 'UNKNOWN'
    if (!acc[category]) {
      acc[category] = { count: 0, value: 0 }
    }
    acc[category].count++
    acc[category].value += calculateAvailableStockLocal(stock) * (stock.drug?.pricePerBox || 0)
    return acc
  }, {} as Record<string, { count: number, value: number }>)

  const summaryData: ExportRow[] = [
    {
      'รายการ': 'สรุปรวม',
      'รายการยา': totalStocks,
      'มูลค่ารวม': totalValue.toFixed(2),
      'สต็อกต่ำ': lowStockCount,
      'แผนก': config.department === 'PHARMACY' ? 'คลังยา' : 'OPD',
      'วันที่ Export': new Date().toLocaleString('th-TH')
    },
    {}, // Empty row
    {
      'รายการ': 'สรุปตามประเภท',
      'รายการยา': '',
      'มูลค่ารวม': '',
      'สต็อกต่ำ': '',
      'แผนก': '',
      'วันที่ Export': ''
    },
    ...Object.entries(categoryStats).map(([category, categoryData]) => {
      const data = categoryData as { count: number, value: number }
      return {
        'รายการ': `ประเภท: ${getCategoryLabelLocal(category)}`,
        'รายการยา': data.count,
        'มูลค่ารวม': data.value.toFixed(2),
        'สต็อกต่ำ': '',
        'แผนก': '',
        'วันที่ Export': ''
      }
    })
  ]

  return summaryData
}

// สร้าง Header สำหรับใบเบิก
function createRequisitionHeader(config: ExportRequest): Array<Record<string, string | number>> {
  const departmentName = config.department === 'PHARMACY' ? 'คลังยา' : 'OPD'
  const currentDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return [
    {
      'ข้อมูล': 'ใบเบิกยา',
      'ค่า': `${departmentName} - ${currentDate}`
    },
    {
      'ข้อมูล': 'จำนวนรายการ',
      'ค่า': `${config.stats.totalSelected} รายการ`
    },
    {
      'ข้อมูล': 'มูลค่ารวม',
      'ค่า': `฿${config.stats.totalValue.toLocaleString()}`
    },
    {
      'ข้อมูล': 'วันที่ Export',
      'ค่า': new Date().toLocaleString('th-TH')
    },
    {},
    {
      'ข้อมูล': 'หมายเหตุ:',
      'ค่า': 'ใบเบิกสำหรับตรวจสอบสต็อกและการเบิกจ่าย'
    },
    {
      'ข้อมูล': '',
      'ค่า': 'อัปเดต = วันเวลาที่อัปเดตสต็อกล่าสุด'
    }
  ]
}

// กำหนดความกว้างคอลัมน์
function getColumnWidths(format: 'summary' | 'detailed' | 'requisition'): XLSX.ColInfo[] {
  // ใบเบิก Format
  if (format === 'requisition') {
    return [
      { wch: 15 }, // รหัส
      { wch: 30 }, // ชื่อยา
      { wch: 12 }, // รูปแบบ
      { wch: 15 }, // ความแรง
      { wch: 15 }, // ขนาดบรรจุ
      { wch: 12 }, // ขั้นต่ำ
      { wch: 12 }, // คงเหลือ
      { wch: 18 }, // อัปเดต (วันเวลา)
    ]
  }

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