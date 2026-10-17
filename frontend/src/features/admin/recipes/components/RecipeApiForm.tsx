import { useState } from 'react'
import { BookOpen, Check, ChefHat, Leaf, LoaderCircle, Plus, BarChart3, Trash2 } from 'lucide-react'
import { Select } from '../../../../shared/components/Select'
import { RecordPicker, Feedback } from '../../components/ApiWorkspace'
import {
  fieldClass,
  primaryClass,
  secondaryClass,
  errorMessage,
} from '../../utils/apiUi'
import {
  type RecipeDetail,
  type RecipeInput,
  recipeApi,
} from '../api/recipeContract'

const VALID_UNITS = ['g', 'kg', 'ml'] as const

const nutrients = [
  ['caloriesPerServing', 'Năng lượng (kcal)'],
  ['proteinGramPerServing', 'Đạm (g)'],
  ['carbohydrateGramPerServing', 'Carbs (g)'],
  ['fatGramPerServing', 'Chất béo (g)'],
] as const
export function RecipeApiForm({
  recipe,
  onSaved,
  onCancel,
}: {
  recipe?: RecipeDetail
  onSaved: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<RecipeInput>(() =>
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
          servings: 1,
          instructions: '',
          prepTimeMinutes: 0,
          cookTimeMinutes: 0,
          imageUrl: null,
          caloriesPerServing: null,
          proteinGramPerServing: null,
          carbohydrateGramPerServing: null,
          fatGramPerServing: null,
          ingredients: [
            { ingredientId: '', quantity: 1, unit: 'g', note: null },
          ],
        },
  )
  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      recipe?.ingredients.map((item) => [item.ingredientId, item.name]) || [],
    ),
  )
  const [categoryName, setCategoryName] = useState(recipe?.categoryName || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const changeIngredient = (
    index: number,
    patch: Partial<RecipeInput['ingredients'][number]>,
  ) =>
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }))
  return (
    <form
      className="admin-content-form admin-recipe-form"
      aria-busy={busy}
      onSubmit={async (event) => {
        event.preventDefault()
        if (busy) return
        if (
          !form.categoryId ||
          form.ingredients.some((item) => !item.ingredientId)
        ) {
          setError('Vui lòng chọn danh mục và đầy đủ nguyên liệu.')
          return
        }
        if (
          new Set(form.ingredients.map((item) => item.ingredientId)).size !==
          form.ingredients.length
        ) {
          setError('Mỗi nguyên liệu chỉ được xuất hiện một lần.')
          return
        }
        const invalidUnit = form.ingredients.find(
          (item) =>
            !item.unit ||
            !(VALID_UNITS as readonly string[]).includes(
              item.unit.trim().toLowerCase(),
            ),
        )
        if (invalidUnit) {
          setError('Đơn vị nguyên liệu không hợp lệ. Vui lòng chọn g, kg hoặc ml.')
          return
        }
        setBusy(true)
        setError(null)
        try {
          if (recipe) await recipeApi.update(recipe.id, form)
          else await recipeApi.create(form)
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
              hideSearch
              value={form.categoryId}
              selectedName={categoryName}
              onChange={(item) => {
                setForm({ ...form, categoryId: item.id })
                setCategoryName(item.name)
              }}
            />
            <label className="block text-sm font-medium text-slate-700">
              URL ảnh <span className="font-normal text-slate-400">(tùy chọn)</span>
              <input
                type="url"
                pattern="https?://.*"
                maxLength={2048}
                className={fieldClass}
                placeholder="https://..."
                value={form.imageUrl || ''}
                onChange={(e) =>
                  setForm({ ...form, imageUrl: e.target.value || null })
                }
              />
              <span className="mt-1.5 block text-xs font-normal leading-relaxed text-slate-400">
                Đường dẫn ảnh đại diện của món ăn (URL HTTP/HTTPS).
              </span>
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
                  <span className="text-xs text-slate-500">Xem trước ảnh món ăn</span>
                </div>
              )}
            </label>
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
                {label}
                <input
                  required
                  type="number"
                  min={min}
                  max={max}
                  step={1}
                  className={fieldClass}
                  value={form[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: Number(e.target.value) })
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
              <RecordPicker
                resource="ingredients"
                label={`Nguyên liệu ${index + 1}`}
                value={ingredient.ingredientId}
                selectedName={names[ingredient.ingredientId]}
                onChange={(item) => {
                  const rawUnit = item.defaultUnit ? item.defaultUnit.trim().toLowerCase() : ''
                  const normalizedUnit = (VALID_UNITS as readonly string[]).includes(rawUnit) ? rawUnit : 'g'
                  changeIngredient(index, { ingredientId: item.id, unit: normalizedUnit })
                  setNames({ ...names, [item.id]: item.name })
                }}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="block text-sm font-medium text-slate-700">
                  <span className="block leading-5">Số lượng <span className="text-rose-500" aria-hidden="true">*</span></span>
                  <input
                    required
                    type="number"
                    min={0.001}
                    max={999999999}
                    step="0.001"
                    value={ingredient.quantity}
                    className={fieldClass}
                    onChange={(e) =>
                      changeIngredient(index, { quantity: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="block text-sm font-medium text-slate-700">
                  <span className="block leading-5">Đơn vị <span className="text-rose-500" aria-hidden="true">*</span></span>
                  <div className="mt-1">
                    <Select
                      aria-label={`Đơn vị nguyên liệu ${index + 1}`}
                      className="!h-[46px]"
                      value={ingredient.unit || 'g'}
                      onChange={(e) => changeIngredient(index, { unit: e.target.value })}
                      options={[
                        { value: 'g', label: 'g (Gam)' },
                        { value: 'kg', label: 'kg (Kilôgam)' },
                        { value: 'ml', label: 'ml (Mililít)' },
                      ]}
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
                  { ingredientId: '', quantity: 1, unit: 'g', note: null },
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
          <label className="block text-sm font-medium text-slate-700">
            Các bước thực hiện <span className="text-rose-500" aria-hidden="true">*</span>
            <textarea
              required
              maxLength={20000}
              rows={5}
              className={`${fieldClass} resize-y`}
              placeholder={'1. Sơ chế nguyên liệu...\n2. Chế biến món ăn...\n3. Hoàn thành và trình bày...'}
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
          </label>
        </section>

        <section aria-label="Dinh dưỡng" className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <BarChart3 size={17} aria-hidden="true" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Dinh dưỡng mỗi khẩu phần</h4>
              <p className="mt-0.5 text-xs text-slate-400">Để trống thông tin chưa biết.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {nutrients.map(([key, label]) => (
              <label key={key} className="text-sm font-medium text-slate-700">
                {label}
                <input
                  type="number"
                  min={0}
                  max={999999999}
                  step="0.001"
                  className={fieldClass}
                  value={form[key] ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [key]: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
            ))}
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
        <button type="submit" className={`${primaryClass} inline-flex items-center justify-center gap-2`} disabled={busy}>
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
