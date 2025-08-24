// app/dashboard/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Hospital, ArrowRight, Users, LogOut } from "lucide-react";

export default function MainDashboard() {
  const router = useRouter();

  // ดึงข้อมูลผู้ใช้จาก localStorage หรือ context
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    position?: string;
    username?: string;
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
            setUser(data.user);
            // เก็บใน localStorage เพื่อใช้ในครั้งต่อไป
            localStorage.setItem("user", JSON.stringify(data.user));
          } else {
            // หากไม่สำเร็จ ให้ใช้ข้อมูล default
            setUser({
              firstName: "ผู้ใช้",
              lastName: "ระบบ",
              position: "เจ้าหน้าที่",
            });
          }
        } else {
          // หาก API ไม่สำเร็จ ลองดึงจาก localStorage
          const userData = localStorage.getItem("user");
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              setUser(parsedUser);
            } catch {
              setUser({
                firstName: "ผู้ใช้",
                lastName: "ระบบ",
                position: "เจ้าหน้าที่",
              });
            }
          } else {
            setUser({
              firstName: "ผู้ใช้",
              lastName: "ระบบ",
              position: "เจ้าหน้าที่",
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
            setUser(parsedUser);
          } catch {
            setUser({
              firstName: "ผู้ใช้",
              lastName: "ระบบ",
              position: "เจ้าหน้าที่",
            });
          }
        } else {
          setUser({
            firstName: "ผู้ใช้",
            lastName: "ระบบ",
            position: "เจ้าหน้าที่",
          });
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      // Call logout API to clear HTTP-only cookies
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // รวม cookies ในการเรียก API
      });

      // Clear any client-side storage (if exists)
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.clear();

      // Always redirect to login regardless of API response
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);

      // Clear client-side storage even if API fails
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.clear();

      // Force redirect anyway for security
      router.push("/login");
    }
  };

  // หากยังไม่มีข้อมูลผู้ใช้ ให้แสดง loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลผู้ใช้...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900">
              ระบบจัดการสต็อกยาโรงพยาบาล
            </h1>
            {user ? (
              <>
                <p className="text-xl text-gray-600 mt-2">
                  ยินดีต้อนรับ, {user.firstName} {user.lastName}
                </p>
                {user.position && (
                  <p className="text-sm text-gray-500">
                    ตำแหน่ง: {user.position}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xl text-gray-600 mt-2">
                กำลังโหลดข้อมูลผู้ใช้...
              </p>
            )}
          </div>

          {/* Admin Controls - Desktop */}
          <div className="hidden sm:flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/users")}
            >
              <Users className="h-4 w-4 mr-2" />
              จัดการผู้ใช้งาน
            </Button>

            <Button
              size="sm"
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </div>

      {/* Department Selection */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          เลือกแผนกที่ต้องการใช้งาน
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pharmacy Department Card */}
          <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer border-2 border-blue-200">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center">
                <Package className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-blue-900">คลังยา</CardTitle>
              <p className="text-gray-600">จัดการสต็อกยาหลัก</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>จัดการสต็อกยาทั้งหมด</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>รับยาจากซัพพลายเออร์</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>จ่ายยาให้แผนกต่างๆ</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>ติดตามยาหมดอายุ</span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => router.push("/dashboard/pharmacy")}
              >
                เข้าสู่แผนกคลังยา
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* OPD Department Card */}
          <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer border-2 border-green-200">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-20 h-20 flex items-center justify-center">
                <Hospital className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-900">OPD</CardTitle>
              <p className="text-gray-600">แผนกผู้ป่วยนอก</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>เบิกยาจากคลังยา</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>จ่ายยาให้ผู้ป่วย</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>ติดตามสต็อก OPD</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>บันทึกการจ่ายยา</span>
                </div>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => router.push("/dashboard/opd")}
              >
                เข้าสู่แผนก OPD
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Controls - Mobile */}
      <div className="sm:hidden">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">เมนูจัดการ</h3>
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/users")}
            className="w-full justify-start"
          >
            <Users className="h-4 w-4 mr-3" />
            จัดการผู้ใช้งาน
          </Button>

          <Button
            onClick={handleLogout}
            className="w-full justify-start bg-red-600 hover:bg-red-700 text-white"
          >
            <LogOut className="h-4 w-4 mr-3" />
            ออกจากระบบ
          </Button>
        </div>
      </div>

      {/* System Info */}
      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Hospital Pharmacy Stock Management System V3.0</p>
        <p>Mobile-First • Department Isolation • Real-time Updates</p>
      </div>
    </div>
  );
}
