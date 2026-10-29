// Chức năng: danh mục nội dung. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import { useEffect, useState } from 'react'
import { Plus, Pencil, Lock, Unlock, Layers } from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import { Modal } from '../../../../shared/components/Modal'
import { CategoryModal } from '../components/CategoryModal'
import { adminCategoriesApi } from '../api/adminCategoriesApi'
import type { AdminCategoryItem } from '../types/adminCategories.types'

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (AdminCategoriesPage); thuộc danh mục nội dung.
export const AdminCategoriesPage = ({ onNavigate }: { onNavigate?: (path: string) => void }) => {
  // Lưu dữ liệu và trạng thái thao tác của danh mục nội dung trong vòng đời màn hình.
  const [items, setItems] = useState<AdminCategoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [editing, setEditing] = useState<AdminCategoryItem | null | undefined>(undefined)
  const [statusTarget, setStatusTarget] = useState<AdminCategoryItem | null>(null)
  const [busy, setBusy] = useState(false)
  // Đồng bộ dữ liệu theo thay đổi đầu vào; hủy hoặc bỏ qua kết quả cũ khi màn hình thay đổi.
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
    {
      key: 'isActive',
      header: 'Trạng thái',
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${
            item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {item.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng'}
        </span>
      ),
    },
    { key: 'createdAt', header: 'Ngày tạo', render: item => new Date(item.createdAt).toLocaleDateString('vi-VN') },
    {
      key: 'actions',
      header: 'Thao tác',
      render: item => (
        <div className="flex gap-2">
          <button
            className="fe1-control p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
            title="Chỉnh sửa"
            onClick={() => setEditing(item)}
          >
            <Pencil className="w-4 h-4" />
          </button>
          {item.isActive ? (
            <button
              className="fe1-control p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
              title="Đang mở (Bấm để khóa / ngừng sử dụng)"
              onClick={() => {
                setError(null)
                setStatusTarget(item)
              }}
            >
              <Unlock className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="fe1-control p-1.5 rounded-lg hover:bg-amber-50 text-amber-700 transition-colors"
              title="Đang khóa (Bấm để mở khóa / kích hoạt lại)"
              onClick={() => {
                setError(null)
                setStatusTarget(item)
              }}
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ]
  // Hiển thị giao diện danh mục nội dung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return <AdminLayout activeMenu="categories" pageTitle="Quản lý danh mục công thức" pageSubtitle="Tạo, chỉnh sửa và ngừng sử dụng danh mục theo dữ liệu thực tế." onNavigate={onNavigate}>
    <div className="space-y-5">
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
      <div className="admin-filter-bar flex flex-wrap items-center gap-4">
        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 text-sky-700"><Layers aria-hidden="true" className="h-4 w-4" /><span className="text-sm font-semibold">{total} danh mục</span></div>
        <input type="search" aria-label="Tìm danh mục" maxLength={120} placeholder="Tìm theo tên danh mục..." value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} className="admin-field min-w-0 flex-1 basis-60" />
        <button type="button" onClick={() => setEditing(null)} className="fe1-btn fe1-btn-primary inline-flex min-h-11 items-center justify-center gap-2"><Plus aria-hidden="true" className="h-4 w-4" />Thêm danh mục</button>
      </div>
      <SharedDataTable columns={columns} data={items} keyExtractor={item => item.id} isLoading={loading} error={error} onRetry={() => setRefresh(value => value + 1)} currentPage={page} totalPages={Math.max(1, Math.ceil(total / 10))} totalItems={total} pageSize={10} onPageChange={setPage} emptyMessage="Chưa có danh mục phù hợp." />
      {editing !== undefined && <CategoryModal key={editing?.id || 'create'} isOpen onClose={() => setEditing(undefined)} categoryToEdit={editing} onSubmit={async data => {
        if (editing) await adminCategoriesApi.update(editing.id, data)
        else await adminCategoriesApi.create(data)
        setNotice('Đã lưu danh mục.'); setRefresh(value => value + 1)
      }} />}
      <Modal
        isOpen={!!statusTarget}
        onClose={() => { if (!busy) setStatusTarget(null) }}
        title={statusTarget?.isActive ? 'Khóa / Ngừng sử dụng danh mục' : 'Mở khóa / Kích hoạt lại danh mục'}
      >
        <p className="text-sm mb-4 text-slate-600">
          {statusTarget?.isActive ? (
            <>Ngừng sử dụng <strong className="font-bold text-slate-900">“{statusTarget?.name}”</strong>? Công thức đã liên kết vẫn được giữ.</>
          ) : (
            <>Mở khóa và kích hoạt lại danh mục <strong className="font-bold text-slate-900">“{statusTarget?.name}”</strong> để sử dụng cho công thức?</>
          )}
        </p>
        {error && <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 mb-3">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setStatusTarget(null)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            disabled={busy}
            className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 ${
              statusTarget?.isActive
                ? 'bg-amber-700 hover:bg-amber-800'
                : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
            onClick={async () => {
              if (!statusTarget || busy) return
              setBusy(true); setError(null)
              try {
                if (statusTarget.isActive) {
                  await adminCategoriesApi.deactivate(statusTarget.id)
                  setItems(prev => prev.map(it => it.id === statusTarget.id ? { ...it, isActive: false } : it))
                  setNotice(`Đã ngừng sử dụng danh mục “${statusTarget.name}”.`)
                } else {
                  setItems(prev => prev.map(it => it.id === statusTarget.id ? { ...it, isActive: true } : it))
                  setNotice(`Đã mở khóa và kích hoạt lại danh mục “${statusTarget.name}”.`)
                }
                setStatusTarget(null)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Thao tác không thành công.')
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? 'Đang lưu...' : (statusTarget?.isActive ? 'Xác nhận khóa' : 'Xác nhận mở khóa')}
          </button>
        </div>
      </Modal>
    </div>
  </AdminLayout>
}
export default AdminCategoriesPage
