// 📄 File: components/modules/stock/StockTableRow.tsx
// ✅ Individual Stock Table Row Component

import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";
import { Stock } from "@/types/dashboard";
import {
  calculateAvailableStock,
  isLowStock,
  getCategoryColor,
  getCategoryLabel,
} from "@/lib/utils/dashboard";

interface StockTableRowProps {
  stock: Stock;
  showExportMode: boolean;
  isSelected: boolean;
  onView: (stock: Stock) => void;
  onToggleStock: (stockId: string) => void;
  calculateStockValue: (stock: Stock) => number;
  getLastUpdatedColor: (lastUpdated: string | null) => string;
}

export function StockTableRow({
  stock,
  showExportMode,
  isSelected,
  onView,
  onToggleStock,
  calculateStockValue,
  getLastUpdatedColor,
}: StockTableRowProps) {
  const availableStock = calculateAvailableStock(stock) || 0;
  const lowStock = isLowStock(stock);
  const categoryColor = getCategoryColor(stock.drug?.category);
  const categoryLabel = getCategoryLabel(stock.drug?.category);
  const reorderPoint = stock.minimumStock || 0;
  const stockValue = calculateStockValue(stock);
  const lastUpdatedColor = getLastUpdatedColor(stock.lastUpdated);

  const handleRowClick = () => {
    if (showExportMode) {
      onToggleStock(stock.id);
    } else {
      onView(stock);
    }
  };

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
            onCheckedChange={() => onToggleStock(stock.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
      )}

      {/* ชื่อยา */}
      <TableCell className="font-medium">
        <div className="space-y-2">
          <div className="font-medium text-gray-900 leading-tight">
            {stock.drug?.name || "ไม่ระบุชื่อยา"}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-xs ${categoryColor} shrink-0`}
            >
              {categoryLabel}
            </Badge>
            <span className="text-sm text-gray-600 font-mono">
              {stock.drug?.hospitalDrugCode || "-"}
            </span>
          </div>
        </div>
      </TableCell>

      {/* รูปแบบ */}
      <TableCell>
        <div className="text-sm text-gray-700">
          {stock.drug?.dosageForm || "-"}
        </div>
      </TableCell>

      {/* ความแรง */}
      <TableCell>
        <div className="text-sm text-gray-700">
          {stock.drug?.strength || ""} {stock.drug?.unit || ""}
        </div>
      </TableCell>

      {/* ขนาดบรรจุ */}
      <TableCell>
        <div className="text-sm text-gray-700">
          {stock.drug?.packageSize ? (
            <>{`1 x ${stock.drug.packageSize}'s`}</>
          ) : (
            "-"
          )}
        </div>
      </TableCell>

      {/* คงเหลือ */}
      <TableCell className="text-center">
        <div className="space-y-1">
          <div
            className={`font-medium ${
              lowStock
                ? "text-red-600"
                : availableStock > 0
                ? "text-green-600"
                : "text-gray-400"
            }`}
          >
            {availableStock.toLocaleString()}
            {lowStock && <AlertTriangle className="inline h-4 w-4 ml-1" />}
          </div>
          <div className="text-xs text-gray-500">
            ขั้นต่ำ: {reorderPoint.toLocaleString()}
          </div>
          {stock.reservedQty > 0 && (
            <div className="text-xs text-orange-600">
              จอง: {stock.reservedQty.toLocaleString()}
            </div>
          )}
        </div>
      </TableCell>

      {/* มูลค่ารวม */}
      <TableCell className="text-right">
        <div className="space-y-1">
          <div className="font-medium text-purple-600">
            {stockValue.toFixed(2).toLocaleString()} ฿
          </div>
          <div className="text-xs text-gray-500">
            กล่องละ {(stock.drug?.pricePerBox || 0).toFixed(2)} ฿
          </div>
        </div>
      </TableCell>

      {/* อัปเดตล่าสุด */}
      <TableCell className="text-center">
        {stock.lastUpdated ? (
          <div className="space-y-1">
            <div className={`text-sm font-medium ${lastUpdatedColor}`}>
              {new Date(stock.lastUpdated).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div className={`text-xs ${lastUpdatedColor}`}>
              {new Date(stock.lastUpdated).toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </TableCell>
    </TableRow>
  );
}
