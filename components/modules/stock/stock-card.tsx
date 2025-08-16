// 📄 File: components/modules/stock/stock-card.tsx

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, MoreVertical } from 'lucide-react'

interface StockCardProps {
  stock: {
    id: string
    totalQuantity: number
    reservedQty: number
    minimumStock: number
    totalValue: number
    drug: {
      hospitalDrugCode: string
      name: string
      genericName?: string
      dosageForm: string
      strength?: string
      unit: string
      category: string
    }
  }
  onAdjust?: (stockId: string) => void
  onViewDetail?: (stockId: string) => void
}

export function StockCard({ stock, onAdjust, onViewDetail }: StockCardProps) {
  const isLowStock = stock.totalQuantity <= stock.minimumStock
  const available = stock.totalQuantity - stock.reservedQty

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

  return (
    <Card className={`transition-all hover:shadow-md cursor-pointer ${isLowStock ? 'border-red-200 bg-red-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {stock.drug.hospitalDrugCode}
              </Badge>
              {isLowStock && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  สต็อกต่ำ
                </Badge>
              )}
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
            <div className="text-xs text-gray-500">พร้อมจ่าย / รวม</div>
            {stock.reservedQty > 0 && (
              <div className="text-xs text-orange-600">จอง: {stock.reservedQty}</div>
            )}
            <div className="text-xs text-gray-500">Min: {stock.minimumStock}</div>
            <div className="text-sm font-medium text-green-600">
              ₿{stock.totalValue.toLocaleString()}
            </div>
          </div>
          
          <div className="flex flex-col space-y-1">
            {onAdjust && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onAdjust(stock.id)}
                className="text-xs"
              >
                ปรับสต็อก
              </Button>
            )}
            {onViewDetail && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onViewDetail(stock.id)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}