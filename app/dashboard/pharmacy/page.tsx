// 📄 File: app/dashboard/pharmacy/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StockCard } from '@/components/modules/stock/stock-card'
import { Package, Calculator, TrendingUp, AlertTriangle, Plus, ArrowRightLeft } from 'lucide-react'

interface Stock {
  id: string
  drugId: string
  department: 'PHARMACY' | 'OPD'
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

export default function PharmacyDashboard() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)

  // Mock user data - will be replaced with actual auth
  const user = {
    firstName: 'สมชาย',
    lastName: 'เภสัชกร',
    position: 'เภสัชกรรมคลินิก'
  }

  useEffect(() => {
    fetchPharmacyStocks()
  }, [])

  const fetchPharmacyStocks = async () => {
    try {
      // Mock data for now - will be replaced with actual API call
      const mockStocks: Stock[] = [
        {
          id: '1',
          drugId: 'drug1',
          department: 'PHARMACY',
          totalQuantity: 150,
          reservedQty: 20,
          minimumStock: 50,
          totalValue: 7500,
          drug: {
            hospitalDrugCode: 'PAR001',
            name: 'Paracetamol 500mg',
            genericName: 'Paracetamol',
            dosageForm: 'TAB',
            strength: '500mg',
            unit: 'เม็ด',
            category: 'GENERAL'
          }
        },
        {
          id: '2',
          drugId: 'drug2',
          department: 'PHARMACY',
          totalQuantity: 25,
          reservedQty: 5,
          minimumStock: 30,
          totalValue: 12500,
          drug: {
            hospitalDrugCode: 'AMX001',
            name: 'Amoxicillin 250mg',
            genericName: 'Amoxicillin',
            dosageForm: 'CAP',
            strength: '250mg',
            unit: 'แคปซูล',
            category: 'REFER'
          }
        },
        {
          id: '3',
          drugId: 'drug3',
          department: 'PHARMACY',
          totalQuantity: 80,
          reservedQty: 0,
          minimumStock: 20,
          totalValue: 4000,
          drug: {
            hospitalDrugCode: 'IBU001',
            name: 'Ibuprofen 400mg',
            genericName: 'Ibuprofen',
            dosageForm: 'TAB',
            strength: '400mg',
            unit: 'เม็ด',
            category: 'GENERAL'
          }
        }
      ]
      
      setStocks(mockStocks)
    } catch (error) {
      console.error('Failed to fetch stocks:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalStockValue = stocks.reduce((sum, stock) => sum + stock.totalValue, 0)
  const lowStockItems = stocks.filter(stock => stock.totalQuantity <= stock.minimumStock)
  const availableStock = stocks.reduce((sum, stock) => sum + (stock.totalQuantity - stock.reservedQty), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">คลังยา Dashboard</h1>
              <p className="text-gray-600">ยินดีต้อนรับ, {user.firstName} {user.lastName}</p>
              {user.position && (
                <p className="text-sm text-gray-500">ตำแหน่ง: {user.position}</p>
              )}
            </div>
            <Badge variant="default" className="px-3 py-1">
              💊 คลังยา
            </Badge>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">ยารวม</p>
                    <p className="text-lg font-semibold">{stocks.length} รายการ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">มูลค่ารวม</p>
                    <p className="text-lg font-semibold">₿{totalStockValue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-600">พร้อมจ่าย</p>
                    <p className="text-lg font-semibold">{availableStock}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-xs text-gray-600">สต็อกต่ำ</p>
                    <p className="text-lg font-semibold">{lowStockItems.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stock">จัดการสต็อก</TabsTrigger>
          <TabsTrigger value="transfers">ใบเบิกจ่าย</TabsTrigger>
          <TabsTrigger value="transactions">ประวัติ</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>สต็อกยาคลัง</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มยาใหม่
                </Button>
              </CardTitle>
              <CardDescription>
                จัดการสต็อกยาในแผนกคลังยา
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {stocks.map((stock) => (
                  <StockCard 
                    key={stock.id} 
                    stock={stock}
                    onAdjust={(stockId) => {
                      console.log('Adjust stock:', stockId)
                    }}
                    onViewDetail={(stockId) => {
                      console.log('View detail:', stockId)
                    }}
                  />
                ))}
                {stocks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>ไม่มียาในคลัง</p>
                    <p className="text-sm">เริ่มต้นด้วยการเพิ่มยาใหม่</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>ใบเบิกจ่ายยา</span>
                <Button size="sm">
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  สร้างใบจ่ายใหม่
                </Button>
              </CardTitle>
              <CardDescription>
                จัดการใบเบิกจ่ายยาระหว่างแผนก - มุมมองคลังยา
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>ไม่มีใบเบิกจ่าย</p>
                <p className="text-sm">ใบเบิกจ่ายยาจะแสดงที่นี่</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ประวัติการเคลื่อนไหว</CardTitle>
              <CardDescription>
                ประวัติการเคลื่อนไหวสต็อกยาในแผนกคลังยา
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>ไม่มีประวัติการเคลื่อนไหว</p>
                <p className="text-sm">การเคลื่อนไหวสต็อกจะแสดงที่นี่</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}