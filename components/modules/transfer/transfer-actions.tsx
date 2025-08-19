// 📄 File: components/modules/transfer/transfer-actions.tsx

'use client'

import { Button } from '@/components/ui/button'
import { getAvailableActions } from '@/lib/utils/transfer-status'
import type { TransferDetails } from '@/types/transfer'
import type { AuthUser } from '@/hooks/use-auth'

interface TransferActionsProps {
  transfer: TransferDetails
  user: AuthUser | null
  processing: boolean
  onQuickAction: (action: string) => void
  onNavigateAction: (action: string) => void
}

export function TransferActions({ 
  transfer, 
  user, 
  processing, 
  onQuickAction, 
  onNavigateAction 
}: TransferActionsProps) {
  if (!user) return null
  
  // ใน V3.0 system, user ไม่มี fixed department
  // ใช้ context-based permissions แทน
  const userDepartment = user.department || 'PHARMACY' // Default fallback
  
  const availableActions = getAvailableActions(
    transfer.status,
    userDepartment,
    transfer.fromDept,
    transfer.toDept
  )
  
  if (availableActions.length === 0) return null
  
  return (
    <div className="flex items-center gap-2 justify-end">
      {availableActions.map((action) => {
        const ActionIcon = action.icon
        const handleClick = action.type === 'navigate' 
          ? () => onNavigateAction(action.action)
          : () => onQuickAction(action.action)
        
        return (
          <Button
            key={action.action}
            variant={action.variant}
            size="sm"
            onClick={handleClick}
            disabled={processing}
            className="flex items-center gap-2"
          >
            <ActionIcon className="h-4 w-4" />
            {action.label}
          </Button>
        )
      })}
    </div>
  )
}