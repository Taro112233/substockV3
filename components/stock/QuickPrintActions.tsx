// components/stock/QuickPrintActions.tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Printer, FileText, AlertTriangle, Clipboard, ChevronDown } from 'lucide-react'
import { usePrintPDF } from '@/hooks/usePrintPDF'
import { StockPrintData, Department } from '@/types/print'
import { PharmacyPrintTemplate } from '@/components/print/PharmacyPrintTemplate'

interface QuickPrintActionsProps {
  stocks: StockPrintData[]
  department: Department
}

export function QuickPrintActions({ stocks, department }: QuickPrintActionsProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentFormat, setCurrentFormat] = useState<'stock-summary' | 'requisition-form' | 'low-stock-report'>('stock-summary')
  const { generateAndPrintPDF } = usePrintPDF()
  
  const lowStockItems = stocks.filter(s => s.totalQuantity <= s.minimumStock)
  const departmentName = department === 'PHARMACY' ? 'คลังยา' : 'OPD'

  const quickActions = [
    {
      id: 'stock-summary' as const,
      label: 'สรุปสต็อก',
      icon: FileText,
      count: stocks.length,
      color: 'text-blue-600',
      data: stocks
    },
    {
      id: 'requisition-form' as const,
      label: 'ใบเบิกยา', 
      icon: Clipboard,
      count: stocks.length,
      color: 'text-green-600',
      data: stocks
    },
    {
      id: 'low-stock-report' as const,
      label: 'ยาใกล้หมด',
      icon: AlertTriangle,
      count: lowStockItems.length,
      color: 'text-red-600',
      data: lowStockItems
    }
  ]

  const handleQuickPrint = async (actionId: typeof quickActions[0]['id']) => {
    const action = quickActions.find(a => a.id === actionId)
    if (!action || action.count === 0) return

    setCurrentFormat(actionId)
    setIsVisible(true)

    setTimeout(async () => {
      try {
        const filename = `${action.label}_${departmentName}`.replace(/\s+/g, '-')
        
        await generateAndPrintPDF('print-preview', {
          filename,
          orientation: 'portrait'
        })
      } catch (error) {
        console.error('Print failed:', error)
      } finally {
        setIsVisible(false)
      }
    }, 100)
  }

  if (stocks.length === 0) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            พิมพ์เอกสาร
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            เลือกรูปแบบเอกสาร ({departmentName})
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {quickActions.map((action) => (
            <DropdownMenuItem
              key={action.id}
              onClick={() => handleQuickPrint(action.id)}
              disabled={action.count === 0}
              className="flex items-start gap-3 p-3 cursor-pointer"
            >
              <action.icon className={`w-4 h-4 mt-0.5 ${action.color}`} />
              <div className="flex-1">
                <div className="font-medium">{action.label}</div>
                <div className="text-xs text-muted-foreground">
                  {action.count} รายการ
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden Print Preview */}
      {isVisible && (
        <div className="fixed -top-[99999px] left-0 pointer-events-none">
          <div id="print-preview">
            <PharmacyPrintTemplate
              stocks={quickActions.find(a => a.id === currentFormat)?.data || []}
              format={currentFormat}
              department={department}
              includeDate={true}
              includeSignature={true}
            />
          </div>
        </div>
      )}
    </>
  )
}