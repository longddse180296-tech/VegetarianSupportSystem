// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import React, { useState, useMemo } from 'react'
import { Search, Calendar, Check } from 'lucide-react'
import { Select } from '../../../shared/components/Select'
import type { SavedMealPlanItem } from '../types/mealPlans.types'

// Cấu trúc SavedPlansSectionProps quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
interface SavedPlansSectionProps {
  savedPlans: SavedMealPlanItem[]
  onViewPlanDetail?: (planId: string) => void
  onApplyPlan?: (planId: string) => void
  applyingPlanId?: string | null
}

// Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (SavedPlansSection); thuộc thực đơn bảy ngày và danh sách đi chợ.
export const SavedPlansSection: React.FC<SavedPlansSectionProps> = ({
  savedPlans,
  onViewPlanDetail,
  onApplyPlan,
  applyingPlanId,
}) => {
  // Lưu dữ liệu và trạng thái thao tác của thực đơn bảy ngày và danh sách đi chợ trong vòng đời màn hình.
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string>('all')

  const filteredPlans = useMemo(() => {
    return savedPlans.filter((plan) => {
      const matchSearch =
        plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchGoal =
        selectedGoalFilter === 'all' || plan.goal === selectedGoalFilter

      return matchSearch && matchGoal
    })
  }, [savedPlans, searchQuery, selectedGoalFilter])

  // Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getTagBadgeClasses); thuộc thực đơn bảy ngày và danh sách đi chợ.
  const getTagBadgeClasses = (color: SavedMealPlanItem['goalTagColor']) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/70'
      case 'teal':
        return 'bg-teal-50 text-teal-800 border-teal-200/70'
      case 'blue':
        return 'bg-blue-50 text-blue-800 border-blue-200/70'
      case 'indigo':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200/70'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  // Hiển thị giao diện thực đơn bảy ngày và danh sách đi chợ từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="space-y-4">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Lịch sử & Bộ sưu tập
          </span>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Thực đơn đã lưu
          </h3>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm thực đơn..."
              className="h-10 w-44 md:w-56 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            />
          </div>

          <div className="w-48">
            <Select
              value={selectedGoalFilter}
              onChange={(e) => setSelectedGoalFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Tất cả mục tiêu' },
                { value: 'maintain', label: 'Duy trì cân nặng' },
                { value: 'muscle-gain', label: 'Tăng cơ & thể lực' },
                { value: 'weight-loss', label: 'Giảm cân khoa học' },
                { value: 'detox', label: 'Thanh lọc cơ thể' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
          Không tìm thấy thực đơn đã lưu phù hợp với từ khóa tìm kiếm.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map((plan) => {
            const isApplying = applyingPlanId === plan.id
            // Hiển thị giao diện thực đơn bảy ngày và danh sách đi chợ từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
            return (
              <div
                key={plan.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-sm hover:border-emerald-200 transition-all"
              >
                <div className="space-y-3">
                  {/* Top Tag & Date */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${getTagBadgeClasses(
                        plan.goalTagColor,
                      )}`}
                    >
                      {plan.goalLabel}
                    </span>

                    <span className="text-[11px] font-medium text-slate-400">
                      {plan.savedDate}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 line-clamp-1 hover:text-emerald-800 transition-colors">
                      {plan.title}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Metadata stat */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold pt-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {plan.daysCount} ngày ({plan.mealsCount} bữa)
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-700 font-bold">
                      {plan.highlightStat}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-5 flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onViewPlanDetail?.(plan.id)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    Xem lại
                  </button>

                  <button
                    type="button"
                    onClick={() => onApplyPlan?.(plan.id)}
                    disabled={isApplying}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-[#184d28] hover:bg-[#123e1f] py-2 text-xs font-bold text-white shadow-2xs active:scale-95 disabled:opacity-60 transition-all"
                  >
                    {isApplying ? (
                      <span>Đang áp dụng...</span>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Áp dụng tuần này</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
