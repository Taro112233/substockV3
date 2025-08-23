// 📄 File: components/modules/stock/stock-display-responsive.tsx
// Responsive wrapper สำหรับแสดงข้อมูลสต็อก - เลือก Table หรือ Cards ตามขนาดหน้าจอ (อัตโนมัติเท่านั้น)

'use client'

import { useEffect, useState } from 'react'
import { Stock } from '@/types/dashboard'
import { StockTableEnhanced } from './stock-table-enhanced'
import { StockCardsMobile } from './stock-cards-mobile'

interface FilteredStatsData {
  totalDrugs: number
  totalValue: number
  lowStockCount: number
}

interface StockDisplayResponsiveProps {
  stocks: Stock[]
  department: 'PHARMACY' | 'OPD'
  onAdjust?: (stock: Stock) => void
  onView?: (stock: Stock) => void
  onUpdate?: (updatedStock: Stock) => void
  onFilteredStatsChange?: (stats: FilteredStatsData) => void
  loading?: boolean
}

export function StockDisplayResponsive(props: StockDisplayResponsiveProps) {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

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

  // Auto mode: show cards on mobile, table on larger screens
  const shouldShowCards = (): boolean => {
    return screenSize === 'mobile'
  }

  return (
    <div className="space-y-4">
      {/* Render appropriate component based on screen size */}
      {shouldShowCards() ? (
        <StockCardsMobile {...props} />
      ) : (
        <StockTableEnhanced {...props} />
      )}
    </div>
  )
}

// Hook for getting current view mode (simplified for auto-only)
export function useStockViewMode() {
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
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const isCardsView = (): boolean => {
    return screenSize === 'mobile'
  }

  return {
    screenSize,
    isCardsView: isCardsView(),
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop'
  }
}