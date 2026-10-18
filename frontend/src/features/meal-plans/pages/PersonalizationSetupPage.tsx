import { useEffect, useState } from 'react'
import {
  Calendar,
  Check,
  CheckCircle2,
  ExternalLink,
  Info,
  Leaf,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { profileApi } from '../../profile/api/profileApi'
import type { UserProfile } from '../../profile/types'
import { mealPlanApi, nextMonday } from '../api/mealPlanApi'
import { MealPlanSkeleton } from '../components/MealPlanSkeleton'
import { Badge, Breadcrumb, PageHeading } from '../../../shared/components'
import {
  DIETARY_TYPES,
  DIETARY_TYPE_LABELS,
  type DietaryType,
} from '../../../shared/constants'

interface PersonalizationSetupPageProps {
  onNavigate?: (path: string) => void
}

const DIET_DESCRIPTIONS: Record<DietaryType, string> = {
  Vegan: 'Thực vật 100%, không trứng, không sữa, không mật ong.',
  'Lacto-vegetarian': 'Sử dụng thực vật và sữa/chế phẩm từ sữa, không dùng trứng.',
  'Ovo-vegetarian': 'Sử dụng thực vật và trứng, không dùng sữa và chế phẩm sữa.',
  'Lacto-ovo vegetarian': 'Chế độ ăn chay linh hoạt, sử dụng cả trứng và sữa.',
}

export const PersonalizationSetupPage = ({
  onNavigate,
}: PersonalizationSetupPageProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('Thực đơn chay 7 ngày')
  const [weekStartDate, setWeekStartDate] = useState(nextMonday)
  const [selectedDiet, setSelectedDiet] = useState<DietaryType | ''>('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    profileApi
      .getProfile()
      .then((value) => {
        if (!active) return
        setProfile(value)
        if (value.dietaryType) {
          setSelectedDiet(value.dietaryType as DietaryType)
        }
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error ? err.message : 'Không thể tải hồ sơ.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const generate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || !selectedDiet || !name.trim()) return
    setBusy(true)
    setError(null)
    try {
      // Auto-save dietary type to user profile if not yet saved or if changed
      if (profile?.dietaryType !== selectedDiet) {
        await profileApi.updateProfile({ dietaryType: selectedDiet })
      }
      const plan = await mealPlanApi.generate(name.trim(), weekStartDate)
      onNavigate?.(`/meal-plans/${plan.id}`)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tạo thực đơn. Vui lòng thử lại.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="ui-page-container py-8 space-y-6">
        <Breadcrumb
          items={[
            { label: 'Trang chủ', onClick: () => onNavigate?.('/') },
            { label: 'Thực đơn', onClick: () => onNavigate?.('/meal-plans') },
            { label: 'Tạo thực đơn' },
          ]}
        />
        <MealPlanSkeleton />
      </div>
    )
  }

  return (
    <div className="ui-page-container py-8 space-y-6">
      <PageHeading
        title="Thực đơn cá nhân hóa 7 ngày"
        description="21 bữa sáng, trưa và tối từ công thức đang hoạt động, tinh chỉnh chính xác theo chế độ ăn, dị ứng và thực phẩm cần tránh."
        breadcrumbs={[
          { label: 'Trang chủ', onClick: () => onNavigate?.('/') },
          { label: 'Thực đơn', onClick: () => onNavigate?.('/meal-plans') },
          { label: 'Tạo thực đơn' },
        ]}
        eyebrow={<Badge icon={<Sparkles size={14} />}>Thiết lập thực đơn</Badge>}
      />

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Hồ sơ tham chiếu */}
        <section className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center">
              <Leaf size={18} />
            </span>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                Hồ sơ dinh dưỡng áp dụng
              </h2>
              <p className="text-xs text-slate-500">
                Kế hoạch được cá nhân hóa theo các thông số này
              </p>
            </div>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="rounded-2xl bg-slate-50 p-4 space-y-2 border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block">
                Chế độ ăn đã lưu trong hồ sơ:
              </span>
              <div className="flex items-center gap-2">
                {profile?.dietaryType ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-[#2E7D32]">
                    <CheckCircle2 size={13} />
                    {profile.dietaryType}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <Info size={13} />
                    Chưa thiết lập trong hồ sơ
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5 px-1">
              <span className="text-xs font-semibold text-slate-500 block">
                Dị ứng đã lưu:
              </span>
              <p className="text-sm font-medium text-slate-800">
                {profile?.allergies && profile.allergies.length > 0 ? (
                  <span className="inline-flex flex-wrap gap-1.5">
                    {profile.allergies.map((allergy) => (
                      <span
                        key={allergy}
                        className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200"
                      >
                        {allergy}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-slate-400 italic text-xs">
                    Không có dị ứng nào
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-1.5 px-1">
              <span className="text-xs font-semibold text-slate-500 block">
                Thực phẩm cần tránh:
              </span>
              <p className="text-sm font-medium text-slate-800">
                {profile?.avoidedFoods && profile.avoidedFoods.length > 0 ? (
                  <span className="inline-flex flex-wrap gap-1.5">
                    {profile.avoidedFoods.map((item) => (
                      <span
                        key={item.id}
                        className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200"
                      >
                        {item.name}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-slate-400 italic text-xs">
                    Không có thực phẩm cần tránh
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={busy}
              onClick={() => onNavigate?.('/profile')}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#2E7D32] hover:text-[#1B5E20] hover:underline transition-colors"
            >
              <ExternalLink size={14} />
              Cập nhật dị ứng &amp; chỉ số trong Hồ sơ
            </button>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Hệ thống sẽ lưu snapshot hồ sơ tại thời điểm tạo. Đổi món và tạo lại
              sẽ tuân thủ các điều kiện bắt buộc này.
            </p>
          </div>
        </section>

        {/* Right Column: Form Thiết lập & Chọn chế độ ăn */}
        <form
          onSubmit={generate}
          className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm"
        >
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center">
              <Calendar size={18} />
            </span>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                Thông tin kế hoạch 7 ngày
              </h2>
              <p className="text-xs text-slate-500">
                Chọn chế độ ăn và thời gian bắt đầu thực đơn
              </p>
            </div>
          </div>

          {/* Chọn nhanh chế độ ăn */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-800">
                Chế độ ăn cho thực đơn <span className="text-rose-500">*</span>
              </label>
              {!profile?.dietaryType && (
                <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium">
                  Chọn 1 trong 4 chế độ dưới đây
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {DIETARY_TYPES.map((diet) => {
                const isSelected = selectedDiet === diet
                const isProfileDiet = profile?.dietaryType === diet
                return (
                  <div
                    key={diet}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedDiet(diet)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedDiet(diet)
                      }
                    }}
                    className={`relative text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#2E7D32] bg-emerald-50/60 ring-2 ring-[#2E7D32]/20 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">
                          {DIETARY_TYPE_LABELS[diet]}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-[#2E7D32] bg-[#2E7D32] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check size={11} strokeWidth={3} />}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-snug">
                        {DIET_DESCRIPTIONS[diet]}
                      </p>
                    </div>

                    {isProfileDiet && (
                      <span className="mt-2 text-[10px] font-bold text-[#2E7D32] bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block w-fit">
                        Theo hồ sơ của bạn
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-800">
              Tên thực đơn <span className="text-rose-500">*</span>
              <input
                required
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={busy}
                placeholder="Ví dụ: Thực đơn chay 7 ngày tuần 42"
                className="mt-2 w-full rounded-2xl border border-slate-200 p-3 text-sm font-normal text-slate-900 focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all"
              />
            </label>

            <label className="block text-sm font-bold text-slate-800">
              Ngày bắt đầu (7 ngày liên tiếp) <span className="text-rose-500">*</span>
              <input
                type="date"
                required
                value={weekStartDate}
                onChange={(event) => setWeekStartDate(event.target.value)}
                disabled={busy}
                className="mt-2 w-full rounded-2xl border border-slate-200 p-3 text-sm font-normal text-slate-900 focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all"
              />
            </label>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800"
            >
              {error}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={busy || !selectedDiet || !name.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold py-3.5 px-6 shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              {busy ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Đang tạo và lưu 21 bữa...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Tạo và lưu 21 bữa</span>
                </>
              )}
            </button>
            {!selectedDiet && (
              <p className="text-center text-xs text-amber-700 mt-2 font-medium">
                Vui lòng chọn 1 chế độ ăn ở trên để tiếp tục
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default PersonalizationSetupPage
