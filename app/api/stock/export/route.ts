// 📄 File: app/api/stock/export/route.ts
// ✅ UPDATED: เพิ่มคอลัมน์ราคาต่อกล่องและราคาต่อหน่วยในใบเบิก format

import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

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

// ✅ LOCAL: Calculate available stock
function calculateAvailableStockLocal(stock: StockData): number {
  return Math.max(0, (stock.totalQuantity || 0) - (stock.reservedQty || 0))
}

// ✅ LOCAL: Check if stock is low
function isLowStockLocal(stock: StockData): boolean {
  const available = calculateAvailableStockLocal(stock)
  const minimum = stock.minimumStock || 0
  return available < minimum && minimum > 0
}

// ✅ LOCAL: Get category label
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

// ✅ NEW: คำนวณราคาต่อหน่วย
function calculatePricePerUnit(pricePerBox: number | null | undefined, packageSize: number | null | undefined): number {
  if (!pricePerBox || !packageSize || packageSize === 0) return 0
  return pricePerBox / packageSize
}

// ✅ NEW: Sort stocks by drug name A-Z (Thai locale support)
function sortStocksByName(stocks: StockData[]): StockData[] {
  return [...stocks].sort((a, b) => {
    const nameA = a.drug?.name?.toLowerCase() || ''
    const nameB = b.drug?.name?.toLowerCase() || ''
    
    // ใช้ Thai locale sorting สำหรับการเรียงลำดับที่ถูกต้อง
    return nameA.localeCompare(nameB, 'th', {
      sensitivity: 'base',
      numeric: true,
      ignorePunctuation: true
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Stock Export API called')

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

// ✅ UPDATED: รวบรวมข้อมูล Stock และเรียงตามชื่อยา A-Z
function collectExportData(body: ExportRequest): StockData[] {
  const allStocks: StockData[] = []

  // เพิ่มข้อมูลจาก Current View
  if (body.currentView && body.currentView.length > 0) {
    console.log(`📋 Adding ${body.currentView.length} stocks from current view`)
    allStocks.push(...body.currentView)
  }

  console.log(`📊 Total stocks before sorting: ${allStocks.length}`)
  
  // ✅ NEW: เรียงตามชื่อยา A-Z ก่อน return
  const sortedStocks = sortStocksByName(allStocks)
  console.log(`📊 Stocks sorted by drug name A-Z: ${sortedStocks.length}`)

  return sortedStocks
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

  // ✅ NEW: เพิ่ม Cell Formatting สำหรับตัวเลข (ชิดขวา)
  if (config.format === 'requisition') {
    applyCellFormatting(mainSheet, mainData)
  }

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

// ✅ UPDATED: สร้างแถวข้อมูลสำหรับ Export - เพิ่มคอลัมน์ราคา
function createExportRow(stock: StockData, config: ExportRequest): ExportRow {
  const availableStock = calculateAvailableStockLocal(stock)
  const lowStock = isLowStockLocal(stock)
  const categoryLabel = getCategoryLabelLocal(stock.drug?.category)
  const stockValue = availableStock * (stock.drug?.pricePerBox || 0)
  const pricePerBox = stock.drug?.pricePerBox || 0
  const pricePerUnit = calculatePricePerUnit(stock.drug?.pricePerBox, stock.drug?.packageSize)

  // ✅ UPDATED: ใบเบิก Format - เพิ่มคอลัมน์ราคา
  if (config.format === 'requisition') {
    return {
      'รหัส': stock.drug?.hospitalDrugCode || '-',
      'ชื่อยา': stock.drug?.name || '-',
      'รูปแบบ': stock.drug?.dosageForm || '-',
      'ความแรง': stock.drug?.strength && stock.drug?.unit 
        ? `${stock.drug.strength} ${stock.drug.unit}` 
        : (stock.drug?.strength || '-'),
      'ขนาดบรรจุ': stock.drug?.packageSize ? `1 x ${stock.drug.packageSize}'s` : '-',
      'ราคาต่อกล่อง': pricePerBox, // ✅ ส่งเป็น number
      'ราคาต่อหน่วย': pricePerUnit, // ✅ ส่งเป็น number
      'ขั้นต่ำ': stock.minimumStock || 0,
      'คงเหลือ': availableStock,
      'สถานะ': lowStock ? 'ต้องเบิก' : 'เพียงพอ',
      'อัปเดต': stock.lastUpdated 
        ? new Date(stock.lastUpdated).toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '-'
    }
  }

  // ✅ FIXED: สำหรับ Summary Format
  if (config.format === 'summary') {
    return {
      'รหัสยา': stock.drug?.hospitalDrugCode || '-',
      'ชื่อยา': stock.drug?.name || '-',
      'ประเภท': categoryLabel,
      'รูปแบบ': stock.drug?.dosageForm || '-',
      'คงเหลือ': availableStock,
      'ขั้นต่ำ': stock.minimumStock || 0,
      'สถานะ': lowStock ? 'สต็อกต่ำ' : 'ปกติ',
      'มูลค่า (บาท)': stockValue.toFixed(2),
      'อัปเดตล่าสุด': stock.lastUpdated 
        ? new Date(stock.lastUpdated).toLocaleString('th-TH')
        : '-'
    }
  }

  // ✅ FIXED: สำหรับ Detailed Format
  if (config.format === 'detailed') {
    const row: ExportRow = {
      'รหัสยา': stock.drug?.hospitalDrugCode || '-',
      'ชื่อยา': stock.drug?.name || '-',
      'ชื่อสามัญ': stock.drug?.genericName || '-',
      'ประเภท': categoryLabel,
      'รูปแบบ': stock.drug?.dosageForm || '-',
      'ความแรง': stock.drug?.strength ? `${stock.drug.strength} ${stock.drug.unit || ''}` : '-',
      'ขนาดบรรจุ': stock.drug?.packageSize ? `1 x ${stock.drug.packageSize}'s` : '-',
      'จำนวนรวม': stock.totalQuantity || 0,
      'จำนวนจอง': stock.reservedQty || 0,
      'คงเหลือ': availableStock,
      'ขั้นต่ำ': stock.minimumStock || 0,
      'สถานะ': lowStock ? 'สต็อกต่ำ' : 'ปกติ',
      'ราคาต่อกล่อง': stock.drug?.pricePerBox || 0,
      'มูลค่ารวม': stockValue.toFixed(2),
      'อัปเดตล่าสุด': stock.lastUpdated 
        ? new Date(stock.lastUpdated).toLocaleString('th-TH')
        : '-'
    }

    return row
  }

  // Fallback (shouldn't reach here)
  return {
    'รหัสยา': stock.drug?.hospitalDrugCode || '-',
    'ชื่อยา': stock.drug?.name || '-',
    'คงเหลือ': availableStock,
    'สถานะ': lowStock ? 'สต็อกต่ำ' : 'ปกติ'
  }
}

// ✅ UPDATED: สร้างข้อมูลสรุป - Summary data จะใช้ข้อมูลที่เรียงแล้ว
function createSummaryData(stocks: StockData[], config: ExportRequest): ExportRow[] {
  const totalStocks = stocks.length
  const totalValue = stocks.reduce((sum, stock) => 
    sum + (calculateAvailableStockLocal(stock) * (stock.drug?.pricePerBox || 0)), 0
  )
  const lowStockCount = stocks.filter(stock => isLowStockLocal(stock)).length
  
  // สรุปตามประเภทยา - เรียงตามประเภท
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
    // ✅ เรียงประเภทตามตัวอักษร
    ...Object.entries(categoryStats)
      .sort(([a], [b]) => getCategoryLabelLocal(a).localeCompare(getCategoryLabelLocal(b), 'th'))
      .map(([category, categoryData]) => {
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
      'ค่า': 'ใบเบิกสำหรับตรวจสอบสต็อกและการเบิกจ่าย (เรียงตามชื่อยา A-Z)'
    },
    {
      'ข้อมูล': '',
      'ค่า': 'สถานะ: ต้องเบิก = คงเหลือต่ำกว่าขั้นต่ำ'
    }
  ]
}

// ✅ NEW: ฟังก์ชั่นสำหรับ Format Cell ให้ตัวเลขชิดขวา
function applyCellFormatting(worksheet: XLSX.WorkSheet, data: ExportRow[]) {
  if (!data.length) return

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  
  // หาตำแหน่งคอลัมน์ราคา (คอลัมน์ที่ 6 และ 7 = F และ G)
  const pricePerBoxCol = 5 // คอลัมน์ F (ราคาต่อกล่อง)
  const pricePerUnitCol = 6 // คอลัมน์ G (ราคาต่อหน่วย)
  const minimumCol = 7 // คอลัมน์ H (ขั้นต่ำ)
  const availableCol = 8 // คอลัมน์ I (คงเหลือ)

  // วนลูปแต่ละแถว (เริ่มจากแถวที่ 2 เพราะแถวแรกเป็น header)
  for (let row = 1; row <= range.e.r; row++) {
    // Format ราคาต่อกล่อง (2 ทศนิยม, ชิดขวา)
    const priceBoxCellRef = XLSX.utils.encode_cell({ r: row, c: pricePerBoxCol })
    if (worksheet[priceBoxCellRef]) {
      worksheet[priceBoxCellRef].z = '#,##0.00' // Number format with 2 decimal places
      if (!worksheet[priceBoxCellRef].s) worksheet[priceBoxCellRef].s = {}
      worksheet[priceBoxCellRef].s.alignment = { horizontal: 'right' }
    }

    // Format ราคาต่อหน่วย (4 ทศนิยม, ชิดขวา)
    const priceUnitCellRef = XLSX.utils.encode_cell({ r: row, c: pricePerUnitCol })
    if (worksheet[priceUnitCellRef]) {
      worksheet[priceUnitCellRef].z = '#,##0.0000' // Number format with 4 decimal places
      if (!worksheet[priceUnitCellRef].s) worksheet[priceUnitCellRef].s = {}
      worksheet[priceUnitCellRef].s.alignment = { horizontal: 'right' }
    }

    // Format ขั้นต่ำ (ชิดขวา)
    const minCellRef = XLSX.utils.encode_cell({ r: row, c: minimumCol })
    if (worksheet[minCellRef]) {
      worksheet[minCellRef].z = '#,##0' // Integer format
      if (!worksheet[minCellRef].s) worksheet[minCellRef].s = {}
      worksheet[minCellRef].s.alignment = { horizontal: 'right' }
    }

    // Format คงเหลือ (ชิดขวา)
    const availCellRef = XLSX.utils.encode_cell({ r: row, c: availableCol })
    if (worksheet[availCellRef]) {
      worksheet[availCellRef].z = '#,##0' // Integer format
      if (!worksheet[availCellRef].s) worksheet[availCellRef].s = {}
      worksheet[availCellRef].s.alignment = { horizontal: 'right' }
    }
  }
}

// ✅ UPDATED: กำหนดความกว้างคอลัมน์ตาม format - เพิ่มคอลัมน์ราคา
function getColumnWidths(format: 'summary' | 'detailed' | 'requisition'): XLSX.ColInfo[] {
  // ✅ UPDATED: ใบเบิก Format - เพิ่มคอลัมน์ราคา
  if (format === 'requisition') {
    return [
      { wch: 15 }, // รหัส
      { wch: 30 }, // ชื่อยา
      { wch: 12 }, // รูปแบบ
      { wch: 15 }, // ความแรง
      { wch: 15 }, // ขนาดบรรจุ
      { wch: 12 }, // ราคาต่อกล่อง
      { wch: 14 }, // ราคาต่อหน่วย
      { wch: 10 }, // ขั้นต่ำ
      { wch: 12 }, // คงเหลือ
      { wch: 12 }, // สถานะ
      { wch: 18 }, // อัปเดต
    ]
  }

  // Summary Format
  if (format === 'summary') {
    return [
      { wch: 15 }, // รหัสยา
      { wch: 30 }, // ชื่อยา
      { wch: 15 }, // ประเภท
      { wch: 12 }, // รูปแบบ
      { wch: 12 }, // คงเหลือ
      { wch: 10 }, // ขั้นต่ำ
      { wch: 12 }, // สถานะ
      { wch: 15 }, // มูลค่า
      { wch: 20 }, // อัปเดต
    ]
  }

  // Detailed Format
  return [
    { wch: 15 }, // รหัสยา
    { wch: 30 }, // ชื่อยา
    { wch: 25 }, // ชื่อสามัญ
    { wch: 15 }, // ประเภท
    { wch: 12 }, // รูปแบบ
    { wch: 15 }, // ความแรง
    { wch: 15 }, // ขนาดบรรจุ
    { wch: 10 }, // รวม
    { wch: 10 }, // จอง
    { wch: 12 }, // คงเหลือ
    { wch: 10 }, // ขั้นต่ำ
    { wch: 12 }, // สถานะ
    { wch: 12 }, // ราคา
    { wch: 15 }, // มูลค่า
    { wch: 20 }, // อัปเดต
  ]
}