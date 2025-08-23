// lib/utils/transfer-status.ts
import { CheckCircle, Clock, Package, XCircle, type LucideIcon } from 'lucide-react';

// Define TransferStatusType locally to avoid conflicts
export type TransferStatusType = 'PENDING' | 'APPROVED' | 'PREPARED' | 'DELIVERED' | 'CANCELLED';

export interface TransferActionConfig {
  label: string;
  action: string;
  variant: 'default' | 'destructive' | 'outline';
  icon: LucideIcon;
  type: 'navigate' | 'quick';
}

export interface StatusConfig {
  color: string;
  text: string;
  icon: LucideIcon;
  description: string;
}

export function getStatusConfig(status: TransferStatusType): StatusConfig {
  const configs: Record<TransferStatusType, StatusConfig> = {
    'PENDING': { 
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      text: 'รออนุมัติ',
      icon: Clock,
      description: 'รอแผนกคลังยาอนุมัติ'
    },
    'APPROVED': { 
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      text: 'อนุมัติแล้ว',
      icon: CheckCircle,
      description: 'รอเตรียมจ่ายยา'
    },
    'PREPARED': { 
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      text: 'เตรียมจ่ายแล้ว',
      icon: Package,
      description: 'พร้อมมารับยา'
    },
    'DELIVERED': { 
      color: 'bg-green-100 text-green-700 border-green-200',
      text: 'ส่งมอบแล้ว',
      icon: CheckCircle,
      description: 'ดำเนินการเสร็จสิ้น'
    },
    'CANCELLED': { 
      color: 'bg-red-100 text-red-700 border-red-200',
      text: 'ยกเลิก',
      icon: XCircle,
      description: 'ใบเบิกถูกยกเลิก'
    }
  };
  
  return configs[status] || configs.PENDING;
}

export function getAvailableActions(
  status: TransferStatusType,
  userDepartment: 'PHARMACY' | 'OPD',
  fromDept: 'PHARMACY' | 'OPD',
  toDept: 'PHARMACY' | 'OPD'
): TransferActionConfig[] {
  const actions: TransferActionConfig[] = [];
  
  // Determine user perspective
  const isRequester = userDepartment === fromDept;
  const isApprover = userDepartment === toDept;
  
  if (isApprover) {
    // Receiving department (คลังยา) perspective
    switch (status) {
      case 'PENDING':
        actions.push({
          label: 'อนุมัติ',
          action: 'approve',
          variant: 'default',
          icon: CheckCircle,
          type: 'navigate'
        });
        actions.push({
          label: 'ปฏิเสธ',
          action: 'reject',
          variant: 'destructive',
          icon: XCircle,
          type: 'quick'
        });
        break;
      case 'APPROVED':
        actions.push({
          label: 'เตรียมจ่าย',
          action: 'prepare',
          variant: 'default',
          icon: Package,
          type: 'navigate'
        });
        break;
    }
  }
  
  if (isRequester) {
    // Requesting department (OPD) perspective
    switch (status) {
      case 'PENDING':
        actions.push({
          label: 'ยกเลิก',
          action: 'cancel',
          variant: 'destructive',
          icon: XCircle,
          type: 'quick'
        });
        break;
      case 'PREPARED':
        actions.push({
          label: 'รับยา',
          action: 'receive',
          variant: 'default',
          icon: CheckCircle,
          type: 'navigate'
        });
        break;
    }
  }
  
  return actions;
}

export function getTransferPerspective(
  fromDept: 'PHARMACY' | 'OPD',
  toDept: 'PHARMACY' | 'OPD',
  userDept: 'PHARMACY' | 'OPD'
) {
  if (userDept === fromDept) {
    return { 
      type: 'outgoing' as const, 
      action: 'จ่ายให้',
      counterpart: toDept 
    };
  } else {
    return { 
      type: 'incoming' as const, 
      action: 'รับจาก',
      counterpart: fromDept 
    };
  }
}

export function getDepartmentLabel(dept: 'PHARMACY' | 'OPD'): string {
  return dept === 'PHARMACY' ? 'คลังยา' : 'OPD';
}

export function getStatusBadgeClass(status: TransferStatusType): string {
  const config = getStatusConfig(status);
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`;
}

// Helper function สำหรับ mapping status เป็น priority level
export function getStatusPriority(status: TransferStatusType): number {
  const priorityMap: Record<TransferStatusType, number> = {
    'PENDING': 1,     // ลำดับความสำคัญสูงสุด
    'APPROVED': 2,
    'PREPARED': 3,
    'DELIVERED': 4,
    'CANCELLED': 5    // ลำดับความสำคัญต่ำสุด
  };
  
  return priorityMap[status] || 999;
}

// Helper function สำหรับเช็คว่า action สามารถทำได้หรือไม่
export function canPerformAction(
  action: string,
  status: TransferStatusType,
  userDepartment: 'PHARMACY' | 'OPD',
  fromDept: 'PHARMACY' | 'OPD',
  toDept: 'PHARMACY' | 'OPD'
): boolean {
  const availableActions = getAvailableActions(status, userDepartment, fromDept, toDept);
  return availableActions.some(a => a.action === action);
}

// Helper function สำหรับ status transition validation
export function isValidStatusTransition(
  currentStatus: TransferStatusType,
  newStatus: TransferStatusType
): boolean {
  const validTransitions: Record<TransferStatusType, TransferStatusType[]> = {
    'PENDING': ['APPROVED', 'CANCELLED'],
    'APPROVED': ['PREPARED', 'CANCELLED'],
    'PREPARED': ['DELIVERED', 'CANCELLED'],
    'DELIVERED': [], // Terminal state
    'CANCELLED': []  // Terminal state
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}