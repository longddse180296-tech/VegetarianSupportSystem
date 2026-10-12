import { useEffect, useState } from 'react'
import { Plus, Pencil, Power, Layers } from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import { Modal } from '../../../../shared/components/Modal'
import { CategoryModal } from '../components/CategoryModal'
import { adminCategoriesApi } from '../api/adminCategoriesApi'
import type { AdminCategoryItem } from '../types/adminCategories.types'

export const AdminCategoriesPage = ({ onNavigate }: { onNavigate?: (path: string) => void }) => {
  const [items, setItems] = useState<AdminCategoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [editing, setEditing] = useState<AdminCategoryItem | null | undefined>(undefined)
  const [deactivating, setDeactivating] = useState<AdminCategoryItem | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setLoading(true); setError(null)
      adminCategoriesApi.list(page, search, controller.signal)
        .then(result => { if (!controller.signal.aborted) { setItems(result.items); setTotal(result.totalCount) } })
        .catch(err => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Không thể tải danh mục.') })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, 200)
    return () => { clearTimeout(timer); controller.abort() }
  }, [page, search, refresh])
  const columns: ColumnDef<AdminCategoryItem>[] = [
    { key: 'name', header: 'Tên danh mục', render: item => <span className="font-bold">{item.name}</span> },
    { key: 'description', header: 'Mô tả', render: item => item.description || '—' },
    { key: 'isActive', header: 'Trạng thái', render: item => <span className={`rounded-full px-3 py-1 text-xs ${item.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>{item.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng'}</span> },
    { key: 'createdAt', header: 'Ngày tạo', render: item => new Date(item.createdAt).toLocaleDateString('vi-VN') },
    { key: 'actions', header: 'Thao tác', render: item => <div className="flex gap-3"><button className="fe1-control" title="Chỉnh sửa" onClick={() => setEditing(item)}><Pencil className="w-4 h-4 text-emerald-700" /></button>{item.isActive && <button className="fe1-control" title="Ngừng sử dụng" onClick={() => setDeactivating(item)}><Power className="w-4 h-4 text-amber-700" /></button>}</div> },
  ]
  return <AdminLayout activeMenu="categories" pageTitle="Quản lý danh mục công thức" pageSubtitle="Tạo, chỉnh sửa và ngừng sử dụng danh mục theo dữ liệu thực tế." onNavigate={onNavigate}>
    <div className="space-y-5">
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
      <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-2"><Layers className="w-5 h-5 text-emerald-700" /><span className="font-bold">{total} danh mục</span></div><button onClick={() => setEditing(null)} className="fe1-btn fe1-btn-primary flex items-center gap-2 rounded-xl bg-[#184d28] px-4 py-3 text-sm font-bold text-white"><Plus className="w-4 h-4" />Thêm danh mục</button></div>
      <input aria-label="Tìm danh mục" maxLength={120} placeholder="Tìm theo tên danh mục..." value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-3 text-sm" />
      <SharedDataTable columns={columns} data={items} keyExtractor={item => item.id} isLoading={loading} error={error} onRetry={() => setRefresh(value => value + 1)} currentPage={page} totalPages={Math.max(1, Math.ceil(total / 10))} totalItems={total} pageSize={10} onPageChange={setPage} emptyMessage="Chưa có danh mục phù hợp." />
      {editing !== undefined && <CategoryModal key={editing?.id || 'create'} isOpen onClose={() => setEditing(undefined)} categoryToEdit={editing} onSubmit={async data => {
        if (editing) await adminCategoriesApi.update(editing.id, data)
        else await adminCategoriesApi.create(data)
        setNotice('Đã lưu danh mục.'); setRefresh(value => value + 1)
      }} />}
      <Modal isOpen={!!deactivating} onClose={() => { if (!busy) setDeactivating(null) }} title="Ngừng sử dụng danh mục">
        <p className="text-sm mb-4">Ngừng sử dụng “{deactivating?.name}”? Công thức đã liên kết vẫn được giữ.</p>
        {error && <p role="alert" className="text-sm text-rose-700 mb-3">{error}</p>}
        <button disabled={busy} className="fe1-control rounded-xl bg-amber-700 px-4 py-2 text-sm text-white disabled:opacity-50" onClick={async () => {
          if (!deactivating || busy) return
          setBusy(true); setError(null)
          try { await adminCategoriesApi.deactivate(deactivating.id); setDeactivating(null); setNotice('Đã ngừng sử dụng danh mục.'); setRefresh(value => value + 1) }
          catch (err) { setError(err instanceof Error ? err.message : 'Không thể ngừng sử dụng.') }
          finally { setBusy(false) }
        }}>{busy ? 'Đang lưu...' : 'Xác nhận ngừng sử dụng'}</button>
      </Modal>
    </div>
  </AdminLayout>
}
export default AdminCategoriesPage
