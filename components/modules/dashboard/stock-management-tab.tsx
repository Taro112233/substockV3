// 📄 File: components/modules/dashboard/stock-management-tab.tsx (Updated)

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { StockTable } from "@/components/modules/stock/stock-table";
import { Stock } from "@/types/dashboard";
import {
  RefreshCw,
  Plus,
  Upload,
  Download,
  Package,
  AlertTriangle,
} from "lucide-react";

interface StockData {
  stocks: Stock[];
  stats: {
    totalDrugs: number;
    totalValue: number;
    lowStockCount: number;
  };
}

interface StockManagementTabProps {
  department: "PHARMACY" | "OPD";
}

export function StockManagementTab({ department }: StockManagementTabProps) {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { toast } = useToast();

  // ดึงข้อมูลสต็อก
  const fetchStockData = async (isRefresh = false) => {
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
  };

  useEffect(() => {
    fetchStockData();
  }, [department]);

  const handleRefresh = () => {
    fetchStockData(true);
  };

  const handleAddStock = () => {
    // TODO: เปิด modal เพิ่มสต็อก
    toast({
      title: "ฟีเจอร์กำลังพัฒนา",
      description: "การเพิ่มสต็อกใหม่จะพร้อมใช้งานในเร็วๆ นี้",
      variant: "default",
    });
  };

  const handleImportStock = () => {
    // TODO: เปิด dialog import
    toast({
      title: "ฟีเจอร์กำลังพัฒนา",
      description: "การ import ข้อมูลสต็อกจะพร้อมใช้งานในเร็วๆ นี้",
      variant: "default",
    });
  };

  const handleExportStock = () => {
    // TODO: Export ข้อมูลสต็อก
    toast({
      title: "ฟีเจอร์กำลังพัฒนา",
      description: "การ export ข้อมูลสต็อกจะพร้อมใช้งานในเร็วๆ นี้",
      variant: "default",
    });
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

  // ฟังก์ชันสำหรับอัปเดตสต็อกเมื่อมีการเปลี่ยนแปลงจาก modal
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

    const lowStockCount = updatedStocks.filter(
      (stock) => stock.totalQuantity <= stock.minimumStock
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
            <StockTable stocks={[]} department={department} loading={true} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // คำนวณมูลค่ารวมแบบใหม่
  const totalValueCalculated = calculateTotalValue();

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
            ข้อมูลสต็อกยาแบบเรียลไทม์ • อัปเดตล่าสุด:{" "}
            {new Date().toLocaleString("th-TH")}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
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
            variant="outline"
            size="sm"
            onClick={handleExportStock}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            ส่งออก
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleImportStock}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            นำเข้า
          </Button>

          <Button
            size="sm"
            onClick={handleAddStock}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            เพิ่มสต็อก
          </Button>
        </div>
      </div>

      {/* Statistics Cards - ลบ card จำนวนทั้งหมดออก */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">รายการยาทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.stats.totalDrugs.toLocaleString()}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">สต็อกต่ำ</p>
                <p
                  className={`text-2xl font-bold ${
                    data.stats.lowStockCount > 0
                      ? "text-red-600"
                      : "text-gray-400"
                  }`}
                >
                  {data.stats.lowStockCount.toLocaleString()}
                </p>
              </div>
              <AlertTriangle
                className={`h-8 w-8 ${
                  data.stats.lowStockCount > 0
                    ? "text-red-500"
                    : "text-gray-400"
                }`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">มูลค่ารวม</p>
                <p className="text-2xl font-bold text-purple-600">
                  ฿{totalValueCalculated.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  คำนวณจาก: จำนวนคงเหลือ × ราคาต่อกล่อง
                </p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <StockTable
        stocks={data.stocks}
        department={department}
        loading={loading}
        onUpdate={handleStockUpdate}
      />
    </div>
  );
}