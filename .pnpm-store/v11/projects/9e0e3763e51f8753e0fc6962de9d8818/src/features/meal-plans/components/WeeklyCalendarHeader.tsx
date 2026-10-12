import React from 'react'
import { RefreshCw, ShoppingCart, FileEdit } from 'lucide-react'
import type { DayOfWeek, WeeklyCalendarDay } from '../types/mealPlans.types'

interface WeeklyCalendarHeaderProps {
  weekRange: string
  days: WeeklyCalendarDay[]
  activeDay: DayOfWeek
  onSelectDay: (dayId: DayOfWeek) => void
  onSwapMeal?: () => void
  onExportShoppingList?: () => void
  onEditWeek?: () => void
  isExportingShoppingList?: boolean
}

export const WeeklyCalendarHeader: React.FC<WeeklyCalendarHeaderProps> = ({
  weekRange,
  days,
  activeDay,
  onSelectDay,
  onSwapMeal,
  onExportShoppingList,
  onEditWeek,
  isExportingShoppingList,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Header Row with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Kế hoạch bữa ăn
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Thực đơn tuần này{' '}
            <span className="font-semibold text-slate-500 text-base md:text-lg">
              ({weekRange.split(' - ')[0]} - {weekRange.split(' - ')[1]?.split('/')[0]}/{weekRange.split(' - ')[1]?.split('/')[1]})
            </span>
          </h2>
        </div>

        {/* 3 Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSwapMeal}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Đổi món</span>
          </button>

          <button
            type="button"
            onClick={onExportShoppingList}
            disabled={isExportingShoppingList}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 disabled:opacity-60 transition-all"
          >
            <ShoppingCart className="h-3.5 w-3.5 text-emerald-600" />
            <span>{isExportingShoppingList ? 'Đang xuất...' : 'Xuất danh sách đi chợ'}</span>
          </button>

          <button
            type="button"
            onClick={onEditWeek}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all"
          >
            <FileEdit className="h-3.5 w-3.5 text-slate-500" />
            <span>Chỉnh sửa tuần</span>
          </button>
        </div>
      </div>

      {/* Day of Week Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {days.map((day) => {
          const isActive = day.id === activeDay
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => onSelectDay(day.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#184d28] text-white shadow-sm ring-1 ring-[#184d28]'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <span>{day.label}</span>
              <span
                className={`text-[11px] font-medium ${
                  isActive ? 'text-emerald-200' : 'text-slate-400'
                }`}
              >
                {day.dateStr}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
