import React from 'react'
import { Sparkles, Bot, CheckCircle2 } from 'lucide-react'
import type { WeeklyPlanOverview } from '../types/mealPlans.types'

interface WeeklyOverviewSectionProps {
  overview: WeeklyPlanOverview
  aiExplanation: string
}

export const WeeklyOverviewSection: React.FC<WeeklyOverviewSectionProps> = ({
  overview,
  aiExplanation,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. 5 Metric Cards */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 text-sm md:text-base">
          Tổng quan cả tuần (7 ngày)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 block">
              Trung bình calo/ngày
            </span>
            <p className="text-xl font-extrabold text-gray-900 mt-1 font-sans">
              {overview.avgCalories.toLocaleString()}{' '}
              <span className="text-xs font-normal text-gray-400">kcal</span>
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{overview.avgCaloriesNote}</span>
            </span>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 block">
              Protein trung bình
            </span>
            <p className="text-xl font-extrabold text-gray-900 mt-1 font-sans">
              {overview.avgProtein}{' '}
              <span className="text-xs font-normal text-gray-400">g/ngày</span>
            </p>
            <span className="text-[11px] text-gray-500 font-medium mt-1 block">
              {overview.avgProteinNote}
            </span>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 block">
              Món ăn đa dạng
            </span>
            <p className="text-xl font-extrabold text-gray-900 mt-1 font-sans">
              {overview.uniqueMealCount}{' '}
              <span className="text-xs font-normal text-gray-400">món</span>
            </p>
            <span className="text-[11px] text-gray-500 font-medium mt-1 block">
              {overview.uniqueMealNote}
            </span>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 block">
              Tận dụng đồ có sẵn
            </span>
            <p className="text-xl font-extrabold text-[#1E6531] mt-1 font-sans">
              {overview.pantryUsedPercent}%
            </p>
            <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
              {overview.pantryUsedNote}
            </span>
          </div>

          {/* Card 5 */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 block">
              Phù hợp mục tiêu
            </span>
            <p className="text-xl font-extrabold text-emerald-600 mt-1 font-sans">
              {overview.goalMatchPercent}%
            </p>
            <span className="text-[11px] text-emerald-700 font-bold mt-1 block">
              {overview.goalMatchNote}
            </span>
          </div>
        </div>
      </div>

      {/* 2. AI Explanation Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-200/80 shadow-xs flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center shrink-0">
          <Bot className="w-6 h-6" />
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900 text-sm">
              Vì sao hệ thống đề xuất thực đơn này?
            </h4>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF5EE] text-[#1E6531]">
              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
              <span>AI Explanation</span>
            </span>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            {aiExplanation}
          </p>
        </div>
      </div>
    </div>
  )
}
export default WeeklyOverviewSection
