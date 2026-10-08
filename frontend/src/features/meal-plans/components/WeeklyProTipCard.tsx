import React from 'react'
import { Lightbulb, BookOpen } from 'lucide-react'
import type { WeeklyProTip } from '../types/mealPlans.types'

interface WeeklyProTipCardProps {
  proTip: WeeklyProTip
  onActionClick?: () => void
}

export const WeeklyProTipCard: React.FC<WeeklyProTipCardProps> = ({
  proTip,
  onActionClick,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 via-emerald-50/60 to-white p-5 md:p-6 shadow-2xs">
      {/* Left Icon + Text */}
      <div className="flex items-start md:items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white border border-emerald-200 text-emerald-700 shadow-2xs">
          <Lightbulb className="h-6 w-6 text-emerald-600" />
        </div>

        <div>
          <h4 className="text-sm md:text-base font-extrabold text-slate-900">
            {proTip.title}
          </h4>
          <p className="mt-1 text-xs md:text-sm text-slate-600 max-w-2xl leading-relaxed">
            {proTip.content}
          </p>
        </div>
      </div>

      {/* Right Button */}
      <div className="shrink-0 self-start md:self-center">
        <button
          type="button"
          onClick={onActionClick}
          className="flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all"
        >
          <BookOpen className="h-4 w-4 text-emerald-600" />
          <span>{proTip.actionLabel}</span>
        </button>
      </div>
    </div>
  )
}
