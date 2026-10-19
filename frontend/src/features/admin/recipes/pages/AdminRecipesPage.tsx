import { useState } from 'react'
import { Plus, Pencil, Lock, Unlock, Eye, BookOpen } from 'lucide-react'
import {
  SharedDataTable,
  type ColumnDef,
} from '../../../../shared/components/SharedDataTable'
import { Modal } from '../../../../shared/components/Modal'
import { Select } from '../../../../shared/components/Select'
import { AdminFrame, Feedback } from '../../components/ApiWorkspace'
import { useApiData } from '../../hooks/useApiData'
import {
  fieldClass,
  primaryClass,
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
  const total = result.data?.totalCount ?? 0
  const [editing, setEditing] = useState<RecipeDetail | null | undefined>()
  const [viewing, setViewing] = useState<RecipeDetail | null>(null)
  const [statusTarget, setStatusTarget] = useState<RecipeSummary | null>(null)
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
            title="Xem công thức"
            onClick={() => void open(item.id, false)}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="fe1-control p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
            disabled={busy}
            title="Sửa công thức"
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
      menu="recipes"
      title="Quản lý công thức món chay"
      subtitle="Quản lý thành phần, cách nấu và dinh dưỡng của kho công thức."
      onNavigate={onNavigate}
    >
      <Feedback error={error} notice={notice} />
      <div className="admin-filter-bar flex flex-wrap items-center gap-3">
        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-700">
          <BookOpen aria-hidden="true" className="h-4 w-4" />
          <span className="text-sm font-semibold">{total} công thức</span>
        </div>
        <input
          aria-label="Tìm công thức"
          className={`${fieldClass} flex-1 basis-60`}
          placeholder="Tên công thức hoặc nguyên liệu..."
          maxLength={120}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <div className="min-w-44 flex-1 basis-44">
          <Select
            aria-label="Lọc chế độ ăn"
            value={diet}
            onChange={(e) => {
              setDiet(e.target.value)
              setPage(1)
            }}
            options={[
              { value: '', label: 'Tất cả chế độ ăn' },
              ...Object.values(dietLabels).map((label, index) => ({
                value: String(index + 1),
                label,
              })),
            ]}
          />
        </div>
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
        className="admin-recipe-dialog"
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
        isOpen={!!statusTarget}
        onClose={() => {
          if (!busy) setStatusTarget(null)
        }}
        title={statusTarget?.isActive ? 'Khóa / Ngừng sử dụng công thức' : 'Mở khóa / Kích hoạt lại công thức'}
      >
        <p className="mb-4 text-sm text-slate-600">
          {statusTarget?.isActive ? (
            <>Ngừng sử dụng “<strong className="font-bold text-slate-900">{statusTarget?.name}</strong>”? Các kế hoạch đã lưu vẫn giữ dữ liệu cũ.</>
          ) : (
            <>Mở khóa và kích hoạt lại công thức “<strong className="font-bold text-slate-900">{statusTarget?.name}</strong>” để hiển thị và sử dụng bình thường?</>
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
                  await recipeApi.deactivate(statusTarget.id)
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
                  setNotice(`Đã ngừng sử dụng công thức “${statusTarget.name}”.`)
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
                  setNotice(`Đã mở khóa và kích hoạt lại công thức “${statusTarget.name}”.`)
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
export default AdminRecipesPage
