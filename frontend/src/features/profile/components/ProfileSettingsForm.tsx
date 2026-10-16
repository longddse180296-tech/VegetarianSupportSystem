import { useState } from 'react'
import { BodyMetricsCalculator } from './BodyMetricsCalculator'
import { AlertError, Button, Input, Select, Textarea } from '../../../shared/components'
import { DIETARY_TYPES, getDietaryTypeLabel } from '../../../shared/constants'
import type { UserProfile, DietaryType } from '../types'

interface Props {
  initialProfile: UserProfile
  onSave: (updates: Partial<UserProfile>) => Promise<void>
  onBackToOverview?: () => void
  onNavigate?: (path: string) => void
  isLoading?: boolean
}

export function ProfileSettingsForm({ initialProfile, onSave, onBackToOverview, isLoading }: Props) {
  const [form, setForm] = useState(initialProfile)
  const [allergies, setAllergies] = useState(initialProfile.allergies.join('\n'))
  const [avoided, setAvoided] = useState(initialProfile.avoidedFoods?.map(item => item.name).join('\n') || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const disabled = busy || isLoading

  return (
    <form className="space-y-5" onSubmit={async event => {
      event.preventDefault()
      if (disabled) return
      setBusy(true)
      setError(null)
      try {
        await onSave({
          fullName: form.fullName.trim(),
          phoneNumber: form.phoneNumber?.trim() || '',
          preferredRegion: form.preferredRegion?.trim() || '',
          dietaryType: form.dietaryType,
          metrics: form.metrics,
          allergies: allergies.split('\n'),
          avoidedFoods: avoided.split('\n').map(name => ({ id: '', name })),
        })
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Không thể lưu hồ sơ. Vui lòng thử lại.')
      } finally {
        setBusy(false)
      }
    }}>
      <section className="ui-card p-5 sm:p-8 space-y-5" aria-labelledby="profile-personal-title">
        <h2 id="profile-personal-title" className="ui-card-title">Thông tin cá nhân &amp; chế độ ăn</h2>
        <fieldset disabled={disabled} className="grid sm:grid-cols-2 gap-4">
          <Input label="Họ và tên" required maxLength={150} value={form.fullName} onChange={event => setForm(current => ({ ...current, fullName: event.target.value }))} />
          <Input label="Email" type="email" value={form.email} readOnly helperText="Email tài khoản chỉ đọc." />
          <Input label="Số điện thoại" type="tel" autoComplete="tel" maxLength={30} value={form.phoneNumber || ''} onChange={event => setForm(current => ({ ...current, phoneNumber: event.target.value }))} />
          <Input label="Khu vực tìm nhà hàng" maxLength={200} value={form.preferredRegion || ''} onChange={event => setForm(current => ({ ...current, preferredRegion: event.target.value }))} helperText="Ví dụ: Quận 1, TP. Hồ Chí Minh; đây là khu vực tìm kiếm, không phải phong cách ẩm thực." />
          <div className="sm:col-span-2">
            <Select
              label="Chế độ ăn" value={form.dietaryType}
              onChange={event => setForm(current => ({ ...current, dietaryType: event.target.value as DietaryType }))}
              options={[{ value: '', label: 'Chưa chọn chế độ ăn' }, ...DIETARY_TYPES.map(value => ({ value, label: getDietaryTypeLabel(value) }))]}
              helperText="Lưu lựa chọn vào hồ sơ dùng chung. Kết quả và thực đơn đã lưu trước đó giữ thông tin tại thời điểm tạo."
            />
          </div>
        </fieldset>
      </section>
      <section className="ui-card p-5 sm:p-8 space-y-5" aria-labelledby="profile-food-title">
        <div>
          <h2 id="profile-food-title" className="ui-card-title">Dị ứng &amp; thực phẩm cần tránh</h2>
          <p className="mt-2 text-sm text-text-muted">Hai danh sách được lưu riêng, độc lập với chế độ ăn chay. Danh sách trống nghĩa là chưa có mục nào được khai báo.</p>
        </div>
        <fieldset disabled={disabled} className="grid sm:grid-cols-2 gap-4">
          <Textarea label="Dị ứng (mỗi dòng một mục)" rows={4} value={allergies} onChange={event => setAllergies(event.target.value)} helperText="Ví dụ: Đậu phộng. Mỗi tên tối đa 150 ký tự." />
          <Textarea label="Thực phẩm cần tránh (mỗi dòng một mục)" rows={4} value={avoided} onChange={event => setAvoided(event.target.value)} helperText="Ví dụ: Nấm. Mỗi tên tối đa 150 ký tự." />
        </fieldset>
      </section>
      <BodyMetricsCalculator metrics={form.metrics} onChange={metrics => setForm(current => ({ ...current, metrics }))} disabled={disabled} />
      {error && <AlertError title="Chưa lưu đầy đủ hồ sơ" message={error} />}
      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={disabled} variant="outline" onClick={onBackToOverview}>Về tổng quan</Button>
        <Button type="submit" disabled={disabled} isLoading={busy || isLoading}>Lưu hồ sơ</Button>
      </div>
    </form>
  )
}
export default ProfileSettingsForm
