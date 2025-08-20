// components/MobileAdminNav.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Users, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function MobileAdminNav() {
  const router = useRouter()

  return (
    <div className="sm:hidden">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">เมนูจัดการ</h3>
      <div className="space-y-3">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/users')}
          className="w-full justify-start"
        >
          <Users className="h-4 w-4 mr-3" />
          จัดการผู้ใช้งาน
        </Button>
        
        <Button
          variant="outline"
          onClick={() => router.push('/settings')}
          className="w-full justify-start"
        >
          <Settings className="h-4 w-4 mr-3" />
          ตั้งค่าระบบ
        </Button>
      </div>
    </div>
  )
}