// 📄 File: components/modules/stock/stock-table.tsx

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Stock } from '@/types/dashboard'
import {
  calculateAvailableStock,
  isLowStock,
  formatCurrency,
  getCategoryColor,
  getCategoryLabel
} from '@/lib/utils/dashboard'
import { 
  Package, 
  AlertTriangle, 
  Edit, 
  Eye, 
  TrendingDown, 
  TrendingUp, 
  Search,
  Filter
} from 'lucide-react'
import { useState } from 'react'

interface StockTableProps {
  stocks: Stock[]
  department: 'PHARMACY' | 'OPD'
  onAdjust?: (stock: Stock) => void
  onView?: (stock: Stock) => void
  loading?: boolean
}

export function StockTable({ 
  stocks, 
  department, 
  onAdjust, 
  onView,
  loading = false 
}: StockTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  // Filter stocks based on search and low stock filter
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = 
      stock.drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.drug.hospitalDrugCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stock.drug.genericName && stock.drug.genericName.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesLowStock = showLowStockOnly ? isLowStock(stock) : true
    
    return matchesSearch && matchesLowStock
  })

  const handleAdjust = (stock: Stock) => {
    if (onAdjust) {
      onAdjust(stock)
    } else {
      console.log('Adjust stock for:', stock.drug.name)
    }
  }

  const handleView = (stock: Stock) => {
    if (onView) {
      onView(stock)
    } else {
      console.log('View stock details for:', stock.drug.name)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-32">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อยา</TableHead>
                <TableHead>รูปแบบ</TableHead>
                <TableHead>ความแรง</TableHead>
                <TableHead>ขนาดบรรจุ</TableHead>
                <TableHead>คงเหลือ</TableHead>
                <TableHead>อัปเดตล่าสุด</TableHead>
                <TableHead>จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-8 bg-gray-200 rounded animate-pulse" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="ค้นหายา (ชื่อ, รหัส, ชื่อสามัญ)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showLowStockOnly ? "default" : "outline"}
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          สต็อกต่ำ
          {showLowStockOnly && (
            <Badge variant="secondary" className="ml-1">
              {filteredStocks.filter(s => isLowStock(s)).length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm text-blue-600">ยาทั้งหมด</div>
          <div className="text-xl font-bold text-blue-900">{filteredStocks.length}</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-sm text-green-600">มูลค่ารวม</div>
          <div className="text-xl font-bold text-green-900">
            {formatCurrency(filteredStocks.reduce((sum, s) => sum + s.totalValue, 0))}
          </div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="text-sm text-orange-600">สต็อกต่ำ</div>
          <div className="text-xl font-bold text-orange-900">
            {filteredStocks.filter(s => isLowStock(s)).length}
          </div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-sm text-purple-600">จำนวนรวม</div>
          <div className="text-xl font-bold text-purple-900">
            {filteredStocks.reduce((sum, s) => sum + s.totalQuantity, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[200px]">ชื่อยา</TableHead>
                <TableHead className="w-[100px]">รูปแบบ</TableHead>
                <TableHead className="w-[120px]">ความแรง</TableHead>
                <TableHead className="w-[120px]">ขนาดบรรจุ</TableHead>
                <TableHead className="w-[120px] text-center">คงเหลือ</TableHead>
                <TableHead className="w-[140px]">อัปเดตล่าสุด</TableHead>
                <TableHead className="w-[120px] text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchTerm || showLowStockOnly ? (
                      <div className="space-y-2">
                        <Package className="h-8 w-8 mx-auto text-gray-400" />
                        <div>ไม่พบข้อมูลตามเงื่อนไขที่กำหนด</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Package className="h-8 w-8 mx-auto text-gray-400" />
                        <div>ไม่มีข้อมูลสต็อกในระบบ</div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStocks.map((stock) => {
                  const availableStock = calculateAvailableStock(stock)
                  const lowStock = isLowStock(stock)
                  
                  return (
                    <TableRow 
                      key={stock.id} 
                      className={`hover:bg-gray-50 ${lowStock ? 'bg-orange-50/50' : ''}`}
                    >
                      {/* ชื่อยา */}
                      <TableCell className="space-y-1">
                        <div className="font-medium text-sm">{stock.drug.name}</div>
                        <div className="text-xs text-gray-500 font-mono">
                          {stock.drug.hospitalDrugCode}
                        </div>
                        {stock.drug.genericName && (
                          <div className="text-xs text-gray-600">
                            {stock.drug.genericName}
                          </div>
                        )}
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getCategoryColor(stock.drug.category)}`}
                        >
                          {getCategoryLabel(stock.drug.category)}
                        </Badge>
                      </TableCell>

                      {/* รูปแบบ */}
                      <TableCell className="text-sm">
                        {stock.drug.dosageForm}
                      </TableCell>

                      {/* ความแรง */}
                      <TableCell className="text-sm">
                        {stock.drug.strength ? (
                          <div>
                            {stock.drug.strength}
                            {stock.drug.unit && (
                              <span className="text-gray-500 ml-1">
                                {stock.drug.unit}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>

                      {/* ขนาดบรรจุ */}
                      <TableCell className="text-sm">
                        {stock.drug.packageSize ? (
                          stock.drug.packageSize
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>

                      {/* คงเหลือ */}
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className={`font-bold text-lg ${
                            lowStock ? 'text-orange-600' : 'text-gray-900'
                          }`}>
                            {stock.totalQuantity.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            พร้อมใช้: {availableStock.toLocaleString()}
                          </div>
                          {stock.reservedQty > 0 && (
                            <div className="text-xs text-yellow-600">
                              จอง: {stock.reservedQty.toLocaleString()}
                            </div>
                          )}
                          {lowStock && (
                            <div className="flex items-center justify-center gap-1 text-orange-600">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="text-xs">สต็อกต่ำ</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            ขั้นต่ำ: {stock.minimumStock.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>

                      {/* อัปเดตล่าสุด */}
                      <TableCell className="text-sm">
                        {stock.lastUpdated ? (
                          <div className="space-y-1">
                            <div>
                              {new Date(stock.lastUpdated).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(stock.lastUpdated).toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>

                      {/* จัดการ */}
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(stock)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={lowStock ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleAdjust(stock)}
                            className="h-8 w-8 p-0"
                          >
                            {lowStock ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <Edit className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer Info */}
      {filteredStocks.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          แสดง {filteredStocks.length} รายการจากทั้งหมด {stocks.length} รายการ
          {searchTerm && ` | ค้นหา: "${searchTerm}"`}
          {showLowStockOnly && ` | กรองสต็อกต่ำเท่านั้น`}
        </div>
      )}
    </div>
  )
}