// 📄 File: app/dashboard/pharmacy/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardStatsCards } from '@/components/modules/dashboard/dashboard-stats'
import { StockManagementTab } from '@/components/modules/dashboard/stock-management-tab'
import { TransferTab } from '@/components/modules/dashboard/transfer-tab'
import { HistoryTab } from '@/components/modules/dashboard/history-tab'
import { TransferDetailModal } from '@/components/modules/transfer/transfer-detail-modal'
import { Stock, Transfer, Transaction, DashboardStats } from '@/types/dashboard'
import { calculateDashboardStats } from '@/lib/utils/dashboard'
import { Package, FileText, History } from 'lucide-react'

export default function PharmacyDashboard() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTransfer, setActiveTransfer] = useState<Transfer | null>(null)

  // Mock user data
  const user = {
    firstName: 'สมชาย',
    lastName: 'เภสัชกร',
    position: 'เภสัชกรรมคลินิก',
    department: 'PHARMACY' as const
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockStocks: Stock[] = [
        {
          id: '1',
          drugId: 'drug1',
          department: 'PHARMACY',
          totalQuantity: 150,
          reservedQty: 20,
          minimumStock: 50,
          totalValue: 7500,
          drug: {
            hospitalDrugCode: 'PAR001',
            name: 'Paracetamol 500mg',
            genericName: 'Paracetamol',
            dosageForm: 'TAB',
            strength: '500mg',
            unit: 'เม็ด',
            category: 'GENERAL'
          }
        },
        {
          id: '2',
          drugId: 'drug2',
          department: 'PHARMACY',
          totalQuantity: 25,
          reservedQty: 5,
          minimumStock: 30,
          totalValue: 12500,
          drug: {
            hospitalDrugCode: 'AMX001',
            name: 'Amoxicillin 250mg',
            genericName: 'Amoxicillin',
            dosageForm: 'CAP',
            strength: '250mg',
            unit: 'แคปซูล',
            category: 'REFER'
          }
        }
      ]

      const mockTransfers: Transfer[] = [
        {
          id: 'TR001',
          transferNumber: 'TR-2024-001',
          fromDept: 'PHARMACY',
          toDept: 'OPD',
          status: 'PENDING',
          totalItems: 2,
          totalValue: 1500,
          requestedAt: '2024-01-20T10:30:00',
          requestedBy: 'พยาบาล OPD',
          items: [
            {
              id: 'TI001',
              drugCode: 'PAR001',
              drugName: 'Paracetamol 500mg',
              requestedQty: 50,
              unit: 'เม็ด'
            },
            {
              id: 'TI002',
              drugCode: 'IBU001',
              drugName: 'Ibuprofen 400mg',
              requestedQty: 30,
              unit: 'เม็ด'
            }
          ]
        },
        {
          id: 'TR002',
          transferNumber: 'TR-2024-002',
          fromDept: 'PHARMACY',
          toDept: 'OPD',
          status: 'SENT',
          totalItems: 1,
          totalValue: 800,
          requestedAt: '2024-01-19T14:15:00',
          requestedBy: 'พยาบาล OPD',
          approvedAt: '2024-01-19T15:00:00',
          sentAt: '2024-01-19T16:30:00',
          items: [
            {
              id: 'TI003',
              drugCode: 'AMX001',
              drugName: 'Amoxicillin 250mg',
              requestedQty: 20,
              approvedQty: 20,
              sentQty: 20,
              unit: 'แคปซูล'
            }
          ]
        }
      ]

      const mockTransactions: Transaction[] = [
        {
          id: 'TX001',
          type: 'TRANSFER_OUT',
          drugCode: 'PAR001',
          drugName: 'Paracetamol 500mg',
          quantity: -50,
          unit: 'เม็ด',
          reference: 'TR-2024-001',
          createdAt: '2024-01-20T10:30:00',
          createdBy: 'สมชาย เภสัชกร'
        },
        {
          id: 'TX002',
          type: 'ADJUSTMENT',
          drugCode: 'AMX001',
          drugName: 'Amoxicillin 250mg',
          quantity: 100,
          unit: 'แคปซูล',
          reference: 'รับยาใหม่',
          createdAt: '2024-01-19T09:15:00',
          createdBy: 'สมชาย เภสัชกร'
        }
      ]

      setStocks(mockStocks)
      setTransfers(mockTransfers)
      setTransactions(mockTransactions)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTransferAction = async (transferId: string, action: string) => {
    console.log(`Action ${action} on transfer ${transferId}`)
    // Implement transfer action logic here
  }

  const handleStockAdjust = (stockId: string) => {
    console.log(`Adjust stock ${stockId}`)
    // Implement stock adjustment logic here
  }

  const handleStockDetail = (stockId: string) => {
    console.log(`View stock detail ${stockId}`)
    // Implement stock detail view logic here
  }

  const handleCreateTransfer = () => {
    console.log('Create new transfer')
    // Implement create transfer logic here
  }

  const handleExportHistory = () => {
    console.log('Export history to Excel')
    // Implement export logic here
  }

  const stats = calculateDashboardStats(stocks, transfers)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          คลังยา Dashboard
        </h1>
        <p className="text-gray-600">สวัสดี, {user.firstName} {user.lastName}</p>
        <p className="text-sm text-gray-500">{user.position}</p>
      </div>

      {/* Quick Stats */}
      <DashboardStatsCards stats={stats} department={user.department} />

      {/* Main Tabs */}
      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="stock" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>จัดการสต็อก</span>
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>ใบเบิกของ</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>ประวัติ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <StockManagementTab
            stocks={stocks}
            department={user.department}
            onStockAdjust={handleStockAdjust}
            onStockDetail={handleStockDetail}
          />
        </TabsContent>

        <TabsContent value="transfers">
          <TransferTab
            transfers={transfers}
            department={user.department}
            onTransferAction={handleTransferAction}
            onViewDetail={setActiveTransfer}
            onCreateNew={handleCreateTransfer}
          />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab
            transactions={transactions}
            onExport={handleExportHistory}
          />
        </TabsContent>
      </Tabs>

      {/* Transfer Detail Modal */}
      <TransferDetailModal
        transfer={activeTransfer}
        isOpen={!!activeTransfer}
        onClose={() => setActiveTransfer(null)}
      />
    </div>
  )
}