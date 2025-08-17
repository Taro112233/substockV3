// 📄 File: app/dashboard/pharmacy/layout.tsx
import { ErrorBoundary } from '@/components/error-boundary'
import { Toaster } from '@/components/ui/toaster'

export default function PharmacyDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {children}
        <Toaster />
      </div>
    </ErrorBoundary>
  )
}

