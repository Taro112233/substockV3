// 📄 File: app/api/transactions/export/route.ts
// ✅ NEW: Transaction Export API Route

import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

interface TransactionData {
  id: string
  type: string
  quantity: number
  beforeQty: number
  afterQty: number
  beforeMinStock?: number | null
  afterMinStock?: number | null
  minStockChange?: number | null
  note: string | null
  reference: string | null
  batchNumber: string | null
  createdAt: string
  user: {
    firstName: string
    lastName: string
  }
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

interface TransactionExportRequest {
  currentView: TransactionData[]
  additionalTransactions: string[]
  format: 'summary' | 'detailed' | 'financial'
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

// Transaction Type Labels
function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'RECEIVE_EXTERNAL': 'รับจากภายนอก',
    'DISPENSE_EXTERNAL': 'จ่ายให้ผู้ป่วย',
    'TRANSFER_IN': 'รับโอนจากแผนกอื่น',
    'TRANSFER_OUT': 'ส่งโอนให้แผนกอื่น',
    'ADJUST_INCREASE': 'ปรับเพิ่มสต็อก',
    'ADJUST_DECREASE': 'ปรับลดสต็อก',
    'RESERVE': 'จองยา',
    'UNRESERVE': 'ยกเลิกจอง',
    'MIN_STOCK_INCREASE': 'ปรับเพิ่มขั้นต่ำ',
    'MIN_STOCK_DECREASE': 'ปรับลดขั้นต่ำ',
    'MIN_STOCK_RESET': 'กำหนดจำนวนขั้นต่ำใหม่',
    'DATA_UPDATE': 'อัปเดตข้อมูล',
    'PRICE_UPDATE': 'อัปเดตราคา',
    'INFO_CORRECTION': 'แก้ไขข้อมูล'
  }
  return labels[type] || type
}

// Category Labels
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
    'ALERT': 'ยาแจ้งเตือน',
    'CANCELLED': 'ยกเลิกการใช้'
  }
  
  return labels[category] || category
}

// Calculate transaction cost
function calculateTransactionCost(transaction: TransactionData): number {
  const price = transaction.drug?.pricePerBox || 0
  const absQuantity = Math.abs(transaction.quantity)
  return price * absQuantity
}

// Format transaction amount
function formatTransactionAmount(type: string, quantity: number): {
  value: number
  formatted: string
  className: string
} {
  const isIncoming = [
    'RECEIVE_EXTERNAL', 'ADJUST_INCREASE', 'TRANSFER_IN', 'UNRESERVE'
  ].includes(type)
  
  const isOutgoing = [
    'DISPENSE_EXTERNAL', 'ADJUST_DECREASE', 'TRANSFER_OUT', 'RESERVE'
  ].includes(type)

  if (isIncoming) {
    return {
      value: Math.abs(quantity),
      formatted: `+${Math.abs(quantity).toLocaleString()}`,
      className: 'text-green-600'
    }
  } else if (isOutgoing) {
    return {
      value: Math.abs(quantity),
      formatted: `-${Math.abs(quantity).toLocaleString()}`,
      className: 'text-red-600'
    }
  } else {
    return {
      value: quantity,
      formatted: quantity.toLocaleString(),
      className: 'text-gray-600'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Transaction Export API called')

    const body: TransactionExportRequest = await request.json()
    console.log('📋 Export request:', {
      format: body.format,
      department: body.department,
      totalSelected: body.stats.totalSelected,
      currentViewCount: body.stats.currentViewCount
    })

    // รวบรวมข้อมูลสำหรับ Export
    const exportTransactions = collectExportData(body)
    
    if (exportTransactions.length === 0) {
      console.log('❌ No data to export')
      return NextResponse.json(
        { success: false, error: 'No data to export' },
        { status: 400 }
      )
    }

    console.log(`📦 Processing ${exportTransactions.length} transactions for export`)

    // สร้าง Excel Workbook
    const workbook = createExcelWorkbook(exportTransactions, body)
    
    // Convert เป็น Buffer
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true 
    })

    // สร้างชื่อไฟล์
    const departmentName = body.department === 'PHARMACY' ? 'คลังยา' : 'OPD'
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const formatName = body.format === 'financial' ? 'การเงิน' : 
                      body.format === 'detailed' ? 'รายละเอียด' : 'สรุป'
    const filename = `ประวัติการเคลื่อนไหว_${departmentName}_${formatName}_${timestamp}.xlsx`

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
    console.error('❌ Transaction Export error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Export failed' 
      },
      { status: 500 }
    )
  }
}

