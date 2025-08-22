// 📄 File: components/modules/dashboard/stock-management-tab.tsx (Updated with Responsive)
// =====================================================

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Stock } from "@/types/dashboard";
import {
  RefreshCw,
  Plus,
  Package,
  AlertTriangle,
  TrendingUp,
  Filter,
  Smartphone,
  Monitor,
  Grid3X3,
  List
} from "lucide-react";
// ✅ Updated: Import the new responsive component
import { StockDisplayResponsive, useStockViewMode } from "../stock/stock-display-responsive";
import { AddDrugModal } from "../stock/add-drug-modal";

interface StockData {
  stocks: Stock[];
  stats: {
    totalDrugs: number;
    totalValue: number;
    lowStockCount: number;
  };
}

interface FilteredStatsData {
  totalDrugs: number;
  totalValue: number;
  lowStockCount: number;
}

interface StockManagementTabProps {
  department: "PHARMACY" | "OPD";
}

export function StockManagementTab({ department }: StockManagementTabProps) {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredStats, setFilteredStats] = useState<FilteredStatsData | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { toast } = useToast();
  
  // ✅ New: Get view mode info for display
  const { viewMode, screenSize, isCardsView, setViewMode } = useStockViewMode();

  // ดึงข้อมูลสต็อก - wrapped with useCallback to fix hook dependency warning
  const fetchStockData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const endpoint =
        department === "PHARMACY" ? "/api/stocks/pharmacy" : "/api/stocks/opd";

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ใช้ cookies แทน Authorization header
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลสต็อกได้");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }

      setData(result.data);

      if (isRefresh) {
        toast({
          title: "อัปเดตข้อมูลสำเร็จ",
          description: "ข้อมูลสต็อกได้รับการอัปเดตแล้ว",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);

      const errorMessage =
        error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลสต็อกได้";

      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [department, toast]); // Add dependencies to useCallback

  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]); // Use fetchStockData in dependency array

  const handleRefresh = () => {
    fetchStockData(true);
  };

  const handleAddStock = () => {
    setIsAddModalOpen(true);
  };

  // ฟังก์ชันสำหรับคำนวณมูลค่ารวมใหม่ (totalQuantity × pricePerBox)
  const calculateTotalValue = () => {
    if (!data || !data.stocks) return 0;
    
    return data.stocks.reduce((sum, stock) => {
      const quantity = stock.totalQuantity || 0;
      const pricePerBox = stock.drug?.pricePerBox || 0;
      return sum + (quantity * pricePerBox);
    }, 0);
  };

  // ✅ Fixed: ฟังก์ชันสำหรับอัปเดตสต็อกเมื่อมีการเปลี่ยนแปลงจาก modal
  const handleStockUpdate = (updatedStock: Stock) => {
    if (!data) return;

    // อัปเดตข้อมูลสต็อกใน state
    const updatedStocks = data.stocks.map((stock) =>
      stock.id === updatedStock.id ? updatedStock : stock
    );

    // คำนวณ stats ใหม่
    const newTotalValue = updatedStocks.reduce((sum, stock) => {
      const quantity = stock.totalQuantity || 0;
      const pricePerBox = stock.drug?.pricePerBox || 0;
      return sum + (quantity * pricePerBox);
    }, 0);

    // ✅ Fixed: Low stock count with minimumStock > 0 check
    const lowStockCount = updatedStocks.filter(
      (stock) => stock.totalQuantity < stock.minimumStock && stock.minimumStock > 0
    ).length;

    setData({
      stocks: updatedStocks,
      stats: {
        ...data.stats,
        totalValue: newTotalValue,
        lowStockCount,
      },
    });

    toast({
      title: "อัปเดตสำเร็จ",
      description: `ข้อมูลสต็อก "${updatedStock.drug.name}" ถูกอัปเดตแล้ว`,
      variant: "default",
    });
  };

  // ✅ Fixed: Handle new drug added
  const handleDrugAdded = (newStock: Stock) => {
    if (!data) return;

    // เพิ่มยาใหม่เข้าใน state (เฉพาะแผนกปัจจุบัน)
    const updatedStocks = [...data.stocks, newStock];

    // คำนวณ stats ใหม่
    const newTotalValue = updatedStocks.reduce((sum, stock) => {
      const quantity = stock.totalQuantity || 0;
      const pricePerBox = stock.drug?.pricePerBox || 0;
      return sum + (quantity * pricePerBox);
    }, 0);

    // ✅ Fixed: Low stock count with minimumStock > 0 check
    const lowStockCount = updatedStocks.filter(
      (stock) => stock.totalQuantity < stock.minimumStock && stock.minimumStock > 0
    ).length;

    setData({
      stocks: updatedStocks,
      stats: {
        totalDrugs: updatedStocks.length,
        totalValue: newTotalValue,
        lowStockCount,
      },
    });

    toast({
      title: "เพิ่มยาสำเร็จ",
      description: `เพิ่มยา "${newStock.drug.name}" เรียบร้อยแล้ว (สร้างสต็อกทั้ง 2 แผนก)`,
      variant: "default",
    });
  };

  // Handle filtered stats from table
  const handleFilteredStatsChange = useCallback((stats: FilteredStatsData) => {
    setFilteredStats(stats);
    
    // Check if filters are active (different from original data)
    if (data) {
      const originalTotalValue = calculateTotalValue();
      const isCurrentlyFiltered = 
        stats.totalDrugs !== data.stats.totalDrugs ||
        Math.abs(stats.totalValue - originalTotalValue) > 0.01 ||
        stats.lowStockCount !== data.stats.lowStockCount;
      
      setIsFiltered(isCurrentlyFiltered);
    }
  }, [data]);

  // ✅ New: Handle view mode toggle for mobile
  const handleViewModeToggle = () => {
    setViewMode(isCardsView ? 'table' : 'cards');
  };

  // กรณี loading หรือไม่มีข้อมูล
  if (loading || !data) {
    return (
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              จัดการสต็อกยา -{" "}
              {department === "PHARMACY" ? "แผนกเภสัชกรรม" : "แผนก OPD"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              กำลังโหลดข้อมูลสต็อกยา...
            </p>
          </div>
        </div>

        {/* Loading State */}
        <Card>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="h-10 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-32">
                  <div className="h-10 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="border rounded-lg">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 border-b animate-pulse" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // คำนวณมูลค่ารวมแบบใหม่
  const totalValueCalculated = calculateTotalValue();
  
  // ใช้ filtered stats หากมีการกรอง หรือใช้ original stats
  const displayStats = filteredStats || {
    totalDrugs: data.stats.totalDrugs,
    totalValue: totalValueCalculated,
    lowStockCount: data.stats.lowStockCount
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header Actions - Updated Layout with View Mode Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">
                จัดการสต็อกยา -{" "}
                {department === "PHARMACY" ? "แผนกเภสัชกรรม" : "แผนก OPD"}
              </h2>
              
              {/* ✅ New: View mode indicator for mobile */}
              {screenSize === 'mobile' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs">
                  {isCardsView ? (
                    <>
                      <Grid3X3 className="h-3 w-3" />
                      <span>การ์ด</span>
                    </>
                  ) : (
                    <>
                      <List className="h-3 w-3" />
                      <span>ตาราง</span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-gray-600">
                จัดการข้อมูลยาและสต็อกของแผนก
              </p>
              
              {/* ✅ New: Screen size indicator (desktop only) */}
              {(screenSize === 'tablet' || screenSize === 'desktop') && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      screenSize === 'desktop' ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <Smartphone className="h-3 w-3" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      screenSize === 'tablet' ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <span>Tablet</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      screenSize === 'desktop' ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <Monitor className="h-3 w-3" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right-aligned Action Buttons */}
          <div className="flex gap-2 flex-wrap justify-end">
            {/* ✅ New: View mode toggle for mobile */}
            {screenSize === 'mobile' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewModeToggle}
                className="flex items-center gap-2"
              >
                {isCardsView ? (
                  <>
                    <List className="h-4 w-4" />
                    <span>ตาราง</span>
                  </>
                ) : (
                  <>
                    <Grid3X3 className="h-4 w-4" />
                    <span>การ์ด</span>
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "กำลังอัปเดต..." : "รีเฟรช"}
            </Button>

            <Button
              size="sm"
              onClick={handleAddStock}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              เพิ่มยาใหม่
            </Button>
          </div>
        </div>

        {/* Dynamic Statistics Cards - Enhanced with Mobile Optimization */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Drugs Card */}
          <Card className={`transition-all duration-200 ${
            isFiltered ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 truncate">
                    รายการยา{isFiltered ? ' (กรองแล้ว)' : 'ทั้งหมด'}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {displayStats.totalDrugs.toLocaleString()}
                    </p>
                    {isFiltered && (
                      <span className="text-sm text-blue-600">
                        / {data.stats.totalDrugs.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <Package className={`h-8 w-8 shrink-0 ${isFiltered ? 'text-blue-500' : 'text-gray-500'}`} />
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Card */}
          <Card className={`transition-all duration-200 ${
            isFiltered ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 truncate">
                    สต็อกต่ำ{isFiltered ? ' (กรองแล้ว)' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-2xl font-bold ${
                        displayStats.lowStockCount > 0
                          ? "text-red-600"
                          : "text-gray-400"
                      }`}
                    >
                      {displayStats.lowStockCount.toLocaleString()}
                    </p>
                    {isFiltered && (
                      <span className="text-sm text-orange-600">
                        / {data.stats.lowStockCount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <AlertTriangle
                  className={`h-8 w-8 shrink-0 ${
                    displayStats.lowStockCount > 0
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Total Value Card */}
          <Card className={`transition-all duration-200 ${
            isFiltered ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 truncate">
                    มูลค่ารวม{isFiltered ? ' (กรองแล้ว)' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-purple-600">
                      ฿{displayStats.totalValue.toLocaleString()}
                    </p>
                    {isFiltered && (
                      <span className="text-sm text-purple-600">
                        / ฿{totalValueCalculated.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <TrendingUp className={`h-8 w-8 shrink-0 ${isFiltered ? 'text-purple-500' : 'text-gray-500'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ Updated: Use Responsive Stock Display */}
        <StockDisplayResponsive
          stocks={data.stocks}
          department={department}
          loading={loading}
          onUpdate={handleStockUpdate}
          onFilteredStatsChange={handleFilteredStatsChange}
        />

        {/* ✅ New: Mobile Bottom Spacing for FAB and Navigation */}
        <div className="h-16 sm:h-0" />
      </div>

      {/* Add Drug Modal */}
      <AddDrugModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onDrugAdded={handleDrugAdded}
        department={department}
      />
    </>
  );
}