import React from 'react'

export const MealPlanSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Diet Tabs Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200/80 rounded-3xl" />
        ))}
      </div>

      {/* Characteristic Banner Skeleton */}
      <div className="h-28 bg-slate-200/80 rounded-3xl" />

      {/* Main Content Skeleton Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 bg-slate-200 rounded w-48 mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 bg-slate-200/80 rounded-3xl" />
          ))}
        </div>

        {/* Right Column (1 col) */}
        <div className="space-y-5">
          <div className="h-60 bg-slate-200/80 rounded-3xl" />
          <div className="h-44 bg-slate-200/80 rounded-3xl" />
          <div className="h-72 bg-slate-200/80 rounded-3xl" />
        </div>
      </div>
    </div>
  )
}
export default MealPlanSkeleton
