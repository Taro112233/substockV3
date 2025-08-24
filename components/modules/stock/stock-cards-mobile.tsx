// 📄 File: components/modules/stock/stock-cards-mobile.tsx
// Mobile-First Stock Cards Layout with Enhanced UX

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stock } from "@/types/dashboard";
import {
  calculateAvailableStock,
  isLowStock,
  getCategoryColor,
  getCategoryLabel,
} from "@/lib/utils/dashboard";
import {
  AlertTriangle,
  Search,
  Clock,
  Package,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { StockDetailModalEnhanced } from "./stock-detail-modal";

// Types (same as table version)
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
  | "ALERT";

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

type SortOption = "name" | "quantity" | "value" | "lastUpdated" | "category";

interface FilterConfig {
  category: DrugCategory | "all";
  dosageForm: DosageForm | "all";
}

interface FilteredStatsData {
  totalDrugs: number;
  totalValue: number;
  lowStockCount: number;
}

interface StockCardsMobileProps {
  stocks: Stock[];
  department: "PHARMACY" | "OPD";
  onAdjust?: (stock: Stock) => void;
  onView?: (stock: Stock) => void;
  onUpdate?: (updatedStock: Stock) => void;
  onFilteredStatsChange?: (stats: FilteredStatsData) => void;
  loading?: boolean;
}

export function StockCardsMobile({
  stocks,
  onUpdate,
  onFilteredStatsChange,
  loading = false,
}: StockCardsMobileProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    category: "all",
    dosageForm: "all",
  });

  // Category options with Thai labels
  const categoryOptions = [
    { value: 'all', label: 'ทุกประเภท' },
    { value: 'GENERAL', label: 'ยาทั่วไป' },
    { value: 'TABLET', label: 'ยาเม็ด' },
    { value: 'SYRUP', label: 'ยาน้ำ' },
    { value: 'INJECTION', label: 'ยาฉีด' },
    { value: 'EXTEMP', label: 'ยาใช้ภายนอก/สมุนไพร' },
    { value: 'FLUID', label: 'สารน้ำ' },
    { value: 'NARCOTIC', label: 'ยาเสพติด' },
    { value: 'PSYCHIATRIC', label: 'ยาจิตเวช' },
    { value: 'REFRIGERATED', label: 'ยาเย็น' },
    { value: 'HAD', label: 'ยา HAD' },
    { value: 'REFER', label: 'ยาส่งต่อ' },
    { value: 'ALERT', label: 'ยาเฝ้าระวัง' },
  ];

  // Dosage form options with Thai labels
  const dosageFormOptions = [
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

  // Utility functions
  const calculateStockValue = (stock: Stock) => {
    const availableStock = calculateAvailableStock(stock);
    const pricePerBox = stock.drug?.pricePerBox || 0;
    return availableStock * pricePerBox;
  };

  const getLastUpdatedText = (lastUpdated: string | null) => {
    if (!lastUpdated) return "ไม่ระบุ";

    const updatedDate = new Date(lastUpdated);

    // Format เป็น: "23 ส.ค. 67, 14:30"
    const dateOptions: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };

    return updatedDate.toLocaleDateString("th-TH", dateOptions);
  };

  // ✅ Updated: สีตามช่วงเวลา - เขียว < 7 วัน, เหลือง 7-13 วัน, แดง >= 14 วัน
  const getLastUpdatedColor = (lastUpdated: string | null) => {
    if (!lastUpdated) return "text-gray-400";

    const now = new Date();
    const updatedDate = new Date(lastUpdated);
    const diffDays = Math.floor(
      (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // ✅ Updated: สีใหม่ตามช่วงเวลา
    if (diffDays >= 14) return "text-red-500"; // แดง >= 14 วัน
    if (diffDays >= 7) return "text-yellow-500"; // เหลือง 7-13 วัน
    return "text-green-500"; // เขียว < 7 วัน
  };

  // Sorting logic - ✅ Fixed: เรียงตาม lastUpdated จาก aTime - bTime (เก่าก่อน)
  const sortedStocks = useMemo(() => {
    return [...stocks].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.drug?.name || "").localeCompare(b.drug?.name || "", "th");
        case "quantity":
          return calculateAvailableStock(b) - calculateAvailableStock(a);
        case "value":
          return calculateStockValue(b) - calculateStockValue(a);
        case "lastUpdated":
          const aTime = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
          const bTime = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
          return aTime - bTime; // ✅ Fixed: เรียงจากน้อยไปมาก (เก่าก่อน)
        case "category":
          return (a.drug?.category || "").localeCompare(
            b.drug?.category || "",
            "th"
          );
        default:
          return 0;
      }
    });
  }, [stocks, sortBy]);

  // Filter stocks
  const filteredStocks = useMemo(() => {
    return sortedStocks.filter((stock) => {
      const drugName = stock.drug?.name?.toLowerCase() || "";
      const hospitalCode = stock.drug?.hospitalDrugCode?.toLowerCase() || "";
      const genericName = stock.drug?.genericName?.toLowerCase() || "";
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        drugName.includes(searchLower) ||
        hospitalCode.includes(searchLower) ||
        genericName.includes(searchLower);

      const matchesLowStock = showLowStockOnly ? isLowStock(stock) : true;

      const matchesCategory =
        filterConfig.category === "all" ||
        stock.drug?.category === filterConfig.category;

      const matchesDosageForm =
        filterConfig.dosageForm === "all" ||
        stock.drug?.dosageForm === filterConfig.dosageForm;

      return (
        matchesSearch && matchesLowStock && matchesCategory && matchesDosageForm
      );
    });
  }, [sortedStocks, searchTerm, showLowStockOnly, filterConfig]);

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    const totalDrugs = filteredStocks.length;
    const totalValue = filteredStocks.reduce(
      (sum, stock) => sum + calculateStockValue(stock),
      0
    );
    const lowStockCount = filteredStocks.filter((stock) =>
      isLowStock(stock)
    ).length;

    return { totalDrugs, totalValue, lowStockCount };
  }, [filteredStocks]);

  useEffect(() => {
    if (onFilteredStatsChange) {
      onFilteredStatsChange(filteredStats);
    }
  }, [filteredStats, onFilteredStatsChange]);

  // Handlers
  const handleCardClick = (stock: Stock) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setShowLowStockOnly(false);
    setFilterConfig({ category: "all", dosageForm: "all" });
    setSortBy("name");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading Search Bar */}
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="w-20 h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Loading Cards */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                </div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                <div className="flex justify-between">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-24" />
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Enhanced Search and Filter Section - Same as Table */}
        <div className="space-y-3">
          {/* Large Screen: Everything in one row */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหายา (ชื่อ, รหัส, ชื่อสามัญ)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
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

            {/* Dosage Form Filter */}
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

            {/* Action Buttons - Icon only */}
            <Button
              variant={showLowStockOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className="flex items-center justify-center shrink-0 w-10 h-10"
              title="สต็อกต่ำ"
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>

            {/* Sort by Last Updated Button - ✅ Fixed Tooltip */}
            <Button
              variant={sortBy === "lastUpdated" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setSortBy(sortBy === "lastUpdated" ? "name" : "lastUpdated")
              }
              className="flex items-center justify-center shrink-0 w-10 h-10"
              title="เรียงตามเวลาอัพเดท (เก่าที่สุดก่อน)"
            >
              <Clock className="h-4 w-4" />
            </Button>

            {/* Clear Filters Button - Icon only */}
            {(filterConfig.category !== "all" ||
              filterConfig.dosageForm !== "all" ||
              searchTerm ||
              showLowStockOnly ||
              sortBy !== "name") && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center justify-center shrink-0 w-10 h-10 bg-red-500 text-white hover:bg-red-600 border-red-500"
                title="ล้างตัวกรอง"
              >
                ✕
              </Button>
            )}
          </div>
        </div>

        {/* Small Screen: Mobile Layout */}
        <div className="lg:hidden">
          {/* Row 1: Search Bar + Clear Button */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหายา (ชื่อ, รหัส, ชื่อสามัญ)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Clear Filters Button - Show when filters are active */}
            {(filterConfig.category !== "all" ||
              filterConfig.dosageForm !== "all" ||
              searchTerm ||
              showLowStockOnly ||
              sortBy !== "name") && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center justify-center shrink-0 w-10 h-10 bg-red-500 text-white hover:bg-red-600 border-red-500"
                title="ล้างตัวกรอง"
              >
                ✕
              </Button>
            )}
          </div>

          {/* Row 2: Filters and Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Category Filter */}
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
                  <SelectValue placeholder="ประเภทยา" />
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

            {/* Dosage Form Filter */}
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
                  <SelectValue placeholder="รูปแบบ" />
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

            {/* Low Stock Filter Button */}
            <Button
              variant={showLowStockOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className="flex items-center justify-center shrink-0 w-10 h-10"
              title="สต็อกต่ำ"
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>

            {/* Sort by Last Updated Button */}
            <Button
              variant={sortBy === "lastUpdated" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setSortBy(sortBy === "lastUpdated" ? "name" : "lastUpdated")
              }
              className="flex items-center justify-center shrink-0 w-10 h-10"
              title="เรียงตามเวลาอัพเดท (เก่าที่สุดก่อน)"
            >
              <Clock className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stock Cards - 2 Column Layout */}
      <div className="space-y-2">
        {filteredStocks.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="text-gray-500">
              <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="font-medium text-sm">ไม่พบรายการที่ค้นหา</p>
              <p className="text-xs mt-1">ลองปรับเปลี่ยนคำค้นหา</p>
            </div>
          </Card>
        ) : (
          filteredStocks.map((stock) => {
            const availableStock = calculateAvailableStock(stock) || 0;
            const lowStock = isLowStock(stock);
            const categoryColor = getCategoryColor(stock.drug?.category);
            const categoryLabel = getCategoryLabel(stock.drug?.category);
            const reorderPoint = stock.minimumStock || 0;
            const stockValue = calculateStockValue(stock);
            const lastUpdatedColor = getLastUpdatedColor(stock.lastUpdated);
            const lastUpdatedText = getLastUpdatedText(stock.lastUpdated);

            return (
              <Card
                key={stock.id}
                className="transition-all duration-200 hover:shadow-sm active:scale-[0.99] cursor-pointer border-l-4"
                style={{ borderLeftColor: lowStock ? "#ef4444" : "#10b981" }}
                onClick={() => handleCardClick(stock)}
              >
                <CardContent className="p-3">
                  {/* Main 2-Column Layout */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Left Column: Drug Info (2/3 width) */}
                    <div className="col-span-2 min-w-0">
                      {/* Drug Category & Status */}
                      <div className="flex items-center gap-1 mb-1">
                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0.5 ${categoryColor} shrink-0`}
                        >
                          {categoryLabel}
                        </Badge>
                      </div>

                      {/* Drug Name */}
                      <h3 className="font-medium text-gray-900 text-sm leading-tight truncate mb-1">
                        {stock.drug?.name || "ไม่ระบุชื่อยา"}
                      </h3>

                      {/* Drug Details */}
                      <p className="text-xs text-gray-500 font-mono mb-2">
                        {stock.drug?.strength && (
                          <span>
                            {" "}
                            {stock.drug.strength} {stock.drug.unit || ""}
                          </span>
                        )}
                      </p>

                      {/* Hospital Code */}
                      <div className="text-xs text-gray-600">
                        {stock.drug?.dosageForm && (
                          <span className="font-medium">
                            {stock.drug.dosageForm}
                          </span>
                        )}{" "}
                        • {stock.drug?.hospitalDrugCode || "-"}
                      </div>

                      {/* Reserved Quantity */}
                      {stock.reservedQty > 0 && (
                        <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                          <span>จอง: {stock.reservedQty.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Stock Info (1/3 width) */}
                    <div className="flex flex-col items-end justify-between">
                      {/* Stock Quantity with Alert Triangle */}
                      <div className="text-right mb-2">
                        <div
                          className={`flex items-center justify-end gap-1 font-bold text-lg leading-tight ${
                            lowStock
                              ? "text-red-600"
                              : availableStock > 0
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {/* Alert Triangle หน้าตัวเลขสต็อก */}
                          {lowStock && (
                            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                          )}
                          <span>{availableStock.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          ขั้นต่ำ: {reorderPoint.toLocaleString()}
                        </div>
                      </div>

                      {/* Stock Value */}
                      <div className="text-right mb-2">
                        <div className="font-bold text-sm text-purple-600">
                          {stockValue.toFixed(2)} ฿
                        </div>
                        <div className="text-xs text-gray-500">
                          กล่องละ {(stock.drug?.pricePerBox || 0).toFixed(0)} ฿
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Last Updated */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs">
                      <p>อัพเดทล่าสุด: </p>
                      <span className={lastUpdatedColor}>
                        {lastUpdatedText}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Enhanced Footer Info - Simplified */}
      {filteredStocks.length > 0 && (
        <div className="text-center text-xs text-gray-500 pb-2">
          <p>
            แสดง <strong>{filteredStocks.length}</strong> /{" "}
            <strong>{stocks.length}</strong> รายการ
          </p>
        </div>
      )}

      {/* Stock Detail Modal */}
      <StockDetailModalEnhanced
        stock={selectedStock}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={onUpdate}
      />
    </>
  );
}

// Helper hook for responsive design
export function useResponsiveStockView() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return isMobile;
}
