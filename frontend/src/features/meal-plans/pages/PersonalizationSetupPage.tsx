import { useEffect, useState } from 'react'
import { Calendar, ChevronRight, Loader2, Sparkles } from 'lucide-react'
import { profileApi } from '../../profile/api/profileApi'
import type { UserProfile } from '../../profile/types'
import { mealPlanApi, nextMonday } from '../api/mealPlanApi'
import { MealPlanSkeleton } from '../components/MealPlanSkeleton'

interface PersonalizationSetupPageProps { onNavigate?: (path: string) => void }

export const PersonalizationSetupPage = ({ onNavigate }: PersonalizationSetupPageProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('Thực đơn chay 7 ngày')
  const [weekStartDate, setWeekStartDate] = useState(nextMonday)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    profileApi.getProfile().then(value => { if (active) setProfile(value) })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Không thể tải hồ sơ.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const generate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || !profile?.dietaryType) return
    setBusy(true)
    setError(null)
    try {
      const plan = await mealPlanApi.generate(name.trim(), weekStartDate)
      onNavigate?.(`/meal-plans/${plan.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo thực đơn. Vui lòng thử lại.')
    } finally { setBusy(false) }
  }

  if (loading) return <MealPlanSkeleton />
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-7">
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <button onClick={() => onNavigate?.('/meal-plans/my-plan')}>Thực đơn của tôi</button><ChevronRight className="w-3 h-3" /><span>Tạo thực đơn</span>
      </nav>
      <section className="rounded-3xl bg-gradient-to-br from-[#0f4a24] to-[#22874a] p-8 text-white space-y-3">
        <Sparkles className="w-7 h-7 text-emerald-200" />
        <h1 className="text-3xl font-black">Thực đơn cá nhân hóa 7 ngày</h1>
        <p className="text-sm text-white/80">21 bữa sáng, trưa và tối từ công thức đang hoạt động, theo chế độ ăn, dị ứng và thực phẩm cần tránh trong hồ sơ của bạn.</p>
      </section>
      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-bold text-lg">Hồ sơ dùng cho kế hoạch</h2>
          <p className="text-sm">Chế độ ăn: <strong>{profile?.dietaryType || 'Chưa chọn'}</strong></p>
          <p className="text-sm">Dị ứng đã lưu: {profile?.allergies.join(', ') || 'Chưa khai báo'}</p>
          <p className="text-sm">Thực phẩm cần tránh: {profile?.avoidedFoods?.map(item => item.name).join(', ') || 'Chưa khai báo'}</p>
          <p className="text-xs text-slate-500">Kế hoạch lưu thông tin hồ sơ tại thời điểm tạo. Đổi món và tạo lại dùng thông tin đã lưu trong kế hoạch. Tổng dinh dưỡng là thông tin tham khảo.</p>
          <button type="button" disabled={busy} onClick={() => onNavigate?.('/profile')} className="text-sm font-bold text-emerald-800 underline">Kiểm tra / cập nhật hồ sơ</button>
        </section>
        <form onSubmit={generate} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5">
          <h2 className="font-bold text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-emerald-700" />Thiết lập kế hoạch</h2>
          <label className="block text-sm font-semibold">Tên thực đơn
            <input required maxLength={120} value={name} onChange={event => setName(event.target.value)} disabled={busy} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" />
          </label>
          <label className="block text-sm font-semibold">Ngày bắt đầu (7 ngày liên tiếp)
            <input type="date" required value={weekStartDate} onChange={event => setWeekStartDate(event.target.value)} disabled={busy} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" />
          </label>
          {!profile?.dietaryType && <p className="text-sm text-amber-800">Vui lòng chọn chế độ ăn trong hồ sơ trước khi tạo thực đơn.</p>}
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <button type="submit" disabled={busy || !profile?.dietaryType || !name.trim()} className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#184d28] px-5 py-3 font-bold text-white disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{busy ? 'Đang tạo và lưu...' : 'Tạo và lưu 21 bữa'}
          </button>
        </form>
      </div>
    </div>
  )
}
export default PersonalizationSetupPage
