import React from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import type { PantryUtilization, RecommendedNutritionSummary } from '../types/mealPlans.types'

interface RecommendedNutritionSummaryCardProps {
  nutrition: RecommendedNutritionSummary
  pantry: PantryUtilization
}

export const RecommendedNutritionSummaryCard: React.FC<RecommendedNutritionSummaryCardProps> = ({
  nutrition,
  pantry,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Card 1: Tổng dinh dưỡng trong ngày */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-bold text-gray-900 text-sm md:text-base">
            Tổng dinh dưỡng trong ngày
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 self-start sm:self-auto">
            Theo chuẩn Viện Dinh Dưỡng Quốc Gia (2024)
          </span>
        </div>

        {/* 4 Nutrition Metric Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* 1. Năng lượng */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Năng lượng</span>
              <span className="font-extrabold text-gray-900 font-mono">
                {nutrition.caloriesConsumed} / {nutrition.targetCalories} kcal
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
              <div
                style={{
                  width: `${Math.min(
                    100,
                    (nutrition.caloriesConsumed / nutrition.targetCalories) * 100
                  )}%`,
                }}
                className="h-full bg-emerald-600 rounded-full"
              />
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold block">
              {nutrition.energyPercentNote}
            </span>
          </div>

          {/* 2. Protein thực vật */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Protein thực vật</span>
              <span className="font-extrabold text-gray-900 font-mono">
                {nutrition.proteinConsumed}g / {nutrition.targetProtein}g
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
              <div
                style={{
                  width: `${Math.min(
                    100,
                    (nutrition.proteinConsumed / nutrition.targetProtein) * 100
                  )}%`,
                }}
                className="h-full bg-teal-500 rounded-full"
              />
            </div>
            <span className="text-[10px] text-teal-700 font-semibold block">
              {nutrition.proteinNote}
            </span>
          </div>

          {/* 3. Carbohydrate phức */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Carbohydrate phức</span>
              <span className="font-extrabold text-gray-900 font-mono">
                {nutrition.carbsGrams}g
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
              <div style={{ width: '75%' }} className="h-full bg-emerald-600 rounded-full" />
            </div>
            <span className="text-[10px] text-gray-500 block">{nutrition.carbsNote}</span>
          </div>

          {/* 4. Chất béo lành mạnh */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Chất béo lành mạnh</span>
              <span className="font-extrabold text-gray-900 font-mono">
                {nutrition.fatGrams}g
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
              <div style={{ width: '65%' }} className="h-full bg-lime-500 rounded-full" />
            </div>
            <span className="text-[10px] text-gray-500 block">{nutrition.fatNote}</span>
          </div>
        </div>
      </div>

      {/* Card 2: Tận dụng nguyên liệu */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-5">
        <div>
          <h3 className="font-bold text-gray-900 text-sm md:text-base">
            Tận dụng nguyên liệu
          </h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Hôm nay, các món được đề xuất đã dùng các nguyên liệu bạn đã có sẵn trong tủ bếp:
          </p>

          {/* Ingredient Badges */}
          <div className="flex flex-wrap gap-2 mt-3.5">
            {pantry.availableIngredients.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EAF5EE] text-[#1E6531] border border-emerald-200/60"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Shopping Alert Box */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-3 text-xs">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <ShoppingCart className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-amber-900 block">Bạn cần mua thêm nhẹ:</span>
            <p className="text-amber-800 mt-0.5">{pantry.buyMoreNote}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default RecommendedNutritionSummaryCard
