import React from 'react'
import type { DayOfWeek } from '../types/mealPlans.types'

interface DetailDaySelectorProps {
  activeDay: DayOfWeek
  dayCalories: Record<DayOfWeek, number>
  onSelectDay: (day: DayOfWeek) => void
}

const DAYS: { id: DayOfWeek; label: string }[] = [
  { id: 'mon', label: 'Thứ Hai' },
  { id: 'tue', label: 'Thứ Ba' },
  { id: 'wed', label: 'Thứ Tư' },
  { id: 'thu', label: 'Thứ Năm' },
  { id: 'fri', label: 'Thứ Sáu' },
  { id: 'sat', label: 'Thứ Bảy' },
  { id: 'sun', label: 'Chủ Nhật' },
]

export const DetailDaySelector: React.FC<DetailDaySelectorProps> = ({
  activeDay,
  dayCalories,
  onSelectDay,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {DAYS.map((d) => {
        const isActive = d.id === activeDay
        const kcal = dayCalories[d.id] || 1800
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelectDay(d.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              isActive
                ? 'bg-[#184d28] text-white shadow-sm ring-1 ring-[#184d28]'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-2xs'
            }`}
          >
            <span>{d.label}</span>
            <span
              className={`text-[11px] font-medium ${
                isActive ? 'text-emerald-200' : 'text-slate-400'
              }`}
            >
              ({kcal.toLocaleString('vi-VN')} kcal)
            </span>
          </button>
        )
      })}
    </div>
  )
}
