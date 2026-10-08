import React, { useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Lock,
  ArrowRight,
  Bookmark,
  Check,
} from 'lucide-react'
import type { DayOfWeek, GeneratedPersonalizedPlan } from '../types/mealPlans.types'

interface PersonalizationPreviewSectionProps {
  plan: GeneratedPersonalizedPlan
  onSaveWeek: () => Promise<void>
  onLoginClick?: () => void
  onViewRecipe?: (recipeId?: string) => void
}

const WEEK_DAYS: { id: DayOfWeek; label: string }[] = [
  { id: 'mon', label: 'Thứ Hai' },
  { id: 'tue', label: 'Thứ Ba' },
  { id: 'wed', label: 'Thứ Tư' },
  { id: 'thu', label: 'Thứ Năm' },
  { id: 'fri', label: 'Thứ Sáu' },
  { id: 'sat', label: 'Thứ Bảy' },
  { id: 'sun', label: 'Chủ Nhật' },
]

export const PersonalizationPreviewSection: React.FC<PersonalizationPreviewSectionProps> = ({
  plan,
  onSaveWeek,
  onLoginClick,
  onViewRecipe,
}) => {
  const [activeDay, setActiveDay] = useState<DayOfWeek>('mon')
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onSaveWeek()
      setIsSaved(true)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 pt-4 border-t border-slate-200/80">
      {/* 1. Header & Day Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
            Kế hoạch chi tiết
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Thực đơn tuần của bạn
          </h2>
        </div>

        {/* 7 Days Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl overflow-x-auto">
          {WEEK_DAYS.map((day) => {
            const isActive = activeDay === day.id

            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setActiveDay(day.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#1E6531] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {day.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. 3 Meal Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plan.dayPreview.meals.map((meal) => (
          <div
            key={meal.id}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4"
          >
            {/* Tag row */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-gray-400">
                {meal.slotLabel} • {meal.slotTime}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF5EE] text-[#1E6531]">
                {meal.categoryTag}
              </span>
            </div>

            {/* Thumbnail */}
            {meal.imageUrl && (
              <div className="w-full h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                <img
                  src={meal.imageUrl}
                  alt={meal.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}

            {/* Info */}
            <div>
              <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">
                {meal.title}
              </h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                {meal.description}
              </p>

              <div className="flex items-center gap-2 text-xs font-mono font-medium text-gray-600 mt-2.5">
                <span className="font-bold text-gray-900">{meal.calories} kcal</span>
                <span className="text-gray-300">•</span>
                <span>{meal.protein}g Protein</span>
                <span className="text-gray-300">•</span>
                <span>{meal.cookTimeMinutes} phút</span>
              </div>
            </div>

            {/* Action */}
            <button
              type="button"
              onClick={() => onViewRecipe?.(meal.recipeId)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Xem công thức</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* 3. 2 Side-by-side Nutrition & Weekly Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Tổng dinh dưỡng trong ngày */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-gray-900 text-sm">
                Tổng dinh dưỡng trong ngày (Thứ Hai)
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF5EE] text-[#1E6531]">
              Đạt {plan.dailyNutrition.percentAchieved}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-400 font-medium block">
                Tổng năng lượng dự kiến:
              </span>
              <p className="text-2xl font-extrabold text-gray-900 font-sans mt-0.5">
                {plan.dailyNutrition.calories.toLocaleString()}{' '}
                <span className="text-xs font-normal text-gray-400">
                  / {plan.dailyNutrition.targetCalories} kcal
                </span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center font-bold text-xs">
              ✓
            </div>
          </div>

          <p className="text-xs text-gray-500 font-medium">
            {plan.dailyNutrition.micronutrientsNote}
          </p>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>Carbohydrate phức</span>
                <span className="font-mono">{plan.dailyNutrition.carbsGrams}g</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ width: '85%' }} className="h-full bg-emerald-600 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>Đạm thực vật (Protein &amp; lipid)</span>
                <span className="font-mono">{plan.dailyNutrition.proteinGrams}g</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ width: '92%' }} className="h-full bg-teal-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tổng quan kế hoạch tuần */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">
                Tổng quan kế hoạch tuần
              </h3>
              <span className="text-xs text-gray-400 font-medium">7 ngày trọn vẹn</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-gray-400 text-[11px] block">Calo trung bình/ngày</span>
                <p className="font-extrabold text-sm text-gray-900 mt-1">
                  {plan.weeklySummary.avgCalories} kcal
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                  {plan.weeklySummary.avgCaloriesNote}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-gray-400 text-[11px] block">Tận dụng tủ bếp</span>
                <p className="font-extrabold text-sm text-[#1E6531] mt-1">
                  {plan.weeklySummary.pantryUsedPercent}%
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                  {plan.weeklySummary.pantryUsedNote}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-gray-400 text-[11px] block">Đáp ứng mục tiêu</span>
                <p className="font-extrabold text-sm text-emerald-600 mt-1">
                  {plan.weeklySummary.goalMatchPercent}%
                </p>
                <span className="text-[10px] text-gray-500 font-medium mt-0.5 block">
                  {plan.weeklySummary.goalMatchNote}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-gray-400 text-[11px] block">Món ăn phong phú</span>
                <p className="font-extrabold text-sm text-gray-900 mt-1">
                  {plan.weeklySummary.uniqueMealsCount} bữa
                </p>
                <span className="text-[10px] text-gray-500 font-medium mt-0.5 block">
                  {plan.weeklySummary.uniqueMealsNote}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[#EAF5EE] rounded-2xl border border-emerald-200/60 text-xs text-[#1E6531] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{plan.weeklySummary.benefitNote}</p>
          </div>
        </div>
      </div>

      {/* 4. Bottom Floating / Sticky Sync Card matching Figma */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <p className="text-xs text-gray-600 max-w-xl leading-relaxed">
            Đăng nhập để tự động đồng bộ kế hoạch vào lịch nhắc nhở mỗi ngày (không bắt buộc, bạn có thể tải bản pdf thực đơn ngay lúc này).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
          <button
            type="button"
            onClick={onLoginClick}
            className="px-4 py-2 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="px-5 py-2 rounded-2xl bg-[#1E6531] hover:bg-[#164e25] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-200" />
                <span>Đã lưu thành công</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu thực đơn tuần'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
export default PersonalizationPreviewSection
