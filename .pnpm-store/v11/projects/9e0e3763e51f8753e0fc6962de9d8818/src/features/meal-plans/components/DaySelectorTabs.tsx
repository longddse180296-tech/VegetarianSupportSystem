import React from 'react'
import { RefreshCw, Sliders, Bookmark, Check } from 'lucide-react'
import type { DayOfWeek, DayPlanOption } from '../types/mealPlans.types'

interface DaySelectorTabsProps {
  days: DayPlanOption[]
  activeDay: DayOfWeek
  onSelectDay: (dayId: DayOfWeek) => void
  onRegenerate: () => void
  onEditProfile: () => void
  onSavePlan: () => void
  isRegenerating?: boolean
  isSaved?: boolean
}

export const DaySelectorTabs: React.FC<DaySelectorTabsProps> = ({
  days,
  activeDay,
  onSelectDay,
  onRegenerate,
  onEditProfile,
  onSavePlan,
  isRegenerating = false,
  isSaved = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Action Bar matching Figma */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <span>💡</span>
          <span>Bạn có thể chỉnh sửa từng bữa trước khi lưu vào quản lý cá nhân.</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isRegenerating ? 'Đang tạo lại...' : 'Tạo lại toàn bộ'}</span>
          </button>

          <button
            type="button"
            onClick={onEditProfile}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Chỉnh sửa thông tin</span>
          </button>

          <button
            type="button"
            onClick={onSavePlan}
            className="px-4 py-2 rounded-2xl bg-[#1E6531] hover:bg-[#164e25] text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Đã lưu thực đơn</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span>Lưu thực đơn</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 7 Days of the Week Selector matching Figma */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {days.map((day) => {
          const isActive = activeDay === day.dayId

          return (
            <button
              key={day.dayId}
              type="button"
              onClick={() => onSelectDay(day.dayId)}
              className={`p-3.5 rounded-2xl text-center border transition-all focus:outline-none ${
                isActive
                  ? 'bg-[#1E6531] border-[#1E6531] text-white shadow-md'
                  : 'bg-white border-slate-200/80 hover:border-emerald-300 text-slate-800 hover:bg-slate-50/50'
              }`}
            >
              <h4 className={`font-bold text-xs ${isActive ? 'text-white' : 'text-gray-900'}`}>
                {day.label}
              </h4>
              <p
                className={`text-[11px] mt-0.5 font-mono ${
                  isActive ? 'text-emerald-100 font-medium' : 'text-gray-400'
                }`}
              >
                {day.calories.toLocaleString()} kcal
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
export default DaySelectorTabs
