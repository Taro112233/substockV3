// components/modules/stock/StockTableComponents.tsx
// ✅ FIXED: แก้ไข interface และ Export handler เพื่อส่ง format parameter

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TableHead } from "@/components/ui/table";
import {
  AlertTriangle,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Package,
  CheckCircle2,
} from "lucide-react";
import { Stock } from "@/types/dashboard";
import { StockPrintData } from "@/types/print";
import {
  ExportButton,
  StockExportFormat,
} from "@/components/ui/ExcelExportButton";

// Types
type SortField =
  | "name"
  | "dosageForm"
  | "strength"
  | "packageSize"
  | "quantity"
  | "totalValue"
  | "lastUpdated";
type SortDirection = "asc" | "desc" | null;

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

type DrugCategory =
  | "REFER"
  | "HAD"
  | "NARCOTIC"
  | "REFRIGERATED"
  | "PSYCHIATRIC"
  | "FLUID"
  | "GENERAL"
  | "TABLET"
  | "SYRUP"
  | "INJECTION"
  | "EXTEMP"
  | "ALERT"
  | "CANCELLED";

type DosageForm =
  | "APP"
  | "BAG"
  | "CAP"
  | "CR"
  | "DOP"
  | "ENE"
  | "GEL"
  | "HAN"
  | "IMP"
  | "INJ"
  | "LIQ"
  | "LOT"
  | "LVP"
  | "MDI"
  | "MIX"
  | "NAS"
  | "NB"
  | "OIN"
  | "PAT"
  | "POW"
  | "PWD"
  | "SAC"
  | "SOL"
  | "SPR"
  | "SUP"
  | "SUS"
  | "SYR"
  | "TAB"
  | "TUR";

interface FilterConfig {
  category: DrugCategory | "all";
  dosageForm: DosageForm | "all";
}

// Options Data
export const categoryOptions = [
  { value: "all", label: "ทุกประเภท" },
  { value: "GENERAL", label: "ยาทั่วไป" },
  { value: "TABLET", label: "ยาเม็ด" },
  { value: "SYRUP", label: "ยาน้ำ" },
  { value: "INJECTION", label: "ยาฉีด" },
  { value: "EXTEMP", label: "ยาใช้ภายนอก/สมุนไพร" },
  { value: "FLUID", label: "สารน้ำ" },
  { value: "NARCOTIC", label: "ยาเสพติด" },
  { value: "PSYCHIATRIC", label: "ยาจิตเวช" },
  { value: "REFRIGERATED", label: "ยาเย็น" },
  { value: "HAD", label: "ยา HAD" },
  { value: "REFER", label: "ยาส่งต่อ" },
  { value: "ALERT", label: "ยาเฝ้าระวัง" },
  { value: "CANCELLED", label: "ยกเลิกการใช้" },
];

export const dosageFormOptions = [
  { value: "all", label: "ทุกรูปแบบ" },
  { value: "TAB", label: "TAB" },
  { value: "CAP", label: "CAP" },
  { value: "SYR", label: "SYR" },
  { value: "SUS", label: "SUS" },
  { value: "INJ", label: "INJ" },
  { value: "SOL", label: "SOL" },
  { value: "OIN", label: "OIN" },
  { value: "GEL", label: "GEL" },
  { value: "LOT", label: "LOT" },
  { value: "SPR", label: "SPR" },
  { value: "SUP", label: "SUP" },
  { value: "ENE", label: "ENE" },
  { value: "POW", label: "POW" },
  { value: "PWD", label: "PWD" },
  { value: "CR", label: "CR" },
  { value: "BAG", label: "BAG" },
  { value: "APP", label: "APP" },
  { value: "LVP", label: "LVP" },
  { value: "MDI", label: "MDI" },
  { value: "NAS", label: "NAS" },
  { value: "SAC", label: "SAC" },
  { value: "LIQ", label: "LIQ" },
  { value: "MIX", label: "MIX" },
];

// ✅ FIXED: Export Controls Component - แก้ไข handler signature
interface ExportControlsProps {
  exportStats: { count: number; totalValue: number; stocks: Stock[] };
  currentViewStats: { count: number; totalValue: number };
  hiddenSelectedCount: number;
  filteredStocksLength: number;
  onExport: (format: StockExportFormat) => Promise<void>; // ✅ แก้ไขให้รับ format parameter
  onCancel: () => void;
  exporting: boolean;
  department: "PHARMACY" | "OPD";
  preparePrintData: (stocks: Stock[]) => StockPrintData[];
}

