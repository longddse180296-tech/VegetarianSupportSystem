import React, { useState } from 'react'
import {
  Flame,
  RefreshCw,
  Sparkles,
  Check,
  Plus,
  ArrowRight,
} from 'lucide-react'
import type { DetailedMealSlot, DetailedSwapOption } from '../types/mealPlans.types'

interface DetailedMealSlotCardProps {
  meal: DetailedMealSlot
  onViewRecipe?: (recipeId?: string) => void
  onSelectSwapOption?: (slotId: string, optionId: string) => void
  isSwapping?: boolean
}

export const DetailedMealSlotCard: React.FC<DetailedMealSlotCardProps> = ({
  meal,
  onViewRecipe,
  onSelectSwapOption,
  isSwapping = false,
}) => {
  const [isSwapPanelOpen, setIsSwapPanelOpen] = useState(
    Boolean(meal.swapOptions && meal.swapOptions.length > 0 && meal.slot === 'lunch'),
  )

  const handleToggleSwap = () => {
    setIsSwapPanelOpen((prev) => !prev)
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-emerald-200 transition-all space-y-4">
      {/* 1. Header Bar: Slot & Time + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 uppercase tracking-wider">
            {meal.slotLabel} • {meal.slotTime}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-700">
            <Flame className="h-3 w-3 text-amber-500" />
            <span>{meal.calories} kcal</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewRecipe?.(meal.recipeId)}
            className="text-xs font-semibold text-slate-600 hover:text-emerald-800 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
          >
            <span>Xem công thức</span>
            <ArrowRight className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={handleToggleSwap}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold transition-all ${
              isSwapPanelOpen
                ? 'bg-[#184d28] text-white shadow-2xs'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isSwapPanelOpen ? 'rotate-180 text-emerald-200' : 'text-slate-500'
              } transition-transform duration-200`}
            />
            <span>{isSwapPanelOpen ? '+ Đổi món (Đang mở)' : 'Đổi món'}</span>
          </button>
        </div>
      </div>

      {/* 2. Meal Body (with or without image) */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {meal.imageUrl && (
          <div className="relative h-24 w-full sm:w-36 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-2xs">
            <img
              src={meal.imageUrl}
              alt={meal.title}
              loading="lazy"
              className="h-full w-full object-cover object-center"
            />
          </div>
        )}

        <div className="flex-1 space-y-1.5">
          <h3
            onClick={() => onViewRecipe?.(meal.recipeId)}
            className="text-base font-extrabold text-slate-900 hover:text-emerald-800 cursor-pointer transition-colors"
          >
            {meal.title}
          </h3>
          {meal.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {meal.description}
            </p>
          )}

          {/* Macro Badges & Diet Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/60">
              Đạm: {meal.protein}g
            </span>
            <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200/60">
              Carbs: {meal.carbs}g
            </span>
            <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200/60">
              Fat: {meal.fat}g
            </span>

            {meal.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Plant-Based Indicator */}
      <div className="space-y-1 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1 text-emerald-800">
            <span>🌱 Tỷ lệ thực vật:</span>
            <span className="font-bold">{meal.plantBasedRate}%</span>
          </span>
          <span className="text-slate-400">100% Thuần khiết</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${meal.plantBasedRate}%` }}
          />
        </div>
      </div>

      {/* 4. AI Swap Panel (Interactive recommendations) */}
      {isSwapPanelOpen && meal.swapOptions && meal.swapOptions.length > 0 && (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>
                Đổi món cho {meal.slotLabel} (AI gợi ý phù hợp hồ sơ dinh dưỡng &amp; không dị ứng đậu phộng)
              </span>
            </div>
            <span className="text-[11px] font-medium text-emerald-700">
              {meal.swapOptions.length} gợi ý tương đương
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {meal.swapOptions.map((opt: DetailedSwapOption) => {
              const isSelected = Boolean(opt.isSelected)
              return (
                <div
                  key={opt.id}
                  className={`flex flex-col justify-between rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-white shadow-xs'
                      : 'border-slate-200 bg-white/80 hover:border-emerald-300'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Khớp {opt.matchPercent}% mục tiêu
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {opt.title}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {opt.calories} kcal • {opt.protein}g Đạm thực vật
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectSwapOption?.(meal.id, opt.id)}
                    disabled={isSwapping}
                    className={`mt-2.5 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#184d28] text-white shadow-2xs'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-3 w-3 stroke-[3]" />
                        <span>Chọn món này</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        <span>Chọn món này</span>
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
