// app/dashboard/page.tsx
'use client';

import { useAuth, withAuth } from '@/app/utils/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Pill, 
  Package, 
  ArrowRightLeft, 
  TrendingUp, 
  Users, 
  Settings,
  LogOut,
  Hospital,
  Building2,
  Stethoscope
} from 'lucide-react';

function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      await logout();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Hospital className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Hospital Pharmacy</h1>
                <p className="text-sm text-gray-600">Stock Management System V3.0</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="text-right">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <div className="flex items-center gap-2">
                  {user?.position && (
                    <Badge variant="outline" className="text-xs">
                      {user.position}
                    </Badge>
                  )}
                  <Badge className="text-xs text-white bg-blue-500">
                    ระบบรวม
                  </Badge>
                </div>
              </div>
              
              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ยินดีต้อนรับ, {user?.firstName}!
          </h2>
          <p className="text-gray-600">
            ระบบจัดการสต็อกยาโรงพยาบาล - เข้าถึงข้อมูลทั้งคลังยาและ OPD
          </p>
        </div>

        {/* Department Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-blue-800 mb-2">คลังยา</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    จัดการสต็อกยาหลัก รับ-จ่ายยา นำเข้าข้อมูลยา
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">ยาในสต็อก</p>
                      <p className="font-bold text-lg">1,245</p>
                    </div>
                    <div>
                      <p className="text-gray-500">มูลค่า</p>
                      <p className="font-bold text-lg">2.4M</p>
                    </div>
                  </div>
                </div>
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-green-800 mb-2">OPD</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    จัดการยาผู้ป่วยนอก เบิกยาจากคลังยา จ่ายยาผู้ป่วย
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">ยาในสต็อก</p>
                      <p className="font-bold text-lg">856</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ผู้ป่วยวันนี้</p>
                      <p className="font-bold text-lg">67</p>
                    </div>
                  </div>
                </div>
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">ยาทั้งหมด</p>
                  <p className="text-2xl font-bold">245</p>
                  <p className="text-xs text-green-600 mt-1">+12 รายการใหม่</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Pill className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">สต็อกรวม</p>
                  <p className="text-2xl font-bold">2,101</p>
                  <p className="text-xs text-orange-600 mt-1">25 รายการใกล้หมด</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">การโอนวันนี้</p>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-blue-600 mt-1">5 รอการอนุมัติ</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ArrowRightLeft className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">มูลค่าสต็อก</p>
                  <p className="text-2xl font-bold">3.2M</p>
                  <p className="text-xs text-green-600 mt-1">+7.5% จากเดือนที่แล้ว</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>เมนูหลัก</CardTitle>
              <CardDescription>
                เลือกฟังก์ชันที่ต้องการใช้งาน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button className="h-20 flex flex-col items-center gap-2" variant="outline">
                  <Pill className="w-6 h-6" />
                  <span className="text-sm">จัดการยา</span>
                </Button>
                <Button className="h-20 flex flex-col items-center gap-2" variant="outline">
                  <Package className="w-6 h-6" />
                  <span className="text-sm">จัดการสต็อก</span>
                </Button>
                <Button className="h-20 flex flex-col items-center gap-2" variant="outline">
                  <ArrowRightLeft className="w-6 h-6" />
                  <span className="text-sm">โอนยา</span>
                </Button>
                <Button className="h-20 flex flex-col items-center gap-2" variant="outline">
                  <TrendingUp className="w-6 h-6" />
                  <span className="text-sm">รายงาน</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>กิจกรรมล่าสุด</CardTitle>
              <CardDescription>
                การเคลื่อนไหวของระบบในวันนี้
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <ArrowRightLeft className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">โอนยา Paracetamol 500mg</p>
                    <p className="text-xs text-gray-600">คลังยา → OPD • 500 เม็ด • 10:30</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">รับยาใหม่เข้าระบบ</p>
                    <p className="text-xs text-gray-600">Amoxicillin 250mg • 1,000 เม็ด • 09:15</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">มีผู้ใช้ใหม่สมัครเข้าระบบ</p>
                    <p className="text-xs text-gray-600">รอการอนุมัติ • 08:45</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              สถานะระบบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-green-600">ปกติ</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <p className="text-sm font-medium">API Server</p>
                <p className="text-xs text-green-600">ปกติ</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <p className="text-sm font-medium">File Storage</p>
                <p className="text-xs text-green-600">ปกติ</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// ใช้ withAuth HOC เพื่อ protect หน้านี้
export default withAuth(DashboardPage);