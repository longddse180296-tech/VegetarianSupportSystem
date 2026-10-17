import React from 'react'
import type { UseFormSetValue } from 'react-hook-form'
import { Check, ShieldAlert, Sparkles, Utensils } from 'lucide-react'
import type { DietType, PersonalizationFormValues } from '../types/mealPlans.types'

interface DietPreferenceFormCardProps {
  dietType: DietType
  allergens: string[]
  preferences: string[]
  setValue: UseFormSetValue<PersonalizationFormValues>
}

const DIET_OPTIONS: {
  id: DietType
  name: string
  description: string
}[] = [
  {
    id: 'vegan',
    name: 'Vegan',
    description: 'Thuần chay 100% không trứng, sữa, mật ong hay sản phẩm động vật',
  },
  {
    id: 'lacto',
    name: 'Lacto-vegetarian',
    description: 'Ăn chay có sử dụng sữa, bơ, phô mai nhưng không ăn trứng',
  },
  {
    id: 'ovo',
    name: 'Ovo-vegetarian',
    description: 'Ăn chay có ăn trứng nhưng không dùng sữa và chế phẩm sữa',
  },
  {
    id: 'lacto-ovo',
    name: 'Lacto-ovo vegetarian',
    description: 'Ăn chay có sử dụng cả trứng và sữa, phổ biến và dễ tiếp cận',
  },
]

const ALLERGEN_OPTIONS = ['Không có', 'Đậu phộng', 'Hạt điều', 'Gluten']

const PREFERENCE_OPTIONS = [
  'Nhiều protein',
  'Dưới 30 phút',
  'Dễ nấu',
  'Tiết kiệm chi phí',
  'Món nước nhiều hơn',
  'Ít dầu',
]

export const DietPreferenceFormCard: React.FC<DietPreferenceFormCardProps> = ({
  dietType,
  allergens,
  preferences,
  setValue,
}) => {
  const handleToggleAllergen = (item: string) => {
    if (item === 'Không có') {
      setValue('allergens', ['Không có'])
      return
    }
    const currentWithoutNone = allergens.filter((a) => a !== 'Không có')
    if (currentWithoutNone.includes(item)) {
      const next = currentWithoutNone.filter((a) => a !== item)
      setValue('allergens', next.length > 0 ? next : ['Không có'])
    } else {
      setValue('allergens', [...currentWithoutNone, item])
    }
  }

  const handleTogglePreference = (item: string) => {
    if (preferences.includes(item)) {
      setValue(
        'preferences',
        preferences.filter((p) => p !== item)
      )
    } else {
      setValue('preferences', [...preferences, item])
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
      {/* 1. Phân loại ăn chay */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-gray-900 text-sm md:text-base">
              Phân loại ăn chay
            </h3>
          </div>
          <span className="text-[11px] font-bold text-rose-500">Bắt buộc</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DIET_OPTIONS.map((opt) => {
            const isSelected = dietType === opt.id

            return (
              <div
                key={opt.id}
                role="button"
                tabIndex={0}
                onClick={() => setValue('dietType', opt.id, { shouldValidate: true, shouldDirty: true })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setValue('dietType', opt.id, { shouldValidate: true, shouldDirty: true })
                  }
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer select-none transition-all flex flex-col justify-between gap-1 text-left active:scale-[0.99] ${
                  isSelected
                    ? 'border-emerald-600 bg-[#EAF5EE] text-[#1E6531] shadow-xs ring-1 ring-emerald-600'
                    : 'border-slate-200/80 bg-white text-gray-800 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{opt.name}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[11px] opacity-75 leading-tight mt-0.5">
                  {opt.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. Dị ứng hoặc thực phẩm cần tránh */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <h4 className="font-bold text-gray-900 text-xs">
            Dị ứng hoặc thực phẩm cần tránh
          </h4>
        </div>

        <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-700">
          {ALLERGEN_OPTIONS.map((item) => {
            const isChecked = allergens.includes(item)

            return (
              <label
                key={item}
                className="flex items-center gap-2 cursor-pointer hover:text-emerald-700 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleAllergen(item)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>{item}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* 3. Sở thích & Phong cách ăn */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h4 className="font-bold text-gray-900 text-xs">
            Sở thích & Phong cách ăn
          </h4>
        </div>

        <div className="flex flex-wrap gap-2">
          {PREFERENCE_OPTIONS.map((item) => {
            const isSelected = preferences.includes(item)

            return (
              <button
                key={item}
                type="button"
                onClick={() => handleTogglePreference(item)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'bg-[#1E6531] text-white border-[#1E6531] shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {isSelected ? `✓ ${item}` : item}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
export default DietPreferenceFormCard
