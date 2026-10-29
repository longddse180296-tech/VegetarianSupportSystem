// Chức năng: danh mục nguyên liệu và dữ liệu dinh dưỡng. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import { useEffect, useState } from 'react'
import { Pencil, Plus, Lock, Unlock, Leaf, Flame, Eye } from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { Modal } from '../../../../shared/components/Modal'
import { CustomSelect } from '../../../../shared/components/CustomSelect'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import { adminIngredientsApi } from '../api/adminIngredientsApi'
import type { AdminIngredientItem, IngredientInput, IngredientOrigin } from '../types/adminIngredients.types'
import { ingredientUnits, normalizeIngredientUnit } from '../../utils/ingredientUnits'

const originLabels: Record<IngredientOrigin, string> = {
  Unknown: 'Chưa xác định',
  Plant: 'Thực vật',
  Animal: 'Động vật',
}

const emptyInput: IngredientInput = {
  name: '',
  aliases: null,
  origin: 'Unknown',
  containsEgg: false,
  containsMilk: false,
  containsHoney: false,
  containsOtherAnimalProducts: null,
  allergens: null,
  defaultUnit: null,
  calories: null,
  proteinGram: null,
  carbohydrateGram: null,
  fatGram: null,
  source: null,
}

const nutrients = [
  { key: 'calories', label: 'Năng lượng', unit: 'kcal' },
  { key: 'proteinGram', label: 'Chất đạm', unit: 'g' },
  { key: 'carbohydrateGram', label: 'Tinh bột', unit: 'g' },
  { key: 'fatGram', label: 'Chất béo', unit: 'g' },
] as const

