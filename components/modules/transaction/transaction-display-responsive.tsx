// 📄 File: components/modules/transaction/transaction-display-responsive.tsx
// Responsive wrapper สำหรับแสดงประวัติการเคลื่อนไหว - เลือก Table หรือ Cards ตามขนาดหน้าจอ (อัตโนมัติเท่านั้น)

'use client'

import { useEffect, useState } from 'react'
import { Transaction } from '@/types/dashboard'
import { TransactionTableEnhanced } from './transaction-table-enhanced'
import { TransactionCardsMobile } from './transaction-cards-mobile'

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

export function TransactionDisplayResponsive(props: TransactionDisplayResponsiveProps) {
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
        <TransactionCardsMobile {...props} />
      ) : (
        <TransactionTableEnhanced {...props} />
      )}
    </div>
  )
}

// Hook for getting current view mode (simplified for auto-only)
export function useTransactionViewMode() {
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