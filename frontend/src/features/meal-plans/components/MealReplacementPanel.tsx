import React, { useState } from 'react'
import { RefreshCw, Check, Sparkles, X } from 'lucide-react'
import type { MealReplacementOption, RecommendedMealItem } from '../types/mealPlans.types'

interface MealReplacementPanelProps {
  currentMeal: RecommendedMealItem
  options: MealReplacementOption[]
  onSelectReplacement: (option: MealReplacementOption) => Promise<void>
  onClose: () => void
  onExploreMore?: () => void
}

export const MealReplacementPanel: React.FC<MealReplacementPanelProps> = ({
  currentMeal,
  options,
  onSelectReplacement,
  onClose,
  onExploreMore,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  const handleChoose = async (opt: MealReplacementOption) => {
    try {
      setSelectedId(opt.id)
      setIsApplying(true)
      await onSelectReplacement(opt)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="bg-[#F8FCF9] rounded-3xl p-6 sm:p-7 border border-emerald-200/90 shadow-sm space-y-6 relative animate-in fade-in">
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-emerald-100/50 rounded-xl transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header matching Figma */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pr-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center shrink-0 mt-0.5">
            <RefreshCw className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-sm md:text-base leading-snug">
              Đổi món cho {currentMeal.slotLabel} ({currentMeal.title})
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Hệ thống tự động tính toán các món thay thế tương đương dinh dưỡng, vừa đảm bảo không có đậu phộng và giàu protein.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#EAF5EE] text-[#1E6531] border border-emerald-200 shrink-0 self-start md:self-auto">
          Tính năng: Smart Replacement Algorithm
        </span>
      </div>

      {/* 3 Replacement Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((opt) => {
          const isChosen = selectedId === opt.id

          return (
            <div
              key={opt.id}
              className="bg-white rounded-2xl p-5 border border-emerald-100/80 shadow-xs flex flex-col justify-between gap-4 hover:border-emerald-300 transition-all"
            >
              <div>
                {/* Badge row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700">
                    {opt.label}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF5EE] text-[#1E6531]">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Phù hợp {opt.matchRate}%</span>
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-bold text-gray-900 text-sm leading-snug">
                  {opt.title}
                </h4>

                {/* Metrics */}
                <div className="flex items-center gap-2 text-xs font-mono text-gray-600 mt-2">
                  <span className="font-bold text-gray-900">{opt.calories} kcal</span>
                  <span className="text-gray-300">•</span>
                  <span>{opt.protein}g protein</span>
                  <span className="text-gray-300">•</span>
                  <span>{opt.cookTimeMinutes} phút</span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {opt.description}
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => void handleChoose(opt)}
                disabled={isApplying}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isChosen
                    ? 'bg-[#1E6531] text-white shadow-xs'
                    : 'bg-[#EAF5EE] text-[#1E6531] hover:bg-emerald-100/80 border border-emerald-200/80'
                }`}
              >
                {isChosen && <Check className="w-3.5 h-3.5" />}
                <span>{isChosen ? 'Đã chọn' : isApplying ? 'Đang cập nhật...' : 'Chọn món này'}</span>
              </button>
            </div>
          )
        })}
      </div>

      {/* Bottom Explore More Link */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onExploreMore}
          className="text-xs font-bold text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Đề xuất món khác từ kho công thức</span>
        </button>
      </div>
    </div>
  )
}
export default MealReplacementPanel
