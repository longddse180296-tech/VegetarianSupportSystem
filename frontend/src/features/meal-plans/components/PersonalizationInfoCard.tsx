import React from 'react'
import { Sparkles, Edit3, AlertCircle } from 'lucide-react'
import type { UserPersonalizationInfo } from '../types/mealPlans.types'

interface PersonalizationInfoCardProps {
  info: UserPersonalizationInfo
  onEdit?: () => void
}

export const PersonalizationInfoCard: React.FC<PersonalizationInfoCardProps> = ({
  info,
  onEdit,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-gray-900 text-sm">
            Thông tin được sử dụng để lập kế hoạch
          </h3>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Chỉnh sửa thông tin</span>
        </button>
      </div>

      {/* 5-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Box 1: BMI */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-gray-400 block">Chỉ số BMI</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-extrabold text-gray-900 font-sans">{info.bmi}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF5EE] text-[#1E6531]">
              {info.bmiCategory}
            </span>
          </div>
        </div>

        {/* Box 2: Mục tiêu */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-gray-400 block">Mục tiêu</span>
          <p className="text-xs font-bold text-gray-900 mt-1 leading-snug">
            {info.goal}
          </p>
        </div>

        {/* Box 3: Nguyên liệu ưu tiên */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-gray-400 block">Nguyên liệu ưu tiên</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {info.preferredIngredients.map((ing, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100"
              >
                {ing}
              </span>
            ))}
          </div>
        </div>

        {/* Box 4: Dị ứng / Tránh */}
        <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-rose-500 block">Dị ứng / Tránh</span>
          <div className="flex items-center gap-1.5 mt-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="text-xs font-bold text-rose-800">
              {info.allergens.join(', ')}
            </span>
          </div>
        </div>

        {/* Box 5: Số bữa & Thời gian */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-gray-400 block">Số bữa & Thời gian</span>
          <p className="text-xs font-bold text-gray-900 mt-1 leading-snug">
            {info.mealsPerDay}
          </p>
        </div>
      </div>
    </div>
  )
}
export default PersonalizationInfoCard
