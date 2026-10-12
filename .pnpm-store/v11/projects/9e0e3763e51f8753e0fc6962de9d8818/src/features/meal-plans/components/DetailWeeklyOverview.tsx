import React from 'react'
import {
  Flame,
  Dumbbell,
  Utensils,
  Refrigerator,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import type { WeeklyOverviewStat } from '../types/mealPlans.types'

interface DetailWeeklyOverviewProps {
  overview: WeeklyOverviewStat
}

export const DetailWeeklyOverview: React.FC<DetailWeeklyOverviewProps> = ({
  overview,
}) => {
  const cards = [
    {
      label: 'Trung bình Calo',
      val: overview.avgCalories,
      note: overview.avgCaloriesNote,
      icon: <Flame className="h-4 w-4 text-amber-500" />,
      bg: 'bg-amber-50',
    },
    {
      label: 'Đạm trung bình',
      val: overview.avgProtein,
      note: overview.avgProteinNote,
      icon: <Dumbbell className="h-4 w-4 text-emerald-600" />,
      bg: 'bg-emerald-50',
    },
    {
      label: 'Tổng số món',
      val: overview.totalMeals,
      note: overview.totalMealsNote,
      icon: <Utensils className="h-4 w-4 text-blue-600" />,
      bg: 'bg-blue-50',
    },
    {
      label: 'Tận dụng tủ bếp',
      val: overview.pantryRatio,
      note: overview.pantryRatioNote,
      icon: <Refrigerator className="h-4 w-4 text-emerald-600" />,
      bg: 'bg-emerald-50',
    },
    {
      label: 'Khớp mục tiêu BMI',
      val: overview.bmiMatchRatio,
      note: overview.bmiMatchRatioNote,
      icon: <ShieldCheck className="h-4 w-4 text-teal-600" />,
      bg: 'bg-teal-50',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Tổng quan cả tuần (7 ngày)
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Đánh giá cân bằng dinh dưỡng và mức độ phù hợp mục tiêu sức khỏe thể chất
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-xs font-bold text-emerald-800 self-start sm:self-auto">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>Chuẩn chỉ số Viện Dinh Dưỡng</span>
        </div>
      </div>

      {/* 5 Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {cards.map((c) => (
          <div
            key={c.label}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-emerald-200 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                {c.label}
              </span>
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full ${c.bg}`}
              >
                {c.icon}
              </div>
            </div>

            <div className="mt-3">
              <span className="text-lg font-black text-slate-900 tracking-tight block">
                {c.val}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 block mt-0.5">
                {c.note}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
