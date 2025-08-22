// 📄 File: components/modules/transaction/transaction-display-responsive.tsx
// Responsive wrapper สำหรับแสดงประวัติการเคลื่อนไหว - เลือก Table หรือ Cards ตามขนาดหน้าจอ

'use client'

import { useEffect, useState } from 'react'
import { Transaction } from '@/types/dashboard'
import { TransactionTableEnhanced } from './transaction-table-enhanced'
import { TransactionCardsMobile } from './transaction-cards-mobile'
import { Button } from '@/components/ui/button'
import { Grid3X3, List, Smartphone, Monitor } from 'lucide-react'

interface FilteredStatsData {
  totalTransactions: number
  totalValue: number
  incomingCount: number
  outgoingCount: number
}

interface TransactionDisplayResponsiveProps {
  transactions: Transaction[]
  department: 'PHARMACY' | 'OPD'
  onView?: (transaction: Transaction) => void
  onFilteredStatsChange?: (stats: FilteredStatsData) => void
  loading?: boolean
}

type ViewMode = 'auto' | 'table' | 'cards'

export function TransactionDisplayResponsive(props: TransactionDisplayResponsiveProps) {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [viewMode, setViewMode] = useState<ViewMode>('auto')
  const [userPreference, setUserPreference] = useState<ViewMode>('auto')

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Load user preference from localStorage (only in browser)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem('transaction-view-preference') as ViewMode
      if (savedPreference && ['auto', 'table', 'cards'].includes(savedPreference)) {
        setUserPreference(savedPreference)
        setViewMode(savedPreference)
      }
    }
  }, [])

  // Save user preference
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    setUserPreference(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('transaction-view-preference', mode)
    }
  }

  // Determine which component to render
  const shouldShowCards = (): boolean => {
    if (viewMode === 'cards') return true
    if (viewMode === 'table') return false
    // Auto mode: show cards on mobile, table on larger screens
    return screenSize === 'mobile'
  }

  const getViewModeIcon = (mode: ViewMode) => {
    switch (mode) {
      case 'cards':
        return <Grid3X3 className="h-4 w-4" />
      case 'table':
        return <List className="h-4 w-4" />
      case 'auto':
        return screenSize === 'mobile' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />
    }
  }

  const getViewModeLabel = (mode: ViewMode) => {
    switch (mode) {
      case 'cards':
        return 'การ์ด'
      case 'table':
        return 'ตาราง'
      case 'auto':
        return 'อัตโนมัติ'
    }
  }

  return (
    <div className="space-y-4">
      {/* View Mode Selector - Show only on tablet and desktop */}
      {(screenSize === 'tablet' || screenSize === 'desktop') && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>มุมมอง:</span>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(['auto', 'table', 'cards'] as ViewMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange(mode)}
                  className="h-8 px-3 text-xs"
                >
                  {getViewModeIcon(mode)}
                  <span className="ml-1 hidden sm:inline">
                    {getViewModeLabel(mode)}
                  </span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Current Screen Size Indicator */}
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
        </div>
      )}

      {/* Render appropriate component */}
      {shouldShowCards() ? (
        <TransactionCardsMobile {...props} />
      ) : (
        <TransactionTableEnhanced {...props} />
      )}

      {/* Mobile View Mode Toggle (Floating Action Button) */}
      {screenSize === 'mobile' && (
        <div className="fixed bottom-20 right-4 z-40">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleViewModeChange(shouldShowCards() ? 'table' : 'cards')}
            className="h-12 w-12 rounded-full shadow-lg bg-white border-2 border-gray-200 hover:bg-gray-50"
          >
            {shouldShowCards() ? (
              <List className="h-5 w-5 text-gray-600" />
            ) : (
              <Grid3X3 className="h-5 w-5 text-gray-600" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// Hook for getting current view mode
export function useTransactionViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>('auto')
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem('transaction-view-preference') as ViewMode
      if (savedPreference && ['auto', 'table', 'cards'].includes(savedPreference)) {
        setViewMode(savedPreference)
      }
    }
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const isCardsView = (): boolean => {
    if (viewMode === 'cards') return true
    if (viewMode === 'table') return false
    return screenSize === 'mobile'
  }

  return {
    viewMode,
    screenSize,
    isCardsView: isCardsView(),
    setViewMode: (mode: ViewMode) => {
      setViewMode(mode)
      if (typeof window !== 'undefined') {
        localStorage.setItem('transaction-view-preference', mode)
      }
    }
  }
}