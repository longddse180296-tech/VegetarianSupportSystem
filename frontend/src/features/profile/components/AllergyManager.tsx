import React, { useState } from 'react'
import { AlertTriangle, ShieldAlert, Plus, X, Check } from 'lucide-react'
import type { HiddenIngredientRules } from '../types'

interface AllergyManagerProps {
  allergies: string[]
  onAllergiesChange: (allergies: string[]) => void
  hiddenRules: HiddenIngredientRules
  onHiddenRulesChange: (rules: HiddenIngredientRules) => void
  disabled?: boolean
}

export const AllergyManager: React.FC<AllergyManagerProps> = ({
  allergies,
  onAllergiesChange,
  hiddenRules,
  onHiddenRulesChange,
  disabled = false,
}) => {
  const [newAllergy, setNewAllergy] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddAllergy = () => {
    const trimmed = newAllergy.trim()
    if (trimmed && !allergies.includes(trimmed)) {
      onAllergiesChange([...allergies, trimmed])
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
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
          {allergies.length} cảnh báo dị ứng
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Thực đơn và sản phẩm quét có chứa các thành phần này sẽ bị hệ thống gắn cờ cảnh báo nguy cơ
        dị ứng nguy hiểm ngay lập tức.
      </p>

      {/* Allergy Chips List */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {allergies.map((allergy, index) => (
            <span
              key={allergy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-sm"
            >
              <span>{allergy}</span>
              <button
                type="button"
                onClick={() => handleRemoveAllergy(index)}
                disabled={disabled}
                className="p-0.5 rounded hover:bg-rose-200 text-rose-600 hover:text-rose-900 transition-colors focus:outline-none"
                aria-label={`Xóa dị ứng ${allergy}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {/* Add Allergy Button / Input */}
          {isAdding ? (
            <div className="inline-flex items-center gap-1.5 p-1 rounded-lg border border-emerald-400 bg-white">
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
                className="text-xs px-2 py-1 outline-none text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddAllergy}
                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm dị ứng / thực phẩm kiêng</span>
            </button>
          )}
        </div>
      </div>

      {/* Hidden Animal Ingredients Section */}
      <div className="pt-4 border-t border-slate-200/80 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-emerald-700" />
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              Cảnh báo Thành phần Động vật Ẩn (Hidden Animal Ingredients Auto-Block)
            </h4>
            <p className="text-xs text-slate-500 leading-tight mt-0.5">
              Hệ thống tự động phát hiện và cảnh báo các phụ gia, gia vị có nguồn gốc động vật ẩn
              thường gặp trong món ăn Việt Nam.
            </p>
          </div>
        </div>

        {/* Toggle List */}
        <div className="flex flex-col gap-2.5">
          {/* Rule 1: Bone Broth */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-bold text-slate-900">
                Nước hầm xương / thịt động vật trong súp phở, canh
              </span>
              <span className="text-[11px] text-slate-500">
                Thường có trong nước dùng phở, bún riêu, lẩu truyền thống
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
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-bold text-slate-900">
                Nước mắm cá cơm, mắm tôm, mắm tép truyền thống
              </span>
              <span className="text-[11px] text-slate-500">
                Tự động cảnh báo các món xào, nộm có nước mắm cá cơm hoặc hạt nêm động vật
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
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-bold text-slate-900">
                Dầu hào chiết xuất từ động vật (Oyster sauce)
              </span>
              <span className="text-[11px] text-slate-500">
                Bắt buộc thay bằng dầu hào nấm chay chiết xuất từ nấm hương cao cấp
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
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-bold text-slate-900">
                Mỡ động vật, mỡ lợn phi hành, mỡ bò
              </span>
              <span className="text-[11px] text-slate-500">
                Cảnh báo thực phẩm xào rán dùng mỡ động vật thay vì dầu thực vật
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
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-bold text-slate-900">
                Gelatin công nghiệp, sáp ong &amp; Mật ong hoa rừng
              </span>
              <span className="text-[11px] text-slate-500">
                Tự động phát hiện phụ gia kẹo dẻo (E441), chất làm bóng (E904, E901)
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
    </div>
  )
}
export default AllergyManager
