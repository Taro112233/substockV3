// app/page.tsx
// Hospital Pharmacy Stock Management System V3.0 - Landing Page

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Pill, 
  Building2, 
  Users, 
  Shield, 
  Smartphone, 
  Clock,
  Activity,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle,
  BarChart3,
  RefreshCw,
  LogIn
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Hospital Pharmacy</h1>
                <p className="text-sm text-gray-600">Stock Management System V3.0</p>
              </div>
            </div>
            
            <Link href="/dashboard">
              <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <LogIn className="w-4 h-4" />
                เข้าสู่ระบบ
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            สำหรับโรงพยาบาล เภสัชกร และเจ้าหน้าที่
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            ระบบจัดการ
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">สต็อกยา</span>
            <br />โรงพยาบาล
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            แทนที่ระบบบัตรสต็อกกระดาษด้วยระบบดิจิทัลที่ทันสมัย 
            รองรับการจัดการสต็อก 2 แผนก พร้อมระบบเบิกจ่ายแบบเรียลไทม์
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-4 w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Building2 className="w-5 h-5 mr-2" />
                เริ่มใช้งานระบบ
              </Button>
            </Link>
            
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 w-full sm:w-auto border-blue-200 hover:bg-blue-50">
              <Users className="w-5 h-5 mr-2" />
              ดูคู่มือการใช้งาน
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-blue-600">2</div>
              <div className="text-sm text-gray-600">แผนกโรงพยาบาล</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-sm text-gray-600">ทดแทนกระดาษ</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-orange-600">7</div>
              <div className="text-sm text-gray-600">วันพัฒนา</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600">บาทงบประมาณ</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ฟีเจอร์หลักของระบบ
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              ระบบครบครันสำหรับการจัดการสต็อกยาในโรงพยาบาล ด้วยเทคโนโลยีทันสมัย
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">สต็อกแบบเรียลไทม์</div>
                    <div className="text-sm text-gray-500">Real-time Stock</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  ติดตามสต็อกยาแบบเรียลไทม์ แยกตามแผนก พร้อมแจ้งเตือนเมื่อยาใกล้หมด
                </p>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    อัปเดตสต็อกทันที
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    แยกข้อมูลตามแผนก
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    แจ้งเตือนยาใกล้หมด
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <RefreshCw className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">ระบบเบิกจ่าย</div>
                    <div className="text-sm text-gray-500">Transfer System</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  จัดการการเบิกจ่ายยาระหว่างแผนก พร้อม workflow ที่สมบูรณ์
                </p>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    คลังยา ↔ OPD
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    อนุมัติ/ส่ง/รับ
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    ติดตามสถานะ
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">Mobile-First PWA</div>
                    <div className="text-sm text-gray-500">Progressive Web App</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  ออกแบบสำหรับมือถือ ติดตั้งได้เป็น app พร้อมใช้งานออฟไลน์
                </p>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    ติดตั้งเป็น app
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    ใช้งานออฟไลน์
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    รองรับทุกอุปกรณ์
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ฟีเจอร์เพิ่มเติม
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="font-semibold mb-2">Import ข้อมูล</h3>
              <p className="text-sm text-gray-600">นำเข้าข้อมูลยาจาก Excel/CSV</p>
            </Card>

            <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="font-semibold mb-2">รายงานสต็อก</h3>
              <p className="text-sm text-gray-600">รายงานและสถิติการใช้ยา</p>
            </Card>

            <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all">
              <Users className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="font-semibold mb-2">จัดการผู้ใช้</h3>
              <p className="text-sm text-gray-600">ระบบสิทธิ์แยกตามแผนก</p>
            </Card>

            <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all">
              <Clock className="w-12 h-12 mx-auto mb-4 text-orange-600" />
              <h3 className="font-semibold mb-2">Audit Trail</h3>
              <p className="text-sm text-gray-600">ติดตามประวัติทุกการเคลื่อนไหว</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Department Overview */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            รองรับ 2 แผนกหลัก
          </h2>
          <p className="text-blue-100 mb-12 text-lg">
            ระบบแยกข้อมูลชัดเจนระหว่างแผนก พร้อมระบบเบิกจ่ายยาที่มีประสิทธิภาพ
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">คลังยา</h3>
                <p className="text-blue-100 mb-4">
                  จัดการสต็อกหลัก จ่ายยาให้แผนกต่างๆ
                </p>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>• จัดการสต็อกยาหลัก</li>
                  <li>• รับยาจากซัพพลายเออร์</li>
                  <li>• จ่ายยาให้ OPD</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">OPD</h3>
                <p className="text-blue-100 mb-4">
                  จัดการยาสำหรับผู้ป่วยนอก
                </p>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>• จัดการสต็อกยา OPD</li>
                  <li>• เบิกยาจากคลังยา</li>
                  <li>• จ่ายยาให้ผู้ป่วย</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            พร้อมที่จะเริ่มใช้งาน?
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            ระบบพร้อมใช้งานทันที ไม่ต้องติดตั้งซอฟต์แวร์เพิ่มเติม
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-4 w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <LogIn className="w-5 h-5 mr-2" />
                เข้าสู่ระบบ Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>ทดลองใช้งานได้ทันที • ไม่ต้องสมัครสมาชิก • Mobile-friendly</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Pill className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white">Hospital Pharmacy V3.0</span>
              </div>
              <p className="text-sm text-gray-400">
                ระบบจัดการสต็อกยาโรงพยาบาลที่ทันสมัย ปลอดภัย และใช้งานง่าย
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">ฟีเจอร์หลัก</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• จัดการสต็อกแบบเรียลไทม์</li>
                <li>• ระบบเบิกจ่ายระหว่างแผนก</li>
                <li>• Mobile-First PWA</li>
                <li>• Import ข้อมูลจาก Excel</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">ข้อมูลเทคนิค</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Next.js 14 + TypeScript</li>
                <li>• Prisma + PostgreSQL</li>
                <li>• TailwindCSS + Shadcn/UI</li>
                <li>• JWT Authentication</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-500 mb-2">
              พัฒนาโดย Ai-Sat สำหรับโรงพยาบาลและเภสัชกร
            </p>
            <div className="text-xs text-gray-600">
              <p>Hospital Pharmacy Stock Management System V3.0</p>
              <p className="mt-1">© 2025 All rights reserved. Built with ❤️ for healthcare professionals.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}