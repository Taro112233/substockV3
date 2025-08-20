// hooks/useUserManagement.ts - Custom hook for user management
'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface User {
  id: string
  username: string
  firstName: string
  lastName: string
  position?: string
  status: 'APPROVED' | 'UNAPPROVED' | 'SUSPENDED' | 'INACTIVE'
  isActive: boolean
  createdAt: string
  lastLogin?: string
  fullName: string
}

interface UserStats {
  totalPending: number
  totalApproved: number
  totalSuspended: number
  recentRegistrations: number
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats>({
    totalPending: 0,
    totalApproved: 0,
    totalSuspended: 0,
    recentRegistrations: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้')
      }

      const data = await response.json()
      if (data.success) {
        setUsers(data.users || [])
      } else {
        throw new Error(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users/stats', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.stats)
        }
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [])

  const updateUserStatus = useCallback(async (userId: string, action: 'approve' | 'suspend' | 'activate') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        throw new Error('ไม่สามารถดำเนินการได้')
      }

      const data = await response.json()
      if (data.success) {
        toast.success(data.message)
        // Refresh data
        await fetchUsers()
        await fetchStats()
        return true
      } else {
        throw new Error(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      toast.error(errorMessage)
      return false
    }
  }, [fetchUsers, fetchStats])

  return {
    users,
    stats,
    isLoading,
    error,
    fetchUsers,
    fetchStats,
    updateUserStatus
  }
}