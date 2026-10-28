// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import React from 'react'
import {
  Activity,
  Flame,
  Refrigerator,
  AlertTriangle,
  Sparkles,
  Edit3,
} from 'lucide-react'
import type { PersonalizationBadgeInfo } from '../types/mealPlans.types'

// Cấu trúc PersonalizationBadgeBarProps quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
interface PersonalizationBadgeBarProps {
  info: PersonalizationBadgeInfo
  onEditClick?: () => void
}

// Thành phần PersonalizationBadgeBar nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc thực đơn bảy ngày và danh sách đi chợ.
export const PersonalizationBadgeBar: React.FC<PersonalizationBadgeBarProps> = ({
  info,
  onEditClick,
}) => {
  // Hiển thị giao diện thực đơn bảy ngày và danh sách đi chợ từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-white p-3 border border-slate-200/80 shadow-2xs">
      <div className="flex flex-wrap items-center gap-2">
        {/* BMI Badge */}
        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          <Activity className="h-3.5 w-3.5 text-emerald-600" />
          <span>
            BMI {info.bmi} ({info.bmiCategory})
          </span>
        </div>

        {/* Calorie Goal Badge */}
        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          <Flame className="h-3.5 w-3.5 text-emerald-600" />
          <span>Mục tiêu: Duy trì {info.targetCalories.toLocaleString('vi-VN')} kcal/ngày</span>
        </div>

        {/* Pantry Badge */}
        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          <Refrigerator className="h-3.5 w-3.5 text-emerald-600" />
          <span>Tủ bếp sẵn sàng: {info.pantryItems.slice(0, 3).join(', ')}...</span>
        </div>

        {/* Allergen Badge */}
        {info.allergens.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200/80 px-2.5 py-1 text-xs font-semibold text-rose-700">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            <span>Dị ứng: {info.allergens.join(', ')}</span>
          </div>
        )}

        {/* Priority Nutrients Badge */}
        <div className="flex items-center gap-1.5 rounded-xl bg-teal-50 border border-teal-200/80 px-2.5 py-1 text-xs font-semibold text-teal-800">
          <Sparkles className="h-3.5 w-3.5 text-teal-600" />
          <span>Vi chất ưu tiên: {info.priorityNutrients.join(', ')}</span>
        </div>
      </div>

      {/* Edit Link Button */}
      <button
        type="button"
        onClick={onEditClick}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors shrink-0 ml-auto"
      >
        <Edit3 className="h-3.5 w-3.5 text-emerald-700" />
        <span>Chỉnh sửa thông tin & BMI</span>
      </button>
    </div>
  )
}