// รวบรวมข้อมูล Transaction สำหรับ Export
function collectExportData(body: TransactionExportRequest): TransactionData[] {
  const allTransactions: TransactionData[] = []

  // เพิ่มข้อมูลจาก Current View
  if (body.currentView && body.currentView.length > 0) {
    console.log(`📋 Adding ${body.currentView.length} transactions from current view`)
    allTransactions.push(...body.currentView)
  }

  console.log(`📊 Total transactions for export: ${allTransactions.length}`)
  return allTransactions
}

// สร้าง Excel Workbook
function createExcelWorkbook(transactions: TransactionData[], config: TransactionExportRequest): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()

  // สร้าง Main Sheet
  const mainData = transactions.map(transaction => createTransactionExportRow(transaction, config))
  const mainSheet = XLSX.utils.json_to_sheet(mainData)
  
  // จัดรูปแบบ Column Width
  const columnWidths = getTransactionColumnWidths(config.format)
  mainSheet['!cols'] = columnWidths

  // เพิ่ม Sheet ลงใน Workbook
  const departmentName = config.department === 'PHARMACY' ? 'คลังยา' : 'OPD'
  const formatName = config.format === 'financial' ? 'การเงิน' : 
                    config.format === 'detailed' ? 'รายละเอียด' : 'สรุป'
  XLSX.utils.book_append_sheet(workbook, mainSheet, `ประวัติ_${departmentName}_${formatName}`)

  // สร้าง Summary Sheet (ถ้าเป็น financial หรือ detailed format)
  if (config.format === 'financial' || config.format === 'detailed') {
    const summaryData = createTransactionSummaryData(transactions, config)
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุป')
  }

  return workbook
}

