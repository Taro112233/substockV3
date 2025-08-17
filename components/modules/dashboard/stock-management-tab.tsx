// 📄 File: components/modules/dashboard/stock-management-tab.tsx

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StockCard } from '@/components/modules/stock/stock-card'
import { Stock } from '@/types/dashboard'
import { isLowStock } from '@/lib/utils/dashboard'
import { Search, Filter, AlertTriangle, Package, Plus } from 'lucide-react'

interface StockManagementTabProps {
  stocks: Stock[]
  department: 'PHARMACY' | 'OPD'
}

export function StockManagementTab({ stocks, department }: StockManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'low' | 'normal'>('all')

  // Filter stocks based on search and filter type
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stock.drug.hospitalDrugCode.toLowerCase().includes(searchQuery.toLowerCase())
    
    let matchesFilter = true
    if (filterType === 'low') {
      matchesFilter = isLowStock(stock)
    } else if (filterType === 'normal') {
      matchesFilter = !isLowStock(stock)
    }
    
    return matchesSearch && matchesFilter
  })

  const lowStockCount = stocks.filter(isLowStock).length
  const departmentLabel = department === 'PHARMACY' ? 'เภสัชกรรม' : 'OPD'

  if (stocks.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          ไม่มีข้อมูลสต็อกยา
        </h3>
        <p className="text-gray-600 mb-6">
          ระบบยังไม่มีข้อมูลสต็อกยาของแผนก {departmentLabel}
        </p>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มข้อมูลยา
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            สต็อกยา{departmentLabel} ({stocks.length} รายการ)
          </h2>
          {lowStockCount > 0 && (
            <p className="text-sm text-orange-600 flex items-center gap-1 mt-1">
              <AlertTriangle className="h-4 w-4" />
              มียาสต็อกต่ำ {lowStockCount} รายการ
            </p>
          )}
        </div>
        
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          ปรับสต็อก
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="ค้นหายา (ชื่อยา หรือ รหัสยา)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
            className="flex items-center gap-1"
          >
            <Filter className="h-3 w-3" />
            ทั้งหมด ({stocks.length})
          </Button>
          <Button
            variant={filterType === 'low' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('low')}
            className="flex items-center gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            สต็อกต่ำ ({lowStockCount})
          </Button>
          <Button
            variant={filterType === 'normal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('normal')}
            className="flex items-center gap-1"
          >
            <Package className="h-3 w-3" />
            ปกติ ({stocks.length - lowStockCount})
          </Button>
        </div>
      </div>

      {/* Stock Grid */}
      {filteredStocks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStocks.map((stock) => (
            <StockCard 
              key={stock.id} 
              stock={stock} 
              department={department}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">
            {searchQuery ? 'ไม่พบยาที่ค้นหา' : 'ไม่มียาในหมวดหมู่นี้'}
          </p>
          {searchQuery && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSearchQuery('')}
              className="mt-2"
            >
              ล้างการค้นหา
            </Button>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-lg">{stocks.length}</div>
            <div className="text-gray-600">รายการยา</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-lg">
              {stocks.reduce((sum, stock) => sum + stock.totalQuantity, 0).toLocaleString()}
            </div>
            <div className="text-gray-600">หน่วยทั้งหมด</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-lg text-orange-600">{lowStockCount}</div>
            <div className="text-gray-600">สต็อกต่ำ</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-lg">
              ฿{stocks.reduce((sum, stock) => sum + stock.totalValue, 0).toLocaleString()}
            </div>
            <div className="text-gray-600">มูลค่ารวม</div>
          </div>
        </div>
      </div>
    </div>
  )
}