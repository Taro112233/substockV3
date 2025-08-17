// 📄 File: components/modules/dashboard/dashboard-stats.tsx

import { Card, CardContent } from '@/components/ui/card'
import { DashboardStats } from '@/types/dashboard'
import { formatCurrency } from '@/lib/utils/dashboard'
import { 
  Package, 
  Calculator, 
  AlertTriangle, 
  ArrowRightLeft 
} from 'lucide-react'

interface DashboardStatsProps {
  stats: DashboardStats
  department: 'PHARMACY' | 'OPD'
}

export function DashboardStatsCards({ stats, department }: DashboardStatsProps) {
  const departmentColors = {
    PHARMACY: {
      primary: 'text-blue-600',
      secondary: 'text-green-600',
      warning: 'text-orange-600',
      accent: 'text-purple-600'
    },
    OPD: {
      primary: 'text-green-600',
      secondary: 'text-blue-600',
      warning: 'text-orange-600',
      accent: 'text-purple-600'
    }
  }

  const colors = departmentColors[department]
  const lowStockLabel = department === 'PHARMACY' ? 'สต็อกต่ำ' : 'ต้องเบิกเพิ่ม'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Package className={`h-8 w-8 ${colors.primary}`} />
            <div>
              <p className="text-2xl font-bold">{stats.totalItems}</p>
              <p className="text-sm text-gray-600">รายการยา</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Calculator className={`h-8 w-8 ${colors.secondary}`} />
            <div>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
              <p className="text-sm text-gray-600">มูลค่ารวม</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`h-8 w-8 ${colors.warning}`} />
            <div>
              <p className="text-2xl font-bold">{stats.lowStockCount}</p>
              <p className="text-sm text-gray-600">{lowStockLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className={`h-8 w-8 ${colors.accent}`} />
            <div>
              <p className="text-2xl font-bold">{stats.transferCount}</p>
              <p className="text-sm text-gray-600">ใบเบิก</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}