// สร้างแถวข้อมูลสำหรับ Transaction Export
function createTransactionExportRow(transaction: TransactionData, config: TransactionExportRequest): ExportRow {
  const transactionCost = calculateTransactionCost(transaction)
  const amountData = formatTransactionAmount(transaction.type, transaction.quantity)
  const typeLabel = getTransactionTypeLabel(transaction.type)
  const categoryLabel = getCategoryLabelLocal(transaction.drug?.category)

  // Summary Format
  if (config.format === 'summary') {
    return {
      'วันที่': new Date(transaction.createdAt).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      'เวลา': new Date(transaction.createdAt).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      'รหัสยา': transaction.drug?.hospitalDrugCode || '-',
      'ชื่อยา': transaction.drug?.name || '-',
      'ประเภท': typeLabel,
      'จำนวน': amountData.formatted,
      'มูลค่า': transactionCost > 0 ? `฿${transactionCost.toLocaleString()}` : '-',
      'ผู้ดำเนินการ': `${transaction.user.firstName} ${transaction.user.lastName}`
    }
  }

  // Financial Format
  if (config.format === 'financial') {
    const isIncoming = ['RECEIVE_EXTERNAL', 'ADJUST_INCREASE', 'TRANSFER_IN', 'UNRESERVE'].includes(transaction.type)
    const isOutgoing = ['DISPENSE_EXTERNAL', 'ADJUST_DECREASE', 'TRANSFER_OUT', 'RESERVE'].includes(transaction.type)
    
    return {
      'วันที่': new Date(transaction.createdAt).toLocaleDateString('th-TH'),
      'เวลา': new Date(transaction.createdAt).toLocaleTimeString('th-TH'),
      'รหัสยา': transaction.drug?.hospitalDrugCode || '-',
      'ชื่อยา': transaction.drug?.name || '-',
      'ประเภทยา': categoryLabel,
      'ประเภทธุรกรรม': typeLabel,
      'จำนวน': Math.abs(transaction.quantity),
      'ราคาต่อหน่วย': transaction.drug?.pricePerBox || 0,
      'เงินเข้า': isIncoming ? transactionCost : 0,
      'เงินออก': isOutgoing ? transactionCost : 0,
      'มูลค่าสุทธิ': isIncoming ? transactionCost : (isOutgoing ? -transactionCost : 0),
      'สต็อกก่อน': transaction.beforeQty || 0,
      'สต็อกหลัง': transaction.afterQty || 0,
      'หมายเหตุ': transaction.note || '',
      'อ้างอิง': transaction.reference || '',
      'ผู้ดำเนินการ': `${transaction.user.firstName} ${transaction.user.lastName}`,
      'แผนก': config.department === 'PHARMACY' ? 'คลังยา' : 'OPD'
    }
  }

  // Detailed Format (default)
  return {
    'วันที่': new Date(transaction.createdAt).toLocaleDateString('th-TH'),
    'เวลา': new Date(transaction.createdAt).toLocaleTimeString('th-TH'),
    'รหัสยา': transaction.drug?.hospitalDrugCode || '-',
    'ชื่อยา': transaction.drug?.name || '-',
    'ชื่อสามัญ': transaction.drug?.genericName || '-',
    'ประเภทยา': categoryLabel,
    'รูปแบบ': transaction.drug?.dosageForm || '-',
    'ความแรง': transaction.drug?.strength && transaction.drug?.unit 
      ? `${transaction.drug.strength} ${transaction.drug.unit}` 
      : (transaction.drug?.strength || '-'),
    'ขนาดบรรจุ': transaction.drug?.packageSize ? `1 x ${transaction.drug.packageSize}'s` : '-',
    'ประเภทธุรกรรม': typeLabel,
    'จำนวน': transaction.quantity,
    'จำนวนสุทธิ': amountData.formatted,
    'สต็อกก่อน': transaction.beforeQty || 0,
    'สต็อกหลัง': transaction.afterQty || 0,
    'ขั้นต่ำก่อน': transaction.beforeMinStock ?? '-',
    'ขั้นต่ำหลัง': transaction.afterMinStock ?? '-',
    'ราคาต่อหน่วย': transaction.drug?.pricePerBox || 0,
    'มูลค่ารวม': transactionCost,
    'แบทช์': transaction.batchNumber || '-',
    'หมายเหตุ': transaction.note || '',
    'อ้างอิง': transaction.reference || '',
    'ผู้ดำเนินการ': `${transaction.user.firstName} ${transaction.user.lastName}`,
    'แผนก': config.department === 'PHARMACY' ? 'คลังยา' : 'OPD'
  }
}

// สร้างข้อมูลสรุปสำหรับ Transaction
function createTransactionSummaryData(transactions: TransactionData[], config: TransactionExportRequest): ExportRow[] {
  const totalTransactions = transactions.length
  const totalValue = transactions.reduce((sum, t) => sum + calculateTransactionCost(t), 0)
  
  // แยกประเภทธุรกรรม
  const incomingTransactions = transactions.filter(t => 
    ['RECEIVE_EXTERNAL', 'ADJUST_INCREASE', 'TRANSFER_IN', 'UNRESERVE'].includes(t.type)
  )
  const outgoingTransactions = transactions.filter(t => 
    ['DISPENSE_EXTERNAL', 'ADJUST_DECREASE', 'TRANSFER_OUT', 'RESERVE'].includes(t.type)
  )
  
  const incomingValue = incomingTransactions.reduce((sum, t) => sum + calculateTransactionCost(t), 0)
  const outgoingValue = outgoingTransactions.reduce((sum, t) => sum + calculateTransactionCost(t), 0)
  
  // สรุปตามประเภทธุรกรรม
  const typeStats = transactions.reduce((acc, transaction) => {
    const type = transaction.type
    if (!acc[type]) {
      acc[type] = { count: 0, value: 0 }
    }
    acc[type].count++
    acc[type].value += calculateTransactionCost(transaction)
    return acc
  }, {} as Record<string, { count: number, value: number }>)

  const summaryData: ExportRow[] = [
    {
      'รายการ': 'สรุปรวม',
      'จำนวนธุรกรรม': totalTransactions,
      'มูลค่ารวม': totalValue.toFixed(2),
      'ธุรกรรมเข้า': incomingTransactions.length,
      'มูลค่าเข้า': incomingValue.toFixed(2),
      'ธุรกรรมออก': outgoingTransactions.length,
      'มูลค่าออก': outgoingValue.toFixed(2),
      'สุทธิ': (incomingValue - outgoingValue).toFixed(2),
      'แผนก': config.department === 'PHARMACY' ? 'คลังยา' : 'OPD',
      'วันที่ Export': new Date().toLocaleString('th-TH')
    },
    {}, // Empty row
    {
      'รายการ': 'สรุปตามประเภทธุรกรรม',
      'จำนวนธุรกรรม': '',
      'มูลค่ารวม': '',
      'ธุรกรรมเข้า': '',
      'มูลค่าเข้า': '',
      'ธุรกรรมออก': '',
      'มูลค่าออก': '',
      'สุทธิ': '',
      'แผนก': '',
      'วันที่ Export': ''
    },
    ...Object.entries(typeStats).map(([type, data]) => ({
      'รายการ': getTransactionTypeLabel(type),
      'จำนวนธุรกรรม': data.count,
      'มูลค่ารวม': data.value.toFixed(2),
      'ธุรกรรมเข้า': '',
      'มูลค่าเข้า': '',
      'ธุรกรรมออก': '',
      'มูลค่าออก': '',
      'สุทธิ': '',
      'แผนก': '',
      'วันที่ Export': ''
    }))
  ]

  return summaryData
}

