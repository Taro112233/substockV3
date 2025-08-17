// 📄 File: components/error-boundary.tsx
'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                เกิดข้อผิดพลาดในระบบ
              </h3>
              <p className="text-gray-600">
                ระบบไม่สามารถแสดงข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
              </p>
              {this.state.error && (
                <details className="text-xs text-gray-500 mt-4">
                  <summary className="cursor-pointer">รายละเอียดข้อผิดพลาด</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-left overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button 
                onClick={() => {
                  this.setState({ hasError: false, error: undefined })
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                ลองใหม่
              </Button>
              
              <Button 
                onClick={() => window.location.reload()}
                size="sm"
                className="flex items-center gap-2"
              >
                รีเฟรชหน้า
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook สำหรับ error handling ใน functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error | unknown) => {
    console.error('Dashboard error:', error)
    setError(error instanceof Error ? error : new Error('Unknown error occurred'))
  }, [])

  return { error, resetError, handleError }
}

// Loading Component
export function DashboardLoading({ message = "กำลังโหลดข้อมูล..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <div className="space-y-2">
          <div className="text-lg font-medium text-gray-900">{message}</div>
          <div className="text-sm text-gray-600">
            กรุณารอสักครู่...
          </div>
        </div>
      </div>
    </div>
  )
}

// Empty State Component
export function EmptyState({ 
  title = "ไม่มีข้อมูล", 
  description = "ยังไม่มีข้อมูลในระบบ",
  action
}: { 
  title?: string
  description?: string
  action?: React.ReactNode 
}) {
  return (
    <div className="flex items-center justify-center min-h-[300px] p-8">
      <div className="text-center space-y-4">
        <div className="text-gray-400">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  )
}