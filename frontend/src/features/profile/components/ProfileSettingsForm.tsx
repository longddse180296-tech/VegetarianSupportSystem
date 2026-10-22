import React, { useState } from 'react'
import {
  Check,
  Egg,
  Leaf,
  Milk,
  Plus,
  ShieldAlert,
  Sparkles,
  UtensilsCrossed,
  X,
  ArrowLeft,
  Save,
} from 'lucide-react'
import { BodyMetricsCalculator } from './BodyMetricsCalculator'
import { AlertError, Button, Input } from '../../../shared/components'
import type { UserProfile, DietaryType } from '../types'

interface Props {
  initialProfile: UserProfile
  onSave: (updates: Partial<UserProfile>) => Promise<void>
  onBackToOverview?: () => void
  onNavigate?: (path: string) => void
  isLoading?: boolean
}

const DIET_CARDS: {
  value: DietaryType
  label: string
  desc: string
  icon: React.ElementType
}[] = [
  {
    value: 'Vegan',
    label: 'Thuần chay (Vegan)',
    desc: '100% Thực vật. Hoàn toàn không dùng thịt cá, gia cầm, trứng, sữa, mật ong.',
    icon: Leaf,
  },
  {
    value: 'Lacto-vegetarian',
    label: 'Chay có sữa (Lacto)',
    desc: 'Không ăn thịt cá, gia cầm và trứng; có sử dụng sữa tươi, phô mai và chế phẩm từ sữa.',
    icon: Milk,
  },
  {
    value: 'Ovo-vegetarian',
    label: 'Chay có trứng (Ovo)',
    desc: 'Không ăn thịt cá và sữa; có sử dụng trứng từ gia cầm nuôi nhân đạo.',
    icon: Egg,
  },
  {
    value: 'Lacto-ovo vegetarian',
    label: 'Trứng & Sữa (Lacto-Ovo)',
    desc: 'Không ăn thịt cá; kết hợp sử dụng cả trứng và các chế phẩm bơ sữa thanh trùng.',
    icon: UtensilsCrossed,
  },
]

const COMMON_ALLERGIES = [
  'Đậu phộng',
  'Gluten (Lúa mì)',
  'Đậu nành',
  'Hạt điều',
  'Mè / Vừng',
  'Nấm rơm',
  'Sữa bò',
  'Trứng gà',
]

const COMMON_AVOIDED = [
  'Hành / Tỏi (Ngũ vị tân)',
  'Ớt cay',
  'Đồ ngọt nhiều đường',
  'Bột ngọt / Mì chính',
  'Mướp đắng',
  'Măng chua',
]