// Tính hoặc tổng hợp chỉ số từ dữ liệu đầu vào của tính năng (nutritionBasis); thuộc danh mục nguyên liệu và dữ liệu dinh dưỡng.
function nutritionBasis(unit: string | null) {
  return { quantity: unit === 'g' || unit === 'ml' ? 100 : 1, unit: unit || '' }
}

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (basisLabel); thuộc danh mục nguyên liệu và dữ liệu dinh dưỡng.
function basisLabel(quantity: number, unit: string) {
  return `${quantity} ${unit === 'đơn vị' ? 'đơn vị (Số lượng)' : unit}`
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (AdminIngredientsPage); thuộc danh mục nguyên liệu và dữ liệu dinh dưỡng.
export const AdminIngredientsPage = ({ onNavigate }: { onNavigate?: (path: string) => void }) => {
  // Lưu dữ liệu và trạng thái thao tác của danh mục nguyên liệu và dữ liệu dinh dưỡng trong vòng đời màn hình.
  const [items, setItems] = useState<AdminIngredientItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [editing, setEditing] = useState<AdminIngredientItem | null | undefined>(() =>
    new URLSearchParams(window.location.search).get('create') === '1' ? null : undefined)
  const [form, setForm] = useState<IngredientInput>(() => ({
    ...emptyInput,
    name: new URLSearchParams(window.location.search).get('create') === '1'
      ? (new URLSearchParams(window.location.search).get('name') || '').slice(0, 120) : '',
  }))
  const [statusTarget, setStatusTarget] = useState<AdminIngredientItem | null>(null)
  const [viewingNutrition, setViewingNutrition] = useState<AdminIngredientItem | null>(null)
  const [busy, setBusy] = useState(false)

  // Đồng bộ dữ liệu theo thay đổi đầu vào; hủy hoặc bỏ qua kết quả cũ khi màn hình thay đổi.
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setLoading(true)
      setError(null)
      adminIngredientsApi
        .list(page, search, controller.signal)
        .then(result => {
          if (!controller.signal.aborted) {
            setItems(result.items)
            setTotal(result.totalCount)
          }
        })
        .catch(err => {
          if (!controller.signal.aborted) {
            setError(err instanceof Error ? err.message : 'Không thể tải nguyên liệu.')
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [page, search, refresh])

  // Xử lý lựa chọn hoặc chuyển trạng thái giao diện theo thao tác người dùng (openForm); thuộc danh mục nguyên liệu và dữ liệu dinh dưỡng.
  const openForm = (item: AdminIngredientItem | null) => {
    setEditing(item)
    setFormError(null)
    if (!item) {
      setForm({ ...emptyInput })
      return
    }
    const { id: _id, isActive: _active, createdAt: _created, updatedAt: _updated,
      nutritionBasisQuantity: _basisQuantity, nutritionBasisUnit: _basisUnit, ...input } = item
    const unit = normalizeIngredientUnit(input.defaultUnit)
    const basis = nutritionBasis(unit)
    const hasMatchingBasis = item.nutritionBasisQuantity === basis.quantity && item.nutritionBasisUnit === basis.unit
    setForm({
      ...input,
      defaultUnit: unit,
      ...(!hasMatchingBasis ? { calories: null, proteinGram: null, carbohydrateGram: null, fatGram: null } : {}),
    })
    if (!hasMatchingBasis) setFormError(`Dữ liệu hiện có tính trên ${basisLabel(item.nutritionBasisQuantity, item.nutritionBasisUnit)}. Vui lòng nhập lại dinh dưỡng theo ${basisLabel(basis.quantity, basis.unit)} hoặc chọn đơn vị tương ứng với dữ liệu cũ.`)
  }

  const columns: ColumnDef<AdminIngredientItem>[] = [
    {
      key: 'name',
      header: 'Nguyên liệu',
      render: item => (
        <div>
          <strong className="text-slate-800">{item.name}</strong>
          {item.aliases && <p className="text-xs text-slate-500 mt-0.5">{item.aliases}</p>}
        </div>
      ),
    },
    {
      key: 'origin',
      header: 'Nguồn gốc',
      render: item => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            item.origin === 'Plant'
              ? 'bg-emerald-50 text-emerald-700'
              : item.origin === 'Animal'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {originLabels[item.origin]}
        </span>
      ),
    },
    {
      key: 'evidence',
      header: 'Thành phần',
      render: item =>
        [
          item.containsEgg && 'Trứng',
          item.containsMilk && 'Sữa',
          item.containsOtherAnimalProducts === true && 'Động vật khác',
          item.containsOtherAnimalProducts === null && 'Động vật khác: chưa rõ',
        ]
          .filter(Boolean)
          .join(', ') || 'Thuần thực vật',
    },
    {
      key: 'defaultUnit',
      header: 'Đơn vị',
      render: item => (
        <span className="font-semibold text-slate-700">
          {item.defaultUnit || 'g'}
        </span>
      ),
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
      render: item => (
        <div className="flex gap-2">
          <button
            type="button"
            className="fe1-control p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
            title="Xem chi tiết dinh dưỡng"
            aria-label={`Xem dinh dưỡng của ${item.name}`}
            onClick={() => setViewingNutrition(item)}
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            className="fe1-control p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
            title="Chỉnh sửa"
            onClick={() => openForm(item)}
          >
            <Pencil className="w-4 h-4" />
          </button>
          {item.isActive ? (
            <button
              className="fe1-control p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
              title="Đang mở (Bấm để khóa / ngừng sử dụng)"
              onClick={() => {
                setFormError(null)
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
                setFormError(null)
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

  // Hiển thị giao diện danh mục nguyên liệu và dữ liệu dinh dưỡng từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <AdminLayout
      activeMenu="ingredients"
      pageTitle="Quản lý nguyên liệu"
      pageSubtitle="Nguồn gốc, bằng chứng thành phần, đơn vị đo lường và dinh dưỡng chuẩn xác."
      onNavigate={onNavigate}
    >
      <div className="space-y-5">
        {notice && (
          <p role="status" className="rounded-xl bg-emerald-50 border border-emerald-200/80 p-4 text-sm font-medium text-emerald-800">
            {notice}
          </p>
        )}
        <div className="admin-filter-bar flex flex-wrap items-center gap-4">
          <span className="flex shrink-0 items-center gap-2 rounded-lg bg-lime-50 px-3 py-2 text-sm font-semibold text-lime-700">
            <Leaf aria-hidden="true" className="h-4 w-4" />
            {total} nguyên liệu
          </span>
          <input
            type="search"
            aria-label="Tìm nguyên liệu"
            maxLength={120}
            placeholder="Tìm tên hoặc tên gọi khác..."
            value={search}
            onChange={event => {
              setSearch(event.target.value)
              setPage(1)
            }}
            className="admin-field min-w-0 flex-1 basis-60"
          />
          <button
            type="button"
            onClick={() => openForm(null)}
            className="fe1-btn fe1-btn-primary inline-flex min-h-11 items-center justify-center gap-2 font-bold px-4 rounded-xl"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Thêm nguyên liệu
          </button>
        </div>

        <SharedDataTable
          columns={columns}
          data={items}
          keyExtractor={item => item.id}
          isLoading={loading}
          error={error}
          onRetry={() => setRefresh(value => value + 1)}
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(total / 10))}
          totalItems={total}
          pageSize={10}
          onPageChange={setPage}
          emptyMessage="Chưa có nguyên liệu phù hợp."
        />

        <Modal
          isOpen={viewingNutrition !== null}
          onClose={() => setViewingNutrition(null)}
          title={viewingNutrition ? `Dinh dưỡng — ${viewingNutrition.name}` : 'Chi tiết dinh dưỡng'}
          description={viewingNutrition ? `Giá trị dinh dưỡng trên ${basisLabel(viewingNutrition.nutritionBasisQuantity, viewingNutrition.nutritionBasisUnit)} nguyên liệu.` : undefined}
          maxWidth="2xl"
        >
          {viewingNutrition && (
            <div className="space-y-5">
              {viewingNutrition.aliases && (
                <p className="break-words text-sm text-slate-600">Tên gọi khác: {viewingNutrition.aliases}</p>
              )}
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {nutrients.map(nutrient => {
                  const value = viewingNutrition[nutrient.key]
                  // Hiển thị giao diện danh mục nguyên liệu và dữ liệu dinh dưỡng từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
                  return (
                    <div key={nutrient.key} className="min-w-0 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                      <dt className="text-xs font-medium text-slate-600">{nutrient.label}</dt>
                      <dd className="mt-2 break-words text-lg font-bold text-emerald-800">
                        {value == null ? (
                          <span className="text-sm font-medium text-slate-500">Chưa có dữ liệu</span>
                        ) : (
                          <>{new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(value)}{' '}
                            <span className="text-xs font-medium">{nutrient.unit}</span></>
                        )}
                      </dd>
                    </div>
                  )
                })}
              </dl>
              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" className="fe1-btn fe1-btn-outline min-h-11 rounded-xl px-4 py-2 text-sm font-semibold"
                  onClick={() => setViewingNutrition(null)}>Đóng</button>
                <button type="button" className="fe1-btn fe1-btn-primary min-h-11 rounded-xl px-4 py-2 text-sm font-semibold"
                  onClick={() => { setViewingNutrition(null); openForm(viewingNutrition) }}>Chỉnh sửa nguyên liệu</button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal Thêm / Chỉnh sửa nguyên liệu */}
        <Modal
          isOpen={editing !== undefined}
          onClose={() => {
            if (!busy) setEditing(undefined)
          }}
          title={editing ? 'Chỉnh sửa nguyên liệu' : 'Thêm nguyên liệu mới'}
          description="Khai báo thông tin nguồn gốc, thuộc tính và dinh dưỡng chuẩn xác."
          maxWidth="2xl"
        >
          <form
            className="space-y-5"
            onSubmit={async event => {
              event.preventDefault()
              if (busy) return
              const name = form.name.trim()
              if (!name) {
                setFormError('Vui lòng nhập tên nguyên liệu.')
                return
              }
              const normUnit = form.defaultUnit?.trim().toLowerCase()
              if (!normUnit || !ingredientUnits.some(unit => unit.value === normUnit)) {
                setFormError('Vui lòng chọn đơn vị g, kg, ml hoặc Số lượng.')
                return
              }
              if (nutrients.some(nutrient => form[nutrient.key] == null || !Number.isFinite(form[nutrient.key]) || form[nutrient.key]! < 0)) {
                setFormError('Vui lòng nhập đầy đủ năng lượng, chất đạm, tinh bột và chất béo. Nhập 0 nếu giá trị đã xác định bằng 0.')
                return
              }

              setBusy(true)
              setFormError(null)
              try {
                const input: IngredientInput = {
                  ...form,
                  name,
                  defaultUnit: normUnit,
                  aliases: form.aliases?.trim() || null,
                  source: form.source?.trim() || null,
                  containsHoney: false, // Ẩn mật ong theo 4 loại ăn chay (Vegan, Lacto, Ovo, Lacto-Ovo)
                  allergens: form.allergens || null, // Ẩn trường nhập trên UI
                }
                if (editing) await adminIngredientsApi.update(editing.id, input)
                else await adminIngredientsApi.create(input)
                setEditing(undefined)
                setNotice(editing ? 'Đã cập nhật nguyên liệu thành công.' : 'Đã thêm nguyên liệu mới thành công.')
                setRefresh(value => value + 1)
              } catch (err) {
                setFormError(err instanceof Error ? err.message : 'Không thể lưu nguyên liệu.')
              } finally {
                setBusy(false)
              }
            }}
          >
            <fieldset disabled={busy} className="space-y-4">
              {formError && (
                <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
                  {formError}
                </div>
              )}

              {/* Block 1: Thông tin chung */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-xs">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Tên nguyên liệu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    aria-label="Tên nguyên liệu"
                    required
                    maxLength={120}
                    placeholder="VD: Đậu hũ non, Nấm đùi gà, Bột yến mạch..."
                    value={form.name}
                    onChange={event => setForm({ ...form, name: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Tên gọi khác (Aliases)
                    </label>
                    <input
                      aria-label="Tên gọi khác"
                      maxLength={1000}
                      placeholder="VD: tofu; đậu phụ; tàu hũ..."
                      value={form.aliases || ''}
                      onChange={event => setForm({ ...form, aliases: event.target.value || null })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  <CustomSelect
                    label="Đơn vị thường dùng"
                    required
                    placeholder="Chọn đơn vị"
                    value={form.defaultUnit}
                    onChange={val => {
                      if (val === form.defaultUnit) return
                      const hadNutrition = nutrients.some(nutrient => form[nutrient.key] != null)
                      setForm({ ...form, defaultUnit: val, calories: null, proteinGram: null, carbohydrateGram: null, fatGram: null })
                      setFormError(hadNutrition ? 'Đã đổi đơn vị. Vui lòng nhập lại dinh dưỡng theo mốc mới.' : null)
                    }}
                    options={ingredientUnits}
                  />
                </div>

              </div>

              {/* Block 2: Nguồn gốc & Cờ thành phần */}
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  Nguồn gốc & Thuộc tính phân loại
                </h4>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  <CustomSelect
                    label="Nguồn gốc nguyên liệu"
                    value={form.origin}
                    onChange={val => setForm({ ...form, origin: val as IngredientOrigin })}
                    options={[
                      { value: 'Plant', label: 'Thực vật', subLabel: 'Có nguồn gốc thực vật' },
                      { value: 'Animal', label: 'Động vật', subLabel: 'Có nguồn gốc động vật' },
                      { value: 'Unknown', label: 'Chưa xác định', subLabel: 'Cần xác minh thêm' },
                    ]}
                  />

                  <CustomSelect
                    label="Động vật khác (thịt, cá...)"
                    value={form.containsOtherAnimalProducts === null ? 'unknown' : String(form.containsOtherAnimalProducts)}
                    onChange={val =>
                      setForm({
                        ...form,
                        containsOtherAnimalProducts: val === 'unknown' ? null : val === 'true',
                      })
                    }
                    options={[
                      { value: 'unknown', label: 'Chưa xác minh', subLabel: 'Chưa rõ thông tin' },
                      { value: 'false', label: 'Đã xác minh không có', subLabel: 'Không chứa thịt, cá...' },
                      { value: 'true', label: 'Có thành phần động vật', subLabel: 'Chứa thịt, cá hoặc dẫn xuất' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Cờ thành phần nhận biết (theo 4 loại ăn chay):
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'containsEgg', label: 'Có trứng', icon: '🥚' },
                      { key: 'containsMilk', label: 'Có sữa', icon: '🥛' },
                    ].map(c => {
                      const checked = Boolean(form[c.key as keyof IngredientInput])
                      // Hiển thị giao diện danh mục nguyên liệu và dữ liệu dinh dưỡng từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
                      return (
                        <button
                          type="button"
                          key={c.key}
                          onClick={() => setForm({ ...form, [c.key]: !checked })}
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            checked
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100/70'
                          }`}
                        >
                          <span className="text-base leading-none">{c.icon}</span>
                          <span>{c.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Block 3: Dinh dưỡng trên 100g */}
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    Dinh dưỡng {form.defaultUnit ? `(trên ${basisLabel(nutritionBasis(form.defaultUnit).quantity, form.defaultUnit)})` : ''} <span className="text-rose-500">*</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {form.defaultUnit ? 'Bắt buộc nhập đủ 4 chỉ số' : 'Chọn đơn vị trước'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {nutrients.map(n => (
                    <div
                      key={n.key}
                      className="bg-white rounded-xl border border-slate-200/90 p-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
                    >
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1 truncate">
                        {n.label}
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          required
                          disabled={!form.defaultUnit}
                          aria-label={n.label}
                          min={0}
                          max={999999999}
                          step="0.001"
                          placeholder="0"
                          value={form[n.key] ?? ''}
                          onChange={event =>
                            setForm({
                              ...form,
                              [n.key]: event.target.value === '' ? null : Number(event.target.value),
                            })
                          }
                          className="w-full text-sm font-bold text-slate-800 bg-transparent focus:outline-none"
                        />
                        <span className="text-xs font-medium text-slate-400 select-none">
                          {n.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </fieldset>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(undefined)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busy || !form.name.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {busy ? 'Đang lưu...' : editing ? 'Cập nhật nguyên liệu' : 'Lưu nguyên liệu'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Khóa / Mở khóa nguyên liệu */}
        <Modal
          isOpen={!!statusTarget}
          onClose={() => {
            if (!busy) setStatusTarget(null)
          }}
          title={statusTarget?.isActive ? 'Khóa / Ngừng sử dụng nguyên liệu' : 'Mở khóa / Kích hoạt lại nguyên liệu'}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {statusTarget?.isActive ? (
                <>
                  Bạn có chắc chắn muốn ngừng sử dụng nguyên liệu{' '}
                  <strong className="text-slate-900 font-bold">“{statusTarget?.name}”</strong>?
                  Dữ liệu trong các công thức và kế hoạch bữa ăn đã lưu vẫn được giữ nguyên.
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn mở khóa và kích hoạt lại nguyên liệu{' '}
                  <strong className="text-slate-900 font-bold">“{statusTarget?.name}”</strong>?
                  Nguyên liệu sẽ có thể được sử dụng bình thường trong các công thức mới.
                </>
              )}
            </p>
            {formError && (
              <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {formError}
              </p>
            )}
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
                  setBusy(true)
                  setFormError(null)
                  try {
                    if (statusTarget.isActive) {
                      await adminIngredientsApi.deactivate(statusTarget.id)
                      setItems(prev => prev.map(it => it.id === statusTarget.id ? { ...it, isActive: false } : it))
                      setNotice(`Đã ngừng sử dụng nguyên liệu “${statusTarget.name}”.`)
                    } else {
                      // Chỉ báo mở khóa sau khi backend đã lưu thành công; lỗi giữ nguyên trạng thái cũ.
                      await adminIngredientsApi.activate(statusTarget.id)
                      setItems(prev => prev.map(it => it.id === statusTarget.id ? { ...it, isActive: true } : it))
                      setNotice(`Đã mở khóa và kích hoạt lại nguyên liệu “${statusTarget.name}”.`)
                    }
                    setStatusTarget(null)
                  } catch (err) {
                    setFormError(err instanceof Error ? err.message : 'Thao tác không thành công.')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                {busy ? 'Đang lưu...' : (statusTarget?.isActive ? 'Xác nhận khóa' : 'Xác nhận mở khóa')}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  )
}

export default AdminIngredientsPage

