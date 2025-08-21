// 📄 File: components/modules/dashboard/dashboard-stats.tsx (Updated)
// Updated Dashboard Stats with Enhanced Visual Indicators

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardStats } from '@/types/dashboard'
import { Package, AlertTriangle, FileText, TrendingUp, Filter, Clock } from 'lucide-react'

interface DashboardStatsProps {
  stats: DashboardStats
  department: 'PHARMACY' | 'OPD'
  isFiltered?: boolean
  filteredStats?: {
    totalDrugs: number
    totalValue: number
    lowStockItems: number
  }
}

export function DashboardStatsCards({ 
  stats, 
  department, 
  isFiltered = false,
  filteredStats 
}: DashboardStatsProps) {
  const departmentColors = {
    PHARMACY: {
      primary: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      filtered: 'border-blue-300 bg-blue-50'
    },
    OPD: {
      primary: 'text-green-600', 
      bg: 'bg-green-50',
      border: 'border-green-200',
      filtered: 'border-green-300 bg-green-50'
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

  // Use filtered stats if available, otherwise use original stats
  const displayStats = filteredStats || {
    totalDrugs: stats.totalDrugs,
    totalValue: stats.totalValue,
    lowStockItems: stats.lowStockItems
  }

  return (
    <div className="space-y-4">
      {/* Filter Indicator */}
      {isFiltered && filteredStats && (
        <div className={`${colors.bg} border ${colors.border} rounded-lg p-3`}>
          <div className={`flex items-center gap-2 ${colors.primary}`}>
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">
              กำลังแสดงข้อมูลที่กรองแล้ว - สถิติด้านล่างแสดงเฉพาะรายการที่ผ่านการกรอง
            </span>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Drugs Card */}
        <Card className={`transition-all duration-200 hover:shadow-md ${
          isFiltered ? colors.filtered : colors.border
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              รายการยา{isFiltered ? ' (กรองแล้ว)' : 'ทั้งหมด'}
            </CardTitle>
            <Package className={`h-4 w-4 ${isFiltered ? colors.primary : 'text-gray-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{displayStats.totalDrugs.toLocaleString()}</div>
              {isFiltered && filteredStats && (
                <span className="text-sm text-gray-500">
                  / {stats.totalDrugs.toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">รายการ</p>
          </CardContent>
        </Card>

        {/* Total Value Card */}
        <Card className={`transition-all duration-200 hover:shadow-md ${
          isFiltered ? 'border-purple-300 bg-purple-50' : colors.border
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              มูลค่าสต็อก{isFiltered ? ' (กรองแล้ว)' : ''}
            </CardTitle>
            <TrendingUp className={`h-4 w-4 ${isFiltered ? 'text-purple-600' : colors.primary}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(displayStats.totalValue)}
              </div>
              {isFiltered && filteredStats && (
                <span className="text-sm text-gray-500">
                  / {formatCurrency(stats.totalValue)}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">บาท</p>
          </CardContent>
        </Card>

        {/* Low Stock Alert Card */}
        <Card className={`transition-all duration-200 hover:shadow-md ${
          displayStats.lowStockItems > 0 
            ? (isFiltered ? 'border-orange-300 bg-orange-50' : 'border-orange-200 bg-orange-50')
            : (isFiltered ? colors.filtered : colors.border)
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              สต็อกต่ำ{isFiltered ? ' (กรองแล้ว)' : ''}
            </CardTitle>
            <AlertTriangle className={`h-4 w-4 ${
              displayStats.lowStockItems > 0 ? 'text-orange-600' : 'text-gray-400'
            }`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${
                displayStats.lowStockItems > 0 ? 'text-orange-600' : 'text-gray-900'
              }`}>
                {displayStats.lowStockItems.toLocaleString()}
              </div>
              {isFiltered && filteredStats && (
                <span className="text-sm text-gray-500">
                  / {stats.lowStockItems.toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">รายการ</p>
          </CardContent>
        </Card>

        {/* Pending Transfers Card */}
        <Card className={`transition-all duration-200 hover:shadow-md ${
          stats.pendingTransfers > 0 
            ? 'border-purple-200 bg-purple-50' 
            : (isFiltered ? colors.filtered : colors.border)
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

      {/* Additional Info Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>อัปเดต: {new Date().toLocaleString('th-TH')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>เชื่อมต่อแล้ว</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>สต็อกต่ำ</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>ใกล้หมด</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>ปกติ</span>
          </div>
        </div>
      </div>
    </div>
  )
}