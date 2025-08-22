// app/layout.tsx - ✅ FIXED for Next.js 15
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/app/utils/auth-client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ แยก metadata export (ไม่รวม themeColor และ viewport)
export const metadata: Metadata = {
  title: "Hospital Pharmacy Stock Management System V3.0",
  description: "ระบบจัดการสต็อกยาโรงพยาบาล - Single Hospital System",
  manifest: "/manifest.json",
  // ❌ ลบ themeColor และ viewport ออก
};

// ✅ สร้าง viewport export แยกต่างหาก (Next.js 15+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb', // ✅ ย้าย themeColor มาที่นี่
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}