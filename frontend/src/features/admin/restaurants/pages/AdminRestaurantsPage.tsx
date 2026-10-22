import { useState } from 'react'
import { Eye, Pencil, Plus, Lock, Unlock, MapPin } from 'lucide-react'
import {
  SharedDataTable,
  type ColumnDef,
} from '../../../../shared/components/SharedDataTable'
import { Modal } from '../../../../shared/components/Modal'
import { AdminFrame, Feedback } from '../../components/ApiWorkspace'
import { useApiData } from '../../hooks/useApiData'
import {
  primaryClass,
  fieldClass,
  errorMessage,
  formatDate,
} from '../../utils/apiUi'
import { dietLabels } from '../../recipes/api/recipeContract'
import {
  restaurantApi,
  type RestaurantDetail,
  type RestaurantSummary,
} from '../api/restaurantContract'
import { RestaurantApiForm } from '../components/RestaurantApiForm'
export const AdminRestaurantsPage = ({
  onNavigate,
}: {
  onNavigate?: (path: string) => void
}) => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const result = useApiData<{ items: RestaurantSummary[]; totalCount: number }>(
    `/api/admin/restaurants?pageNumber=${page}&pageSize=10&search=${encodeURIComponent(search)}`,
  )
  const total = result.data?.totalCount ?? 0
  const [editing, setEditing] = useState<RestaurantDetail | null | undefined>()
  const [viewing, setViewing] = useState<RestaurantDetail | null>(null)
  const [statusTarget, setStatusTarget] = useState<RestaurantSummary | null>(
    null,
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  async function open(id: string, edit: boolean) {
    setBusy(true)
    setError(null)
    try {
      const detail = await restaurantApi.get(id)
      if (edit) setEditing(detail)
      else setViewing(detail)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }
  const columns: ColumnDef<RestaurantSummary>[] = [
    {
      key: 'name',
      header: 'Nhà hàng',
      render: (item) => (
        <div>
          <strong>{item.name}</strong>
          <p className="text-xs text-slate-500">{item.address}</p>
        </div>
      ),
    },
    {
      key: 'district',
      header: 'Khu vực',
      render: (item) => item.district || '—',
    },
    {
      key: 'diet',
      header: 'Chế độ ăn khai báo',
      render: (item) =>
        item.dietaryTypes.map((diet) => dietLabels[diet]).join(' · '),
    },
    {
      key: 'price',
      header: 'Giá tham khảo',
      render: (item) =>
        `${item.priceFromVnd?.toLocaleString('vi-VN') ?? '—'} – ${item.priceToVnd?.toLocaleString('vi-VN') ?? '—'} VND`,
    },
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
    {
      key: 'actions',
      header: 'Thao tác',
      render: (item) => (
        <div className="flex gap-2">
          <button
            className="fe1-control p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            disabled={busy}
            title="Xem nhà hàng"
            onClick={() => void open(item.id, false)}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="fe1-control p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
            disabled={busy}
            title="Sửa nhà hàng"
            onClick={() => void open(item.id, true)}
          >
            <Pencil className="w-4 h-4" />
          </button>
          {item.isActive ? (
            <button
              className="fe1-control p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
              disabled={busy}
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
              disabled={busy}
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
  return (
    <AdminFrame
      menu="restaurants"
      title="Quản lý nhà hàng chay"
      subtitle="Cập nhật địa chỉ, liên hệ, chế độ ăn khai báo và nguồn thông tin."
      onNavigate={onNavigate}
    >
      <Feedback error={error} notice={notice} />
      <div className="admin-filter-bar flex flex-wrap items-center gap-3">
        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
          <MapPin aria-hidden="true" className="h-4 w-4" />
          <span className="text-sm font-semibold">{total} nhà hàng</span>
        </div>
        <input
          aria-label="Tìm nhà hàng"
          maxLength={120}
          placeholder="Tên hoặc địa chỉ..."
          className={`${fieldClass} flex-1 basis-60`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <button
          disabled={busy}
          className={primaryClass}
          onClick={() => setEditing(null)}
        >
          <Plus className="inline w-4 h-4 mr-2" />
          Thêm nhà hàng
        </button>
      </div>
      <SharedDataTable
        columns={columns}
        data={result.data?.items || []}
        keyExtractor={(item) => item.id}
        isLoading={result.loading}
        error={result.error}
        onRetry={result.reload}
        currentPage={page}
        totalPages={Math.max(1, Math.ceil((result.data?.totalCount || 0) / 10))}
        totalItems={result.data?.totalCount || 0}
        pageSize={10}
        onPageChange={setPage}
      />
      <Modal
        isOpen={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? 'Sửa nhà hàng' : 'Thêm nhà hàng'}
        maxWidth="2xl"
      >
        {editing !== undefined && (
          <RestaurantApiForm
            key={editing?.id || 'new'}
            restaurant={editing || undefined}
            onCancel={() => setEditing(undefined)}
            onSaved={() => {
              setEditing(undefined)
              setNotice('Đã lưu nhà hàng.')
              result.reload()
            }}
          />
        )}
      </Modal>
      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name}
        maxWidth="xl"
      >
        {viewing && (
          <div className="space-y-3 text-sm">
            <p>{viewing.description}</p>
            <p>{viewing.address}</p>
            <p>Điện thoại: {viewing.contactPhone || '—'}</p>
            <p>Giờ mở cửa: {viewing.openingHours || '—'}</p>
            {viewing.websiteUrl && (
              <a
                className="text-emerald-800 underline"
                href={viewing.websiteUrl}
                target="_blank"
                rel="noreferrer"
              >
                Website nhà hàng
              </a>
            )}
            <p>Tiện ích: {viewing.amenities.join(', ') || '—'}</p>
            <p>Nguồn: {viewing.source || 'Chưa cung cấp'}</p>
            <p>Cập nhật dữ liệu: {formatDate(viewing.dataUpdatedAt)}</p>
            <p>
              Tọa độ: {viewing.latitude ?? '—'}, {viewing.longitude ?? '—'}
            </p>
            <p>
              Món ăn nổi bật:{' '}
              {viewing.featuredDishes.map((item) => item.name).join(', ') ||
                '—'}
            </p>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={!!statusTarget}
        onClose={() => {
          if (!busy) setStatusTarget(null)
        }}
        title={statusTarget?.isActive ? 'Khóa / Ngừng sử dụng nhà hàng' : 'Mở khóa / Kích hoạt lại nhà hàng'}
      >
        <p className="mb-4 text-sm text-slate-600">
          {statusTarget?.isActive ? (
            <>Ngừng hiển thị “<strong className="font-bold text-slate-900">{statusTarget?.name}</strong>” trên danh sách công khai?</>
          ) : (
            <>Mở khóa và kích hoạt lại nhà hàng “<strong className="font-bold text-slate-900">{statusTarget?.name}</strong>” trên danh sách công khai?</>
          )}
        </p>
        <Feedback error={error} />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            onClick={() => setStatusTarget(null)}
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
              setBusy(true)
              setError(null)
              try {
                if (statusTarget.isActive) {
                  await restaurantApi.deactivate(statusTarget.id)
                  result.setData((prev) =>
                    prev
                      ? {
                          ...prev,
                          items: prev.items.map((it) =>
                            it.id === statusTarget.id ? { ...it, isActive: false } : it,
                          ),
                        }
                      : prev,
                  )
                  setNotice(`Đã ngừng sử dụng nhà hàng “${statusTarget.name}”.`)
                } else {
                  result.setData((prev) =>
                    prev
                      ? {
                          ...prev,
                          items: prev.items.map((it) =>
                            it.id === statusTarget.id ? { ...it, isActive: true } : it,
                          ),
                        }
                      : prev,
                  )
                  setNotice(`Đã mở khóa và kích hoạt lại nhà hàng “${statusTarget.name}”.`)
                }
                setStatusTarget(null)
              } catch (reason) {
                setError(errorMessage(reason))
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? 'Đang lưu...' : (statusTarget?.isActive ? 'Xác nhận khóa' : 'Xác nhận mở khóa')}
          </button>
        </div>
      </Modal>
    </AdminFrame>
  )
}
export default AdminRestaurantsPage
