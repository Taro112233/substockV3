// 📄 File: components/modules/transfer/workflow-progress.tsx (Fixed)

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, Package, Truck, XCircle, type LucideIcon } from 'lucide-react';
import type { TransferDetails } from '@/types/transfer';

interface WorkflowProgressProps {
  transfer: TransferDetails;
}

// Define step types
type StepType = 'requested' | 'approved' | 'prepared' | 'delivered' | 'cancelled'

// Define step config interface
interface StepConfig {
  icon: LucideIcon
  label: string
  timestamp?: string
  user?: { firstName: string; lastName: string } | null
}

export function WorkflowProgress({ transfer }: WorkflowProgressProps) {
  const getStepStatus = (step: StepType) => {
    const statuses: Record<string, StepType[]> = {
      'PENDING': ['requested'],
      'APPROVED': ['requested', 'approved'],
      'PREPARED': ['requested', 'approved', 'prepared'],
      'DELIVERED': ['requested', 'approved', 'prepared', 'delivered'],
      'CANCELLED': ['requested', 'cancelled']
    };
    
    const currentSteps = statuses[transfer.status] || ['requested'];
    
    if (step === 'cancelled' && transfer.status === 'CANCELLED') {
      return 'completed';
    }
    
    if (currentSteps.includes(step)) {
      return 'completed';
    }
    
    // Check if this is the next step
    const allSteps: StepType[] = ['requested', 'approved', 'prepared', 'delivered'];
    const currentIndex = allSteps.findIndex(s => currentSteps.includes(s));
    const stepIndex = allSteps.findIndex(s => s === step);
    
    if (stepIndex === currentIndex + 1) {
      return 'current';
    }
    
    return 'pending';
  };

  const getStepConfig = (step: StepType): StepConfig => {
    const configs: Record<StepType, StepConfig> = {
      'requested': {
        icon: Clock,
        label: 'ส่งคำขอ',
        timestamp: transfer.requestedAt,
        user: transfer.requester
      },
      'approved': {
        icon: CheckCircle,
        label: 'อนุมัติ',
        timestamp: transfer.approvedAt,
        user: transfer.approver
      },
      'prepared': {
        icon: Package,
        label: 'เตรียมจ่าย',
        timestamp: transfer.dispensedAt,
        user: transfer.dispenser
      },
      'delivered': {
        icon: Truck,
        label: 'ส่งมอบ',
        timestamp: transfer.receivedAt,
        user: transfer.receiver
      },
      'cancelled': {
        icon: XCircle,
        label: 'ยกเลิก',
        timestamp: transfer.requestedAt, // Use request time as cancellation time
        user: transfer.requester
      }
    };
    
    return configs[step];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getUserName = (user?: { firstName: string; lastName: string } | null) => {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`;
  };

  const steps: StepType[] = transfer.status === 'CANCELLED' 
    ? ['requested', 'cancelled']
    : ['requested', 'approved', 'prepared', 'delivered'];

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">สถานะการดำเนินการ</h3>
        
        <div className="space-y-4 relative">
          {steps.map((step, index) => {
            const status = getStepStatus(step);
            const config = getStepConfig(step);
            const IconComponent = config.icon;
            
            return (
              <div key={step} className="flex items-start gap-4 relative">
                {/* Icon */}
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 relative z-10
                  ${status === 'completed' ? 'bg-green-100 border-green-500 text-green-700' : ''}
                  ${status === 'current' ? 'bg-blue-100 border-blue-500 text-blue-700' : ''}
                  ${status === 'pending' ? 'bg-gray-100 border-gray-300 text-gray-500' : ''}
                  ${step === 'cancelled' ? 'bg-red-100 border-red-500 text-red-700' : ''}
                `}>
                  <IconComponent className="w-5 h-5" />
                </div>
                
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className={`
                    absolute left-5 top-10 w-0.5 h-6 z-0
                    ${status === 'completed' ? 'bg-green-300' : 'bg-gray-300'}
                  `} />
                )}
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`
                      font-medium
                      ${status === 'completed' ? 'text-green-700' : ''}
                      ${status === 'current' ? 'text-blue-700' : ''}
                      ${status === 'pending' ? 'text-gray-500' : ''}
                      ${step === 'cancelled' ? 'text-red-700' : ''}
                    `}>
                      {config.label}
                    </span>
                    
                    {status === 'completed' && (
                      <Badge variant="secondary" className="text-xs">
                        เสร็จสิ้น
                      </Badge>
                    )}
                    
                    {status === 'current' && (
                      <Badge variant="default" className="text-xs">
                        ดำเนินการ
                      </Badge>
                    )}
                  </div>
                  
                  {config.timestamp && (
                    <p className="text-sm text-gray-600">
                      {formatDate(config.timestamp)}
                    </p>
                  )}
                  
                  {config.user && (
                    <p className="text-sm text-gray-500">
                      โดย: {getUserName(config.user)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
