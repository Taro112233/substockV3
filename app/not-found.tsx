// app/not-found.tsx - ✅ FIXED for Next.js 15
import type { Metadata, Viewport } from "next";
import Link from 'next/link';

// ✅ metadata export ไม่รวม themeColor และ viewport
export const metadata: Metadata = {
  title: 'ไม่พบหน้าที่ค้นหา | Hospital Pharmacy',
  description: 'หน้าที่คุณค้นหาไม่มีอยู่ในระบบ',
};

// ✅ viewport export แยกต่างหาก (ถ้าต้องการ override)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#dc2626', // สีแดงสำหรับหน้า error
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto text-center p-6">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            ไม่พบหน้าที่ค้นหา
          </h2>
          <p className="text-gray-600">
            หน้าที่คุณพยายามเข้าถึงไม่มีอยู่ในระบบ
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/dashboard"
            className="inline-block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            กลับไปหน้าหลัก
          </Link>
          
          <Link 
            href="/login"
            className="inline-block w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}