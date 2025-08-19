// 📄 File: app/dashboard/opd/page.tsx

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StockManagementTab } from '@/components/modules/dashboard/stock-management-tab'
import { TransferTab } from '@/components/modules/dashboard/transfer-tab'
import { HistoryTab } from '@/components/modules/dashboard/history-tab'
import { TransferDetailModal } from '@/components/modules/transfer/transfer-detail-modal'
import { Transfer } from '@/types/dashboard'
import { Package, FileText, History } from 'lucide-react'

export default function OpdDashboard() {
  const [activeTransfer, setActiveTransfer] = useState<Transfer | null>(null)

  // Mock user data - ในระบบจริงจะดึงจาก authentication context
  const user = {
    firstName: 'สมหญิง',
    lastName: 'พยาบาล',
    position: 'พยาบาลหัวหน้า',
    department: 'OPD' as const
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ระบบจัดการสต็อกยา - แผนก OPD
          </h1>
          <p className="text-gray-600 mt-1">
            ยินดีต้อนรับ คุณ{user.firstName} {user.lastName} ({user.position})
          </p>
          <p className="text-xs text-gray-500 mt-1">
            อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}
          </p>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">จัดการสต็อก</span>
            <span className="sm:hidden">สต็อก</span>
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">ใบเบิกของ</span>
            <span className="sm:hidden">เบิกของ</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">ประวัติ</span>
            <span className="sm:hidden">ประวัติ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <StockManagementTab 
            department="OPD"
          />
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <TransferTab 
            department="OPD"
            onViewDetail={setActiveTransfer}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <HistoryTab 
            department="OPD"
          />
        </TabsContent>
      </Tabs>

      {/* Transfer Detail Modal */}
      {activeTransfer && (
        <TransferDetailModal
          transfer={activeTransfer}
          isOpen={!!activeTransfer}
          onClose={() => setActiveTransfer(null)}
        />
      )}

      {/* Footer Information */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
          <div>
            Hospital Pharmacy Management System V3.0 - Separate API Architecture
          </div>
          <div className="mt-2 sm:mt-0">
            ระบบอัปเดตข้อมูลแบบเรียลไทม์
          </div>
        </div>
      </div>
    </div>
  )
}