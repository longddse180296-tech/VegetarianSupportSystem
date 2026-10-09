import React, { useState } from 'react'
import {
  AlertTriangle,
  ShieldAlert,
  Plus,
  X,
  Check,
  Sparkles,
  Info,
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3 className="text-base font-bold text-slate-900">
            Bộ lọc An toàn &amp; Cảnh báo Dị ứng
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
          {allergies.length} cảnh báo dị ứng đang bật
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Bất kỳ công thức, thực đơn gợi ý hoặc sản phẩm quét nhãn có chứa thành phần trong danh sách này
        sẽ được hệ thống lập tức gắn cờ cảnh báo đỏ để bảo vệ sức khỏe của bạn.
      </p>

      {/* Active Allergy Chips List */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold text-slate-700">
          Danh sách dị ứng &amp; thực phẩm kiêng của bạn:
        </label>

        <div className="flex flex-wrap items-center gap-2 min-h-10 p-3 rounded-xl bg-slate-50 border border-slate-200">
          {allergies.length === 0 && !isAdding && (
            <span className="text-xs text-slate-400 italic">
              Chưa có thực phẩm dị ứng nào được lưu. Bạn có thể chọn nhanh từ gợi ý bên dưới hoặc thêm mới.
            </span>
          )}

          {allergies.map((allergy, index) => (
            <span
              key={allergy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs"
            >
              <span>{allergy}</span>
              <button
                type="button"
                onClick={() => handleRemoveAllergy(index)}
                disabled={disabled}
                className="p-0.5 rounded hover:bg-rose-200 text-rose-600 hover:text-rose-900 transition-colors focus:outline-none"
                aria-label={`Xóa dị ứng ${allergy}`}
                title="Xóa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {/* Add Allergy Button / Input */}
          {isAdding ? (
            <div className="inline-flex items-center gap-1.5 p-1 rounded-lg border border-emerald-500 bg-white shadow-xs">
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
                className="text-xs px-2 py-1 outline-none text-slate-900 w-44"
              />
              <button
                type="button"
                onClick={() => handleAddAllergy()}
                className="p-1 rounded bg-emerald-700 text-white hover:bg-emerald-800"
                title="Thêm"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
                title="Hủy"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Thêm dị ứng mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Suggestions */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
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
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                  isAlreadyAdded
                    ? 'bg-rose-50 text-rose-700 border-rose-200 opacity-60 cursor-default'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-900'
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
      <div className="pt-5 border-t border-slate-200/90 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-emerald-700" />
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              Tự động chặn Thành phần Động vật Ẩn (Hidden Animal Ingredients Guard)
            </h4>
            <p className="text-xs text-slate-500 leading-tight mt-0.5">
              Hệ thống tự động phát hiện và cảnh báo các gia vị, phụ gia có gốc động vật ẩn thường gặp trong món ăn Việt Nam.
            </p>
          </div>
        </div>

        {/* Toggle List */}
        <div className="flex flex-col gap-2.5">
          {/* Rule 1: Bone Broth */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-bold text-slate-900">
                Nước hầm xương / thịt động vật trong súp phở, canh
              </span>
              <span className="text-[11px] text-slate-500">
                Thường có trong nước dùng phở, bún riêu, lẩu truyền thống chưa rõ nguồn gốc thực vật
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hiddenRules.boneBroth}
              onClick={() => handleToggleRule('boneBroth')}
              disabled={disabled}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-shrink-0 ${
                hiddenRules.boneBroth ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-sm block" />
            </button>
          </div>

          {/* Rule 2: Fish sauce */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-bold text-slate-900">
                Nước mắm cá cơm, mắm tôm, mắm tép truyền thống
              </span>
              <span className="text-[11px] text-slate-500">
                Tự động cảnh báo các món xào, nộm có nước mắm cá cơm hoặc hạt nêm nguồn gốc thịt
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hiddenRules.fishSauce}
              onClick={() => handleToggleRule('fishSauce')}
              disabled={disabled}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-shrink-0 ${
                hiddenRules.fishSauce ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-sm block" />
            </button>
          </div>

          {/* Rule 3: Oyster sauce */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-bold text-slate-900">
                Dầu hào chiết xuất từ động vật (Oyster sauce)
              </span>
              <span className="text-[11px] text-slate-500">
                Bắt buộc thay bằng dầu hào nấm chay chiết xuất từ nấm hương hữu cơ
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hiddenRules.oysterSauce}
              onClick={() => handleToggleRule('oysterSauce')}
              disabled={disabled}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-shrink-0 ${
                hiddenRules.oysterSauce ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-sm block" />
            </button>
          </div>

          {/* Rule 4: Animal Fat */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-bold text-slate-900">
                Mỡ động vật, mỡ lợn phi hành, mỡ bò
              </span>
              <span className="text-[11px] text-slate-500">
                Cảnh báo thực phẩm chiên xào ngoài hàng quán dùng mỡ động vật thay vì dầu thực vật
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hiddenRules.animalFat}
              onClick={() => handleToggleRule('animalFat')}
              disabled={disabled}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-shrink-0 ${
                hiddenRules.animalFat ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-sm block" />
            </button>
          </div>

          {/* Rule 5: Gelatin & Honey */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-bold text-slate-900">
                Gelatin công nghiệp, sáp ong &amp; Mật ong hoa rừng
              </span>
              <span className="text-[11px] text-slate-500">
                Tự động quét phát hiện phụ gia kẹo dẻo (E441), chất làm bóng vỏ thuốc/bánh (E904, E901)
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hiddenRules.gelatinHoney}
              onClick={() => handleToggleRule('gelatinHoney')}
              disabled={disabled}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-shrink-0 ${
                hiddenRules.gelatinHoney ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-sm block" />
            </button>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 text-xs text-sky-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-sky-700 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Lưu ý:</strong> Khi sử dụng tính năng <em>Kiểm tra món ăn &amp; Quét nhãn</em>,
          hệ thống sẽ kết hợp cả danh sách dị ứng và các quy tắc thành phần ẩn trên đây để đưa ra khuyến cáo phù hợp nhất.
        </p>
      </div>
    </div>
  )
}

export default AllergyManager
