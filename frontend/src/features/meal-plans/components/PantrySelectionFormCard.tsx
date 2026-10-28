// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import React, { useState } from 'react'
import type { UseFormSetValue } from 'react-hook-form'
import { Search, Check, Plus, ShoppingBag } from 'lucide-react'
import type { PersonalizationFormValues } from '../types/mealPlans.types'

// Cấu trúc PantrySelectionFormCardProps quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
interface PantrySelectionFormCardProps {
  availableIngredients: string[]
  setValue: UseFormSetValue<PersonalizationFormValues>
}

const COMMON_PANTRY_ITEMS = [
  'Đậu hũ',
  'Nấm hương',
  'Yến mạch',
  'Cà rốt',
  'Gạo lứt đỏ',
  'Đậu gà',
  'Khoai lang',
  'Bí đỏ',
  'Cải bó xôi',
  'Hạt chia',
  'Hạnh nhân',
  'Nấm đùi gà',
]

// Xử lý lựa chọn hoặc chuyển trạng thái giao diện theo thao tác người dùng (PantrySelectionFormCard); thuộc thực đơn bảy ngày và danh sách đi chợ.
export const PantrySelectionFormCard: React.FC<PantrySelectionFormCardProps> = ({
  availableIngredients,
  setValue,
}) => {
  // Lưu dữ liệu và trạng thái thao tác của thực đơn bảy ngày và danh sách đi chợ trong vòng đời màn hình.
  const [searchTerm, setSearchTerm] = useState('')

  // Xử lý lựa chọn hoặc chuyển trạng thái giao diện theo thao tác người dùng (handleToggle); thuộc thực đơn bảy ngày và danh sách đi chợ.
  const handleToggle = (item: string) => {
    if (availableIngredients.includes(item)) {
      setValue(
        'availableIngredients',
        availableIngredients.filter((i) => i !== item)
      )
    } else {
      setValue('availableIngredients', [...availableIngredients, item])
    }
  }

  // Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (handleAddCustom); thuộc thực đơn bảy ngày và danh sách đi chợ.
  const handleAddCustom = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault()
      const newItem = searchTerm.trim()
      if (!availableIngredients.includes(newItem)) {
        setValue('availableIngredients', [...availableIngredients, newItem])
      }
      setSearchTerm('')
    }
  }

  const filteredItems = COMMON_PANTRY_ITEMS.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase().trim())
  )

  // Hiển thị giao diện thực đơn bảy ngày và danh sách đi chợ từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
      {/* Tiêu đề và thao tác chính. */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm md:text-base">
            Nguyên liệu bạn đang có
          </h3>
        </div>

        <span className="text-xs text-gray-400 font-medium">
          Tủ bếp: {availableIngredients.length} món
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleAddCustom}
          placeholder="Thêm nguyên liệu có sẵn trong bếp (nhấn Enter)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
      </div>

      {/* Tag Chips Grid */}
      <div className="flex flex-wrap gap-2 pt-1">
        {filteredItems.map((item) => {
          const isSelected = availableIngredients.includes(item)

          // Hiển thị giao diện thực đơn bảy ngày và danh sách đi chợ từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
          return (
            <button
              key={item}
              type="button"
              onClick={() => handleToggle(item)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                isSelected
                  ? 'bg-[#EAF5EE] text-[#1E6531] border-emerald-300 shadow-xs'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {isSelected ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              ) : (
                <Plus className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span>{item}</span>
            </button>
          )
        })}
      </div>

      {/* Summary Box */}
      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
        <span className="font-bold text-[#1E6531] shrink-0">
          Đã chọn {availableIngredients.length} nguyên liệu:
        </span>
        <span className="text-slate-600 truncate">
          {availableIngredients.join(', ')}
        </span>
      </div>
    </div>
  )
}
export default PantrySelectionFormCard
