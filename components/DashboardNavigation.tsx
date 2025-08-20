// components/DashboardNavigation.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Users, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DashboardNavigationProps {
  className?: string
}

export function DashboardNavigation({ className = "" }: DashboardNavigationProps) {
  const router = useRouter()

  return (
    <div className={`flex space-x-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/admin/users')}
        className="hidden sm:flex"
      >
        <Users className="h-4 w-4 mr-2" />
        จัดการผู้ใช้งาน
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/settings')}
        className="hidden sm:flex"
      >
        <Settings className="h-4 w-4 mr-2" />
        ตั้งค่า
      </Button>
    </div>
  )
}