export function ProfileSettingsForm({
  initialProfile,
  onSave,
  onBackToOverview,
  isLoading,
}: Props) {
  const [form, setForm] = useState(initialProfile)
  const [allergyList, setAllergyList] = useState<string[]>(
    initialProfile.allergies || [],
  )
  const [avoidedList, setAvoidedList] = useState<string[]>(
    initialProfile.avoidedFoods?.map((item) => item.name) || [],
  )
  const [newAllergy, setNewAllergy] = useState('')
  const [newAvoided, setNewAvoided] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const disabled = busy || isLoading

  const addAllergy = (nameToAdd?: string) => {
    const val = (nameToAdd !== undefined ? nameToAdd : newAllergy).trim()
    if (!val) return
    if (!allergyList.some((a) => a.toLowerCase() === val.toLowerCase())) {
      setAllergyList([...allergyList, val])
    }
    setNewAllergy('')
  }

  const removeAllergy = (target: string) => {
    setAllergyList(allergyList.filter((a) => a !== target))
  }

  const addAvoided = (nameToAdd?: string) => {
    const val = (nameToAdd !== undefined ? nameToAdd : newAvoided).trim()
    if (!val) return
    if (!avoidedList.some((a) => a.toLowerCase() === val.toLowerCase())) {
      setAvoidedList([...avoidedList, val])
    }
    setNewAvoided('')
  }

  const removeAvoided = (target: string) => {
    setAvoidedList(avoidedList.filter((a) => a !== target))
  }

  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault()
        if (disabled) return
        setBusy(true)
        setError(null)
        try {
          await onSave({
            fullName: form.fullName.trim(),
            phoneNumber: form.phoneNumber?.trim() || '',
            dietaryType: form.dietaryType,
            metrics: form.metrics,
            allergies: allergyList,
            avoidedFoods: avoidedList.map((name) => ({ id: '', name })),
          })
        } catch (reason) {
          setError(
            reason instanceof Error
              ? reason.message
              : 'Không thể lưu hồ sơ. Vui lòng thử lại.',
          )
        } finally {
          setBusy(false)
        }
      }}
    >
      {/* SECTION 1: THÔNG TIN CÁ NHÂN & CHẾ ĐỘ ĂN */}
      <section
        className="ui-card p-5 sm:p-7 space-y-6"
        aria-labelledby="profile-personal-title"
      >
        <div>
          <h2 id="profile-personal-title" className="ui-card-title text-xl">
            Thông tin cá nhân &amp; Chế độ ăn
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Cập nhật thông tin cơ bản và trường phái ăn chay chuẩn của bạn.
          </p>
        </div>

        <fieldset disabled={disabled} className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Họ và tên"
            required
            maxLength={150}
            value={form.fullName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                fullName: event.target.value,
              }))
            }
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            readOnly
            helperText="Email tài khoản chỉ đọc."
          />
          <Input
            label="Số điện thoại"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            value={form.phoneNumber || ''}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                phoneNumber: event.target.value,
              }))
            }
          />
        </fieldset>

        {/* 4 Cards chọn chế độ ăn trực quan */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>Trường phái ăn chay</span>
            <span className="text-[11px] font-semibold text-[#2E7D32] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Chuẩn hệ thống
            </span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {DIET_CARDS.map((card) => {
              const isSelected = form.dietaryType === card.value
              const Icon = card.icon
              return (
                <div
                  key={card.value}
                  onClick={() =>
                    !disabled &&
                    setForm((current) => ({
                      ...current,
                      dietaryType: card.value,
                    }))
                  }
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'border-[#2E7D32] bg-emerald-50/50 shadow-xs ring-1 ring-[#2E7D32]'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#2E7D32] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="font-bold text-sm text-slate-900">
                        {card.label}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#2E7D32] text-white flex items-center justify-center shadow-xs">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-slate-500">
            Lựa chọn này sẽ đồng bộ cùng Trợ lý AI, thực đơn cá nhân và bộ lọc
            công thức.
          </p>
        </div>
      </section>

      {/* SECTION 2: DỊ ỨNG & THỰC PHẨM CẦN TRÁNH (TAGS / CHIPS) */}
      <section
        className="ui-card p-5 sm:p-7 space-y-6"
        aria-labelledby="profile-food-title"
      >
        <div>
          <h2 id="profile-food-title" className="ui-card-title text-xl">
            Dị ứng &amp; Thực phẩm cần tránh
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Hệ thống sẽ gắn cờ cảnh báo an toàn và tự động lọc các nguyên liệu
            này khi lên thực đơn hoặc gợi ý món.
          </p>
        </div>

        <fieldset disabled={disabled} className="grid lg:grid-cols-2 gap-6">
          {/* Cột 1: Dị ứng */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldAlert size={15} className="text-rose-500" />
                <span>Dị ứng ({allergyList.length})</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Cảnh báo an toàn
              </span>
            </div>

            {/* Khung chứa các chips dị ứng */}
            <div className="min-h-[72px] p-3 rounded-2xl bg-slate-50/70 border border-slate-200 flex flex-wrap items-center gap-2">
              {allergyList.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  Chưa khai báo mục nào. Chọn gợi ý bên dưới hoặc tự nhập.
                </span>
              ) : (
                allergyList.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs transition-all animate-in fade-in zoom-in duration-150"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeAllergy(item)}
                      className="hover:text-rose-950 hover:bg-rose-100 rounded-full p-0.5 transition-colors cursor-pointer"
                      title="Xóa"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Ô nhập thêm dị ứng */}
            <div className="flex gap-2">
              <input
                type="text"
                disabled={disabled}
                placeholder="Nhập tên dị ứng..."
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAllergy()
                  }
                }}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32]"
              />
              <button
                type="button"
                disabled={disabled || !newAllergy.trim()}
                onClick={() => addAllergy()}
                className="px-3 py-2 rounded-xl bg-slate-800 text-white hover:bg-[#2E7D32] text-xs font-semibold inline-flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Plus size={14} />
                <span>Thêm</span>
              </button>
            </div>

            {/* Gợi ý phổ biến */}
            <div className="pt-1">
              <span className="text-[11px] text-slate-500 font-medium block mb-1.5">
                Gợi ý nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_ALLERGIES.map((sug) => {
                  const added = allergyList.some(
                    (a) => a.toLowerCase() === sug.toLowerCase(),
                  )
                  return (
                    <button
                      key={sug}
                      type="button"
                      disabled={disabled || added}
                      onClick={() => addAllergy(sug)}
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                        added
                          ? 'opacity-40 border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-700'
                      }`}
                    >
                      + {sug}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Cột 2: Thực phẩm cần tránh */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={15} className="text-amber-500" />
                <span>Thực phẩm cần tránh ({avoidedList.length})</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Kiêng theo sở thích
              </span>
            </div>

            {/* Khung chứa các chips thực phẩm tránh */}
            <div className="min-h-[72px] p-3 rounded-2xl bg-slate-50/70 border border-slate-200 flex flex-wrap items-center gap-2">
              {avoidedList.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  Chưa khai báo mục nào. Chọn gợi ý bên dưới hoặc tự nhập.
                </span>
              ) : (
                avoidedList.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs transition-all animate-in fade-in zoom-in duration-150"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeAvoided(item)}
                      className="hover:text-amber-950 hover:bg-amber-100 rounded-full p-0.5 transition-colors cursor-pointer"
                      title="Xóa"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Ô nhập thêm thực phẩm tránh */}
            <div className="flex gap-2">
              <input
                type="text"
                disabled={disabled}
                placeholder="Nhập thực phẩm cần tránh..."
                value={newAvoided}
                onChange={(e) => setNewAvoided(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAvoided()
                  }
                }}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32]"
              />
              <button
                type="button"
                disabled={disabled || !newAvoided.trim()}
                onClick={() => addAvoided()}
                className="px-3 py-2 rounded-xl bg-slate-800 text-white hover:bg-[#2E7D32] text-xs font-semibold inline-flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Plus size={14} />
                <span>Thêm</span>
              </button>
            </div>

            {/* Gợi ý phổ biến */}
            <div className="pt-1">
              <span className="text-[11px] text-slate-500 font-medium block mb-1.5">
                Gợi ý nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_AVOIDED.map((sug) => {
                  const added = avoidedList.some(
                    (a) => a.toLowerCase() === sug.toLowerCase(),
                  )
                  return (
                    <button
                      key={sug}
                      type="button"
                      disabled={disabled || added}
                      onClick={() => addAvoided(sug)}
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                        added
                          ? 'opacity-40 border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-800'
                      }`}
                    >
                      + {sug}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </fieldset>
      </section>

      {/* SECTION 3: CHỈ SỐ CƠ THỂ & MỤC TIÊU */}
      <BodyMetricsCalculator
        metrics={form.metrics}
        onChange={(metrics) =>
          setForm((current) => ({ ...current, metrics }))
        }
        disabled={disabled}
      />

      {error && <AlertError title="Chưa lưu đầy đủ hồ sơ" message={error} />}

      {/* HÀNG NÚT LƯU & QUAY LẠI */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={disabled}
          isLoading={busy || isLoading}
          leftIcon={<Save size={16} />}
        >
          Lưu hồ sơ
        </Button>
        <Button
          type="button"
          disabled={disabled}
          variant="outline"
          onClick={onBackToOverview}
          leftIcon={<ArrowLeft size={16} />}
        >
          Về tổng quan
        </Button>
      </div>
    </form>
  )
}

export default ProfileSettingsForm
