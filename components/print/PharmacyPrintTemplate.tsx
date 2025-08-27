// components/print/PharmacyPrintTemplate.tsx
import React from 'react'
import { StockPrintData, PrintFormat, Department } from '@/types/print'

interface PharmacyPrintTemplateProps {
  stocks: StockPrintData[]
  format: PrintFormat
  department: Department
  title?: string
  includeDate?: boolean
  includeSignature?: boolean
}

export function PharmacyPrintTemplate({ 
  stocks, 
  format, 
  department, 
  title,
  includeDate = true,
  includeSignature = true 
}: PharmacyPrintTemplateProps) {
  const today = new Date()
  const thaiDate = today.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const departmentName = department === 'PHARMACY' ? 'คลังยา' : 'OPD'
  
  const getDocumentTitle = () => {
    if (title) return title
    
    switch (format) {
      case 'requisition-form': return `ใบเบิกยา - ${departmentName}`
      case 'stock-summary': return `สรุปสต็อกยา - ${departmentName}`
      case 'low-stock-report': return `รายงานยาใกล้หมด - ${departmentName}`
      case 'inventory-check': return `ใบตรวจนับสต็อก - ${departmentName}`
      default: return `รายงานยา - ${departmentName}`
    }
  }

  const getTotalValue = () => {
    return stocks.reduce((sum, stock) => {
      return sum + (stock.totalQuantity * (stock.cost || 0))
    }, 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  return (
    <div className="print-template bg-white p-8 min-h-screen font-thai text-sm">
      {/* Header */}
      <div className="header mb-8 text-center border-b-2 border-black pb-6">
        <h1 className="text-2xl font-bold mb-2">โรงพยาบาล [ชื่อโรงพยาบาล]</h1>
        <h2 className="text-xl font-semibold mb-4">{getDocumentTitle()}</h2>
        {includeDate && (
          <div className="text-base">
            <p>วันที่พิมพ์: {thaiDate}</p>
            <p>เวลา: {today.toLocaleTimeString('th-TH')}</p>
          </div>
        )}
      </div>

      {/* Document Info */}
      <div className="doc-info mb-6 grid grid-cols-2 gap-4 text-base">
        <div>
          <p><strong>แผนก:</strong> {departmentName}</p>
          <p><strong>จำนวนรายการ:</strong> {stocks.length.toLocaleString()}</p>
        </div>
        <div>
          <p><strong>เอกสารเลขที่:</strong> DOC-{today.getFullYear()}-{String(today.getMonth() + 1).padStart(2, '0')}-{String(today.getDate()).padStart(2, '0')}</p>
          {format === 'stock-summary' && (
            <p><strong>มูลค่ารวม:</strong> {getTotalValue()} บาท</p>
          )}
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse border-2 border-black mb-8">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-3 text-center w-12">ลำดับ</th>
            <th className="border border-black p-3 text-left w-24">รหัสยา</th>
            <th className="border border-black p-3 text-left">ชื่อยา</th>
            <th className="border border-black p-3 text-left w-32">รูปแบบ</th>
            <th className="border border-black p-3 text-center w-20">ความแรง</th>
            <th className="border border-black p-3 text-center w-16">หน่วย</th>
            <th className="border border-black p-3 text-center w-20">บรรจุ</th>
            
            {format === 'requisition-form' && (
              <>
                <th className="border border-black p-3 text-center w-20">คงเหลือ</th>
                <th className="border border-black p-3 text-center w-20">ขั้นต่ำ</th>
                <th className="border border-black p-3 text-center w-24">ต้องการเบิก</th>
                <th className="border border-black p-3 text-center w-20">ได้รับจริง</th>
              </>
            )}
            
            {format === 'stock-summary' && (
              <>
                <th className="border border-black p-3 text-center w-20">คงเหลือ</th>
                <th className="border border-black p-3 text-center w-24">ราคา/หน่วย</th>
                <th className="border border-black p-3 text-center w-24">มูลค่า</th>
                <th className="border border-black p-3 text-center w-28">อัปเดตล่าสุด</th>
              </>
            )}
            
            {format === 'low-stock-report' && (
              <>
                <th className="border border-black p-3 text-center w-20">คงเหลือ</th>
                <th className="border border-black p-3 text-center w-20">ขั้นต่ำ</th>
                <th className="border border-black p-3 text-center w-20">ขาด</th>
                <th className="border border-black p-3 text-center w-32">ระดับความรุนแรง</th>
              </>
            )}
            
            {format === 'inventory-check' && (
              <>
                <th className="border border-black p-3 text-center w-20">ระบบแสดง</th>
                <th className="border border-black p-3 text-center w-20">นับจริง</th>
                <th className="border border-black p-3 text-center w-20">ต่าง</th>
                <th className="border border-black p-3 text-center w-32">หมายเหตุ</th>
              </>
            )}
          </tr>
        </thead>
        
        <tbody>
          {stocks.map((stock, index) => {
            const shortage = Math.max(0, stock.minimumStock - stock.totalQuantity)
            const severityLevel = shortage > stock.minimumStock * 0.5 ? 'วิกฤติ' : 
                                shortage > 0 ? 'ต่ำ' : 'ปกติ'
            
            return (
              <tr key={stock.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-black p-3 text-center font-medium">
                  {index + 1}
                </td>
                <td className="border border-black p-3 font-mono text-sm">
                  {stock.drug.hospitalDrugCode}
                </td>
                <td className="border border-black p-3">
                  <div className="font-semibold">{stock.drug.name}</div>
                  {stock.drug.genericName && (
                    <div className="text-xs text-gray-600 mt-1">
                      ({stock.drug.genericName})
                    </div>
                  )}
                </td>
                <td className="border border-black p-3 text-sm">
                  {stock.drug.dosageForm || '-'}
                </td>
                <td className="border border-black p-3 text-center text-sm">
                  {stock.drug.strength || '-'}
                </td>
                <td className="border border-black p-3 text-center text-sm">
                  {stock.drug.unit || '-'}
                </td>
                <td className="border border-black p-3 text-center">
                  {stock.drug.packageSize ? `${stock.drug.packageSize}'s` : '-'}
                </td>
                
                {format === 'requisition-form' && (
                  <>
                    <td className="border border-black p-3 text-center font-semibold">
                      {stock.totalQuantity.toLocaleString()}
                    </td>
                    <td className="border border-black p-3 text-center text-red-600 font-medium">
                      {stock.minimumStock.toLocaleString()}
                    </td>
                    <td className="border border-black p-3 text-center bg-yellow-50">
                      _____________
                    </td>
                    <td className="border border-black p-3 text-center bg-green-50">
                      _____________
                    </td>
                  </>
                )}
                
                {format === 'stock-summary' && (
                  <>
                    <td className="border border-black p-3 text-center font-semibold">
                      {stock.totalQuantity.toLocaleString()}
                    </td>
                    <td className="border border-black p-3 text-right">
                      {stock.cost ? stock.cost.toLocaleString('th-TH', {
                        minimumFractionDigits: 2
                      }) : '-'}
                    </td>
                    <td className="border border-black p-3 text-right font-medium">
                      {stock.cost ? (stock.totalQuantity * stock.cost).toLocaleString('th-TH', {
                        minimumFractionDigits: 2
                      }) : '-'}
                    </td>
                    <td className="border border-black p-3 text-center text-sm">
                      {stock.lastUpdated 
                        ? stock.lastUpdated.toLocaleDateString('th-TH')
                        : '-'
                      }
                    </td>
                  </>
                )}
                
                {format === 'low-stock-report' && (
                  <>
                    <td className="border border-black p-3 text-center font-semibold text-red-600">
                      {stock.totalQuantity.toLocaleString()}
                    </td>
                    <td className="border border-black p-3 text-center">
                      {stock.minimumStock.toLocaleString()}
                    </td>
                    <td className="border border-black p-3 text-center font-bold text-red-700">
                      {shortage.toLocaleString()}
                    </td>
                    <td className="border border-black p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        severityLevel === 'วิกฤติ' ? 'bg-red-100 text-red-800' :
                        severityLevel === 'ต่ำ' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {severityLevel}
                      </span>
                    </td>
                  </>
                )}
                
                {format === 'inventory-check' && (
                  <>
                    <td className="border border-black p-3 text-center font-semibold">
                      {stock.totalQuantity.toLocaleString()}
                    </td>
                    <td className="border border-black p-3 text-center bg-blue-50">
                      _____________
                    </td>
                    <td className="border border-black p-3 text-center bg-yellow-50">
                      _____________
                    </td>
                    <td className="border border-black p-3 bg-gray-50">
                      _________________________
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
        
        {/* Summary Row */}
        {format === 'stock-summary' && (
          <tfoot>
            <tr className="bg-gray-200 font-bold">
              <td colSpan={8} className="border border-black p-3 text-right">
                <strong>รวมทั้งสิ้น:</strong>
              </td>
              <td className="border border-black p-3 text-center">
                {stocks.length.toLocaleString()} รายการ
              </td>
              <td className="border border-black p-3 text-right">
                <strong>{getTotalValue()} บาท</strong>
              </td>
              <td className="border border-black p-3"></td>
            </tr>
          </tfoot>
        )}
      </table>

      {/* Signature Section */}
      {includeSignature && (
        <div className="signatures mt-12 grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="border-b border-black mb-2 pb-8"></div>
            <p className="font-semibold">ผู้จัดทำ</p>
            <p className="text-sm text-gray-600 mt-1">
              วันที่: _______________
            </p>
          </div>
          
          <div className="text-center">
            <div className="border-b border-black mb-2 pb-8"></div>
            <p className="font-semibold">หัวหน้าแผนก{departmentName}</p>
            <p className="text-sm text-gray-600 mt-1">
              วันที่: _______________
            </p>
          </div>
          
          <div className="text-center">
            <div className="border-b border-black mb-2 pb-8"></div>
            <p className="font-semibold">หัวหน้าเภสัชกรรม</p>
            <p className="text-sm text-gray-600 mt-1">
              วันที่: _______________
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="footer mt-8 text-xs text-gray-500 text-center border-t pt-4">
        <p>พิมพ์จากระบบ Hospital Pharmacy Stock Management System V3.0</p>
        <p>เอกสารนี้พิมพ์โดย: [ชื่อผู้ใช้] | IP: [IP Address] | วันเวลา: {today.toLocaleString('th-TH')}</p>
      </div>
    </div>
  )
}