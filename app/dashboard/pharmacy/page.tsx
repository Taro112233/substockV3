// 📄 File: app/dashboard/pharmacy/page.tsx (with Back Button)

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StockManagementTab } from "@/components/modules/dashboard/stock-management-tab";
import { TransferTab } from "@/components/modules/dashboard/transfer-tab";
import { HistoryTabEnhanced } from "@/components/modules/dashboard/history-tab-enhanced";
import { TransferDetailModal } from "@/components/modules/transfer/transfer-detail-modal";
import { Transfer } from "@/types/dashboard";
import { Package, FileText, History, ArrowLeft } from "lucide-react";
import { SimpleStatusIndicator } from "@/components/SimpleStatusIndicator";

export default function PharmacyDashboard() {
  const router = useRouter();
  const [activeTransfer, setActiveTransfer] = useState<Transfer | null>(null);

  // ดึงข้อมูลผู้ใช้จาก API
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    position?: string;
    username?: string;
    department?: string;
  } | null>(null);

  useEffect(() => {
    // เรียก API เพื่อดึงข้อมูลผู้ใช้จาก server
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include", // รวม cookies
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser({
              ...data.user,
              department: "PHARMACY", // กำหนด department สำหรับ Pharmacy
            });
            // เก็บใน localStorage เพื่อใช้ในครั้งต่อไป
            localStorage.setItem("user", JSON.stringify(data.user));
          } else {
            // หากไม่สำเร็จ ให้ใช้ข้อมูล default
            setUser({
              firstName: "เภสัชกร",
              lastName: "คลังยา",
              position: "เจ้าหน้าที่เภสัชกรรม",
              department: "PHARMACY",
            });
          }
        } else {
          // หาก API ไม่สำเร็จ ลองดึงจาก localStorage
          const userData = localStorage.getItem("user");
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              setUser({
                ...parsedUser,
                department: "PHARMACY",
              });
            } catch {
              setUser({
                firstName: "เภสัชกร",
                lastName: "คลังยา",
                position: "เจ้าหน้าที่เภสัชกรรม",
                department: "PHARMACY",
              });
            }
          } else {
            setUser({
              firstName: "เภสัชกร",
              lastName: "คลังยา",
              position: "เจ้าหน้าที่เภสัชกรรม",
              department: "PHARMACY",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // หากเกิดข้อผิดพลาด ลองดึงจาก localStorage
        const userData = localStorage.getItem("user");
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setUser({
              ...parsedUser,
              department: "PHARMACY",
            });
          } catch {
            setUser({
              firstName: "เภสัชกร",
              lastName: "คลังยา",
              position: "เจ้าหน้าที่เภสัชกรรม",
              department: "PHARMACY",
            });
          }
        } else {
          setUser({
            firstName: "เภสัชกร",
            lastName: "คลังยา",
            position: "เจ้าหน้าที่เภสัชกรรม",
            department: "PHARMACY",
          });
        }
      }
    };

    fetchUserData();
  }, []);

  // Function to handle back navigation
  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  // หากยังไม่มีข้อมูลผู้ใช้ ให้แสดง loading state
  if (!user) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูลผู้ใช้...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Back Button & Status Section - แก้ไขส่วนนี้ */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">กลับไปหน้าหลัก</span>
          <span className="sm:hidden">กลับ</span>
        </Button>

        {/* เพิ่ม Server Status ชิดขวา */}
        <SimpleStatusIndicator />
      </div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">แผนกคลังยา</h1>
            </div>
          </div>
          <p className="text-gray-600 mt-1">
            ยินดีต้อนรับ คุณ{user.firstName} {user.lastName}
            {user.position && ` (${user.position})`}
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
          <StockManagementTab department="PHARMACY" />
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <TransferTab
            department="PHARMACY"
            // onViewDetail={setActiveTransfer}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <HistoryTabEnhanced department="PHARMACY" />
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
          <div className="mt-2 sm:mt-0">ระบบอัปเดตข้อมูลแบบเรียลไทม์</div>
        </div>
      </div>
    </div>
  );
}
