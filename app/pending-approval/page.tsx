// app/pending-approval/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  CheckCircle, 
  Phone, 
  Mail, 
  RefreshCw,
  LogOut,
  Hospital,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/app/utils/auth-client'

export default function PendingApprovalPage() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)

  // Redirect if user is approved or not logged in
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (user.status === 'APPROVED') {
        router.push('/dashboard')
      } else if (user.status === 'SUSPENDED') {
        router.push('/suspended')
      }
    }
  }, [user, loading, router])

  const checkApprovalStatus = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          // Update user data in auth context would happen automatically
          // If status changed, useEffect will handle redirect
          if (data.user.status === 'APPROVED') {
            router.push('/dashboard')
          }
        }
      }
    } catch (error) {
      console.error('Error checking approval status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user || user.status !== 'UNAPPROVED') {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <Hospital className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900">Hospital Pharmacy</h1>
              <p className="text-sm text-gray-600">Stock Management System V3.0</p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 bg-orange-100 rounded-full w-20 h-20 flex items-center justify-center">
              <Clock className="h-10 w-10 text-orange-600" />
            </div>
            <CardTitle className="text-xl text-orange-900">รอการอนุมัติ</CardTitle>
            <p className="text-gray-600 text-sm">
              บัญชีของคุณอยู่ระหว่างการตรวจสอบ
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-2">ข้อมูลผู้ใช้งาน</h3>
              <div className="space-y-1 text-sm">
                <p><strong>ชื่อ:</strong> {user.firstName} {user.lastName}</p>
                <p><strong>ชื่อผู้ใช้:</strong> {user.username}</p>
                {user.position && (
                  <p><strong>ตำแหน่ง:</strong> {user.position}</p>
                )}
              </div>
            </div>

            {/* Status Info */}
            <Alert className="border-orange-200 bg-orange-50">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="space-y-2">
                  <p className="font-semibold">สถานะ: รอการอนุมัติ</p>
                  <p className="text-sm">
                    ผู้ดูแลระบบจะตรวจสอบข้อมูลและอนุมัติการใช้งานภายใน 1-2 วันทำการ
                    เมื่อได้รับการอนุมัติแล้ว คุณจะสามารถเข้าใช้งานระบบได้ทันที
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Instructions */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">ขั้นตอนต่อไป:</h4>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">รอการตรวจสอบ</p>
                    <p className="text-gray-600">ผู้ดูแลระบบจะตรวจสอบข้อมูลของคุณ</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">ได้รับการอนุมัติ</p>
                    <p className="text-gray-600">คุณจะได้รับสิทธิ์เข้าใช้งานระบบ</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">เริ่มใช้งาน</p>
                    <p className="text-gray-600">เข้าใช้งานระบบจัดการสต็อกยาได้เต็มรูปแบบ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">ติดต่อสอบถาม</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>โทร: 02-XXX-XXXX ต่อ IT Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email: it-support@hospital.com</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={checkApprovalStatus}
                disabled={isChecking}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    ตรวจสอบสถานะใหม่
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                ออกจากระบบ
              </Button>
            </div>

            {/* Additional Info */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-gray-500">
                หากมีข้อสงสัยเพิ่มเติม กรุณาติดต่อผู้ดูแลระบบ
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Hospital Pharmacy Stock Management System</p>
          <p>© 2025 - Developed by Ai-Sat</p>
        </div>
      </div>
    </div>
  )
}