// 📄 File: components/modules/transaction/TransactionTableRow.tsx
// ✅ Individual Transaction Table Row Component

import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  RotateCcw,
  Bookmark,
  Settings,
  Edit,
  DollarSign,
  Target
} from "lucide-react";
import { Transaction } from "@/types/dashboard";

interface TransactionTableRowProps {
  transaction: Transaction;
  showExportMode: boolean;
  isSelected: boolean;
  onView: (transaction: Transaction) => void;
  onToggleTransaction: (transactionId: string) => void;
  calculateTransactionCost: (transaction: Transaction) => number;
  getTransactionTypeBadge: (type: string) => { label: string; color: string };
  formatTransactionAmount: (type: string, quantity: number, transaction: Transaction) => {
    value: number;
    formatted: string;
    className: string;
  };
}

export function TransactionTableRow({
  transaction,
  showExportMode,
  isSelected,
  onView,
  onToggleTransaction,
  calculateTransactionCost,
  getTransactionTypeBadge,
  formatTransactionAmount,
}: TransactionTableRowProps) {
  const transactionCost = calculateTransactionCost(transaction);
  const typeConfig = getTransactionTypeBadge(transaction.type);
  const amountData = formatTransactionAmount(transaction.type, transaction.quantity, transaction);

  // Get transaction type icon
  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'RECEIVE_EXTERNAL':
        return <ShoppingCart className="h-4 w-4 text-green-600" />
      case 'DISPENSE_EXTERNAL':
        return <Users className="h-4 w-4 text-red-600" />
      case 'TRANSFER_IN':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'TRANSFER_OUT':
        return <TrendingDown className="h-4 w-4 text-orange-600" />
      case 'ADJUST_INCREASE':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'ADJUST_DECREASE':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'RESERVE':
        return <Bookmark className="h-4 w-4 text-yellow-600" />
      case 'UNRESERVE':
        return <RotateCcw className="h-4 w-4 text-gray-600" />
      case 'MIN_STOCK_INCREASE':
        return <Target className="h-4 w-4 text-blue-600" />
      case 'MIN_STOCK_DECREASE':
        return <Target className="h-4 w-4 text-orange-400" />
      case 'MIN_STOCK_RESET':
        return <Target className="h-4 w-4 text-indigo-600" />
      case 'DATA_UPDATE':
        return <Settings className="h-4 w-4 text-gray-600" />
      case 'PRICE_UPDATE':
        return <DollarSign className="h-4 w-4 text-purple-600" />
      case 'INFO_CORRECTION':
        return <Edit className="h-4 w-4 text-orange-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  // Get category styles
  const getCategoryColor = (category?: string) => {
    const colors = {
      'HAD': 'bg-red-100 text-red-800 border-red-200',
      'NARCOTIC': 'bg-purple-100 text-purple-800 border-purple-200',
      'REFRIGERATED': 'bg-blue-100 text-blue-800 border-blue-200',
      'PSYCHIATRIC': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'FLUID': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'REFER': 'bg-pink-100 text-pink-800 border-pink-200',
      'ALERT': 'bg-orange-100 text-orange-800 border-orange-200',
      'EXTEMP': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'GENERAL': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[category as keyof typeof colors] || colors.GENERAL
  }

  const getCategoryLabel = (category?: string) => {
    const labels = {
      'HAD': 'ยาเสี่ยงสูง',
      'NARCOTIC': 'ยาเสพติด',
      'REFRIGERATED': 'ยาแช่เย็น',
      'PSYCHIATRIC': 'ยาจิตเวช',
      'FLUID': 'สารน้ำ',
      'REFER': 'ยาส่งต่อ',
      'ALERT': 'ยาเฝ้าระวัง',
      'EXTEMP': 'ยาใช้ภายนอก',
      'GENERAL': 'ยาทั่วไป'
    }
    return labels[category as keyof typeof labels] || (category || 'ไม่ระบุ')
  }

  const handleRowClick = () => {
    if (showExportMode) {
      onToggleTransaction(transaction.id);
    } else {
      onView(transaction);
    }
  };

  const categoryColor = getCategoryColor(transaction.drug?.category);
  const categoryLabel = getCategoryLabel(transaction.drug?.category);

  return (
    <TableRow
      className={`border-b transition-all ${
        showExportMode
          ? isSelected
            ? "bg-green-50 hover:bg-green-100"
            : "hover:bg-gray-50"
          : "hover:bg-gray-50/50 cursor-pointer"
      }`}
      onClick={handleRowClick}
    >
      {/* Checkbox Column */}
      {showExportMode && (
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleTransaction(transaction.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
      )}

      {/* ชื่อยา */}
      <TableCell className="font-medium">
        <div className="space-y-2">
          <div className="font-medium text-gray-900 leading-tight">
            {transaction.drug?.name || 'ยาไม่ระบุ'}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={`text-xs ${categoryColor} shrink-0`}
            >
              {categoryLabel}
            </Badge>
            <span className="text-sm text-gray-600 font-mono">
              {transaction.drug?.hospitalDrugCode || '-'}
            </span>
          </div>
          
          {transaction.batchNumber && (
            <div className="text-xs text-gray-500">
              LOT: {transaction.batchNumber}
            </div>
          )}
        </div>
      </TableCell>

      {/* รูปแบบ */}
      <TableCell>
        <div className="text-sm text-gray-700">
          {transaction.drug?.dosageForm || '-'}
        </div>
      </TableCell>

      {/* ความแรง */}
      <TableCell>
        <div className="text-sm text-gray-700">
          {transaction.drug?.strength || ''} {transaction.drug?.unit || ''}
        </div>
      </TableCell>

      {/* ขนาดบรรจุ */}
      <TableCell>
        <div className="text-sm text-gray-700">
          {transaction.drug?.packageSize ? (
            <>1 x {transaction.drug.packageSize}&apos;s</>
          ) : (
            '-'
          )}
        </div>
      </TableCell>

      {/* ประเภท */}
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            {getTransactionTypeIcon(transaction.type)}
            <Badge variant="outline" className={`text-xs ${typeConfig.color}`}>
              {typeConfig.label}
            </Badge>
          </div>
          
          <div className="text-xs text-gray-600">
            โดย: {transaction.user.firstName} {transaction.user.lastName}
          </div>
        </div>
      </TableCell>

      {/* จำนวน */}
      <TableCell className="text-center">
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1">
            {getTransactionTypeIcon(transaction.type)}
            <span className={`font-medium ${amountData.className}`}>
              {amountData.formatted}
            </span>
          </div>
          
          {/* แสดง Before → After ตามประเภท transaction */}
          {(() => {
            const isStockMovement = ['RECEIVE_EXTERNAL', 'DISPENSE_EXTERNAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUST_INCREASE', 'ADJUST_DECREASE', 'RESERVE', 'UNRESERVE'].includes(transaction.type)
            const isMinStockAdjustment = ['MIN_STOCK_INCREASE', 'MIN_STOCK_DECREASE', 'MIN_STOCK_RESET'].includes(transaction.type)
            
            if (isStockMovement) {
              return (
                <div className="text-xs text-gray-500">
                  สต็อก: {transaction.beforeQty.toLocaleString()} → {transaction.afterQty.toLocaleString()}
                </div>
              )
            } else if (isMinStockAdjustment) {
              const beforeMin = transaction.beforeMinStock
              const afterMin = transaction.afterMinStock
              const changeAmount = transaction.minStockChange ?? transaction.quantity
              
              if (beforeMin !== undefined && beforeMin !== null && afterMin !== undefined && afterMin !== null) {
                return (
                  <div className="text-xs text-gray-500">
                    ขั้นต่ำ: {beforeMin} → {afterMin}
                  </div>
                )
              } else {
                return (
                  <div className="text-xs text-blue-600">
                    เปลี่ยนขั้นต่ำ: {changeAmount >= 0 ? '+' : ''}{changeAmount}
                  </div>
                )
              }
            } else {
              return (
                <div className="text-xs text-gray-500">
                  ไม่เปลี่ยนแปลงสต็อก
                </div>
              )
            }
          })()}

          {/* มูลค่า */}
          {transactionCost > 0 && !['MIN_STOCK_INCREASE', 'MIN_STOCK_DECREASE', 'MIN_STOCK_RESET', 'DATA_UPDATE', 'PRICE_UPDATE', 'INFO_CORRECTION'].includes(transaction.type) && (
            <div className="text-xs text-gray-500 font-mono">
              ฿{transactionCost.toLocaleString()}
            </div>
          )}
        </div>
      </TableCell>

      {/* วันเวลา */}
      <TableCell className="text-center">
        {transaction.createdAt ? (
          <div className="space-y-1">
            <div className="text-sm text-gray-700">
              {new Date(transaction.createdAt).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(transaction.createdAt).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>
    </TableRow>
  );
}