import React, { useState } from 'react'
import { RefreshCw, ArrowRight, Star } from 'lucide-react'
import type { MealItem } from '../types/mealPlans.types'

interface MealPlanCardProps {
  meal: MealItem
  onSwap?: (mealId: string, slot: MealItem['slot']) => Promise<void>
  onViewRecipe?: (recipeId?: string) => void
}

export const MealPlanCard: React.FC<MealPlanCardProps> = ({
  meal,
  onSwap,
  onViewRecipe,
}) => {
  const [isSwapping, setIsSwapping] = useState(false)

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
