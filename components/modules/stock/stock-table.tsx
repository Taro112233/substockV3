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
    // ป้องกัน undefined/null ใน search
    const drugName = stock.drug?.name?.toLowerCase() || ''
    const hospitalCode = stock.drug?.hospitalDrugCode?.toLowerCase() || ''
    const genericName = stock.drug?.genericName?.toLowerCase() || ''
    const searchLower = searchTerm.toLowerCase()
    
    const matchesSearch = 
      drugName.includes(searchLower) ||
      hospitalCode.includes(searchLower) ||
      genericName.includes(searchLower)
    
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
          size="sm"
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          สต็อกต่ำ
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[250px]">ชื่อยา</TableHead>
                <TableHead className="w-[120px]">รูปแบบ</TableHead>
                <TableHead className="w-[120px]">ความแรง</TableHead>
                <TableHead className="w-[120px]">ขนาดบรรจุ</TableHead>
                <TableHead className="w-[120px] text-center">คงเหลือ</TableHead>
                <TableHead className="w-[140px] text-center">อัปเดตล่าสุด</TableHead>
                <TableHead className="w-[120px] text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                    {searchTerm || showLowStockOnly ? 'ไม่พบรายการที่ค้นหา' : 'ไม่มีข้อมูลสต็อก'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStocks.map((stock) => {
                  // ป้องกัน undefined/null values
                  const availableStock = calculateAvailableStock(stock) || 0
                  const lowStock = isLowStock(stock)
                  const categoryColor = getCategoryColor(stock.drug?.category)
                  const categoryLabel = getCategoryLabel(stock.drug?.category)
                  const reorderPoint = stock.minimumStock || 0

                  return (
                    <TableRow 
                      key={stock.id} 
                      className="border-b" // ลบ hover:bg-gray-50/50 ออก
                    >
                      {/* ชื่อยา */}
                      <TableCell className="font-medium">
                        <div className="space-y-2">
                          {/* ชื่อยา */}
                          <div className="font-medium text-gray-900 leading-tight">
                            {stock.drug?.name || 'ไม่ระบุชื่อยา'}
                          </div>
                          
                          {/* Category Badge + Hospital Drug Code */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${categoryColor} shrink-0`}
                            >
                              {categoryLabel}
                            </Badge>
                            <span className="text-sm text-gray-600 font-mono">
                              {stock.drug?.hospitalDrugCode || '-'}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* รูปแบบ */}
                      <TableCell>
                        <div className="text-sm text-gray-700">
                          {stock.drug?.dosageForm || '-'}
                        </div>
                      </TableCell>

                      {/* ความแรง */}
                      <TableCell>
                        <div className="text-sm text-gray-700">
                          {stock.drug?.strength || ''} {stock.drug?.unit || ''}
                        </div>
                      </TableCell>

                      {/* ขนาดบรรจุ */}
                      <TableCell>
                        <div className="text-sm text-gray-700">
                          {stock.drug?.packageSize ? (
                            <>1 x {stock.drug.packageSize}'s</>
                          ) : (
                            '-'
                          )}
                        </div>
                      </TableCell>

                      {/* คงเหลือ */}
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          {/* จำนวนคงเหลือ */}
                          <div className={`font-medium ${
                            lowStock 
                              ? 'text-red-600' 
                              : availableStock > 0 
                                ? 'text-green-600' 
                                : 'text-gray-400'
                          }`}>
                            {availableStock.toLocaleString()}
                          </div>
                          
                          {/* ขั้นต่ำ */}
                          <div className="text-xs text-gray-500">
                            ขั้นต่ำ: {reorderPoint.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>

                      {/* อัปเดตล่าสุด */}
                      <TableCell className="text-center">
                        {stock.lastUpdated ? (
                          <div className="space-y-1">
                            <div className="text-sm text-gray-700">
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
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>

                      {/* จัดการ */}
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          {/* ปุ่มปรับสต็อก */}
                          <Button
                            variant={lowStock ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleAdjust(stock)}
                            className="h-8 px-3 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            ปรับ
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