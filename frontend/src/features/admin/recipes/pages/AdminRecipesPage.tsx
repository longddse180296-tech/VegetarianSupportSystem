import { useState } from 'react'
import { Plus, Pencil, Power, Eye } from 'lucide-react'
import {
  SharedDataTable,
  type ColumnDef,
} from '../../../../shared/components/SharedDataTable'
import { Modal } from '../../../../shared/components/Modal'
import { AdminFrame, Feedback } from '../../components/ApiWorkspace'
import { useApiData } from '../../hooks/useApiData'
import {
  fieldClass,
  primaryClass,
  secondaryClass,
  errorMessage,
} from '../../utils/apiUi'
import {
  recipeApi,
  dietLabels,
  type RecipeSummary,
  type RecipeDetail,
} from '../api/recipeContract'
import { RecipeApiForm } from '../components/RecipeApiForm'

export const AdminRecipesPage = ({
  onNavigate,
}: {
  onNavigate?: (path: string) => void
}) => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [diet, setDiet] = useState('')
  const result = useApiData<{ items: RecipeSummary[]; totalCount: number }>(
    `/api/admin/recipes?pageNumber=${page}&pageSize=10&search=${encodeURIComponent(search)}${diet ? `&dietaryType=${diet}` : ''}`,
  )
  const [editing, setEditing] = useState<RecipeDetail | null | undefined>()
  const [viewing, setViewing] = useState<RecipeDetail | null>(null)
  const [deactivating, setDeactivating] = useState<RecipeSummary | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  async function open(id: string, edit: boolean) {
    setBusy(true)
    setError(null)
    try {
      const detail = await recipeApi.get(id)
      if (edit) setEditing(detail)
      else setViewing(detail)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }
  const columns: ColumnDef<RecipeSummary>[] = [
    {
      key: 'name',
      header: 'Công thức',
      render: (item) => (
        <div>
          <strong>{item.name}</strong>
          <p className="text-xs text-slate-500 mt-1">
            {item.dietaryAssessments
              .filter((item) => item.status === 'Compatible')
              .map((item) => dietLabels[item.dietaryType])
              .join(' · ') || 'Chưa đủ dữ liệu phân loại'}
          </p>
        </div>
      ),
    },
    { key: 'categoryName', header: 'Danh mục' },
    {
      key: 'time',
      header: 'Thời gian',
      render: (item) => `${item.prepTimeMinutes + item.cookTimeMinutes} phút`,
    },
    {
      key: 'caloriesPerServing',
      header: 'Kcal/khẩu phần',
      render: (item) => item.caloriesPerServing ?? 'Chưa biết',
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
            title="Xem công thức"
            onClick={() => void open(item.id, false)}
          >
            <Eye size={17} />
          </button>
          <button className="fe1-control"
            disabled={busy}
            title="Sửa công thức"
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
      menu="recipes"
      title="Quản lý công thức món chay"
      subtitle="Quản lý thành phần, cách nấu và dinh dưỡng của kho công thức."
      onNavigate={onNavigate}
    >
      <Feedback error={error} notice={notice} />
      <div className="flex flex-wrap justify-between gap-3">
        <input
          aria-label="Tìm công thức"
          className={`${fieldClass} max-w-md`}
          placeholder="Tên công thức hoặc nguyên liệu..."
          maxLength={120}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <select
          aria-label="Lọc chế độ ăn"
          className="rounded-xl border p-3 text-sm"
          value={diet}
          onChange={(e) => {
            setDiet(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Tất cả chế độ ăn</option>
          {Object.values(dietLabels).map((label, index) => (
            <option key={label} value={index + 1}>
              {label}
            </option>
          ))}
        </select>
        <button
          disabled={busy}
          className={primaryClass}
          onClick={() => setEditing(null)}
        >
          <Plus className="inline w-4 h-4 mr-2" />
          Thêm công thức
        </button>
      </div>
      <SharedDataTable
        title="Kho công thức"
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
        title={editing ? 'Sửa công thức' : 'Thêm công thức'}
        maxWidth="2xl"
      >
        {editing !== undefined && (
          <RecipeApiForm
            key={editing?.id || 'new'}
            recipe={editing || undefined}
            onCancel={() => setEditing(undefined)}
            onSaved={() => {
              setEditing(undefined)
              setNotice('Đã lưu công thức.')
              result.reload()
            }}
          />
        )}
      </Modal>
      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name}
        maxWidth="2xl"
      >
        {viewing && (
          <div className="space-y-4 text-sm">
            <p>{viewing.description}</p>
            <p>
              {viewing.categoryName} · {viewing.servings} khẩu phần ·{' '}
              {viewing.prepTimeMinutes + viewing.cookTimeMinutes} phút
            </p>
            <h4 className="font-bold">Nguyên liệu</h4>
            <ul className="space-y-2">
              {viewing.ingredients.map((item) => (
                <li key={item.ingredientId}>
                  {item.name}: {item.quantity} {item.unit}
                  {item.note && ` · ${item.note}`}
                </li>
              ))}
            </ul>
            <h4 className="font-bold">Hướng dẫn</h4>
            <p className="whitespace-pre-wrap">{viewing.instructions}</p>
            <h4 className="font-bold">Phân loại theo thành phần</h4>
            {viewing.dietaryAssessments.map((item) => (
              <p key={item.dietaryType}>
                {dietLabels[item.dietaryType]}:{' '}
                {item.status === 'Compatible'
                  ? 'Phù hợp'
                  : item.status === 'Incompatible'
                    ? 'Không phù hợp'
                    : 'Chưa đủ thông tin'}
              </p>
            ))}
          </div>
        )}
      </Modal>
      <Modal
        isOpen={!!deactivating}
        onClose={() => {
          if (!busy) setDeactivating(null)
        }}
        title="Ngừng sử dụng công thức"
      >
        <p className="mb-4 text-sm">
          Ngừng sử dụng “{deactivating?.name}”? Các kế hoạch đã lưu vẫn giữ dữ
          liệu cũ.
        </p>
        <Feedback error={error} />
        <div className="mt-4 flex gap-2">
          <button
            disabled={busy}
            className={secondaryClass}
            onClick={() => setDeactivating(null)}
          >
            Hủy
          </button>
          <button
            disabled={busy}
            className={primaryClass}
            onClick={async () => {
              if (!deactivating || busy) return
              setBusy(true)
              setError(null)
              try {
                await recipeApi.deactivate(deactivating.id)
                setDeactivating(null)
                setNotice('Đã ngừng sử dụng công thức.')
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
        </div>
      </Modal>
    </AdminFrame>
  )
}
export default AdminRecipesPage
