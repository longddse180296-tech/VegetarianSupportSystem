import React, { useState } from 'react'
import {
  RefreshCw,
  ArrowRight,
  Star,
  Calendar,
  Utensils,
  Flame,
  Lock,
} from 'lucide-react'
import type { MealItem, DietType } from '../types/mealPlans.types'

export interface RecommendedPlanItem {
  id: string
  title: string
  description: string
  imageUrl: string
  dietType?: DietType
  dietLabel?: string
  mealsCount?: number
  avgCalories?: number
  durationDays?: number
  tags?: string[]
  rating?: number
  ratingCount?: number
}

export interface MealPlanCardProps {
  meal?: MealItem
  plan?: RecommendedPlanItem
  onSwap?: (mealId: string, slot: MealItem['slot']) => Promise<void>
  onViewRecipe?: (recipeId?: string) => void
  onViewDetail?: (planId: string) => void
  isAuthenticated?: boolean
}

export const MealPlanCard: React.FC<MealPlanCardProps> = ({
  meal,
  plan,
  onSwap,
  onViewRecipe,
  onViewDetail,
  isAuthenticated = false,
}) => {
  const [isSwapping, setIsSwapping] = useState(false)

  // ── Render Case A: Recommended Plan Card (Public Discovery) ──────
  if (plan) {
    const dietColorMap: Record<string, string> = {
      vegan: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      lacto: 'bg-blue-100 text-blue-800 border-blue-200',
      ovo: 'bg-amber-100 text-amber-800 border-amber-200',
      'lacto-ovo': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    }

    const dietBadgeClass =
      plan.dietType && dietColorMap[plan.dietType]
        ? dietColorMap[plan.dietType]
        : 'bg-emerald-100 text-emerald-800 border-emerald-200'

    return (
      <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-200/60 transition-all duration-200 overflow-hidden flex flex-col">
        {/* Plan Image */}
        <div className="relative h-48 overflow-hidden bg-slate-100">
          <img
            src={plan.imageUrl}
            alt={plan.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Diet badge overlay */}
          {plan.dietLabel && (
            <span
              className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${dietBadgeClass}`}
            >
              {plan.dietLabel}
            </span>
          )}

          {/* Rating badge */}
          {plan.rating && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-xs">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-bold text-slate-800">{plan.rating}</span>
              {plan.ratingCount && (
                <span className="text-[10px] text-slate-400">({plan.ratingCount})</span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col gap-3">
          <div className="space-y-1.5">
            <h3
              onClick={() => onViewDetail?.(plan.id)}
              className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-emerald-800 cursor-pointer transition-colors"
            >
              {plan.title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {plan.description}
            </p>
          </div>

          {/* Tags */}
          {plan.tags && plan.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {plan.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-auto pt-2 border-t border-slate-100">
            {plan.durationDays && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-600" />
                <span className="font-medium">{plan.durationDays} ngày</span>
              </span>
            )}
            {plan.mealsCount && (
              <span className="flex items-center gap-1">
                <Utensils className="w-3 h-3 text-emerald-600" />
                <span className="font-medium">{plan.mealsCount} bữa</span>
              </span>
            )}
            {plan.avgCalories && (
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-500" />
                <span className="font-medium">~{plan.avgCalories} kcal</span>
              </span>
            )}
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={() => onViewDetail?.(plan.id)}
            className="w-full mt-1 px-4 py-2.5 rounded-xl bg-[#1E6531] hover:bg-[#164e25] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {!isAuthenticated && <Lock className="w-3.5 h-3.5" />}
            <span>Xem chi tiết thực đơn</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // ── Render Case B: Single Meal Slot Item (Weekly Schedule) ────────
  if (!meal) {
    return null
  }

  const handleSwapClick = async () => {
    if (!onSwap || isSwapping) return
    try {
      setIsSwapping(true)
      await onSwap(meal.id, meal.slot)
    } finally {
      setIsSwapping(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row gap-5 relative overflow-hidden group">
      {/* Left: Meal Thumbnail */}
      <div className="relative w-full md:w-56 h-48 md:h-auto rounded-2xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/60">
        <img
          src={meal.imageUrl}
          alt={meal.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Time Badge in image */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>
            {meal.slotLabel} • {meal.slotTime}
          </span>
        </div>
      </div>

      {/* Right: Meal Details */}
      <div className="flex-1 flex flex-col justify-between gap-3 min-w-0">
        <div>
          {/* Tags list */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {meal.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100/80"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Meal Title */}
          <h3
            onClick={() => onViewRecipe?.(meal.recipeId)}
            className="text-base font-bold text-gray-900 hover:text-emerald-700 cursor-pointer transition-colors leading-snug line-clamp-1"
          >
            {meal.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {meal.description}
          </p>
        </div>

        {/* Nutritional Stats Row */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-gray-900 text-sm font-sans">
              {meal.calories} <span className="text-[11px] font-normal text-gray-400">kcal</span>
            </span>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-3 text-[11px] text-gray-600 font-medium">
              <span>Đạm: <strong className="text-gray-800 font-semibold">{meal.protein}g</strong></span>
              <span>Béo: <strong className="text-gray-800 font-semibold">{meal.fat}g</strong></span>
              <span>Carbs: <strong className="text-gray-800 font-semibold">{meal.carbs}g</strong></span>
            </div>
          </div>

          {/* Absorption Rate Match Note */}
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50/70 px-2.5 py-0.5 rounded-full">
            <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
            <span>Tỷ lệ hấp thu {meal.matchRate}%</span>
            {meal.matchNote && (
              <>
                <span className="text-emerald-300">•</span>
                <span className="text-emerald-800">{meal.matchNote}</span>
              </>
            )}
          </div>
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onSwap && (
            <button
              type="button"
              onClick={handleSwapClick}
              disabled={isSwapping}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSwapping ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isSwapping ? 'Đang đổi...' : 'Đổi món'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewRecipe?.(meal.recipeId)}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Xem công thức</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default MealPlanCard
