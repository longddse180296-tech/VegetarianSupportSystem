// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import { useEffect, useState } from 'react'
import {
  Calendar,
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
import { DIETARY_TYPE_LABELS } from '../../../shared/constants'

// Cấu trúc PersonalizationSetupPageProps quy định dữ liệu trao đổi trong thực đơn bảy ngày và danh sách đi chợ.
interface PersonalizationSetupPageProps {
  onNavigate?: (path: string) => void
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (PersonalizationSetupPage); thuộc thực đơn bảy ngày và danh sách đi chợ.
export const PersonalizationSetupPage = ({
  onNavigate,
}: PersonalizationSetupPageProps) => {
  // Lưu dữ liệu và trạng thái thao tác của thực đơn bảy ngày và danh sách đi chợ trong vòng đời màn hình.
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('Thực đơn chay 7 ngày')
  const [weekStartDate, setWeekStartDate] = useState(nextMonday)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Đồng bộ dữ liệu theo thay đổi đầu vào; hủy hoặc bỏ qua kết quả cũ khi màn hình thay đổi.
  useEffect(() => {
    let active = true
    profileApi
      .getProfile()
      .then((value) => {
        if (!active) return
        setProfile(value)
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

  // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (generate); thuộc thực đơn bảy ngày và danh sách đi chợ.
  const generate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || !profile?.dietaryType || !name.trim()) return
    setBusy(true)
    setError(null)
    try {
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

  // Hiển thị giao diện thực đơn bảy ngày và danh sách đi chợ từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="ui-page-container py-8 space-y-6">
      <PageHeading
        title="Thực đơn cá nhân hóa 7 ngày"
        description="Lập 21 bữa sáng, trưa và tối từ kho công thức, dựa trên chế độ ăn, dị ứng và thực phẩm cần tránh đã khai báo."
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
                    {DIETARY_TYPE_LABELS[profile.dietaryType]}
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
              Cập nhật chế độ ăn, dị ứng &amp; chỉ số trong Hồ sơ
            </button>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Thực đơn sẽ lưu chế độ ăn, dị ứng và thực phẩm cần tránh tại thời điểm tạo.
              Khi đổi món hoặc tạo lại, các lựa chọn này vẫn được áp dụng.
            </p>
          </div>
        </section>

        {/* Right Column: Thông tin thực đơn */}
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
                Đặt tên và chọn thời gian bắt đầu thực đơn
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm">
            {profile?.dietaryType ? (
              <p className="text-emerald-900">
                Chế độ ăn áp dụng: <strong>{DIETARY_TYPE_LABELS[profile.dietaryType]}</strong>.
                {' '}Tự động lấy từ hồ sơ của bạn.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-amber-800">
                  {profile ? 'Bạn chưa lưu chế độ ăn trong hồ sơ.' : 'Chưa tải được hồ sơ. Vui lòng tải lại trang để thử lại.'}
                </p>
                {profile && (
                  <button
                    type="button"
                    onClick={() => onNavigate?.('/profile')}
                    className="font-bold text-[#2E7D32] underline"
                  >
                    Cập nhật hồ sơ
                  </button>
                )}
              </div>
            )}
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
              disabled={busy || !profile?.dietaryType || !name.trim()}
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
            {profile && !profile.dietaryType && (
              <p className="text-center text-xs text-amber-700 mt-2 font-medium">
                Cập nhật chế độ ăn trong hồ sơ để tiếp tục.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default PersonalizationSetupPage
