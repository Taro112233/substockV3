// 📄 File: components/modules/transfer/transfer-items-table.tsx

'use client'

import type { TransferDetails } from '@/types/transfer'

interface TransferItemsTableProps {
  items: TransferDetails['items']
  showColumns?: ('requested' | 'approved' | 'dispensed' | 'received' | 'batch' | 'pricing')[]
  showDeliveryFormat?: boolean
}

export function TransferItemsTable({ 
  items, 
  showColumns = ['requested', 'dispensed'],
  showDeliveryFormat = false 
}: TransferItemsTableProps) {
  
  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('th-TH')
  }

  const getTotalValue = () => {
    return items.reduce((sum, item) => sum + (item.totalValue || 0), 0)
  }

  if (showDeliveryFormat) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-medium">รหัสเวชภัณฑ์</th>
              <th className="text-left p-3 font-medium">ชื่อเวชภัณฑ์</th>
              <th className="text-right p-3 font-medium">จำนวนจ่าย</th>
              <th className="text-right p-3 font-medium">ราคา</th>
              <th className="text-right p-3 font-medium">มูลค่า</th>
              <th className="text-left p-3 font-medium">Exp</th>
              <th className="text-left p-3 font-medium">บริษัท</th>
              <th className="text-left p-3 font-medium">LotNo</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-xs">
                  {item.drug.hospitalDrugCode}
                </td>
                <td className="p-3">
                  <div className="font-medium">
                    {item.drug.name} {item.drug.dosageForm} {item.drug.strength}
                  </div>
                </td>
                <td className="p-3 text-right font-medium">
                  {item.dispensedQty ? 
                    `${item.dispensedQty.toLocaleString()}${item.drug.packageSize ? `x${item.drug.packageSize}` : ''}` : 
                    '-'
                  }
                </td>
                <td className="p-3 text-right">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="p-3 text-right font-medium">
                  {formatCurrency(item.totalValue)}
                </td>
                <td className="p-3">
                  {formatDate(item.expiryDate)}
                </td>
                <td className="p-3">{item.manufacturer || '-'}</td>
                <td className="p-3 font-mono text-xs">{item.lotNumber || '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 bg-gray-50">
              <td colSpan="4" className="p-3 text-right font-medium">
                มูลค่ารวม:
              </td>
              <td className="p-3 text-right font-bold text-lg">
                {formatCurrency(getTotalValue())}
              </td>
              <td colSpan="3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-3 font-medium">ลำดับ</th>
            <th className="text-left p-3 font-medium">รหัสยา</th>
            <th className="text-left p-3 font-medium">รายการ</th>
            <th className="text-left p-3 font-medium">รูปแบบ</th>
            <th className="text-left p-3 font-medium">ความแรง</th>
            <th className="text-left p-3 font-medium">ขนาด</th>
            {showColumns.includes('requested') && (
              <th className="text-right p-3 font-medium">จำนวนเบิก</th>
            )}
            {showColumns.includes('approved') && (
              <th className="text-right p-3 font-medium">จำนวนอนุมัติ</th>
            )}
            {showColumns.includes('dispensed') && (
              <th className="text-right p-3 font-medium">จำนวนจ่าย</th>
            )}
            {showColumns.includes('received') && (
              <th className="text-right p-3 font-medium">จำนวนรับ</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{index + 1}</td>
              <td className="p-3 font-mono text-xs">
                {item.drug.hospitalDrugCode}
              </td>
              <td className="p-3">
                <div>
                  <div className="font-medium">{item.drug.name}</div>
                  {item.drug.genericName && (
                    <div className="text-gray-500 text-xs">{item.drug.genericName}</div>
                  )}
                </div>
              </td>
              <td className="p-3">{item.drug.dosageForm}</td>
              <td className="p-3">{item.drug.strength || '-'}</td>
              <td className="p-3">{item.drug.packageSize || '-'}</td>
              {showColumns.includes('requested') && (
                <td className="p-3 text-right font-medium">
                  {item.requestedQty.toLocaleString()} {item.drug.unit}
                </td>
              )}
              {showColumns.includes('approved') && (
                <td className="p-3 text-right font-medium">
                  {item.approvedQty ? 
                    `${item.approvedQty.toLocaleString()} ${item.drug.unit}` : 
                    '-'
                  }
                </td>
              )}
              {showColumns.includes('dispensed') && (
                <td className="p-3 text-right font-medium">
                  {item.dispensedQty ? 
                    `${item.dispensedQty.toLocaleString()} ${item.drug.unit}` : 
                    '-'
                  }
                </td>
              )}
              {showColumns.includes('received') && (
                <td className="p-3 text-right font-medium">
                  {item.receivedQty ? 
                    `${item.receivedQty.toLocaleString()} ${item.drug.unit}` : 
                    '-'
                  }
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}