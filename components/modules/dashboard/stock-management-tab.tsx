// 📄 File: components/modules/dashboard/stock-management-tab.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StockCard } from '@/components/modules/stock/stock-card'
import { Stock } from '@/types/dashboard'
import { isLowStock } from '@/lib/utils/dashboard'
import { AlertTriangle, Plus } from 'lucide-react'

interface StockManagementTabProps {
  stocks: Stock[]
  department: 'PHARMACY' | 'OPD'
  onStockAdjust?: (stockId: string) => void
  onStockDetail?: (stockId: string) => void
}

export function StockManagementTab({ 
  stocks, 
  department, 
  onStockAdjust, 
  onStockDetail 
}: StockManagementTabProps) {
  const lowStockItems = stocks.filter(isLowStock)
  
  const departmentConfig = {
    PHARMACY: {
      title: 'สต็อกยาคลัง',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      alertTitle: 'แจ้งเตือนสต็อกต่ำ',
      alertMessage: `มียาที่มีสต็อกต่ำกว่าระดับขั้นต่ำ ${lowStockItems.length} รายการ`
    },
    OPD: {
      title: 'สต็อกยา OPD', 
      buttonColor: 'bg-green-600 hover:bg-green-700',
      alertTitle: 'แจ้งเตือนต้องเบิกยาเพิ่ม',
      alertMessage: `มียาที่ต้องเบิกเพิ่มจากคลังยา ${lowStockItems.length} รายการ`
    }
  }

  const config = departmentConfig[department]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{config.title}</h2>
        <Button className={config.buttonColor} onClick={() => onStockAdjust?.('new')}>
          <Plus className="h-4 w-4 mr-2" />
          ปรับสต็อก
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {config.alertTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">{config.alertMessage}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {stocks.map((stock) => (
          <StockCard 
            key={stock.id} 
            stock={stock}
            department={department}
            onAdjust={onStockAdjust}
            onViewDetail={onStockDetail}
          />
        ))}
      </div>
    </div>
  )
}