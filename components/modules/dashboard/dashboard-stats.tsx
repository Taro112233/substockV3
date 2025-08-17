// 📄 File: components/modules/dashboard/dashboard-stats.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardStats } from '@/types/dashboard'
import { Package, AlertTriangle, FileText, Activity, TrendingUp } from 'lucide-react'

interface DashboardStatsProps {
  stats: DashboardStats
  department: 'PHARMACY' | 'OPD'
}

export function DashboardStatsCards({ stats, department }: DashboardStatsProps) {
  const departmentColors = {
    PHARMACY: {
      primary: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    OPD: {
      primary: 'text-green-600', 
      bg: 'bg-green-50',
      border: 'border-green-200'
    }
  }

  const colors = departmentColors[department]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Drugs Card */}
      <Card className={`${colors.border} hover:shadow-md transition-shadow`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            รายการยาทั้งหมด
          </CardTitle>
          <Package className={`h-4 w-4 ${colors.primary}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDrugs.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">รายการ</p>
        </CardContent>
      </Card>

      {/* Total Value Card */}
      <Card className={`${colors.border} hover:shadow-md transition-shadow`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            มูลค่าสต็อก
          </CardTitle>
          <TrendingUp className={`h-4 w-4 ${colors.primary}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          <p className="text-xs text-gray-500 mt-1">บาท</p>
        </CardContent>
      </Card>

      {/* Low Stock Alert Card */}
      <Card className={`border-orange-200 hover:shadow-md transition-shadow ${
        stats.lowStockItems > 0 ? 'bg-orange-50' : ''
      }`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            สต็อกต่ำ
          </CardTitle>
          <AlertTriangle className={`h-4 w-4 ${
            stats.lowStockItems > 0 ? 'text-orange-600' : 'text-gray-400'
          }`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            stats.lowStockItems > 0 ? 'text-orange-600' : 'text-gray-900'
          }`}>
            {stats.lowStockItems.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">รายการ</p>
        </CardContent>
      </Card>

      {/* Pending Transfers Card */}
      <Card className={`border-purple-200 hover:shadow-md transition-shadow ${
        stats.pendingTransfers > 0 ? 'bg-purple-50' : ''
      }`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            รอดำเนินการ
          </CardTitle>
          <FileText className={`h-4 w-4 ${
            stats.pendingTransfers > 0 ? 'text-purple-600' : 'text-gray-400'
          }`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            stats.pendingTransfers > 0 ? 'text-purple-600' : 'text-gray-900'
          }`}>
            {stats.pendingTransfers.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">ใบเบิก</p>
        </CardContent>
      </Card>
    </div>
  )
}