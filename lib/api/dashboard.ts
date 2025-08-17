// 📄 File: lib/api/dashboard.ts
// Client-side API utilities สำหรับ Dashboard

import { ApiResponse, DashboardApiData, StockUpdateRequest, TransferActionRequest } from '@/lib/types/api'

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  headers?: Record<string, string>
  cache?: RequestCache
}

class DashboardApiClient {
  private baseUrl = '/api/dashboard'

  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      cache = 'no-store'
    } = options

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      cache,
    }

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error)
      throw error
    }
  }

  // Dashboard Data APIs
  async getPharmacyDashboard(): Promise<ApiResponse<DashboardApiData>> {
    return this.request<DashboardApiData>('/pharmacy')
  }

  async getOpdDashboard(): Promise<ApiResponse<DashboardApiData>> {
    return this.request<DashboardApiData>('/opd')
  }

  // Stock Management APIs
  async updateStock(data: StockUpdateRequest): Promise<ApiResponse<any>> {
    return this.request('/stock/update', {
      method: 'POST',
      body: data
    })
  }

  async getStockDetail(stockId: string): Promise<ApiResponse<any>> {
    return this.request(`/stock/${stockId}`)
  }

  // Transfer Management APIs
  async performTransferAction(data: TransferActionRequest): Promise<ApiResponse<any>> {
    return this.request('/transfer/action', {
      method: 'POST',
      body: data
    })
  }

  async getTransferDetail(transferId: string): Promise<ApiResponse<any>> {
    return this.request(`/transfer/${transferId}`)
  }

  async createTransfer(data: any): Promise<ApiResponse<any>> {
    return this.request('/transfer/create', {
      method: 'POST',
      body: data
    })
  }

  // Transaction History APIs
  async getTransactionHistory(department: 'PHARMACY' | 'OPD', page = 1, limit = 50): Promise<ApiResponse<any>> {
    return this.request(`/transactions?department=${department}&page=${page}&limit=${limit}`)
  }
}

export const dashboardApi = new DashboardApiClient()

// React Hook สำหรับ Dashboard Data
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

export function useDashboardData(department: 'PHARMACY' | 'OPD') {
  const [data, setData] = useState<DashboardApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = useCallback(async (showToast = false) => {
    try {
      setError(null)
      if (showToast) setLoading(true)

      const response = department === 'PHARMACY' 
        ? await dashboardApi.getPharmacyDashboard()
        : await dashboardApi.getOpdDashboard()

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch data')
      }

      setData(response.data!)
      
      if (showToast) {
        toast({
          title: "ข้อมูลอัปเดตแล้ว",
          description: "ข้อมูลล่าสุดถูกโหลดเรียบร้อย",
          duration: 2000
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }, [department, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = useCallback(() => {
    fetchData(true)
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refresh,
    refetch: fetchData
  }
}

// Utility Functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'RECEIVE': 'รับเข้า',
    'DISPENSE': 'จ่ายออก',
    'ADJUST_IN': 'ปรับเพิ่ม',
    'ADJUST_OUT': 'ปรับลด',
    'TRANSFER_IN': 'โอนเข้า',
    'TRANSFER_OUT': 'โอนออก',
    'EXPIRE': 'หมดอายุ',
    'DAMAGED': 'เสียหาย'
  }
  return labels[type] || type
}

export function getTransferStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'PENDING': 'รอดำเนินการ',
    'APPROVED': 'อนุมัติแล้ว',
    'SENT': 'ส่งแล้ว',
    'RECEIVED': 'รับแล้ว',
    'CANCELLED': 'ยกเลิก'
  }
  return labels[status] || status
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    'LOW': 'ต่ำ',
    'MEDIUM': 'ปกติ',
    'HIGH': 'สูง',
    'URGENT': 'เร่งด่วน'
  }
  return labels[priority] || priority
}