import React, { useState } from 'react'
import {
  AlertTriangle,
  ShieldAlert,
  Plus,
  X,
  Check,
  Sparkles,
} from 'lucide-react'
import type { HiddenIngredientRules } from '../types'

interface AllergyManagerProps {
  allergies: string[]
  onAllergiesChange: (allergies: string[]) => void
  hiddenRules: HiddenIngredientRules
  onHiddenRulesChange: (rules: HiddenIngredientRules) => void
  disabled?: boolean
}

const POPULAR_ALLERGENS = [
  'Đậu phộng (Peanuts)',
  'Gluten (Lúa mì)',
  'Đậu nành (Soy)',
  'Hạt điều (Cashew)',
  'Hạnh nhân & Quả hạch',
  'Mè / Vừng (Sesame)',
  'Nấm rơm & Nấm hương',
  'Ngũ vị tân (Hành, tỏi, hẹ, kiệu)',
]

export const AllergyManager: React.FC<AllergyManagerProps> = ({
  allergies,
  onAllergiesChange,
  hiddenRules,
  onHiddenRulesChange,
  disabled = false,
}) => {
  const [newAllergy, setNewAllergy] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddAllergy = (valueToAdd?: string) => {
    const target = (valueToAdd !== undefined ? valueToAdd : newAllergy).trim()
    if (target && !allergies.includes(target)) {
      onAllergiesChange([...allergies, target])
      setNewAllergy('')
      setIsAdding(false)
    }
  }

  const handleRemoveAllergy = (indexToRemove: number) => {
    onAllergiesChange(allergies.filter((_, idx) => idx !== indexToRemove))
  }

  const handleToggleRule = (key: keyof HiddenIngredientRules) => {
    if (disabled) return
    onHiddenRulesChange({
      ...hiddenRules,
      [key]: !hiddenRules[key],
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1f2937] leading-none">
              Bộ lọc An toàn &amp; Cảnh báo Dị ứng
            </h3>
            <p className="text-[11px] text-[#6b7280] mt-0.5">
              Cảnh báo thành phần gây hại theo quy chuẩn an toàn sức khỏe
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          {allergies.length} cảnh báo dị ứng đang bật
        </span>
      </div>

      <p className="text-xs text-[#6b7280] leading-relaxed">
        Bất kỳ công thức, món ăn trong thực đơn hoặc sản phẩm quét nhãn có chứa thành phần thuộc danh sách dưới đây sẽ được hệ thống lập tức gắn cờ cảnh báo đỏ để bảo vệ sức khỏe của bạn.
      </p>

      {/* Active Allergy Chips List */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-bold text-[#1f2937]">
          Danh sách dị ứng &amp; thực phẩm kiêng của bạn:
        </label>

        <div className="flex flex-wrap items-center gap-2 min-h-12 p-3.5 rounded-[12px] bg-[#f8faf8] border border-[#e5e7eb]">
          {allergies.length === 0 && !isAdding && (
            <span className="text-xs text-[#6b7280] italic">
              Chưa có thực phẩm dị ứng nào được thêm. Bạn có thể chọn nhanh từ gợi ý bên dưới hoặc thêm mới.
            </span>
          )}

          {allergies.map((allergy, index) => (
            <span
              key={allergy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs"
            >
              <span>{allergy}</span>
              <button
                type="button"
                onClick={() => handleRemoveAllergy(index)}
                disabled={disabled}
                className="p-0.5 rounded-full hover:bg-rose-200 text-rose-600 hover:text-rose-900 transition-colors cursor-pointer"
                aria-label={`Xóa dị ứng ${allergy}`}
                title="Xóa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {/* Add Allergy Inline Form / Trigger */}
          {isAdding ? (
            <div className="inline-flex items-center gap-1.5 p-1 rounded-[10px] border border-[#2e7d32] bg-white shadow-xs">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddAllergy()
                  }
                  if (e.key === 'Escape') setIsAdding(false)
                }}
                placeholder="Nhập tên dị ứng / món kiêng..."
                autoFocus
                className="text-xs px-2.5 py-1 outline-none text-[#1f2937] w-48 font-medium"
              />
              <button
                type="button"
                onClick={() => handleAddAllergy()}
                className="p-1 rounded-[6px] bg-[#2e7d32] text-white hover:bg-[#1b5e20] transition-colors cursor-pointer"
                title="Xác nhận thêm"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1 rounded-[6px] text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Hủy"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#2e7d32] bg-white hover:bg-[#e8f5e9] border border-emerald-300 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#2e7d32]" />
              <span>Thêm dị ứng mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Suggestions */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#1f2937] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#2e7d32]" />
          <span>Gợi ý dị ứng phổ biến trong ẩm thực chay (nhấp để thêm nhanh):</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {POPULAR_ALLERGENS.map((item) => {
            const isAlreadyAdded = allergies.includes(item)
            return (
              <button
                key={item}
                type="button"
                disabled={disabled || isAlreadyAdded}
                onClick={() => handleAddAllergy(item)}
                className={`text-xs px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAlreadyAdded
                    ? 'bg-rose-50 text-rose-700 border-rose-200 opacity-60 cursor-default'
                    : 'bg-white text-[#1f2937] border-[#e5e7eb] hover:border-[#2e7d32] hover:bg-[#e8f5e9] hover:text-[#2e7d32]'
                }`}
              >
                {isAlreadyAdded ? (
                  <span>✓ Đã thêm: {item}</span>
                ) : (
                  <>
                    <Plus className="w-3 h-3 text-slate-400" />
                    <span>{item}</span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Hidden Animal Ingredients Section */}
      <div className="pt-5 border-t border-[#e5e7eb] flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1f2937] leading-tight">
              Tự động chặn Thành phần Động vật Ẩn (Hidden Animal Ingredients Guard)
            </h4>
            <p className="text-xs text-[#6b7280] leading-tight mt-0.5">
              Hệ thống tự động phát hiện và cảnh báo các gia vị, phụ gia có gốc động vật ẩn thường gặp trong món ăn Việt Nam.
            </p>
          </div>
        </div>

        {/* Toggle List */}
        <div className="flex flex-col gap-2.5">
          {/* Rule 1: Bone Broth */}
          <div className="flex items-center justify-between p-4 rounded-[12px] bg-white border border-[#e5e7eb] hover:border-slate-300 transition-colors shadow-2xs">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-bold text-[#1f2937]">
                Nước hầm xương / thịt động vật trong súp phở, canh
              </span>
              <span className="text-[11px] text-[#6b7280]">
                Thường có trong nước dùng phở, bún riêu, lẩu truyền thống chưa rõ nguồn gốc thực vật
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hiddenRules.boneBroth}
              onClick={() => handleToggleRule('boneBroth')}
              disabled={disabled}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2e7d32] shrink-0 cursor-pointer ${
                hiddenRules.boneBroth ? 'bg-[#2e7d32] justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-sm block" />
            </button>
          </div>

          {/* Rule 2: Fish sauce */}
          <div className="flex items-center justify-between p-4 rounded-[12px] bg-white border border-[#e5e7eb] hover:border-slate-300 transition-colors shadow-2xs">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-bold text-[#1f2937]">
                Nước mắm cá cơm, mắm tôm, mắm tép truyền thống
              </span>
              <span className="text-[11px] text-[#6b7280]">
                Tự động cảnh báo các món xào, nộm có nước mắm cá cơm hoặc hạt nêm nguồn gốc thịt
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hiddenRules.fishSauce}
              onClick={() => handleToggleRule('fishSauce')}
              disabled={disabled}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2e7d32] shrink-0 cursor-pointer ${
                hiddenRules.fishSauce ? 'bg-[#2e7d32] justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-sm block" />
            </button>
          </div>

          {/* Rule 3: Oyster sauce */}
          <div className="flex items-center justify-between p-4 rounded-[12px] bg-white border border-[#e5e7eb] hover:border-slate-300 transition-colors shadow-2xs">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-bold text-[#1f2937]">
                Dầu hào chiết xuất từ động vật (Oyster sauce)
              </span>
              <span className="text-[11px] text-[#6b7280]">
                Bắt buộc gợi ý thay bằng dầu hào nấm chay chiết xuất từ nấm hương hữu cơ
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hiddenRules.oysterSauce}
              onClick={() => handleToggleRule('oysterSauce')}
              disabled={disabled}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2e7d32] shrink-0 cursor-pointer ${
                hiddenRules.oysterSauce ? 'bg-[#2e7d32] justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-sm block" />
            </button>
          </div>

          {/* Rule 4: Animal Fat */}
          <div className="flex items-center justify-between p-4 rounded-[12px] bg-white border border-[#e5e7eb] hover:border-slate-300 transition-colors shadow-2xs">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-bold text-[#1f2937]">
                Mỡ động vật, mỡ lợn phi hành, mỡ bò
              </span>
              <span className="text-[11px] text-[#6b7280]">
                Cảnh báo thực phẩm chiên xào ngoài hàng quán dùng mỡ động vật thay vì dầu thực vật nguyên chất
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hiddenRules.animalFat}
              onClick={() => handleToggleRule('animalFat')}
              disabled={disabled}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2e7d32] shrink-0 cursor-pointer ${
                hiddenRules.animalFat ? 'bg-[#2e7d32] justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-sm block" />
            </button>
          </div>

          {/* Rule 5: Gelatin & Honey */}
          <div className="flex items-center justify-between p-4 rounded-[12px] bg-white border border-[#e5e7eb] hover:border-slate-300 transition-colors shadow-2xs">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-bold text-[#1f2937]">
                Gelatin từ da/xương động vật &amp; Sáp ong
              </span>
              <span className="text-[11px] text-[#6b7280]">
                Thường có trong thạch rau câu công nghiệp, kẹo dẻo và bánh tráng miệng
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hiddenRules.gelatinHoney}
              onClick={() => handleToggleRule('gelatinHoney')}
              disabled={disabled}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2e7d32] shrink-0 cursor-pointer ${
                hiddenRules.gelatinHoney ? 'bg-[#2e7d32] justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-sm block" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AllergyManager
