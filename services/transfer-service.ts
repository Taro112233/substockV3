// 📄 File: services/transfer-service.ts - Updated for cookie auth

import type { TransferDetails } from '@/types/transfer'

class TransferService {
  private getAuthHeaders() {
    // ไม่ใช้ localStorage เพราะ server-side cookies
    return {
      'Content-Type': 'application/json'
    }
  }

  async getTransferDetails(id: string): Promise<TransferDetails> {
    const response = await fetch(`/api/transfers/${id}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include' // Important: ส่ง cookies
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch transfer: ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch transfer details')
    }

    return result.data
  }

  async performAction(
    transferId: string, 
    action: string, 
    data: { note?: string; items?: any[] }
  ): Promise<void> {
    const response = await fetch(`/api/transfers/${transferId}/actions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include', // Important: ส่ง cookies
      body: JSON.stringify({
        action,
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`Action failed: ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Action failed')
    }
  }

  async getTransfersByDepartment(department: 'PHARMACY' | 'OPD') {
    const endpoint = department === 'PHARMACY' 
      ? '/api/transfers/pharmacy' 
      : '/api/transfers/opd'

    const response = await fetch(endpoint, {
      headers: this.getAuthHeaders(),
      credentials: 'include', // Important: ส่ง cookies
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch transfers: ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch transfers')
    }

    return result.data
  }
}

export const transferService = new TransferService()