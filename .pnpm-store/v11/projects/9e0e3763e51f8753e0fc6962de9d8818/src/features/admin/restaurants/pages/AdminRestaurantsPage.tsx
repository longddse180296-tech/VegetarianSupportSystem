import { useState } from 'react'
import { Eye, Pencil, Plus, Power } from 'lucide-react'
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
  const [district, setDistrict] = useState('')
  const result = useApiData<{ items: RestaurantSummary[]; totalCount: number }>(
    `/api/admin/restaurants?pageNumber=${page}&pageSize=10&search=${encodeURIComponent(search)}&district=${encodeURIComponent(district)}`,
  )
  const [editing, setEditing] = useState<RestaurantDetail | null | undefined>()
  const [viewing, setViewing] = useState<RestaurantDetail | null>(null)
  const [deactivating, setDeactivating] = useState<RestaurantSummary | null>(
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
      render: (item) => (item.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng'),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (item) => (
        <div className="flex gap-3">
          <button className="fe1-control"
            disabled={busy}
            title="Xem nhà hàng"
            onClick={() => void open(item.id, false)}
          >
            <Eye size={17} />
          </button>
          <button className="fe1-control"
            disabled={busy}
            title="Sửa nhà hàng"
            onClick={() => void open(item.id, true)}
          >
            <Pencil size={17} />
          </button>
          {item.isActive && (
            <button className="fe1-control"
              disabled={busy}
              title="Ngừng sử dụng"
              onClick={() => setDeactivating(item)}
            >
              <Power size={17} />
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
      <div className="flex flex-wrap gap-3">
        <input
          aria-label="Tìm nhà hàng"
          maxLength={120}
          placeholder="Tên hoặc địa chỉ..."
          className={`${fieldClass} max-w-sm`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <input
          aria-label="Lọc khu vực"
          maxLength={120}
          placeholder="Quận / khu vực..."
          className={`${fieldClass} max-w-xs`}
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value)
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
              Công thức liên quan:{' '}
              {viewing.relatedRecipes.map((item) => item.name).join(', ') ||
                '—'}
            </p>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={!!deactivating}
        onClose={() => {
          if (!busy) setDeactivating(null)
        }}
        title="Ngừng sử dụng nhà hàng"
      >
        <p className="mb-4 text-sm">
          Ngừng hiển thị “{deactivating?.name}” trên danh sách công khai?
        </p>
        <Feedback error={error} />
        <button
          className={`fe1-control ${primaryClass} mt-4`}
          disabled={busy}
          onClick={async () => {
            if (!deactivating || busy) return
            setBusy(true)
            setError(null)
            try {
              await restaurantApi.deactivate(deactivating.id)
              setDeactivating(null)
              setNotice('Đã ngừng sử dụng nhà hàng.')
              result.reload()
            } catch (reason) {
              setError(errorMessage(reason))
            } finally {
              setBusy(false)
            }
          }}
        >
          Xác nhận
        </button>
      </Modal>
    </AdminFrame>
  )
}
export default AdminRestaurantsPage
