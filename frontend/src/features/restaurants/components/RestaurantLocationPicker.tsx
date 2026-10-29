// Chọn vị trí từng cấp; danh mục tham chiếu tải khi cần, không gửi vị trí người dùng sang dịch vụ bên ngoài.
import { useEffect, useId, useState } from 'react'

interface Area { id: string; name: string; latitude: number; longitude: number }
interface Province extends Area { wards: Area[] }
export interface RestaurantLocationSelection {
  provinceId: string
  wardId: string
  label: string
  latitude: number
  longitude: number
}

export function RestaurantLocationPicker({ value, onChange }: {
  value: RestaurantLocationSelection | null
  onChange: (value: RestaurantLocationSelection | null) => void
}) {
  const id = useId()
  const [provinces, setProvinces] = useState<Province[]>([])
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    void import('../data/vietnamLocations.json').then(data => {
      if (active) { setProvinces(data.default.provinces); setError(false) }
    }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [retry])
  const selected = provinces.find(province => province.id === value?.provinceId)
  const selectProvince = (province: Province | undefined) => {
    // Đổi tỉnh xóa phường/xã cũ ngay; không giữ tọa độ của khu vực trước.
    onChange(province ? { provinceId: province.id, wardId: '', label: province.name,
      latitude: province.latitude, longitude: province.longitude } : null)
  }
  const selectWard = (ward: Area | undefined) => {
    if (!selected) return
    if (!ward) { selectProvince(selected); return }
    onChange({ provinceId: selected.id, wardId: ward.id, label: `${ward.name}, ${selected.name}`,
      latitude: ward.latitude, longitude: ward.longitude })
  }
  if (error) return <div role="alert" className="text-sm text-amber-900">
    Chưa tải được danh sách khu vực. <button type="button" className="font-semibold underline" onClick={() => setRetry(current => current + 1)}>Thử lại</button>
  </div>
  return <div className="w-full space-y-2">
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="min-w-0">
        <label htmlFor={`${id}-province`} className="mb-1 block text-xs font-semibold text-amber-950">1. Tỉnh / Thành phố</label>
        <select id={`${id}-province`} value={value?.provinceId ?? ''} disabled={!provinces.length}
          onChange={event => selectProvince(provinces.find(province => province.id === event.target.value))}
          className="w-full min-w-0 rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-emerald-600 disabled:bg-slate-100">
          <option value="">{provinces.length ? 'Chọn tỉnh / thành phố' : 'Đang tải khu vực…'}</option>
          {provinces.map(province => <option key={province.id} value={province.id}>{province.name}</option>)}
        </select>
      </div>
      <div className="min-w-0">
        <label htmlFor={`${id}-ward`} className="mb-1 block text-xs font-semibold text-amber-950">2. Phường / Xã</label>
        <select id={`${id}-ward`} value={value?.wardId ?? ''} disabled={!selected}
          onChange={event => selectWard(selected?.wards.find(ward => ward.id === event.target.value))}
          className="w-full min-w-0 rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-emerald-600 disabled:bg-slate-100">
          <option value="">{selected ? 'Chọn phường / xã để tìm gần hơn' : 'Chọn tỉnh / thành phố trước'}</option>
          {selected?.wards.map(ward => <option key={ward.id} value={ward.id}>{ward.name}</option>)}
        </select>
      </div>
    </div>
    <p className="text-[11px] text-slate-500">Danh mục hiện hành. Dữ liệu khu vực: <a href="https://github.com/open-admin-data/vietnam-administrative-divisions" target="_blank" rel="noreferrer" className="underline">Open Admin Data</a> · CC BY 4.0.</p>
  </div>
}
