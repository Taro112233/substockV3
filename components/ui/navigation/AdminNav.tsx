// components/ui/navigation/AdminNav.tsx - Admin navigation component
'use client'

import { Button } from '@/components/ui/button'
import { Users, Settings, BarChart3, Database, Shield } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

export function AdminNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    {
      href: '/admin/users',
      label: 'จัดการผู้ใช้งาน',
      icon: Users,
      description: 'อนุมัติและจัดการผู้ใช้งาน'
    },
    {
      href: '/admin/system',
      label: 'ตั้งค่าระบบ',
      icon: Settings,
      description: 'กำหนดค่าและการตั้งค่าระบบ'
    },
    {
      href: '/admin/reports',
      label: 'รายงานระบบ',
      icon: BarChart3,
      description: 'รายงานการใช้งานและสถิติ'
    },
    {
      href: '/admin/database',
      label: 'จัดการข้อมูล',
      icon: Database,
      description: 'การนำเข้าและจัดการข้อมูล'
    },
    {
      href: '/admin/security',
      label: 'ความปลอดภัย',
      icon: Shield,
      description: 'การจัดการความปลอดภัยระบบ'
    }
  ]

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">เมนูจัดการระบบ</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Button
              key={item.href}
              variant={isActive ? "default" : "outline"}
              onClick={() => router.push(item.href)}
              className="h-auto p-4 flex flex-col items-start space-y-2"
            >
              <div className="flex items-center space-x-2">
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              <p className="text-xs text-left opacity-75">
                {item.description}
              </p>
            </Button>
          )
        })}
      </div>
    </div>
  )
}