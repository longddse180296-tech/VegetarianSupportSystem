import React from 'react'

export interface SkeletonLoaderProps {
  count?: number
  variant?: 'card' | 'table-row' | 'text' | 'recipe'
  className?: string
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  count = 6,
  variant = 'card',
  className = '',
}) => {
  if (variant === 'table-row') {
    return (
      <div className={`flex flex-col gap-3 w-full ${className}`} aria-busy="true">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-12 w-full bg-slate-100 rounded-lg animate-pulse border border-slate-200/60"
          />
        ))}
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div className={`flex flex-col gap-2.5 w-full ${className}`} aria-busy="true">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-slate-150 rounded animate-pulse"
            style={{ width: `${Math.max(40, 100 - (i % 3) * 20)}%` }}
          />
        ))}
      </div>
    )
  }

  // Card & Recipe variant
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full ${className}`}
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-[16px] border border-[#e5e7eb] overflow-hidden flex flex-col p-4 shadow-xs animate-pulse"
        >
          <div className="w-full h-44 bg-slate-200 rounded-xl mb-4" />
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-2.5" />
          <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
          <div className="h-3.5 bg-slate-100 rounded w-full mb-1.5" />
          <div className="h-3.5 bg-slate-100 rounded w-2/3 mb-5" />
          <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="h-4 bg-slate-100 rounded w-16" />
            <div className="h-8 bg-slate-200 rounded-[10px] w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default SkeletonLoader
