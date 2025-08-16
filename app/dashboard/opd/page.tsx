// 📄 File: app/dashboard/opd/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Calculator, CheckCircle, AlertTriangle, ArrowRightLeft, Plus, Users } from 'lucide-react'

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

export default function OPDDashboard() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)

  // Mock user data - will be replaced with actual auth
  const user = {
    firstName: 'สมหญิง',
    lastName: 'พยาบาล',
    position: 'พยาบาลวิชาชีพ'
  }

  useEffect(() => {
    fetchOPDStocks()
  }, [])

  const fetchOPDStocks = async () => {
    try {
      // Mock data for now - will be replaced with actual API call
      const mockStocks: Stock[] = [
        {
          id: '4',
          drugId: 'drug1',
          department: 'OPD',
          totalQuantity: 50,
          reservedQty: 10,
          minimumStock: 20,
          totalValue: 2500,
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
          id: '5',
          drugId: 'drug3',
          department: 'OPD',
          totalQuantity: 15,
          reservedQty: 5,
          minimumStock: 20,
          totalValue: 750,
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
              <h1 className="text-2xl font-bold text-gray-900">OPD Dashboard</h1>
              <p className="text-gray-600">ยินดีต้อนรับ, {user.firstName} {user.lastName}</p>
              {user.position && (
                <p className="text-sm text-gray-500">ตำแหน่ง: {user.position}</p>
              )}
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              🏥 OPD
            </Badge>
          </div>
          
          {/* Quick Stats for OPD */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">ยาใน OPD</p>
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
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">พร้อมใช้</p>
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
                    <p className="text-xs text-gray-600">ต้องเบิกเพิ่ม</p>
                    <p className="text-lg font-semibold">{lowStockItems.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content for OPD */}
      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stock">สต็อก OPD</TabsTrigger>
          <TabsTrigger value="requests">ใบเบิกยา</TabsTrigger>
          <TabsTrigger value="dispense">จ่ายยาผู้ป่วย</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>สต็อกยา OPD</span>
                <Button size="sm" variant="outline">
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  เบิกยาจากคลัง
                </Button>
              </CardTitle>
              <CardDescription>
                สต็อกยาในแผนก OPD สำหรับการจ่ายยาให้ผู้ป่วย
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {stocks.map((stock) => {
                  const isLowStock = stock.totalQuantity <= stock.minimumStock
                  const available = stock.totalQuantity - stock.reservedQty
                  
                  return (
                    <Card key={stock.id} className={`transition-all hover:shadow-md ${isLowStock ? 'border-orange-200 bg-orange-50' : ''}`}>
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
                                  ต้องเบิกเพิ่ม
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                OPD Stock
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
                            <div className="text-xs text-gray-500">ควรมี: {stock.minimumStock}</div>
                            <div className="text-sm font-medium text-green-600">
                              ₿{stock.totalValue.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-1">
                            {isLowStock && (
                              <Button size="sm" variant="outline" className="text-xs">
                                เบิกเพิ่ม
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              รายละเอียด
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {stocks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>ไม่มียาใน OPD</p>
                    <Button className="mt-4" size="sm">
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      เบิกยาจากคลัง
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>ใบเบิกยา</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  สร้างใบเบิกใหม่
                </Button>
              </CardTitle>
              <CardDescription>
                จัดการใบเบิกยาจากคลังยา - มุมมอง OPD
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>ไม่มีใบเบิกยา</p>
                <Button className="mt-4" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  สร้างใบเบิกใหม่
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispense" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>จ่ายยาผู้ป่วย</span>
                <Button size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  จ่ายยาใหม่
                </Button>
              </CardTitle>
              <CardDescription>
                ระบบจ่ายยาให้ผู้ป่วย OPD
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>ระบบจ่ายยาผู้ป่วย</p>
                <p className="text-sm">จะพัฒนาในระยะต่อไป</p>
                <Button className="mt-4" size="sm" disabled>
                  <Users className="h-4 w-4 mr-2" />
                  จ่ายยาผู้ป่วย
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}