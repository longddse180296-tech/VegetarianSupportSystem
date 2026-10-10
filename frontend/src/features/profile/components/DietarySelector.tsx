import React from 'react'
import { CheckCircle2, ShieldCheck, Leaf, Milk, Egg, Utensils } from 'lucide-react'
import type { DietaryType } from '../types'

interface DietarySelectorProps {
  selectedDiet: DietaryType
  onChange: (diet: DietaryType) => void
  disabled?: boolean
}

interface DietOption {
  id: DietaryType
  name: string
  vietnameseName: string
  icon: React.ElementType
  description: string
  tags: string[]
}

const DIET_OPTIONS: DietOption[] = [
  {
    id: 'Vegan',
    name: 'Vegan',
    vietnameseName: 'Thuần chay',
    icon: Leaf,
    description:
      'Hoàn toàn không sử dụng bất kỳ sản phẩm nào từ động vật: thịt, gia cầm, cá, trứng, sữa động vật, mật ong, gelatin, mỡ động vật.',
    tags: ['100% Thực vật', 'Không bơ sữa', 'Không mật ong'],
  },
  {
    id: 'Lacto-vegetarian',
    name: 'Lacto-vegetarian',
    vietnameseName: 'Chay có sữa',
    icon: Milk,
    description:
      'Không ăn thịt, gia cầm, cá và trứng; có sử dụng sữa tươi, phô mai, bơ và các chế phẩm từ sữa động vật.',
    tags: ['Có sữa bò & phô mai', 'Không trứng'],
  },
  {
    id: 'Ovo-vegetarian',
    name: 'Ovo-vegetarian',
    vietnameseName: 'Chay có trứng',
    icon: Egg,
    description:
      'Không ăn thịt, gia cầm, cá và sữa động vật; có sử dụng trứng gia cầm từ nguồn trang trại hữu cơ nhân đạo.',
    tags: ['Có trứng gà', 'Không sữa'],
  },
  {
    id: 'Lacto-ovo vegetarian',
    name: 'Lacto-ovo vegetarian',
    vietnameseName: 'Chay trứng & sữa',
    icon: Utensils,
    description:
      'Không ăn thịt, gia cầm, cá; kết hợp sử dụng cả trứng và các chế phẩm bơ sữa động vật thanh trùng.',
    tags: ['Trứng & Sữa', 'Dễ thích nghi', 'Phổ biến'],
  },
]

export const DietarySelector: React.FC<DietarySelectorProps> = ({
  selectedDiet,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1f2937] leading-none">
              Chế độ Ăn chay Trung tâm
            </h3>
            <p className="text-[11px] text-[#6b7280] mt-0.5">
              Quyết định quy chuẩn phân loại món ăn trên toàn bộ hệ thống
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#e8f5e9] text-[#2e7d32] border border-emerald-200/80">
          Chính sách Tiêu chuẩn
        </span>
      </div>

      <p className="text-xs text-[#6b7280] leading-relaxed">
        Trường phái bạn chọn sẽ tự động đồng bộ hóa cùng: Trợ lý AI dinh dưỡng, thuật toán quét thực phẩm/OCR, kế hoạch thực đơn 7 ngày và danh mục gợi ý nhà hàng chay.
      </p>

      {/* 4 Diet Cards Grid (DESIGN.md Level 1 card with 16px radius) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DIET_OPTIONS.map((option) => {
          const isSelected = selectedDiet === option.id
          const Icon = option.icon

          return (
            <div
              key={option.id}
              onClick={() => !disabled && onChange(option.id)}
              className={`p-5 rounded-[16px] border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                isSelected
                  ? 'bg-gradient-to-br from-[#e8f5e9]/70 to-white border-[#2e7d32] ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-white border-[#e5e7eb] hover:border-emerald-300 hover:bg-[#f8faf8] shadow-2xs'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#2e7d32] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1f2937] leading-tight">
                        {option.vietnameseName}
                      </h4>
                      <p className="text-[11px] text-[#6b7280] font-medium leading-tight">
                        ({option.name})
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator Chip */}
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2e7d32] bg-[#e8f5e9] border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ĐANG ÁP DỤNG</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#6b7280] font-medium px-2 py-0.5 rounded-[6px] border border-[#e5e7eb]">
                      Tùy chọn
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#6b7280] leading-relaxed">{option.description}</p>
              </div>

              {/* Dietary Filter Chips (DESIGN.md #248: height 32px, rounded-full) */}
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                {option.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`h-7 px-3 rounded-full text-[11px] font-medium inline-flex items-center transition-colors ${
                      isSelected
                        ? 'bg-[#e8f5e9] text-[#2e7d32] border border-emerald-200 font-semibold'
                        : 'bg-[#f8faf8] text-[#6b7280] border border-[#e5e7eb]'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* System Impact Note Box */}
      <div className="p-4 rounded-[12px] bg-[#f8faf8] border border-emerald-200/80 text-xs text-[#1f2937] flex items-start gap-3 shadow-2xs">
        <div className="p-1.5 rounded-full bg-[#e8f5e9] text-[#2e7d32] shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <p className="leading-relaxed text-[#6b7280]">
          <strong className="text-[#1f2937]">Tác động hệ thống:</strong> Khi bạn thay đổi chế độ ăn chay, hệ thống sẽ tự động cập nhật lại tiêu chí nhận diện nguyên liệu trong mô-đun quét ảnh/OCR, gắn cờ cảnh báo thành phần không phù hợp và điều chỉnh lại danh sách gợi ý món ăn hàng ngày.
        </p>
      </div>
    </div>
  )
}

export default DietarySelector
