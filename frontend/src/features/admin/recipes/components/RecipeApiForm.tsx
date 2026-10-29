// Chức năng: công thức và định lượng nguyên liệu. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import { useEffect, useState } from 'react'
import { BookOpen, Check, ChefHat, Leaf, LoaderCircle, Plus, BarChart3, Trash2 } from 'lucide-react'
import { RecordPicker, Feedback } from '../../components/ApiWorkspace'
import {
  fieldClass,
  primaryClass,
  secondaryClass,
  errorMessage,
} from '../../utils/apiUi'
import {
  dietLabels,
  type RecipeDetail,
  type RecipeInput,
  recipeApi,
} from '../api/recipeContract'
import { uploadPublicImage } from '../../../../shared/api/publicImageApi'
import { IngredientPicker } from './IngredientPicker'
import { ingredientUnits } from '../../utils/ingredientUnits'
import { apiClient } from '../../../../shared/api/apiClient'
import { recipeQuantityUnit, type RecipeIngredientOption } from '../api/recipeNutrition'
import { useRecipeNutrition } from '../hooks/useRecipeNutrition'

// Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý (parseSteps); thuộc công thức và định lượng nguyên liệu.
function parseSteps(instructions: string) {
  // Numbered legacy instructions may contain continuation lines within a step.
  const numbered = instructions.trim().split(/\r?\n(?=\s*\d+[.)]\s)/)
  return numbered.length > 1
    ? numbered.map(step => step.replace(/^\s*\d+[.)]\s*/, ''))
    : [instructions.replace(/^\s*1[.)]\s*/, '')]
}

