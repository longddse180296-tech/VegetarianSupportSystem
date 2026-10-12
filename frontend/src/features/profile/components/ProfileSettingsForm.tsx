import { useState } from 'react'
import { BodyMetricsCalculator } from './BodyMetricsCalculator'
import { Feedback } from '../../admin/components/ApiWorkspace'
import {
  fieldClass,
  primaryClass,
  secondaryClass,
  errorMessage,
} from '../../admin/utils/apiUi'
import type { UserProfile, DietaryType } from '../types'
interface Props {
  initialProfile: UserProfile
  onSave: (updates: Partial<UserProfile>) => Promise<void>
  onBackToOverview?: () => void
  onNavigate?: (path: string) => void
  isLoading?: boolean
}
export const ProfileSettingsForm = ({
  initialProfile,
  onSave,
  onBackToOverview,
  isLoading,
}: Props) => {
  const [form, setForm] = useState(initialProfile)
  const [allergies, setAllergies] = useState(
    initialProfile.allergies.join('\n'),
  )
  const [avoided, setAvoided] = useState(
    initialProfile.avoidedFoods?.map((item) => item.name).join('\n') || '',
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        if (busy || isLoading) return
        setBusy(true)
        setError(null)
        setNotice(null)
        try {
          await onSave({
            fullName: form.fullName,
            phoneNumber: form.phoneNumber || '',
            preferredRegion: form.preferredRegion || '',
            dietaryType: form.dietaryType,
            metrics: form.metrics,
            allergies: [
              ...new Set(
                allergies
                  .split('\n')
                  .map((item) => item.trim())
                  .filter(Boolean),
              ),
            ],
            avoidedFoods: [
              ...new Set(
                avoided
                  .split('\n')
                  .map((item) => item.trim())
                  .filter(Boolean),
              ),
            ].map((name) => ({ id: '', name })),
          })
          setNotice('Đã lưu hồ sơ.')
        } catch (reason) {
          setError(errorMessage(reason))
        } finally {
          setBusy(false)
        }
      }}
    >
      <section className="rounded-2xl border bg-white p-5 sm:p-8 space-y-4">
        <h2 className="font-bold text-xl text-[#184d28]">
          Thông tin cá nhân & chế độ ăn
        </h2>
        <fieldset disabled={busy || isLoading} className="space-y-4">
          <label className="block text-sm">
            Họ và tên
            <input
              required
              maxLength={150}
              className={fieldClass}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </label>
          <p className="text-sm text-slate-500">Email: {form.email}</p>
          <label className="block text-sm">
            Số điện thoại
            <input
              maxLength={30}
              className={fieldClass}
              value={form.phoneNumber || ''}
              onChange={(e) =>
                setForm({ ...form, phoneNumber: e.target.value })
              }
            />
          </label>
          <label className="block text-sm">
            Khu vực ẩm thực
            <input
              maxLength={200}
              className={fieldClass}
              value={form.preferredRegion || ''}
              onChange={(e) =>
                setForm({ ...form, preferredRegion: e.target.value })
              }
            />
          </label>
          <label className="block text-sm">
            Chế độ ăn
            <select
              className={fieldClass}
              value={form.dietaryType}
              onChange={(e) =>
                setForm({ ...form, dietaryType: e.target.value as DietaryType })
              }
            >
              <option value="">Chưa chọn</option>
              <option value="Vegan">Thuần chay</option>
              <option value="Lacto-vegetarian">Chay có sữa</option>
              <option value="Ovo-vegetarian">Chay có trứng</option>
              <option value="Lacto-ovo vegetarian">Chay trứng sữa</option>
            </select>
          </label>
          <label className="block text-sm">
            Dị ứng (mỗi dòng một mục)
            <textarea
              rows={3}
              className={fieldClass}
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Thực phẩm cần tránh (mỗi dòng một mục)
            <textarea
              rows={3}
              className={fieldClass}
              value={avoided}
              onChange={(e) => setAvoided(e.target.value)}
            />
          </label>
        </fieldset>
      </section>
      <BodyMetricsCalculator
        metrics={form.metrics}
        onChange={(metrics) => setForm({ ...form, metrics })}
        preferredProteins={[]}
        disabled={busy || isLoading}
      />
      <Feedback error={error} notice={notice} />
      <div className="flex gap-3">
        <button
          type="button"
          disabled={busy}
          className={secondaryClass}
          onClick={onBackToOverview}
        >
          Về tổng quan
        </button>
        <button disabled={busy || isLoading} className={primaryClass}>
          {busy || isLoading ? 'Đang lưu...' : 'Lưu hồ sơ'}
        </button>
      </div>
    </form>
  )
}
export default ProfileSettingsForm