export function ExportControls({
  exportStats,
  currentViewStats,
  hiddenSelectedCount,
  filteredStocksLength,
  onExport,
  onCancel,
  exporting,
}: ExportControlsProps) {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-medium text-green-900 flex items-center gap-2">
                โหมดเลือก Export ({exportStats.count} รายการ)
                {hiddenSelectedCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />+
                    {hiddenSelectedCount} นอกมุมมอง
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-green-700 mt-1">
                ในมุมมองนี้: {currentViewStats.count}/{filteredStocksLength}{" "}
                รายการ • รวมทั้งหมด: {exportStats.count} รายการ (฿
                {exportStats.totalValue.toLocaleString()})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* ✅ FIXED: Excel Export Button - ส่ง format ที่ถูกต้อง */}
            <ExportButton
              selectedCount={exportStats.count}
              exporting={exporting}
              onExport={(format) => {
                // ✅ ส่ง format ที่เลือกจาก dropdown ไปยัง handler
                if (
                  format === "requisition" ||
                  format === "detailed" ||
                  format === "summary"
                ) {
                  onExport(format); // ส่ง format ที่เลือก
                }
              }}
              variant="stock"
            />

            <Button
              variant="outline"
              onClick={onCancel}
              className="bg-red-500 text-white hover:bg-red-600 border-red-500 hover:border-red-600"
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Search and Filter Bar Component
interface SearchFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterConfig: FilterConfig;
  setFilterConfig: (
    config: FilterConfig | ((prev: FilterConfig) => FilterConfig)
  ) => void;
  showLowStockOnly: boolean;
  setShowLowStockOnly: (show: boolean) => void;
  showExportMode: boolean;
  onToggleExportMode: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function SearchFilterBar({
  searchTerm,
  setSearchTerm,
  filterConfig,
  setFilterConfig,
  showLowStockOnly,
  setShowLowStockOnly,
  showExportMode,
  onToggleExportMode,
  hasActiveFilters,
  onClearFilters,
}: SearchFilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Large Screen Layout */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="ค้นหายา (ชื่อ, รหัส, ชื่อสามัญ, หมายเหตุ)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="w-48">
          <Select
            value={filterConfig.category}
            onValueChange={(value) =>
              setFilterConfig((prev) => ({
                ...prev,
                category: value as DrugCategory | "all",
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกประเภทยา" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <Select
            value={filterConfig.dosageForm}
            onValueChange={(value) =>
              setFilterConfig((prev) => ({
                ...prev,
                dosageForm: value as DosageForm | "all",
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกรูปแบบยา" />
            </SelectTrigger>
            <SelectContent>
              {dosageFormOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button
            variant={showLowStockOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            สต็อกต่ำ
          </Button>

          {!showExportMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleExportMode}
              className="flex items-center gap-2 bg-[#217346] text-white hover:bg-[#1e5f3a] border-[#217346] hover:border-[#1e5f3a]"
            >
              <Download className="h-4 w-4" />
              Excel
            </Button>
          )}

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center gap-2 text-xs bg-red-500 text-white hover:bg-red-600"
            >
              ✕ ล้าง
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="ค้นหายา (ชื่อ, รหัส, ชื่อสามัญ, หมายเหตุ)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select
              value={filterConfig.category}
              onValueChange={(value) =>
                setFilterConfig((prev) => ({
                  ...prev,
                  category: value as DrugCategory | "all",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="ทุกประเภท" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select
              value={filterConfig.dosageForm}
              onValueChange={(value) =>
                setFilterConfig((prev) => ({
                  ...prev,
                  dosageForm: value as DosageForm | "all",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="ทุกรูปแบบ" />
              </SelectTrigger>
              <SelectContent>
                {dosageFormOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant={showLowStockOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className="flex items-center justify-center shrink-0 w-10 h-10"
            title="สต็อกต่ำ"
          >
            <AlertTriangle className="h-4 w-4" />
          </Button>

          {!showExportMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleExportMode}
              className="flex items-center justify-center shrink-0 w-10 h-10 bg-[#217346] text-white hover:bg-[#1e5f3a] border-[#217346] hover:border-[#1e5f3a]"
              title="Export Excel"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center justify-center shrink-0 w-10 h-10 bg-red-500 text-white hover:bg-red-600 border-red-500"
              title="ล้างตัวกรอง"
            >
              ✕
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Sortable Header Component
interface SortableHeaderProps {
  field: SortField;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
}

export function SortableHeader({
  field,
  children,
  className = "",
  align = "left",
  sortConfig,
  onSort,
}: SortableHeaderProps) {
  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }

    if (sortConfig.direction === "asc") {
      return <ArrowUp className="h-4 w-4 text-blue-600" />;
    } else if (sortConfig.direction === "desc") {
      return <ArrowDown className="h-4 w-4 text-blue-600" />;
    }

    return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
  };

  return (
    <TableHead
      className={`cursor-pointer hover:bg-gray-100 transition-colors ${className} ${
        align === "center"
          ? "text-center"
          : align === "right"
          ? "text-right"
          : ""
      }`}
      onClick={() => onSort(field)}
    >
      <div
        className={`flex items-center gap-2 ${
          align === "center"
            ? "justify-center"
            : align === "right"
            ? "justify-end"
            : ""
        }`}
      >
        {children}
        {getSortIcon(field)}
      </div>
    </TableHead>
  );
}

// Select All Header Component
interface SelectAllHeaderProps {
  currentViewStats: { count: number };
  filteredStocksLength: number;
  onSelectAll: () => void;
}

export function SelectAllHeader({
  currentViewStats,
  filteredStocksLength,
  onSelectAll,
}: SelectAllHeaderProps) {
  return (
    <TableHead className="w-[50px]">
      <div
        className="flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded p-1"
        onClick={onSelectAll}
        title={
          currentViewStats.count === filteredStocksLength
            ? "ยกเลิกเลือกทั้งหมดในหน้านี้"
            : "เลือกทั้งหมดในหน้านี้"
        }
      >
        {currentViewStats.count === filteredStocksLength &&
        filteredStocksLength > 0 ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : currentViewStats.count > 0 ? (
          <div className="h-4 w-4 border-2 border-blue-600 rounded flex items-center justify-center">
            <div className="h-2 w-2 bg-blue-600 rounded-sm" />
          </div>
        ) : (
          <div className="h-4 w-4 border-2 border-gray-400 rounded" />
        )}
      </div>
    </TableHead>
  );
}

// Footer Info Component
interface FooterInfoProps {
  filteredStocksLength: number;
  totalStocksLength: number;
  totalValue: number;
  showExportMode: boolean;
  currentViewStats: { count: number; totalValue: number };
  hiddenSelectedCount: number;
  exportStats: { count: number; totalValue: number };
}

export function FooterInfo({
  filteredStocksLength,
  totalStocksLength,
  totalValue,
  showExportMode,
  currentViewStats,
  hiddenSelectedCount,
  exportStats,
}: FooterInfoProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
      <div className="flex flex-col sm:flex-row gap-2 text-center sm:text-left">
        <span>
          แสดง <strong className="text-gray-700">{filteredStocksLength}</strong>{" "}
          รายการ จากทั้งหมด{" "}
          <strong className="text-gray-700">{totalStocksLength}</strong> รายการ
        </span>
        <span className="text-purple-600 font-medium">
          มูลค่ารวม ฿{totalValue.toLocaleString()}
        </span>
        {showExportMode && (
          <div className="flex flex-col sm:flex-row gap-1">
            <span className="text-green-600 font-medium">
              • เลือกใน view: {currentViewStats.count} รายการ
            </span>
            {hiddenSelectedCount > 0 && (
              <span className="text-blue-600 font-medium">
                • จำไว้นอก view: {hiddenSelectedCount} รายการ
              </span>
            )}
            <span className="text-green-700 font-bold">
              • รวม Export: {exportStats.count} รายการ (฿
              {exportStats.totalValue.toLocaleString()})
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span>อัปเดต</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>{"<"} 7 วัน</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>7-13 วัน</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>{">"} 14 วัน</span>
        </div>
      </div>
    </div>
  );
}

// Export Instructions Component
interface ExportInstructionsProps {
  showExportMode: boolean;
  filteredStocksLength: number;
  hiddenSelectedCount: number;
}

export function ExportInstructions({
  showExportMode,
  filteredStocksLength,
  hiddenSelectedCount,
}: ExportInstructionsProps) {
  if (!showExportMode || filteredStocksLength === 0) return null;

  return (
    <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
      <p>
        💡 <strong>วิธีใช้:</strong> คลิกเพื่อเลือกรายการยาที่ต้องการ Export •
        ระบบจะจำการเลือกข้ามตัวกรองต่างๆ • ใช้ checkbox
        ด้านบนเพื่อเลือก/ยกเลิกทั้งหมดในหน้าปัจจุบัน
      </p>
      {hiddenSelectedCount > 0 && (
        <p className="text-blue-700 font-medium mt-1">
          🔍 คุณได้เลือก {hiddenSelectedCount}{" "}
          รายการที่ไม่ได้แสดงในตัวกรองปัจจุบัน
        </p>
      )}
    </div>
  );
}