const nutrients = [
  ['caloriesPerServing', 'Năng lượng (kcal)'],
  ['proteinGramPerServing', 'Đạm (g)'],
  ['carbohydrateGramPerServing', 'Carbs (g)'],
  ['fatGramPerServing', 'Chất béo (g)'],
] as const
// Cấu trúc RecipeFormInput quy định dữ liệu trao đổi trong công thức và định lượng nguyên liệu.
type RecipeFormInput = Omit<RecipeInput, 'servings' | 'prepTimeMinutes' | 'cookTimeMinutes' | 'ingredients'> & {
  servings: number | ''
  prepTimeMinutes: number | ''
  cookTimeMinutes: number | ''
  ingredients: Array<Omit<RecipeInput['ingredients'][number], 'quantity'> & { quantity: number | '' }>
}
// Thành phần RecipeApiForm nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc công thức và định lượng nguyên liệu.
export function RecipeApiForm({
  recipe,
  onSaved,
  onCancel,
}: {
  recipe?: RecipeDetail
  onSaved: () => void
  onCancel: () => void
}) {
  // Lưu dữ liệu và trạng thái thao tác của công thức và định lượng nguyên liệu trong vòng đời màn hình.
  const [form, setForm] = useState<RecipeFormInput>(() =>
    recipe
      ? {
          categoryId: recipe.categoryId,
          name: recipe.name,
          description: recipe.description,
          servings: recipe.servings,
          instructions: recipe.instructions,
          prepTimeMinutes: recipe.prepTimeMinutes,
          cookTimeMinutes: recipe.cookTimeMinutes,
          imageUrl: recipe.imageUrl,
          caloriesPerServing: recipe.caloriesPerServing,
          proteinGramPerServing: recipe.proteinGramPerServing,
          carbohydrateGramPerServing: recipe.carbohydrateGramPerServing,
          fatGramPerServing: recipe.fatGramPerServing,
          declaredDietaryType: recipe.declaredDietaryType,
          ingredients: recipe.ingredients.map(
            ({ ingredientId, quantity, unit, note }) => ({
              ingredientId,
              quantity,
              unit,
              note,
            }),
          ),
        }
      : {
          categoryId: '',
          name: '',
          description: null,
          servings: '',
          instructions: '',
          prepTimeMinutes: '',
          cookTimeMinutes: '',
          imageUrl: null,
          caloriesPerServing: null,
          proteinGramPerServing: null,
          carbohydrateGramPerServing: null,
          fatGramPerServing: null,
          declaredDietaryType: null,
          ingredients: [
            { ingredientId: '', quantity: '', unit: '', note: null },
          ],
        },
  )
  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      recipe?.ingredients.map((item) => [item.ingredientId, item.name]) || [],
    ),
  )
  const [categoryName, setCategoryName] = useState(recipe?.categoryName || '')
  const [steps, setSteps] = useState(() => parseSteps(recipe?.instructions || ''))
  const [busy, setBusy] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingUnits, setLoadingUnits] = useState(!!recipe)
  // Đồng bộ dữ liệu theo thay đổi đầu vào; hủy hoặc bỏ qua kết quả cũ khi màn hình thay đổi.
  useEffect(() => {
    if (!recipe) return
    const controller = new AbortController()
    void Promise.all(recipe.ingredients.map(row => apiClient.get<RecipeIngredientOption>(
      `/api/admin/ingredients/${row.ingredientId}`, { signal: controller.signal },
    ))).then(items => {
      if (controller.signal.aborted) return
      const byId = new Map(items.map(item => [item.id, item]))
      setForm(current => ({ ...current, ingredients: current.ingredients.map(row => {
        const item = byId.get(row.ingredientId)
        if (!item) return row
        const unit = recipeQuantityUnit(item)
        if (unit === row.unit) return row
        const massUnits = ['g', 'kg']
        let quantity: number | '' = ''
        if (row.quantity !== '' && massUnits.includes(unit) && massUnits.includes(row.unit)) {
          const converted = row.quantity * (row.unit === 'kg' ? 1000 : 1) / (unit === 'kg' ? 1000 : 1)
          if (Math.abs(converted * 1000 - Math.round(converted * 1000)) < 1e-6 && converted >= 0.001 && converted <= 999999999) quantity = converted
        }
        return { ...row, unit, quantity }
      }) }))
      setLoadingUnits(false)
    }).catch(() => {
      if (!controller.signal.aborted) setError('Không tải được đơn vị nguyên liệu. Vui lòng mở lại biểu mẫu để thử lại.')
    })
    return () => controller.abort()
  }, [recipe])
  const completeInput = !loadingUnits && Number.isInteger(form.servings) && Number(form.servings) >= 1 && Number(form.servings) <= 10000 &&
    form.ingredients.length > 0 && new Set(form.ingredients.map(row => row.ingredientId)).size === form.ingredients.length &&
    form.ingredients.every(row => row.ingredientId && row.unit && row.quantity !== '' && Number.isFinite(row.quantity) && row.quantity > 0 && row.quantity <= 999999999)
  const nutrition = useRecipeNutrition(completeInput ? {
    servings: Number(form.servings),
    ingredients: form.ingredients.map(row => ({ ingredientId: row.ingredientId, quantity: Number(row.quantity), unit: row.unit })),
  } : null)
  // Kiểm tra và tải tệp phục vụ nội dung đang chỉnh sửa (uploadImage); thuộc công thức và định lượng nguyên liệu.
  const uploadImage = async (file?: File) => {
    if (!file || busy || uploadingImage) return
    setUploadingImage(true)
    setError(null)
    try {
      const imageUrl = await uploadPublicImage(file)
      setForm((current) => ({ ...current, imageUrl }))
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setUploadingImage(false)
    }
  }
  // Xử lý lựa chọn hoặc chuyển trạng thái giao diện theo thao tác người dùng (changeIngredient); thuộc công thức và định lượng nguyên liệu.
  const changeIngredient = (
    index: number,
    patch: Partial<RecipeFormInput['ingredients'][number]>,
  ) =>
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }))
  // Hiển thị giao diện công thức và định lượng nguyên liệu từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <form
      className="admin-content-form admin-recipe-form"
      aria-busy={busy}
      onSubmit={async (event) => {
        event.preventDefault()
        if (busy || uploadingImage || loadingUnits) return
        if (!form.imageUrl) {
          setError('Vui lòng tải ảnh đại diện thành công trước khi lưu công thức.')
          return
        }
        if (form.servings === '' || form.prepTimeMinutes === '' || form.cookTimeMinutes === '') {
          setError('Vui lòng nhập đầy đủ khẩu phần, thời gian chuẩn bị và thời gian nấu.')
          return
        }
        if (
          !form.categoryId ||
          !form.declaredDietaryType ||
          form.ingredients.some((item) => !item.ingredientId)
        ) {
          setError('Vui lòng chọn danh mục, một chế độ ăn và đầy đủ nguyên liệu.')
          return
        }
        if (
          new Set(form.ingredients.map((item) => item.ingredientId)).size !==
          form.ingredients.length
        ) {
          setError('Mỗi nguyên liệu chỉ được xuất hiện một lần.')
          return
        }
        const invalidUnit = form.ingredients.find(item => !item.unit.trim() || item.unit.trim().length > 40)
        if (invalidUnit) {
          setError('Vui lòng chọn nguyên liệu để hệ thống lấy đúng đơn vị.')
          return
        }
        if (!completeInput) {
          setError('Vui lòng nhập định lượng lớn hơn 0 cho từng nguyên liệu và số khẩu phần hợp lệ.')
          return
        }
        if (nutrition.result && !nutrition.result.isComplete) {
          setError(nutrition.result.issues.map(issue => issue.message).join(' '))
          return
        }
        if (steps.some(step => !step.trim())) {
          setError('Vui lòng nhập nội dung cho từng bước hướng dẫn.')
          return
        }
        const instructions = steps.map((step, index) => `${index + 1}. ${step.trim()}`).join('\n')
        if (instructions.length > 20000) {
          setError('Tổng hướng dẫn nấu không được vượt quá 20.000 ký tự.')
          return
        }
        setBusy(true)
        setError(null)
        try {
          const input: RecipeInput = { ...form, instructions,
            ingredients: form.ingredients.map(row => ({ ...row, quantity: Number(row.quantity) })),
            servings: Number(form.servings), prepTimeMinutes: Number(form.prepTimeMinutes), cookTimeMinutes: Number(form.cookTimeMinutes),
            caloriesPerServing: nutrition.result?.caloriesPerServing ?? null,
            proteinGramPerServing: nutrition.result?.proteinGramPerServing ?? null,
            carbohydrateGramPerServing: nutrition.result?.carbohydrateGramPerServing ?? null,
            fatGramPerServing: nutrition.result?.fatGramPerServing ?? null }
          if (recipe) await recipeApi.update(recipe.id, input)
          else await recipeApi.create(input)
          onSaved()
        } catch (reason) {
          setError(errorMessage(reason))
        } finally {
          setBusy(false)
        }
      }}
    >
      <fieldset disabled={busy} className="admin-recipe-fields space-y-5">
        <section aria-label="Thông tin chung" className="space-y-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <BookOpen size={17} aria-hidden="true" />
            </span>
            <h4 className="text-sm font-bold text-slate-800">Thông tin chung</h4>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Tên công thức <span className="text-rose-500" aria-hidden="true">*</span>
            <input
              required
              maxLength={120}
              className={fieldClass}
              placeholder="Ví dụ: Đậu hũ sốt nấm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <RecordPicker
              resource="categories"
              label="Danh mục"
              required
              hideSearch
              value={form.categoryId}
              selectedName={categoryName}
              onChange={(item) => {
                setForm({ ...form, categoryId: item.id })
                setCategoryName(item.name)
              }}
            />
            <label className="block text-sm font-medium text-slate-700">
              Chế độ ăn <span className="text-rose-500" aria-hidden="true">*</span>
              <select
                required
                className={fieldClass}
                value={form.declaredDietaryType ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    declaredDietaryType: e.target.value
                      ? e.target.value as RecipeInput['declaredDietaryType']
                      : null,
                  })
                }
              >
                <option value="">Chọn một chế độ ăn</option>
                {Object.entries(dietLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <div className="space-y-2.5">
              <label htmlFor="recipe-image-file" className="text-sm font-semibold text-slate-700">
                Ảnh đại diện <span className="text-rose-500" aria-hidden="true">*</span>
              </label>
              <div className="w-full">
                <input
                  id="recipe-image-file"
                  type="file"
                  required={!form.imageUrl}
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingImage}
                  className={`${fieldClass} !mt-0 !h-auto cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 disabled:cursor-not-allowed`}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    void uploadImage(file)
                  }}
                />
                <span className="mt-1.5 block text-xs font-normal leading-relaxed text-slate-400">
                  Chọn ảnh JPG, PNG hoặc WEBP từ thiết bị, tối đa 10 MB.
                </span>
                {!form.imageUrl && (
                  <span className="mt-2 block text-xs text-slate-500">Công thức này chưa có ảnh đại diện.</span>
                )}
                {form.imageUrl && (
                  <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <img
                      src={form.imageUrl}
                      alt="Xem trước ảnh công thức"
                      className="size-12 rounded-md object-cover border border-slate-200 bg-white"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs text-slate-500">Ảnh đại diện hiện tại</span>
                      <button
                        type="button"
                        className="mt-1 text-xs font-semibold text-rose-600 hover:underline"
                        onClick={() => setForm((current) => ({ ...current, imageUrl: null }))}
                      >
                        Bỏ ảnh
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Mô tả <span className="font-normal text-slate-400">(tùy chọn)</span>
            <textarea
              maxLength={2000}
              rows={3}
              className={`${fieldClass} resize-y`}
              placeholder="Giới thiệu ngắn về món ăn..."
              value={form.description || ''}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value || null })
              }
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ['servings', 'Khẩu phần', 1, 10000],
                ['prepTimeMinutes', 'Chuẩn bị (phút)', 0, 10080],
                ['cookTimeMinutes', 'Nấu (phút)', 0, 10080],
              ] as const
            ).map(([key, label, min, max]) => (
              <label key={key} className="text-sm font-medium text-slate-700">
                {label} <span className="text-rose-500" aria-hidden="true">*</span>
                <input
                  required
                  type="number"
                  min={min}
                  max={max}
                  step={1}
                  className={fieldClass}
                  value={form[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                />
              </label>
            ))}
          </div>
        </section>

        <section aria-label="Thành phần và định lượng" className="space-y-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Leaf size={17} aria-hidden="true" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Thành phần và định lượng</h4>
              <p className="mt-0.5 text-xs text-slate-400">Chọn từng nguyên liệu và lượng dùng cho toàn bộ công thức.</p>
            </div>
          </div>
          {form.ingredients.map((ingredient, index) => (
            <div key={index} className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
              <IngredientPicker
                label={`Nguyên liệu ${index + 1}`}
                value={ingredient.ingredientId}
                selectedName={names[ingredient.ingredientId]}
                onChange={(item) => {
                  const unit = recipeQuantityUnit(item)
                  changeIngredient(index, { ingredientId: item.id, unit, quantity: ingredient.ingredientId === item.id ? ingredient.quantity : '' })
                  setNames({ ...names, [item.id]: item.name })
                }}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="block text-sm font-medium text-slate-700">
                  <span className="block leading-5">Số lượng <span className="text-rose-500" aria-hidden="true">*</span></span>
                  <input
                    required
                    aria-label={`Số lượng nguyên liệu ${index + 1}`}
                    type="number"
                    min={0.001}
                    max={999999999}
                    step="0.001"
                    value={ingredient.quantity}
                    className={fieldClass}
                    onChange={(e) =>
                      changeIngredient(index, { quantity: e.target.value === '' ? '' : Number(e.target.value) })
                    }
                  />
                </div>
                <div className="block text-sm font-medium text-slate-700">
                  <span className="block leading-5">Đơn vị <span className="text-rose-500" aria-hidden="true">*</span></span>
                  <div className="mt-1">
                    <input
                      aria-label={`Đơn vị nguyên liệu ${index + 1}`}
                      className={`${fieldClass} !mt-0 !h-[46px] bg-slate-50`}
                      readOnly
                      value={ingredientUnits.find(unit => unit.value === ingredient.unit)?.label || ingredient.unit}
                      placeholder="Chọn nguyên liệu trước"
                    />
                  </div>
                </div>
                <div className="col-span-2 block text-sm font-medium text-slate-700">
                  <span className="block leading-5">Ghi chú <span className="font-normal text-slate-400">(tùy chọn)</span></span>
                  <input
                    maxLength={500}
                    value={ingredient.note || ''}
                    className={fieldClass}
                    placeholder="Ví dụ: Thái nhỏ, để ráo..."
                    onChange={(e) =>
                      changeIngredient(index, { note: e.target.value || null })
                    }
                  />
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">Đơn vị được lấy từ dữ liệu nguyên liệu. {ingredient.unit === 'ml' ? 'Nhập lượng ml; dinh dưỡng tính theo mốc ml đã khai báo, không đổi sang gam. ' : ingredient.unit === 'đơn vị' ? 'Nhập số lượng cần dùng; dinh dưỡng tính theo 1 đơn vị đã khai báo, không đổi sang gam. ' : ''}Nhập lượng dùng cho toàn bộ công thức; hệ thống tự tính dinh dưỡng mỗi khẩu phần.</p>
              {form.ingredients.length > 1 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
                    onClick={() =>
                      setForm({
                        ...form,
                        ingredients: form.ingredients.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Bỏ nguyên liệu {index + 1}
                  </button>
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            disabled={form.ingredients.length >= 200}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50"
            onClick={() =>
              setForm({
                ...form,
                ingredients: [
                  ...form.ingredients,
                  { ingredientId: '', quantity: '', unit: '', note: null },
                ],
              })
            }
          >
            <Plus size={16} aria-hidden="true" />
            Thêm nguyên liệu
          </button>
        </section>

        <section aria-label="Hướng dẫn nấu" className="space-y-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ChefHat size={17} aria-hidden="true" />
            </span>
            <h4 className="text-sm font-bold text-slate-800">Hướng dẫn nấu</h4>
          </div>
          {steps.map((step, index) => (
            <div key={index} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <label className="block text-sm font-medium text-slate-700">
                Bước {index + 1} <span className="text-rose-500" aria-hidden="true">*</span>
                <textarea required maxLength={20000} rows={3} className={`${fieldClass} resize-y`}
                  placeholder={`Nhập hướng dẫn cho bước ${index + 1}...`} value={step}
                  onChange={event => setSteps(current => current.map((text, i) => i === index ? event.target.value : text))} />
              </label>
              {steps.length > 1 && <button type="button" className="min-h-11 text-sm font-medium text-rose-600"
                onClick={() => setSteps(current => current.filter((_, i) => i !== index))}>Bỏ bước {index + 1}</button>}
            </div>
          ))}
          <button type="button" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-2.5 text-sm font-semibold text-emerald-800"
            onClick={() => setSteps(current => [...current, ''])}>
            <Plus size={16} aria-hidden="true" />Thêm bước hướng dẫn
          </button>
        </section>

        <section aria-label="Dinh dưỡng" className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <BarChart3 size={17} aria-hidden="true" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Dinh dưỡng mỗi khẩu phần</h4>
              <p className="mt-0.5 text-xs text-slate-400">Tự tính theo nguyên liệu, định lượng và số khẩu phần.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {nutrients.map(([key, label]) => (
              <label key={key} className="text-sm font-medium text-slate-700">
                {label}
                <input
                  type="number"
                  readOnly
                  className={fieldClass}
                  value={nutrition.result?.isComplete ? nutrition.result[key] ?? '' : ''}
                  placeholder="—"
                />
              </label>
            ))}
          </div>
          <div aria-live="polite" aria-busy={nutrition.loading} className="text-sm text-slate-600">
            {loadingUnits ? 'Đang lấy đơn vị nguyên liệu...' : !completeInput ? 'Chọn nguyên liệu, nhập đủ định lượng và số khẩu phần để tính dinh dưỡng.'
              : nutrition.loading ? <span className="inline-flex items-center gap-2"><LoaderCircle size={15} className="animate-spin" aria-hidden="true" />Đang tính dinh dưỡng...</span>
                : nutrition.result?.isComplete ? 'Đã cập nhật dinh dưỡng mỗi khẩu phần.' : null}
            {nutrition.result?.issues.map((issue, index) => <p key={`${issue.ingredientId}-${index}`} className="mt-1 text-amber-800">{issue.message}</p>)}
            {nutrition.error && <p className="mt-1 text-rose-700">{nutrition.error} <button type="button" className="underline" onClick={nutrition.retry}>Kết nối lại</button></p>}
          </div>
          <p className="rounded-lg bg-emerald-50/60 px-3 py-2.5 text-xs leading-relaxed text-emerald-800">
            Chế độ ăn được xác định từ thành phần của công thức.
          </p>
        </section>
      </fieldset>
      {error && (
        <div className="admin-form-feedback">
          <Feedback error={error} />
        </div>
      )}
      <div className="admin-form-actions flex items-center justify-end gap-3">
        <p className="mr-auto hidden text-xs text-slate-400 sm:block">
          <span className="text-rose-500">*</span> Thông tin bắt buộc
        </p>
        <button type="button" disabled={busy} className={secondaryClass} onClick={onCancel}>
          Hủy
        </button>
        <button type="submit" className={`${primaryClass} inline-flex items-center justify-center gap-2`} disabled={busy || uploadingImage || loadingUnits}>
          {busy ? (
            <LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <Check size={16} aria-hidden="true" />
          )}
          {busy ? 'Đang lưu...' : 'Lưu công thức'}
        </button>
      </div>
    </form>
  )
}
