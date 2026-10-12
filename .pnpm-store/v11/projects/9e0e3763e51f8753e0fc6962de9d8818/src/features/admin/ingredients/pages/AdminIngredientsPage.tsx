import { useEffect, useState } from 'react'
import { Pencil, Plus, Power, Leaf } from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { Modal } from '../../../../shared/components/Modal'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import { adminIngredientsApi } from '../api/adminIngredientsApi'
import type { AdminIngredientItem, IngredientInput, IngredientOrigin } from '../types/adminIngredients.types'

const originLabels = { Unknown: 'Chưa xác định', Plant: 'Thực vật', Animal: 'Động vật' }
const emptyInput: IngredientInput = { name: '', aliases: null, origin: 'Unknown', containsEgg: false, containsMilk: false, containsHoney: false, containsOtherAnimalProducts: null, allergens: null, defaultUnit: null, caloriesPer100Gram: null, proteinGramPer100Gram: null, carbohydrateGramPer100Gram: null, fatGramPer100Gram: null, source: null }
const nutrients = [['caloriesPer100Gram', 'Năng lượng (kcal)'], ['proteinGramPer100Gram', 'Đạm (g)'], ['carbohydrateGramPer100Gram', 'Carbs (g)'], ['fatGramPer100Gram', 'Chất béo (g)']] as const
const textFields = [['aliases', 'Tên gọi khác', 1000], ['defaultUnit', 'Đơn vị mặc định', 40], ['allergens', 'Dị nguyên', 1000], ['source', 'Nguồn dữ liệu', 1000]] as const

