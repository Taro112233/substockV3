// 📄 File: components/modules/stock/stock-card.tsx

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Stock } from '@/types/dashboard'
import {
  calculateAvailableStock,
  isLowStock,
  getStockStatusColor,
  formatCurrency,
  getCategoryColor,
  getCategoryLabel
} from '@/lib/utils/dashboard'
import { Package, AlertTriangle, Edit, Eye, TrendingDown, TrendingUp } from 'lucide-react'

interface StockCardProps {
  stock: Stock
  department: 'PHARMACY' | 'OPD'
  onAdjust?: (stock: Stock) => void
  onView?: (stock: Stock) => void
}

export function StockCard({ 
  stock, 
  department, 
  onAdjust, 
  onView 
}: StockCardProps) {
  const availableStock = calculateAvailableStock(stock)
  const lowStock = isLowStock(stock)
  const stockPercentage = (stock.totalQuantity / (stock.minimumStock * 2)) * 100

  const handleAdjust = () => {
    if (onAdjust) {
      onAdjust(stock)
    } else {
      // Default action
      console.log('Adjust stock for:', stock.drug.name)
    }
  }

  const handleView = () => {
    if (onView) {
      onView(stock)
    } else {
      // Default action
      console.log('View stock details for:', stock.drug.name)
    }
  }

  return (
    <Card className={`hover:shadow-md transition-shadow duration-200 ${
      lowStock ? 'border-orange-200 bg-orange-50/50' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            {/* Drug Code */}
            <div className="font-mono text-xs text-gray-500">
              {stock.drug.hospitalDrugCode}
            </div>
            
            {/* Drug Name */}
            <h3 className="font-semibold text-sm leading-tight">
              {stock.drug.name}
            </h3>
            
            {/* Generic Name & Strength */}
            {(stock.drug.genericName || stock.drug.strength) && (
              <div className="text-xs text-gray-600 space-y-1">
                {stock.drug.genericName && (
                  <div>ชื่อสามัญ: {stock.drug.genericName}</div>
                )}
                {stock.drug.strength && (
                  <div>ความแรง: {stock.drug.strength}</div>
                )}
              </div>
            )}
          </div>

          {/* Category Badge */}
          <Badge 
            variant="secondary" 
            className={`text-xs ${getCategoryColor(stock.drug.category)}`}
          >
            {getCategoryLabel(stock.drug.category)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stock Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">สต็อกปัจจุบัน:</span>
            <div className="text-right">
              <span className={`font-bold text-lg ${
                lowStock ? 'text-orange-600' : 'text-gray-900'
              }`}>
                {stock.totalQuantity.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 ml-1">
                {stock.drug.unit}
              </span>
            </div>
          </div>

          {/* Stock Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                lowStock 
                  ? 'bg-orange-500' 
                  : stockPercentage > 75 
                    ? 'bg-green-500' 
                    : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
            />
          </div>

          {/* Stock Details */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <span>พร้อมใช้:</span>
              <span className="ml-1 font-medium">{availableStock.toLocaleString()}</span>
            </div>
            <div>
              <span>จองไว้:</span>
              <span className="ml-1 font-medium">{stock.reservedQty.toLocaleString()}</span>
            </div>
            <div>
              <span>ขั้นต่ำ:</span>
              <span className="ml-1 font-medium">{stock.minimumStock.toLocaleString()}</span>
            </div>
            <div>
              <span>มูลค่า:</span>
              <span className="ml-1 font-medium">{formatCurrency(stock.totalValue)}</span>
            </div>
          </div>
        </div>

        {/* Low Stock Warning */}
        {lowStock && (
          <div className="flex items-center gap-2 p-2 bg-orange-100 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <span className="text-xs text-orange-700">
              สต็อกต่ำกว่าขั้นต่ำ ควร{department === 'PHARMACY' ? 'สั่งซื้อ' : 'เบิก'}เพิ่ม
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="flex items-center gap-1 flex-1"
          >
            <Eye className="h-3 w-3" />
            ดูรายละเอียด
          </Button>

          <Button
            variant={lowStock ? "default" : "outline"}
            size="sm"
            onClick={handleAdjust}
            className="flex items-center gap-1 flex-1"
          >
            {lowStock ? (
              <>
                <TrendingUp className="h-3 w-3" />
                {department === 'PHARMACY' ? 'สั่งซื้อ' : 'เบิกเพิ่ม'}
              </>
            ) : (
              <>
                <Edit className="h-3 w-3" />
                ปรับสต็อก
              </>
            )}
          </Button>
        </div>

        {/* Last Updated */}
        {stock.lastUpdated && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            อัปเดตล่าสุด: {new Date(stock.lastUpdated).toLocaleDateString('th-TH')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}