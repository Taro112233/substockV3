// app/admin/layout.tsx - Simple layout for admin pages
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'การจัดการระบบ - Hospital Pharmacy',
  description: 'หน้าจัดการระบบและผู้ใช้งาน',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}