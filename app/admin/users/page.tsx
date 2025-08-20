// app/admin/users/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/app/utils/auth-client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Users, 
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Calendar,
  RefreshCw
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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

export default function UserApprovalPage() {
  const { user: currentUser, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats>({
    totalPending: 0,
    totalApproved: 0,
    totalSuspended: 0,
    recentRegistrations: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check authentication and authorization
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login')
      return
    }
    
    if (!loading && currentUser) {
      fetchUsers()
      fetchStats()
    }
  }, [currentUser, loading, router])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
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
  }

  const fetchStats = async () => {
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
  }

  const handleUserAction = async (userId: string, action: 'approve' | 'suspend' | 'activate') => {
    try {
      setActionLoading(userId)
      
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        throw new Error(`ไม่สามารถดำเนินการได้`)
      }

      const data = await response.json()
      if (data.success) {
        toast.success(data.message)
        // Refresh data
        await fetchUsers()
        await fetchStats()
      } else {
        throw new Error(data.error || 'เกิดข้อผิดพลาด')
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      toast.error(errorMessage)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 border-green-200">อนุมัติแล้ว</Badge>
      case 'UNAPPROVED':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">รอการอนุมัติ</Badge>
      case 'SUSPENDED':
        return <Badge className="bg-red-100 text-red-800 border-red-200">ระงับการใช้งาน</Badge>
      case 'INACTIVE':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">ไม่ใช้งาน</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionButtons = (user: User) => {
    const isCurrentUser = user.id === currentUser?.id

    if (isCurrentUser) {
      return (
        <div className="text-sm text-gray-500 italic">
          (คุณเอง)
        </div>
      )
    }

    switch (user.status) {
      case 'UNAPPROVED':
        return (
          <div className="flex space-x-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  disabled={actionLoading === user.id}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  อนุมัติ
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ยืนยันการอนุมัติผู้ใช้งาน</AlertDialogTitle>
                  <AlertDialogDescription>
                    คุณต้องการอนุมัติให้ "{user.fullName}" สามารถเข้าใช้งานระบบได้หรือไม่?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleUserAction(user.id, 'approve')}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={actionLoading === user.id}
                  >
                    อนุมัติ
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 flex-1"
                  disabled={actionLoading === user.id}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  ปฏิเสธ
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ยืนยันการปฏิเสธผู้ใช้งาน</AlertDialogTitle>
                  <AlertDialogDescription>
                    คุณต้องการปฏิเสธการสมัครของ "{user.fullName}" หรือไม่? 
                    ผู้ใช้นี้จะไม่สามารถเข้าใช้งานระบบได้
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleUserAction(user.id, 'suspend')}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={actionLoading === user.id}
                  >
                    ปฏิเสธ
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )

      case 'APPROVED':
        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                disabled={actionLoading === user.id}
              >
                <UserX className="h-4 w-4 mr-1" />
                ระงับ
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ยืนยันการระงับผู้ใช้งาน</AlertDialogTitle>
                <AlertDialogDescription>
                  คุณต้องการระงับการใช้งานของ "{user.fullName}" หรือไม่?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleUserAction(user.id, 'suspend')}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={actionLoading === user.id}
                >
                  ระงับ
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )

      case 'SUSPENDED':
        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={actionLoading === user.id}
              >
                <UserCheck className="h-4 w-4 mr-1" />
                เปิดใช้งาน
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ยืนยันการเปิดใช้งานผู้ใช้</AlertDialogTitle>
                <AlertDialogDescription>
                  คุณต้องการเปิดใช้งานให้ "{user.fullName}" หรือไม่?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleUserAction(user.id, 'activate')}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={actionLoading === user.id}
                >
                  เปิดใช้งาน
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )

      default:
        return null
    }
  }

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const pendingUsers = users.filter(user => user.status === 'UNAPPROVED')
  const approvedUsers = users.filter(user => user.status === 'APPROVED')
  const suspendedUsers = users.filter(user => user.status === 'SUSPENDED')

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">การจัดการผู้ใช้งาน</h1>
            <p className="text-gray-600 text-sm">อนุมัติและจัดการสถานะผู้ใช้งาน</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchUsers()
              fetchStats()
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600">รอการอนุมัติ</p>
                <p className="text-xl font-bold text-yellow-800">{stats.totalPending}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600">อนุมัติแล้ว</p>
                <p className="text-xl font-bold text-green-800">{stats.totalApproved}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-red-600">ระงับ</p>
                <p className="text-xl font-bold text-red-800">{stats.totalSuspended}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">ทั้งหมด</p>
                <p className="text-xl font-bold text-blue-800">{users.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* No Pending Users */}
      {pendingUsers.length === 0 && !isLoading && (
        <Card className="text-center p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">ไม่มีผู้ใช้งานรอการอนุมัติ</h3>
              <p className="text-gray-600 text-sm">ผู้ใช้งานทั้งหมดได้รับการอนุมัติแล้ว</p>
            </div>
          </div>
        </Card>
      )}

      {/* All Users */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span>ผู้ใช้งานทั้งหมด ({users.length} คน)</span>
        </h2>
        
        <div className="space-y-3">
          {users.map(user => (
            <Card key={user.id} className={`border-l-4 ${
              user.status === 'APPROVED' ? 'border-l-green-400' :
              user.status === 'UNAPPROVED' ? 'border-l-yellow-400' :
              user.status === 'SUSPENDED' ? 'border-l-red-400' : 'border-l-gray-400'
            }`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{user.fullName}</h3>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                    {user.position && (
                      <p className="text-xs text-gray-500 mt-1">{user.position}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>สมัครเมื่อ {formatDate(user.createdAt)}</span>
                      </div>
                      {user.lastLogin && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>เข้าใช้ล่าสุด {formatDate(user.lastLogin)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    {getStatusBadge(user.status)}
                    {getActionButtons(user)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="text-center p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </Card>
      )}
    </div>
  )
}