export const AdminIngredientsPage = ({ onNavigate }: { onNavigate?: (path: string) => void }) => {
  const [items, setItems] = useState<AdminIngredientItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [editing, setEditing] = useState<AdminIngredientItem | null | undefined>(undefined)
  const [form, setForm] = useState<IngredientInput>(emptyInput)
  const [deactivating, setDeactivating] = useState<AdminIngredientItem | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setLoading(true); setError(null)
      adminIngredientsApi.list(page, search, controller.signal)
        .then(result => { if (!controller.signal.aborted) { setItems(result.items); setTotal(result.totalCount) } })
        .catch(err => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Không thể tải nguyên liệu.') })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, 200)
    return () => { clearTimeout(timer); controller.abort() }
  }, [page, search, refresh])
  const openForm = (item: AdminIngredientItem | null) => {
    setEditing(item); setFormError(null)
    if (!item) { setForm({ ...emptyInput }); return }
    const { id: _id, isActive: _active, createdAt: _created, updatedAt: _updated, ...input } = item
    setForm(input)
  }
  const columns: ColumnDef<AdminIngredientItem>[] = [
    { key: 'name', header: 'Nguyên liệu', render: item => <div><strong>{item.name}</strong><p className="text-xs text-slate-500">{item.aliases}</p></div> },
    { key: 'origin', header: 'Nguồn gốc', render: item => originLabels[item.origin] },
    { key: 'evidence', header: 'Thành phần', render: item => [item.containsEgg && 'Trứng', item.containsMilk && 'Sữa', item.containsHoney && 'Mật ong', item.containsOtherAnimalProducts === true && 'Động vật khác', item.containsOtherAnimalProducts === null && 'Động vật khác: chưa rõ'].filter(Boolean).join(', ') || 'Không ghi nhận cờ thành phần' },
    { key: 'allergens', header: 'Dị nguyên', render: item => item.allergens || 'Chưa khai báo' },
    { key: 'defaultUnit', header: 'Đơn vị', render: item => item.defaultUnit || '—' },
    { key: 'isActive', header: 'Trạng thái', render: item => item.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng' },
    { key: 'actions', header: 'Thao tác', render: item => <div className="flex gap-3"><button className="fe1-control" title="Chỉnh sửa" onClick={() => openForm(item)}><Pencil className="w-4 h-4 text-emerald-700" /></button>{item.isActive && <button className="fe1-control" title="Ngừng sử dụng" onClick={() => { setFormError(null); setDeactivating(item) }}><Power className="w-4 h-4 text-amber-700" /></button>}</div> },
  ]
  return <AdminLayout activeMenu="ingredients" pageTitle="Quản lý nguyên liệu" pageSubtitle="Nguồn gốc, bằng chứng thành phần, dị nguyên và dinh dưỡng từ dữ liệu thực tế." onNavigate={onNavigate}>
    <div className="space-y-5">
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
      <div className="flex flex-wrap items-center justify-between gap-4"><span className="flex items-center gap-2 font-bold"><Leaf className="w-5 h-5 text-emerald-700" />{total} nguyên liệu</span><button onClick={() => openForm(null)} className="fe1-btn fe1-btn-primary flex items-center gap-2 rounded-xl bg-[#184d28] px-4 py-3 text-sm font-bold text-white"><Plus className="w-4 h-4" />Thêm nguyên liệu</button></div>
      <input aria-label="Tìm nguyên liệu" maxLength={120} placeholder="Tìm tên hoặc tên gọi khác..." value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-3 text-sm" />
      <SharedDataTable columns={columns} data={items} keyExtractor={item => item.id} isLoading={loading} error={error} onRetry={() => setRefresh(value => value + 1)} currentPage={page} totalPages={Math.max(1, Math.ceil(total / 10))} totalItems={total} pageSize={10} onPageChange={setPage} emptyMessage="Chưa có nguyên liệu phù hợp." />
      <Modal isOpen={editing !== undefined} onClose={() => { if (!busy) setEditing(undefined) }} title={editing ? 'Chỉnh sửa nguyên liệu' : 'Thêm nguyên liệu'} maxWidth="2xl">
        <form className="space-y-4" onSubmit={async event => {
          event.preventDefault()
          if (busy || !form.name.trim()) return
          setBusy(true); setFormError(null)
          try {
            const input = { ...form, name: form.name.trim() }
            if (editing) await adminIngredientsApi.update(editing.id, input)
            else await adminIngredientsApi.create(input)
            setEditing(undefined); setNotice('Đã lưu nguyên liệu.'); setRefresh(value => value + 1)
          } catch (err) { setFormError(err instanceof Error ? err.message : 'Không thể lưu nguyên liệu.') }
          finally { setBusy(false) }
        }}>
          <fieldset disabled={busy} className="space-y-4">
            <label className="block text-sm">Tên nguyên liệu<input aria-label="Tên nguyên liệu" required maxLength={120} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
            <label className="block text-sm">Nguồn gốc<select aria-label="Nguồn gốc" value={form.origin} onChange={event => setForm({ ...form, origin: event.target.value as IngredientOrigin })} className="mt-1 w-full rounded-xl border p-3">{Object.entries(originLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <div className="flex flex-wrap gap-4">{([['containsEgg', 'Có trứng'], ['containsMilk', 'Có sữa'], ['containsHoney', 'Có mật ong']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form[key]} onChange={event => setForm({ ...form, [key]: event.target.checked })} />{label}</label>)}</div>
            <label className="block text-sm">Thành phần động vật khác (thịt, cá, gelatin...)<select aria-label="Thành phần động vật khác" value={form.containsOtherAnimalProducts === null ? 'unknown' : String(form.containsOtherAnimalProducts)} onChange={event => setForm({ ...form, containsOtherAnimalProducts: event.target.value === 'unknown' ? null : event.target.value === 'true' })} className="mt-1 w-full rounded-xl border p-3"><option value="unknown">Chưa xác minh</option><option value="false">Đã xác minh không có</option><option value="true">Có</option></select></label>
            <div className="grid sm:grid-cols-2 gap-4">{textFields.map(([key, label, maxLength]) => <label key={key} className="text-sm">{label}<input aria-label={label} maxLength={maxLength} value={form[key] || ''} onChange={event => setForm({ ...form, [key]: event.target.value || null })} className="mt-1 w-full rounded-xl border p-3" /></label>)}</div>
            <p className="text-xs text-slate-500">Dinh dưỡng trên 100g. Để trống nếu chưa biết. Thông tin dị nguyên được lưu riêng với phân loại chế độ ăn.</p>
            <div className="grid grid-cols-2 gap-4">{nutrients.map(([key, label]) => <label key={key} className="text-sm">{label}<input aria-label={label} type="number" min={0} max={999999999} step="0.001" value={form[key] ?? ''} onChange={event => setForm({ ...form, [key]: event.target.value === '' ? null : Number(event.target.value) })} className="mt-1 w-full rounded-xl border p-3" /></label>)}</div>
          </fieldset>
          {formError && <p role="alert" className="text-sm text-rose-700">{formError}</p>}
          <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => setEditing(undefined)} className="fe1-btn fe1-btn-outline rounded-xl border px-4 py-2 text-sm">Hủy</button><button type="submit" disabled={busy || !form.name.trim()} className="fe1-btn fe1-btn-primary rounded-xl bg-[#184d28] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Lưu nguyên liệu'}</button></div>
        </form>
      </Modal>
      <Modal isOpen={!!deactivating} onClose={() => { if (!busy) setDeactivating(null) }} title="Ngừng sử dụng nguyên liệu">
        <p className="text-sm mb-4">Ngừng sử dụng “{deactivating?.name}”? Dữ liệu trong công thức và kế hoạch đã lưu vẫn được giữ.</p>
        {formError && <p role="alert" className="mb-3 text-sm text-rose-700">{formError}</p>}
        <button disabled={busy} className="fe1-control rounded-xl bg-amber-700 px-4 py-2 text-sm text-white disabled:opacity-50" onClick={async () => {
          if (!deactivating || busy) return
          setBusy(true); setFormError(null)
          try { await adminIngredientsApi.deactivate(deactivating.id); setDeactivating(null); setNotice('Đã ngừng sử dụng nguyên liệu.'); setRefresh(value => value + 1) }
          catch (err) { setFormError(err instanceof Error ? err.message : 'Không thể ngừng sử dụng.') }
          finally { setBusy(false) }
        }}>{busy ? 'Đang lưu...' : 'Xác nhận ngừng sử dụng'}</button>
      </Modal>
    </div>
  </AdminLayout>
}
export default AdminIngredientsPage
