import React from 'react'
import { RefreshCw, Edit3, Bookmark, Check } from 'lucide-react'
import type { DietType } from '../types/mealPlans.types'

interface DetailBottomBarProps {
  dietType: DietType
  onRegenerateAll?: () => void
  onEditPreferences?: () => void
  onSavePlan?: () => void
  isRegenerating?: boolean
  isSaving?: boolean
  isSaved?: boolean
}

export const DetailBottomBar: React.FC<DetailBottomBarProps> = ({
  dietType,
  onRegenerateAll,
  onEditPreferences,
  onSavePlan,
  isRegenerating = false,
  isSaving = false,
  isSaved = false,
}) => {
  const getDietLabel = (type: DietType) => {
    switch (type) {
      case 'vegan':
        return 'Thuần chay (Vegan)'
      case 'lacto':
        return 'Chay có sữa (Lacto-Vegetarian)'
      case 'ovo':
        return 'Chay có trứng (Ovo-Vegetarian)'
      case 'lacto-ovo':
        return 'Trứng & Sữa (Lacto-Ovo Vegetarian)'
      default:
        return 'Ăn chay'
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-slate-200/90 bg-white p-4 md:p-5 shadow-xs">
      {/* Left indicator */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
        <span>
          Chế độ ăn đã chọn:{' '}
          <strong className="text-emerald-800 font-extrabold">
            {getDietLabel(dietType)}
          </strong>
        </span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-500 font-medium">
          Đồng bộ theo thời gian thực
        </span>
      </div>

      {/* Right actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onRegenerateAll}
          disabled={isRegenerating}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 disabled:opacity-60 transition-all shadow-2xs"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              isRegenerating ? 'animate-spin text-emerald-600' : 'text-slate-500'
            }`}
          />
          <span>{isRegenerating ? 'Đang tạo lại...' : 'Tạo lại toàn bộ'}</span>
        </button>

        <button
          type="button"
          onClick={onEditPreferences}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
        >
          <Edit3 className="h-3.5 w-3.5 text-slate-500" />
          <span>Chỉnh sửa thông tin</span>
        </button>

        <button
          type="button"
          onClick={onSavePlan}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-xl bg-[#184d28] hover:bg-[#123e1f] px-5 py-2.5 text-xs font-bold text-white shadow-2xs active:scale-95 disabled:opacity-60 transition-all"
        >
          {isSaved ? (
            <>
              <Check className="h-4 w-4 stroke-[3] text-emerald-200" />
              <span>Đã lưu thành công</span>
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu thực đơn tuần'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
