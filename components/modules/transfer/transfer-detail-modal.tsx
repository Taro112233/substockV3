// 📄 File: components/modules/transfer/transfer-detail-modal.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/modules/transfer/status-badge'
import { Transfer } from '@/types/dashboard'
import { formatDate } from '@/lib/utils/dashboard'

interface TransferDetailModalProps {
  transfer: Transfer | null
  isOpen: boolean
  onClose: () => void
}

export function TransferDetailModal({ 
  transfer, 
  isOpen, 
  onClose 
}: TransferDetailModalProps) {
  if (!isOpen || !transfer) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{transfer.transferNumber}</CardTitle>
              <CardDescription>
                รายละเอียดใบเบิกยา
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="request" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="request">ใบเบิก</TabsTrigger>
              <TabsTrigger value="receipt">ใบรับของ</TabsTrigger>
            </TabsList>

            <TabsContent value="request" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">จาก</p>
                  <p className="font-semibold">
                    {transfer.fromDept === 'PHARMACY' ? 'คลังยา' : 'แผนก OPD'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ไป</p>
                  <p className="font-semibold">
                    {transfer.toDept === 'PHARMACY' ? 'คลังยา' : 'แผนก OPD'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">สถานะ</p>
                  <StatusBadge status={transfer.status} size="md" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">ผู้ร้องขอ</p>
                  <p className="font-semibold">{transfer.requestedBy}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">รายการยาที่ขอเบิก</h4>
                <div className="space-y-2">
                  {transfer.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{item.drugCode}</p>
                        <p className="text-sm text-gray-600">{item.drugName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.requestedQty} {item.unit}</p>
                        <p className="text-xs text-gray-500">ขอเบิก</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="receipt" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">วันที่อนุมัติ</p>
                  <p className="font-semibold">
                    {transfer.approvedAt ? formatDate(transfer.approvedAt) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">วันที่ส่ง</p>
                  <p className="font-semibold">
                    {transfer.sentAt ? formatDate(transfer.sentAt) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">วันที่รับ</p>
                  <p className="font-semibold">
                    {transfer.receivedAt ? formatDate(transfer.receivedAt) : '-'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">รายการยาที่ส่ง/รับ</h4>
                <div className="space-y-2">
                  {transfer.items.map((item) => (
                    <div key={item.id} className="p-3 border rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{item.drugCode}</p>
                          <p className="text-sm text-gray-600">{item.drugName}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <p className="text-gray-600">ขอเบิก</p>
                          <p className="font-semibold">{item.requestedQty}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600">อนุมัติ</p>
                          <p className="font-semibold">{item.approvedQty || '-'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600">ส่ง/รับจริง</p>
                          <p className="font-semibold">
                            {item.receivedQty || item.sentQty || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}