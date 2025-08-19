// lib/api/dashboard.ts - Fixed TypeScript errors
// Client-side API utilities สำหรับ Dashboard

import { ApiResponse, DashboardApiData, StockUpdateRequest, TransferActionRequest } from '@/lib/types/api'
import type { Stock as DashboardStock, Transfer, Transaction } from '@/types/dashboard'
import type { TransferDetails } from '@/types/transfer'

// Enhanced request body types
export interface CreateTransferRequest {
  fromDepartment: 'PHARMACY' | 'OPD'
  toDepartment: 'PHARMACY' | 'OPD'
  title: string
  purpose: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  requestNote?: string
  items: {
    drugId: string
    requestedQty: number
    note?: string
  }[]
}

export interface TransactionHistoryResponse {
  transactions: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface StockDetailResponse {
  stock: DashboardStock
  recentTransactions: Transaction[]
  batchInfo?: {
    id: string
    lotNumber: string
    expiryDate: string
    quantity: number
    manufacturer?: string
  }[]
}

export interface TransferActionResponse {
  success: boolean
  message: string
  transfer: Transfer
}

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: Record<string, unknown> | CreateTransferRequest | StockUpdateRequest | TransferActionRequest
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
      credentials: 'include', // ใช้ cookies สำหรับ authentication
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
  async updateStock(data: StockUpdateRequest): Promise<ApiResponse<StockDetailResponse>> {
    return this.request<StockDetailResponse>('/stock/update', {
      method: 'POST',
      body: data
    })
  }

  async getStockDetail(stockId: string): Promise<ApiResponse<StockDetailResponse>> {
    return this.request<StockDetailResponse>(`/stock/${stockId}`)
  }

  // Transfer Management APIs
  async performTransferAction(data: TransferActionRequest): Promise<ApiResponse<TransferActionResponse>> {
    return this.request<TransferActionResponse>('/transfer/action', {
      method: 'POST',
      body: data
    })
  }

  async getTransferDetail(transferId: string): Promise<ApiResponse<TransferDetails>> {
    return this.request<TransferDetails>(`/transfer/${transferId}`)
  }

  async createTransfer(data: CreateTransferRequest): Promise<ApiResponse<TransferDetails>> {
    return this.request<TransferDetails>('/transfer/create', {
      method: 'POST',
      body: data
    })
  }

  // Transaction History APIs
  async getTransactionHistory(
    department: 'PHARMACY' | 'OPD', 
    page = 1, 
    limit = 50
  ): Promise<ApiResponse<TransactionHistoryResponse>> {
    return this.request<TransactionHistoryResponse>(
      `/transactions?department=${department}&page=${page}&limit=${limit}`
    )
  }

  // Bulk operations APIs
  async bulkStockUpdate(data: {
    updates: StockUpdateRequest[]
    reason: string
  }): Promise<ApiResponse<{ updated: number; failed: number }>> {
    return this.request('/stock/bulk-update', {
      method: 'POST',
      body: data
    })
  }

  // Search APIs
  async searchDrugs(query: string, department?: 'PHARMACY' | 'OPD'): Promise<ApiResponse<{
    drugs: Array<{
      id: string
      hospitalDrugCode: string
      name: string
      genericName?: string
      unit: string
      currentStock: number
    }>
  }>> {
    const params = new URLSearchParams({ q: query })
    if (department) params.append('department', department)
    
    return this.request(`/search/drugs?${params.toString()}`)
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

// Enhanced Stock Management Hook
export function useStockOperations() {
  const { toast } = useToast()

  const updateStock = useCallback(async (data: StockUpdateRequest) => {
    try {
      const response = await dashboardApi.updateStock(data)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update stock')
      }

      toast({
        title: "ปรับสต็อกสำเร็จ",
        description: "ข้อมูลสต็อกได้รับการอัปเดตแล้ว",
        duration: 3000
      })

      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed'
      
      toast({
        title: "เกิดข้อผิดพลาดในการปรับสต็อก",
        description: errorMessage,
        variant: "destructive",
        duration: 4000
      })
      
      throw error
    }
  }, [toast])

  return { updateStock }
}

// Transfer Operations Hook
export function useTransferOperations() {
  const { toast } = useToast()

  const performAction = useCallback(async (data: TransferActionRequest) => {
    try {
      const response = await dashboardApi.performTransferAction(data)
      
      if (!response.success) {
        throw new Error(response.error || 'Action failed')
      }

      toast({
        title: "ดำเนินการสำเร็จ",
        description: "การดำเนินการได้รับการบันทึกแล้ว",
        duration: 3000
      })

      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Action failed'
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
        duration: 4000
      })
      
      throw error
    }
  }, [toast])

  const createTransfer = useCallback(async (data: CreateTransferRequest) => {
    try {
      const response = await dashboardApi.createTransfer(data)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create transfer')
      }

      toast({
        title: "สร้างใบเบิกสำเร็จ",
        description: "ใบเบิกได้รับการสร้างแล้ว",
        duration: 3000
      })

      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Creation failed'
      
      toast({
        title: "เกิดข้อผิดพลาดในการสร้างใบเบิก",
        description: errorMessage,
        variant: "destructive",
        duration: 4000
      })
      
      throw error
    }
  }, [toast])

  return { performAction, createTransfer }
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
    'RECEIVE_EXTERNAL': 'รับเข้า',
    'DISPENSE_EXTERNAL': 'จ่ายออก',
    'ADJUST_INCREASE': 'ปรับเพิ่ม',
    'ADJUST_DECREASE': 'ปรับลด',
    'TRANSFER_IN': 'โอนเข้า',
    'TRANSFER_OUT': 'โอนออก',
    'RESERVE': 'จองยา',
    'UNRESERVE': 'ยกเลิกจอง'
  }
  return labels[type] || type
}

export function getTransferStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'PENDING': 'รอดำเนินการ',
    'APPROVED': 'อนุมัติแล้ว',
    'PREPARED': 'เตรียมจ่ายแล้ว',
    'DELIVERED': 'ส่งมอบแล้ว',
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