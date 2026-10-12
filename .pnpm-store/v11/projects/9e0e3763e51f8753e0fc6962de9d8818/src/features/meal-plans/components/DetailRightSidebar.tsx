import React, { useState } from 'react'
import {
  Check,
  Bot,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import type {
  DailyNutritionRing,
  PantrySavingsInfo,
  GroceryItemToday,
} from '../types/mealPlans.types'

interface DetailRightSidebarProps {
  nutrition: DailyNutritionRing
  pantry: PantrySavingsInfo
  todayGroceries: GroceryItemToday[]
  aiAdvice: string
  onAskAiClick?: () => void
}

export const DetailRightSidebar: React.FC<DetailRightSidebarProps> = ({
  nutrition,
  pantry,
  todayGroceries,
  aiAdvice,
  onAskAiClick,
}) => {
  const [groceries, setGroceries] = useState<GroceryItemToday[]>(todayGroceries)

  const handleToggleGrocery = (id: string) => {
    setGroceries((prev) =>
      prev.map((g) => (g.id === id ? { ...g, isChecked: !g.isChecked } : g)),
    )
  }

  const checkedCount = groceries.filter((g) => g.isChecked).length

  return (
    <div className="space-y-4">
      {/* 1. Dinh dưỡng trong ngày Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-extrabold text-sm text-slate-900">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span>Dinh dưỡng trong ngày</span>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/60">
            {nutrition.percent}% Mục tiêu
          </span>
        </div>

        {/* Circular Gauge / Donut Mockup */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-slate-50 border-8 border-emerald-100 shadow-inner">
            {/* SVG circle progress */}
            <svg className="absolute inset-0 h-full w-full -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-emerald-600"
                strokeWidth="8"
                fill="none"
                strokeDasharray="402"
                strokeDashoffset="20"
                strokeLinecap="round"
              />
            </svg>

            <div className="text-center z-10">
              <span className="text-2xl font-black text-slate-900 tracking-tight block">
                {nutrition.consumedCalories.toLocaleString('vi-VN')}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold block">
                / {nutrition.targetCalories.toLocaleString('vi-VN')} kcal
              </span>
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                Calo tiêu thụ / Tối ưu
              </span>
            </div>
          </div>
        </div>

        {/* 3 Macro Progress Bars */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          {/* Carbs */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                Carbohydrate phức ({nutrition.carbsPercent}%)
              </span>
              <span className="font-bold text-slate-900">{nutrition.carbsGrams}g</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${nutrition.carbsPercent}%` }}
              />
            </div>
          </div>

          {/* Protein */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                Đạm thực vật ({nutrition.proteinPercent}%)
              </span>
              <span className="font-bold text-emerald-800">{nutrition.proteinGrams}g</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${nutrition.proteinPercent * 3}%` }}
              />
            </div>
          </div>

          {/* Fat */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                Chất béo tốt ({nutrition.fatPercent}%)
              </span>
              <span className="font-bold text-slate-900">{nutrition.fatGrams}g</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full"
                style={{ width: `${nutrition.fatPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tận dụng tủ bếp Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-sm text-slate-900">
            Tận dụng tủ bếp
          </h4>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/60">
            {pantry.pantryRatio}% Sẵn có
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Hệ thống tự ưu tiên ghép {pantry.availableIngredients.length} nguyên liệu sẵn có trong tủ lạnh của bạn:
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {pantry.availableIngredients.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
            >
              <span>{item}</span>
              <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
            </span>
          ))}
        </div>

        {/* Savings banner */}
        <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-3 text-xs text-emerald-900">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check className="h-3 w-3" />
          </div>
          <span className="font-semibold">
            Ước tính tiết kiệm <strong className="font-black">{pantry.savingsAmount}</strong> so với mua mới toàn bộ
          </span>
        </div>
      </div>

      {/* 3. Cần mua thêm hôm nay Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-sm text-slate-900">
            Cần mua thêm hôm nay
          </h4>
          <span className="text-[11px] font-semibold text-slate-400">
            {checkedCount}/{groceries.length} đã chọn
          </span>
        </div>

        <div className="space-y-2">
          {groceries.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggleGrocery(item.id)}
              className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all cursor-pointer ${
                item.isChecked
                  ? 'border-emerald-200 bg-emerald-50/60 text-slate-500 line-through'
                  : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                    item.isChecked
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {item.isChecked && <Check className="h-3 w-3" />}
                </div>
                <span className="font-semibold">{item.name}</span>
              </div>
              <span className="font-bold text-slate-700">{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Trợ lý Dinh dưỡng AI Card */}
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-2xs">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">
              Trợ lý Dinh dưỡng AI
            </h4>
            <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              <span>Gemini Nutrition Core</span>
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-700 italic leading-relaxed border-l-2 border-emerald-500 pl-3">
          &ldquo;{aiAdvice}&rdquo;
        </p>

        <button
          type="button"
          onClick={onAskAiClick}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#184d28] hover:bg-[#123e1f] py-2.5 text-xs font-bold text-white shadow-2xs active:scale-[0.98] transition-all"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Hỏi đáp thêm với AI</span>
        </button>
      </div>
    </div>
  )
}
