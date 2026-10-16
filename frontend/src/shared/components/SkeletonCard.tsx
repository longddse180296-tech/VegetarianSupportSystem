import React from 'react'

export interface SkeletonCardProps {
  className?: string
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs animate-pulse flex flex-col ${className}`}
      aria-hidden="true"
    >
      {/* Box ảnh màu xám nhấp nháy animate-pulse */}
      <div className="h-44 w-full rounded-xl bg-slate-200" />
      {/* 2 dòng text xám bên dưới */}
      <div className="mt-4 space-y-2.5">
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-3.5 w-1/2 rounded bg-slate-200/70" />
      </div>
    </div>
  )
}

export default SkeletonCard
