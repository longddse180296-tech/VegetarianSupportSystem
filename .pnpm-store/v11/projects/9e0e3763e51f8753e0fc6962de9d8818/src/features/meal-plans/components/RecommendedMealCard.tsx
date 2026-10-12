import React from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import type { RecommendedMealItem } from '../types/mealPlans.types'

interface RecommendedMealCardProps {
  meal: RecommendedMealItem
  isSwappingActive?: boolean
  onToggleSwap: (meal: RecommendedMealItem) => void
  onViewRecipe?: (recipeId?: string) => void
}

export const RecommendedMealCard: React.FC<RecommendedMealCardProps> = ({
  meal,
  isSwappingActive = false,
  onToggleSwap,
  onViewRecipe,
}) => {
  return (
    <div
      className={`bg-white rounded-3xl p-5 border transition-all shadow-xs flex flex-col justify-between gap-4 ${
        isSwappingActive
          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
          : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      {/* Top Header Tag */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold text-gray-400 tracking-wider">
          {meal.slotLabel} • {meal.slotTime}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
          {meal.categoryTag}
        </span>
      </div>

      {/* Image Preview if present */}
      {meal.imageUrl && (
        <div className="w-full h-36 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
          <img
            src={meal.imageUrl}
            alt={meal.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      )}

      {/* Title & Optimal Badge */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3
            onClick={() => onViewRecipe?.(meal.recipeId)}
            className="font-bold text-gray-900 text-sm hover:text-emerald-700 cursor-pointer transition-colors leading-snug line-clamp-1"
          >
            {meal.title}
          </h3>
          {meal.isOptimal && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF5EE] text-[#1E6531] border border-emerald-200/60">
              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
              <span>Tối ưu nhất</span>
            </span>
          )}
        </div>

        {/* Nutritional Metrics */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-600 mt-2 font-mono">
          <span className="font-extrabold text-gray-900">{meal.calories} kcal</span>
          <span className="text-gray-300">•</span>
          <span>{meal.protein}g protein</span>
          <span className="text-gray-300">•</span>
          <span>{meal.cookTimeMinutes} phút</span>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
          {meal.description}
        </p>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
        <button
          type="button"
          onClick={() => onViewRecipe?.(meal.recipeId)}
          className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold text-center transition-colors"
        >
          Xem công thức
        </button>

        <button
          type="button"
          onClick={() => onToggleSwap(meal)}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
            isSwappingActive
              ? 'bg-[#1E6531] text-white shadow-xs'
              : 'bg-[#EAF5EE] text-[#1E6531] hover:bg-emerald-100/70 border border-emerald-200/60'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Đổi món</span>
        </button>
      </div>
    </div>
  )
}
export default RecommendedMealCard
