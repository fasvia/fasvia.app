'use client'

import Image from 'next/image'

export default function BrandLoader({ size = 80, className = '' }: { size?: number, className?: string }) {
  const isSmall = size <= 32;

  return (
    <div className={`flex items-center justify-center animate-in fade-in duration-500 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Aura / Glow */}
        {!isSmall && (
          <div className="absolute -inset-4 bg-gradient-to-tr from-purple-primary via-purple-accent to-blue-400 rounded-full opacity-30 blur-2xl animate-pulse transition-opacity duration-1000"></div>
        )}
        
        {/* The Logo */}
        <div className="relative flex items-center justify-center animate-[spin_3s_linear_infinite]">
          <Image 
            src="/fasvia-logo.png" 
            alt="Loading..."
            width={size}
            height={size}
            className={isSmall ? "opacity-90" : "animate-[pulse_1.5s_easeInOut_infinite] drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"}
          />
        </div>
      </div>
      
      {!isSmall && (
        <style jsx>{`
          @keyframes easeInOut {
            0%, 100% { transform: scale(0.9); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
          }
        `}</style>
      )}
    </div>
  )
}
