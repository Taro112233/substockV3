// 📄 File: lib/utils/transfer-status.ts

import type { TransferStatusType } from '@/types/transfer'
import { 
  Clock, 
  CheckCircle, 
  Package, 
  XCircle 
} from 'lucide-react'

export const TRANSFER_STATUS_CONFIG = {
  PENDING: {
    label: 'รออนุมัติ',
    description: 'รอแผนกเภสัชกรรมอนุมัติ',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    text: 'รออนุมัติ',
    icon: Clock,
    canEdit: true
  },
  APPROVED: {
    label: 'อนุมัติแล้ว',
    description: 'รอเตรียมจ่ายยา',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    text: 'อนุมัติแล้ว',
    icon: CheckCircle,
    canEdit: false
  },
  PREPARED: {
    label: 'เตรียมจ่ายแล้ว',
    description: 'พร้อมมารับยา',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    text: 'เตรียมจ่ายแล้ว',
    icon: Package,
    canEdit: false
  },
  DELIVERED: {
    label: 'ส่งมอบแล้ว',
    description: 'ดำเนินการเสร็จสิ้น',
    color: 'bg-green-100 text-green-700 border-green-200',
    text: 'ส่งมอบแล้ว',
    icon: CheckCircle,
    canEdit: false
  },
  CANCELLED: {
    label: 'ยกเลิก',
    description: 'ใบเบิกถูกยกเลิก',
    color: 'bg-red-100 text-red-700 border-red-200',
    text: 'ยกเลิก',
    icon: XCircle,
    canEdit: false
  }
} as const

export type TransferStatusType = keyof typeof TRANSFER_STATUS_CONFIG

export function getStatusConfig(status: TransferStatusType) {
  return TRANSFER_STATUS_CONFIG[status] || TRANSFER_STATUS_CONFIG.PENDING
}

export function getAvailableActions(
  status: TransferStatusType,
  userDepartment: 'PHARMACY' | 'OPD',
  transferFromDept: 'PHARMACY' | 'OPD',
  transferToDept: 'PHARMACY' | 'OPD'
) {
  const isRequester = transferFromDept === userDepartment
  const isReceiver = transferToDept === userDepartment
  
  const actions: Array<{
    action: string
    label: string
    variant: 'default' | 'destructive' | 'outline'
    type: 'navigate' | 'quick'
    icon: any
  }> = []

  if (isReceiver) {
    // Receiving department actions (คลังยา)
    switch (status) {
      case 'PENDING':
        actions.push(
          { action: 'approve', label: 'อนุมัติ', variant: 'default', type: 'navigate', icon: CheckCircle },
          { action: 'reject', label: 'ปฏิเสธ', variant: 'destructive', type: 'quick', icon: XCircle }
        )
        break
      case 'APPROVED':
        actions.push(
          { action: 'prepare', label: 'เตรียมจ่าย', variant: 'default', type: 'navigate', icon: Package }
        )
        break
    }
  }

  if (isRequester) {
    // Requesting department actions (OPD)
    switch (status) {
      case 'PENDING':
        actions.push(
          { action: 'cancel', label: 'ยกเลิก', variant: 'destructive', type: 'quick', icon: XCircle }
        )
        break
      case 'PREPARED':
        actions.push(
          { action: 'receive', label: 'รับยา', variant: 'default', type: 'navigate', icon: CheckCircle }
        )
        break
    }
  }

  return actions
}