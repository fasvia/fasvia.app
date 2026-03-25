'use client'

import React, { useState, useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const threshold = 120 // Distance to pull before triggering refresh

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the scroll
      if (window.scrollY === 0) {
        startY.current = e.touches[0].pageY
      } else {
        startY.current = -1
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === -1 || isRefreshing) return

      const currentY = e.touches[0].pageY
      const distance = currentY - startY.current

      if (distance > 0) {
        // Apply some resistance
        const dampenedDistance = Math.pow(distance, 0.8)
        setPullDistance(Math.min(dampenedDistance, threshold + 20))
        
        // Prevent default scrolling when pulling
        if (distance > 10) {
          if (e.cancelable) e.preventDefault()
        }
      }
    }

    const handleTouchEnd = () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        setPullDistance(threshold)
        // Refresh the page
        setTimeout(() => {
          window.location.reload()
        }, 800)
      } else {
        setPullDistance(0)
      }
      startY.current = -1
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDistance, isRefreshing])

  return (
    <div className="relative w-full min-h-screen">
      {/* Pull Indicator */}
      <div 
        className="fixed left-0 right-0 z-[100] flex justify-center pointer-events-none transition-transform duration-200"
        style={{ 
          transform: `translateY(${pullDistance - 60}px)`,
          opacity: pullDistance / threshold 
        }}
      >
        <div className="bg-surface border border-border-subtle rounded-full p-3 shadow-2xl flex items-center justify-center">
          <RefreshCw 
            size={24} 
            className={`text-purple-accent ${isRefreshing ? 'animate-spin' : ''}`} 
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div 
        className="transition-transform duration-200"
        style={{ 
          transform: isRefreshing ? `translateY(${threshold}px)` : pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none' 
        }}
      >
        {children}
      </div>
    </div>
  )
}
