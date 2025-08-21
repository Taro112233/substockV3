// 📄 File: components/modules/transfer/transfer-detail-modal.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from './status-badge'
import { Transfer } from '@/types/dashboard'
import { FileText, Package, User, Calendar, MessageSquare } from 'lucide-react'
import { getDepartmentLabel } from '@/lib/utils/transfer-status'
import { formatDateTime } from '@/lib/api/dashboard'

interface TransferDetailModalProps {
  transfer: Transfer
  isOpen: boolean
  onClose: () => void
}

export function TransferDetailModal({
  transfer,
  isOpen,
  onClose
}: TransferDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            รายละเอียดใบเบิก {transfer.transferNumber}
            <StatusBadge status={transfer.status} />
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="request" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">ใบเบิก</TabsTrigger>
            <TabsTrigger value="delivery">ใบรับของ</TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="space-y-4">
            {/* Transfer Header Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  ข้อมูลการเบิก
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">จาก:</span>
                    <p className="font-medium">{getDepartmentLabel(transfer.fromDepartment)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">ไปยัง:</span>
                    <p className="font-medium">{getDepartmentLabel(transfer.toDepartment)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">ผู้ขอเบิก:</span>
                    <p className="font-medium">{transfer.requestedBy.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">วันที่ขอ:</span>
                    <p className="font-medium">{formatDateTime(transfer.requestedAt)}</p>
                  </div>
                </div>

                {transfer.notes && (
                  <div>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      หมายเหตุ:
                    </span>
                    <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                      {transfer.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  รายการยาที่ขอเบิก ({transfer.items.length} รายการ)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">รหัสยา</th>
                        <th className="text-left p-2">ชื่อยา</th>
                        <th className="text-right p-2">จำนวนขอ</th>
                        <th className="text-right p-2">หน่วย</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfer.items.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-mono text-xs">
                            {item.drug.hospitalDrugCode}
                          </td>
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{item.drug.name}</div>
                              {item.drug.strength && (
                                <div className="text-gray-500 text-xs">{item.drug.strength}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-right font-medium">
                            {item.requestedQty.toLocaleString()}
                          </td>
                          <td className="p-2 text-right">{item.drug.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4">
            {/* Delivery Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  สถานะการส่งมอบ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {transfer.approvedAt && (
                    <div>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <User className="h-4 w-4" />
                        ผู้อนุมัติ:
                      </span>
                      <p className="font-medium">{transfer.approvedBy?.name || '-'}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(transfer.approvedAt)}</p>
                    </div>
                  )}
                  {transfer.sentAt && (
                    <div>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        วันที่ส่ง:
                      </span>
                      <p className="font-medium">{formatDateTime(transfer.sentAt)}</p>
                    </div>
                  )}
                  {transfer.receivedAt && (
                    <div>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        วันที่รับ:
                      </span>
                      <p className="font-medium">{formatDateTime(transfer.receivedAt)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Details Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">รายละเอียดการส่งมอบ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">รหัสยา</th>
                        <th className="text-left p-2">ชื่อยา</th>
                        <th className="text-right p-2">ขอเบิก</th>
                        <th className="text-right p-2">อนุมัติ</th>
                        <th className="text-right p-2">ส่งจริง</th>
                        <th className="text-right p-2">รับจริง</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfer.items.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-mono text-xs">
                            {item.drug.hospitalDrugCode}
                          </td>
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{item.drug.name}</div>
                              {item.drug.strength && (
                                <div className="text-gray-500 text-xs">{item.drug.strength}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-right">
                            {item.requestedQty.toLocaleString()}
                          </td>
                          <td className="p-2 text-right">
                            {item.approvedQty?.toLocaleString() || '-'}
                          </td>
                          <td className="p-2 text-right">
                            {item.sentQty?.toLocaleString() || '-'}
                          </td>
                          <td className="p-2 text-right">
                            {item.receivedQty?.toLocaleString() || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}