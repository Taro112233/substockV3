// 📄 File: components/modules/transfer/transfer-signatures.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'
import type { TransferDetails } from '@/types/transfer'

interface TransferSignaturesProps {
  transfer: TransferDetails
}

export function TransferSignatures({ transfer }: TransferSignaturesProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const signatures = [
    {
      label: 'ผู้เบิก',
      person: transfer.requester,
      date: transfer.requestedAt,
      status: 'completed'
    },
    {
      label: 'ผู้อนุมัติ',
      person: transfer.approver,
      date: transfer.approvedAt,
      status: transfer.approver ? 'completed' : 'pending'
    },
    {
      label: 'ผู้จ่าย',
      person: transfer.dispenser,
      date: transfer.dispensedAt,
      status: transfer.dispenser ? 'completed' : 'pending'
    },
    {
      label: 'ผู้รับ',
      person: transfer.receiver,
      date: transfer.receivedAt,
      status: transfer.receiver ? 'completed' : 'pending'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          ลายเซ็นผู้เกี่ยวข้อง
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {signatures.map((sig) => (
            <div key={sig.label}>
              <label className="text-sm text-gray-500">{sig.label}</label>
              <div className="mt-2 p-3 border border-gray-200 rounded-lg">
                {sig.person ? (
                  <>
                    <p className="font-medium">
                      {sig.person.firstName} {sig.person.lastName}
                    </p>
                    {sig.person.position && (
                      <p className="text-sm text-gray-600">{sig.person.position}</p>
                    )}
                    {sig.date && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(sig.date)}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">
                    {sig.status === 'pending' ? 'รอดำเนินการ' : 'ไม่ระบุ'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}