// กำหนดความกว้างคอลัมน์ตาม format
function getTransactionColumnWidths(format: 'summary' | 'detailed' | 'financial'): XLSX.ColInfo[] {
  // Summary Format
  if (format === 'summary') {
    return [
      { wch: 12 }, // วันที่
      { wch: 8 },  // เวลา
      { wch: 15 }, // รหัสยา
      { wch: 30 }, // ชื่อยา
      { wch: 20 }, // ประเภท
      { wch: 12 }, // จำนวน
      { wch: 15 }, // มูลค่า
      { wch: 20 }, // ผู้ดำเนินการ
    ]
  }

  // Financial Format
  if (format === 'financial') {
    return [
      { wch: 12 }, // วันที่
      { wch: 8 },  // เวลา
      { wch: 15 }, // รหัสยา
      { wch: 25 }, // ชื่อยา
      { wch: 15 }, // ประเภทยา
      { wch: 20 }, // ประเภทธุรกรรม
      { wch: 10 }, // จำนวน
      { wch: 12 }, // ราคาต่อหน่วย
      { wch: 12 }, // เงินเข้า
      { wch: 12 }, // เงินออก
      { wch: 12 }, // มูลค่าสุทธิ
      { wch: 10 }, // สต็อกก่อน
      { wch: 10 }, // สต็อกหลัง
      { wch: 25 }, // หมายเหตุ
      { wch: 15 }, // อ้างอิง
      { wch: 20 }, // ผู้ดำเนินการ
      { wch: 10 }, // แผนก
    ]
  }

  // Detailed Format (default)
  return [
    { wch: 12 }, // วันที่
    { wch: 8 },  // เวลา
    { wch: 15 }, // รหัสยา
    { wch: 25 }, // ชื่อยา
    { wch: 20 }, // ชื่อสามัญ
    { wch: 15 }, // ประเภทยา
    { wch: 12 }, // รูปแบบ
    { wch: 15 }, // ความแรง
    { wch: 15 }, // ขนาดบรรจุ
    { wch: 20 }, // ประเภทธุรกรรม
    { wch: 10 }, // จำนวน
    { wch: 12 }, // จำนวนสุทธิ
    { wch: 10 }, // สต็อกก่อน
    { wch: 10 }, // สต็อกหลัง
    { wch: 10 }, // ขั้นต่ำก่อน
    { wch: 10 }, // ขั้นต่ำหลัง
    { wch: 12 }, // ราคาต่อหน่วย
    { wch: 12 }, // มูลค่ารวม
    { wch: 15 }, // แบทช์
    { wch: 25 }, // หมายเหตุ
    { wch: 15 }, // อ้างอิง
    { wch: 20 }, // ผู้ดำเนินการ
    { wch: 10 }, // แผนก
  ]
}