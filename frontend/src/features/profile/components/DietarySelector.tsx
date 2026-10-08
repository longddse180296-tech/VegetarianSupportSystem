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
    tags: ['100% Thực vật', 'Nguồn gốc rõ ràng', 'Không phụ gia'],
  },
  {
    id: 'Lacto-vegetarian',
    name: 'Lacto-vegetarian',
    vietnameseName: 'Chay có sữa',
    icon: Milk,
    description:
      'Không ăn thịt, gia cầm, cá và trứng; có sử dụng sữa tươi, phô mai, bơ và các chế phẩm từ sữa động vật.',
    tags: ['Sữa bò & Phô mai', 'Không trứng'],
  },
  {
    id: 'Ovo-vegetarian',
    name: 'Ovo-vegetarian',
    vietnameseName: 'Chay có trứng',
    icon: Egg,
    description:
      'Không ăn thịt, gia cầm, cá và sữa động vật; có sử dụng trứng gia cầm từ nguồn trang trại hữu cơ nhân đạo.',
    tags: ['Có trứng', 'Không sữa'],
  },
  {
    id: 'Lacto-ovo vegetarian',
    name: 'Lacto-ovo vegetarian',
    vietnameseName: 'Chay trứng & sữa',
    icon: Utensils,
    description:
      'Không ăn thịt, gia cầm, cá; kết hợp sử dụng cả trứng và các chế phẩm bơ sữa động vật thanh trùng.',
    tags: ['Trứng & Sữa', 'Phổ biến'],
  },
]

export const DietarySelector: React.FC<DietarySelectorProps> = ({
  selectedDiet,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Chế độ Ăn chay Trung tâm</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
          Chính sách MVP
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Chế độ này sẽ tự động đồng bộ với mọi tính năng: quét thực phẩm, thực đơn tuần, tìm nhà hàng
        chay và Trợ lý AI dinh dưỡng để lọc chính xác món ăn phù hợp với tiêu chuẩn của bạn.
      </p>

      {/* 4 Diet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DIET_OPTIONS.map((option) => {
          const isSelected = selectedDiet === option.id
          const Icon = option.icon

          return (
            <div
              key={option.id}
              onClick={() => !disabled && onChange(option.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {option.vietnameseName}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-tight font-medium">
                        ({option.name})
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ĐANG ÁP DỤNG</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded border border-slate-200">
                      Tùy chọn
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{option.description}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                {option.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      isSelected
                        ? 'bg-emerald-200/60 text-emerald-900 font-semibold'
                        : 'bg-slate-100 text-slate-600'
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
      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Tác động hệ thống:</strong> Hồ sơ này là trung tâm quyết định cách AI đánh giá món
          ăn, tự động quét phát hiện nguyên liệu ẩn và đề xuất nhà hàng, thực đơn phù hợp nhất cho
          bạn trên toàn bộ nền tảng Vegetarian Support.
        </p>
      </div>
    </div>
  )
}
export default DietarySelector
