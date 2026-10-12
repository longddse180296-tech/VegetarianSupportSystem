import { useState } from 'react'
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
      className="space-y-4"
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
      <fieldset disabled={busy} className="space-y-4">
        <label className="block text-sm">
          Tên công thức
          <input
            required
            maxLength={120}
            className={fieldClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <RecordPicker
          resource="categories"
          label="Danh mục"
          value={form.categoryId}
          selectedName={categoryName}
          onChange={(item) => {
            setForm({ ...form, categoryId: item.id })
            setCategoryName(item.name)
          }}
        />
        <label className="block text-sm">
          Mô tả
          <textarea
            maxLength={2000}
            className={fieldClass}
            value={form.description || ''}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value || null })
            }
          />
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ['servings', 'Khẩu phần', 1, 10000],
              ['prepTimeMinutes', 'Chuẩn bị (phút)', 0, 10080],
              ['cookTimeMinutes', 'Nấu (phút)', 0, 10080],
            ] as const
          ).map(([key, label, min, max]) => (
            <label key={key} className="text-sm">
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
        <label className="block text-sm">
          URL ảnh
          <input
            type="url"
            pattern="https?://.*"
            maxLength={2048}
            className={fieldClass}
            value={form.imageUrl || ''}
            onChange={(e) =>
              setForm({ ...form, imageUrl: e.target.value || null })
            }
          />
        </label>
        <label className="block text-sm">
          Hướng dẫn nấu
          <textarea
            required
            maxLength={20000}
            rows={5}
            className={fieldClass}
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />
        </label>
        <h4 className="font-bold">Thành phần và định lượng</h4>
        {form.ingredients.map((ingredient, index) => (
          <div key={index} className="rounded-xl border p-3 space-y-3">
            <RecordPicker
              resource="ingredients"
              label={`Nguyên liệu ${index + 1}`}
              value={ingredient.ingredientId}
              selectedName={names[ingredient.ingredientId]}
              onChange={(item) => {
                changeIngredient(index, { ingredientId: item.id })
                setNames({ ...names, [item.id]: item.name })
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Số lượng
                <input
                  required
                  type="number"
                  min={0.001}
                  max={999999999}
                  step="0.001"
                  value={ingredient.quantity}
                  className={fieldClass}
                  onChange={(e) =>
                    changeIngredient(index, {
                      quantity: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="text-sm">
                Đơn vị
                <input
                  required
                  maxLength={40}
                  value={ingredient.unit}
                  className={fieldClass}
                  onChange={(e) =>
                    changeIngredient(index, { unit: e.target.value })
                  }
                />
              </label>
            </div>
            <label className="block text-sm">
              Ghi chú
              <input
                maxLength={500}
                value={ingredient.note || ''}
                className={fieldClass}
                onChange={(e) =>
                  changeIngredient(index, { note: e.target.value || null })
                }
              />
            </label>
            {form.ingredients.length > 1 && (
              <button
                type="button"
                className="fe1-link text-sm text-rose-700"
                onClick={() =>
                  setForm({
                    ...form,
                    ingredients: form.ingredients.filter((_, i) => i !== index),
                  })
                }
              >
                Bỏ nguyên liệu {index + 1}
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          disabled={form.ingredients.length >= 200}
          className={secondaryClass}
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
          Thêm nguyên liệu
        </button>
        <p className="text-xs text-slate-500">
          Dinh dưỡng theo mỗi khẩu phần. Để trống nếu chưa biết. Chế độ ăn được
          xác định từ thành phần.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {nutrients.map(([key, label]) => (
            <label key={key} className="text-sm">
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
                    [key]:
                      e.target.value === '' ? null : Number(e.target.value),
                  })
                }
              />
            </label>
          ))}
        </div>
      </fieldset>
      <Feedback error={error} />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={busy}
          className={secondaryClass}
          onClick={onCancel}
        >
          Hủy
        </button>
        <button className={primaryClass} disabled={busy}>
          {busy ? 'Đang lưu...' : 'Lưu công thức'}
        </button>
      </div>
    </form>
  )
}
