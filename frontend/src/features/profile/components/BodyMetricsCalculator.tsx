import { useEffect, useRef, useState } from 'react'
import type { BodyMetrics } from '../types'
import { ageOn, profileApi } from '../api/profileApi'
import { AlertError, Input, Select } from '../../../shared/components'

interface BodyMetricsCalculatorProps {
  metrics: BodyMetrics
  onChange: (metrics: BodyMetrics) => void
  preferredProteins?: string[]
  disabled?: boolean
}

const BMI_LABELS = {
  underweight: 'Thiếu cân',
  normal: 'Cân nặng phù hợp',
  overweight: 'Thừa cân',
  obese: 'Béo phì',
  unknown: 'Chưa đủ dữ liệu để phân loại BMI người lớn',
}

export function BodyMetricsCalculator({ metrics, onChange, disabled = false }: BodyMetricsCalculatorProps) {
  const requestSequence = useRef(0)
  const timer = useRef<number | undefined>(undefined)
  const controller = useRef<AbortController | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [latestBirthDate] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => () => {
    window.clearTimeout(timer.current)
    controller.current?.abort()
    requestSequence.current++
  }, [])

  const update = (changes: Partial<BodyMetrics>) => {
    const updated: BodyMetrics = {
      ...metrics, ...changes,
      bmi: 0, bmiCategory: 'unknown', tdeeKcal: 0,
      bmrKcal: 0, dailyProteinGrams: 0, dailyCarbsGrams: 0, dailyFatGrams: 0,
    }
    if ('birthDate' in changes) updated.age = ageOn(updated.birthDate || null)
    onChange(updated)
    setPreviewError(null)
    setPreviewing(true)
    const sequence = ++requestSequence.current
    window.clearTimeout(timer.current)
    controller.current?.abort()
    controller.current = new AbortController()
    const signal = controller.current.signal
    timer.current = window.setTimeout(() => {
      void profileApi.previewMetrics(updated, signal).then(result => {
        if (sequence !== requestSequence.current || signal.aborted) return
        onChange({ ...updated, ...result })
        setPreviewing(false)
      }).catch(error => {
        if (sequence !== requestSequence.current || signal.aborted) return
        setPreviewError(error instanceof Error ? error.message : 'Không thể tải chỉ số ước tính.')
        setPreviewing(false)
      })
    }, 350)
  }

  return (
    <section className="ui-card p-5 sm:p-8 space-y-5" aria-labelledby="profile-body-title">
      <div>
        <h2 id="profile-body-title" className="ui-card-title">Chỉ số cơ thể &amp; mục tiêu</h2>
        <p className="mt-2 text-sm text-text-muted">Các thông tin này là tùy chọn. BMI và năng lượng ước tính được trả về từ hồ sơ, không phải chẩn đoán y khoa.</p>
      </div>
      <fieldset disabled={disabled} className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Ngày sinh" type="date" value={metrics.birthDate || ''}
          max={latestBirthDate}
          onChange={event => update({ birthDate: event.target.value || null })}
          helperText="Nhập ngày sinh thực tế; có thể để trống nếu chưa muốn khai báo."
        />
        <Select
          label="Giới tính dùng để ước tính năng lượng"
          value={metrics.gender}
          onChange={event => update({ gender: event.target.value as BodyMetrics['gender'] })}
          options={[{ value: '', label: 'Chưa khai báo' }, { value: 'male', label: 'Nam' }, { value: 'female', label: 'Nữ' }]}
        />
        <Input
          label="Chiều cao (cm)" type="number" min={0.01} max={300} step="0.01"
          value={metrics.heightCm || ''}
          onChange={event => update({ heightCm: Number(event.target.value) })}
          helperText="Để trống để xóa chiều cao đã lưu."
        />
        <Input
          label="Cân nặng (kg)" type="number" min={0.01} max={1000} step="0.01"
          value={metrics.weightKg || ''}
          onChange={event => update({ weightKg: Number(event.target.value) })}
          helperText="Để trống để xóa cân nặng đã lưu."
        />
        <Select
          label="Mức độ vận động" value={metrics.activityLevel}
          onChange={event => update({ activityLevel: event.target.value as BodyMetrics['activityLevel'] })}
          options={[
            { value: '', label: 'Chưa khai báo' },
            { value: 'sedentary', label: 'Ít vận động' },
            { value: 'light', label: 'Vận động nhẹ' },
            { value: 'moderate', label: 'Vận động vừa phải' },
            { value: 'active', label: 'Vận động nhiều' },
            { value: 'very_active', label: 'Vận động rất nhiều' },
          ]}
        />
        <Select
          label="Mục tiêu cân nặng" value={metrics.goal}
          onChange={event => update({ goal: event.target.value as BodyMetrics['goal'] })}
          options={[
            { value: '', label: 'Chưa khai báo' },
            { value: 'maintain', label: 'Duy trì cân nặng' },
            { value: 'weight_loss', label: 'Giảm cân' },
            { value: 'muscle_gain', label: 'Tăng cân' },
          ]}
        />
      </fieldset>
      {previewing && <p role="status" className="text-sm text-text-muted">Đang tải chỉ số ước tính...</p>}
      {previewError && <AlertError title="Chưa thể xem trước chỉ số" message={previewError} />}
      <dl className="grid sm:grid-cols-2 gap-4 rounded-xl bg-primary-light p-4" aria-label="Chỉ số tham khảo">
        <div><dt className="text-sm text-text-muted">BMI</dt><dd className="mt-1 text-xl font-bold">{metrics.bmi || '—'}</dd><dd className="text-sm">{BMI_LABELS[metrics.bmiCategory]}</dd></div>
        <div><dt className="text-sm text-text-muted">Năng lượng ước tính (TDEE)</dt><dd className="mt-1 text-xl font-bold">{metrics.tdeeKcal > 0 ? metrics.tdeeKcal.toLocaleString('vi-VN') + ' kcal/ngày' : 'Chưa đủ dữ liệu'}</dd></div>
      </dl>
      <p className="text-xs text-text-muted">Xem trước không lưu hồ sơ. Các chỉ số phụ thuộc dữ liệu đã khai báo; phân loại BMI người lớn chỉ có khi đủ điều kiện.</p>
    </section>
  )
}

export default BodyMetricsCalculator
