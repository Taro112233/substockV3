// 📄 File: components/modules/dashboard/transfer-tab.tsx

import { Button } from '@/components/ui/button'
import { TransferCard } from '@/components/modules/transfer/transfer-card'
import { Transfer } from '@/types/dashboard'
import { Plus } from 'lucide-react'

interface TransferTabProps {
  transfers: Transfer[]
  department: 'PHARMACY' | 'OPD'
  onTransferAction?: (transferId: string, action: string) => void
  onViewDetail?: (transfer: Transfer) => void
  onCreateNew?: () => void
}

export function TransferTab({ 
  transfers, 
  department, 
  onTransferAction, 
  onViewDetail,
  onCreateNew 
}: TransferTabProps) {
  const departmentConfig = {
    PHARMACY: {
      title: 'ใบเบิกของ',
      buttonText: 'สร้างใบเบิกใหม่',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    },
    OPD: {
      title: 'ใบเบิกของ',
      buttonText: 'เบิกยาใหม่',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    }
  }

  const config = departmentConfig[department]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{config.title}</h2>
        <Button className={config.buttonColor} onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          {config.buttonText}
        </Button>
      </div>

      <div className="grid gap-4">
        {transfers.map((transfer) => (
          <TransferCard
            key={transfer.id}
            transfer={transfer}
            userDepartment={department}
            onAction={onTransferAction}
            onViewDetail={onViewDetail}
          />
        ))}
      </div>

      {transfers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>ยังไม่มีใบเบิกของ</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={onCreateNew}
          >
            {config.buttonText}
          </Button>
        </div>
      )}
    </div>
  )
}