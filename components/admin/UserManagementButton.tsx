// components/admin/UserManagementButton.tsx - Add to dashboard navigation
'use client'

import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function UserManagementButton() {
  const router = useRouter()

  return (
    <Button
      variant="outline"
      onClick={() => router.push('/admin/users')}
      className="w-full sm:w-auto"
    >
      <Users className="h-4 w-4 mr-2" />
      จัดการผู้ใช้งาน
    </Button>
  )
}