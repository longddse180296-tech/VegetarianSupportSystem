import React from 'react'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import type { DailyMacroSummary } from '../types/mealPlans.types'

interface DailyNutritionCardProps {
  summary: DailyMacroSummary
}

export const DailyNutritionCard: React.FC<DailyNutritionCardProps> = ({
  summary,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-sm">Dinh dưỡng trong ngày</h3>
        <Sparkles className="w-4 h-4 text-emerald-600" />
      </div>

      {/* Calorie Donut / Score Row */}
      <div className="flex items-center gap-4 p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
        <div className="w-16 h-16 rounded-full border-4 border-emerald-500 bg-white flex flex-col items-center justify-center shrink-0 shadow-xs">
          <span className="font-extrabold text-sm text-gray-900 leading-tight">
            {summary.calories.toLocaleString()}
          </span>
          <span className="text-[9px] text-gray-400">/{summary.targetCalories}</span>
        </div>

        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Đạt {summary.percentAchieved}% mục tiêu</span>
          </span>
          <p className="text-[11px] text-gray-500 mt-1 leading-snug">
            {summary.statusNote}
          </p>
        </div>
      </div>

      {/* Macro Distribution */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-gray-800 block">
          Phân bổ đa lượng (Macro)
        </span>

        {/* Multi-segmented Progress Bar */}
        <div className="h-3 w-full rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5">
          <div
            style={{ width: `${summary.carbsPercent}%` }}
            className="h-full bg-emerald-600 rounded-l-full"
            title={`Carbs: ${summary.carbsPercent}%`}
          />
          <div
            style={{ width: `${summary.proteinPercent}%` }}
            className="h-full bg-teal-500"
            title={`Protein: ${summary.proteinPercent}%`}
          />
          <div
            style={{ width: `${summary.fatPercent}%` }}
            className="h-full bg-lime-500 rounded-r-full"
            title={`Lipid: ${summary.fatPercent}%`}
          />
        </div>

        {/* 3 Columns Stat */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-center gap-1 text-emerald-700 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Carbs</span>
            </div>
            <p className="font-extrabold text-gray-900 text-xs mt-1">
              {summary.carbsPercent}%
            </p>
            <span className="text-[10px] text-gray-400">{summary.carbsGrams}g</span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-center gap-1 text-teal-700 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span>Protein</span>
            </div>
            <p className="font-extrabold text-gray-900 text-xs mt-1">
              {summary.proteinPercent}%
            </p>
            <span className="text-[10px] text-gray-400">{summary.proteinGrams}g</span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-center gap-1 text-lime-800 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-lime-500" />
              <span>Lipid tốt</span>
            </div>
            <p className="font-extrabold text-gray-900 text-xs mt-1">
              {summary.fatPercent}%
            </p>
            <span className="text-[10px] text-gray-400">{summary.fatGrams}g</span>
          </div>
        </div>
      </div>
    </div>
  )
}
export default DailyNutritionCard
