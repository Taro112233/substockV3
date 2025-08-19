// 📄 File: app/dashboard/page.tsx

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Hospital, ArrowRight } from 'lucide-react'

export default function MainDashboard() {
  const router = useRouter()

  // Mock user data - will be replaced with actual auth
  const user = {
    firstName: 'สมชาย',
    lastName: 'เภสัชกร',
    position: 'เภสัชกรรมคลินิก'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="text-center space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ระบบจัดการสต็อกยาโรงพยาบาล</h1>
            <p className="text-xl text-gray-600 mt-2">ยินดีต้อนรับ, {user.firstName} {user.lastName}</p>
            {user.position && (
              <p className="text-sm text-gray-500">ตำแหน่ง: {user.position}</p>
            )}
          </div>
        </div>
      </div>

      {/* Department Selection */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          เลือกแผนกที่ต้องการใช้งาน
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pharmacy Department Card */}
          <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer border-2 border-blue-200">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center">
                <Package className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-blue-900">คลังยา</CardTitle>
              <p className="text-gray-600">จัดการสต็อกยาหลัก</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>จัดการสต็อกยาทั้งหมด</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>รับยาจากซัพพลายเออร์</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>จ่ายยาให้แผนกต่างๆ</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>ติดตามยาหมดอายุ</span>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => router.push('/dashboard/pharmacy')}
              >
                เข้าสู่แผนกคลังยา
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* OPD Department Card */}
          <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer border-2 border-green-200">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-20 h-20 flex items-center justify-center">
                <Hospital className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-900">OPD</CardTitle>
              <p className="text-gray-600">แผนกผู้ป่วยนอก</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>เบิกยาจากคลังยา</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>จ่ายยาให้ผู้ป่วย</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>ติดตามสต็อก OPD</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>บันทึกการจ่ายยา</span>
                </div>
              </div>
              
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                onClick={() => router.push('/dashboard/opd')}
              >
                เข้าสู่แผนก OPD
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}