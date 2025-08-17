// 📄 File: components/modules/stock/stock-card.tsx

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Stock } from '@/types/dashboard'
import { 
  calculateAvailableStock, 
  isLowStock, 
  getStockStatusColor,
  formatCurrency 
} from '@/lib/utils/dashboard'
import { AlertTriangle } from 'lucide-react'

interface StockCardProps {
  stock: Stock
  department: 'PHARMACY' | 'OPD'
  onAdjust?: (stockId: string) => void
  onViewDetail?: (stockId: string) => void
}

export function StockCard({ stock, department, onAdjust, onViewDetail }: StockCardProps) {
  const available = calculateAvailableStock(stock)
  const lowStock = isLowStock(stock)
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'HIGH_ALERT': return 'destructive'
      case 'NARCOTIC': return 'destructive'
      case 'REFER': return 'secondary'
      case 'REFRIGERATED': return 'default'
      case 'PSYCHIATRIC': return 'default'
      case 'FLUID': return 'default'
      default: return 'outline'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'HIGH_ALERT': return 'High Alert'
      case 'NARCOTIC': return 'ยาเสพติด'
      case 'REFER': return 'ยา Refer'
      case 'REFRIGERATED': return 'แช่เย็น'
      case 'PSYCHIATRIC': return 'จิตเวช'
      case 'FLUID': return 'สารน้ำ'
      case 'GENERAL': return 'ทั่วไป'
      default: return category
    }
  }

  const departmentBadgeConfig = {
    PHARMACY: { className: 'bg-blue-100 text-blue-800', label: 'Pharmacy Stock' },
    OPD: { className: 'bg-green-100 text-green-800', label: 'OPD Stock' }
  }

  const lowStockAction = {
    PHARMACY: { label: 'เติมสต็อก', color: 'bg-orange-600 hover:bg-orange-700' },
    OPD: { label: 'เบิกเพิ่ม', color: 'bg-orange-600 hover:bg-orange-700' }
  }

  const deptBadge = departmentBadgeConfig[department]
  const action = lowStockAction[department]

  return (
    <Card className={`transition-all hover:shadow-md cursor-pointer ${getStockStatusColor(stock)}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {stock.drug.hospitalDrugCode}
              </Badge>
              
              {lowStock && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {department === 'PHARMACY' ? 'สต็อกต่ำ' : 'ต้องเบิกเพิ่ม'}
                </Badge>
              )}
              
              <Badge variant="secondary" className={`text-xs ${deptBadge.className}`}>
                {deptBadge.label}
              </Badge>
              
              <Badge variant={getCategoryColor(stock.drug.category)} className="text-xs">
                {getCategoryLabel(stock.drug.category)}
              </Badge>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-1">{stock.drug.name}</h3>
            {stock.drug.genericName && (
              <p className="text-sm text-gray-600 mb-1">{stock.drug.genericName}</p>
            )}
            <p className="text-sm text-gray-500">
              {stock.drug.strength && `${stock.drug.strength} • `}
              {stock.drug.dosageForm} • {stock.drug.unit}
            </p>
          </div>
          
          <div className="text-right space-y-1 mx-4">
            <div className="text-lg font-bold text-gray-900">
              {available} / {stock.totalQuantity}
            </div>
            <div className="text-xs text-gray-500">
              ใช้งานได้ / ทั้งหมด
            </div>
            {stock.reservedQty > 0 && (
              <div className="text-xs text-orange-600">
                จอง: {stock.reservedQty}
              </div>
            )}
          </div>
          
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(stock.totalValue)}
            </p>
            <p className="text-xs text-gray-500">มูลค่า</p>
            {lowStock && (
              <Button 
                size="sm" 
                className={`mt-2 ${action.color}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onAdjust?.(stock.id)
                }}
              >
                {action.label}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}