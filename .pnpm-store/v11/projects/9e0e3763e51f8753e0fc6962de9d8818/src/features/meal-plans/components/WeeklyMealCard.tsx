import React from 'react'
import { Flame, Clock, Dumbbell, ArrowRight, RefreshCw } from 'lucide-react'
import type { MyWeeklyMealItem } from '../types/mealPlans.types'

interface WeeklyMealCardProps {
  meal: MyWeeklyMealItem
  onViewRecipe?: (recipeId?: string) => void
  onSwapMeal?: (mealId: string) => void
  isSwapping?: boolean
}

export const WeeklyMealCard: React.FC<WeeklyMealCardProps> = ({
  meal,
  onViewRecipe,
  onSwapMeal,
  isSwapping = false,
}) => {
  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-md transition-all">
      <div className="space-y-3.5">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <span>{meal.slotLabel}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 font-medium">{meal.slotTime}</span>
          </span>

          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/60">
            {meal.slotTag}
          </span>
        </div>

        {/* Meal Image */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100">
          <img
            src={meal.imageUrl}
            alt={meal.title}
            loading="lazy"
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Meal Info */}
        <div className="space-y-1.5">
          <h3
            onClick={() => onViewRecipe?.(meal.recipeId)}
            className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors cursor-pointer line-clamp-1"
          >
            {meal.title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {meal.description}
          </p>
        </div>

        {/* Nutrition & Time Badges */}
        <div className="flex items-center gap-3 pt-1 text-xs text-slate-600 border-t border-slate-100">
          <div className="flex items-center gap-1 font-semibold">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span>{meal.calories} kcal</span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-slate-500">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <span>{meal.cookTimeMinutes} phút</span>
          </div>

          <div className="flex items-center gap-1 font-bold text-emerald-700 ml-auto">
            <Dumbbell className="h-3.5 w-3.5 text-emerald-600" />
            <span>{meal.protein}g Đạm</span>
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="mt-4 flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => onViewRecipe?.(meal.recipeId)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 active:scale-[0.98] transition-all"
        >
          <span>Xem công thức</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onSwapMeal?.(meal.id)}
          disabled={isSwapping}
          title="Đổi món ăn này"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${isSwapping ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>
    </div>
  )
}
