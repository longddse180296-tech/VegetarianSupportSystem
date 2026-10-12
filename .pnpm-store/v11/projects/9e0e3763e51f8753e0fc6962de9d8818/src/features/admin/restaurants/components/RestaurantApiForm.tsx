import { useState } from 'react'
import { RecordPicker, Feedback } from '../../components/ApiWorkspace'
import {
  fieldClass,
  primaryClass,
  secondaryClass,
  errorMessage,
} from '../../utils/apiUi'
import { dietLabels, type DietaryType } from '../../recipes/api/recipeContract'
import {
  restaurantApi,
  type RestaurantDetail,
  type RestaurantInput,
} from '../api/restaurantContract'
export function RestaurantApiForm({
  restaurant,
  onSaved,
  onCancel,
}: {
  restaurant?: RestaurantDetail
  onSaved: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<RestaurantInput>(() =>
    restaurant
      ? {
          name: restaurant.name,
          description: restaurant.description,
          address: restaurant.address,
          district: restaurant.district,
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          contactPhone: restaurant.contactPhone,
          websiteUrl: restaurant.websiteUrl,
          openingHours: restaurant.openingHours,
          priceFromVnd: restaurant.priceFromVnd,
          priceToVnd: restaurant.priceToVnd,
          imageUrl: restaurant.imageUrl,
          source: restaurant.source,
          dietaryTypes: restaurant.dietaryTypes,
          amenities: restaurant.amenities,
          relatedRecipeIds: restaurant.relatedRecipes.map((item) => item.id),
        }
      : {
          name: '',
          description: null,
          address: '',
          district: null,
          latitude: null,
          longitude: null,
          contactPhone: null,
          websiteUrl: null,
          openingHours: null,
          priceFromVnd: null,
          priceToVnd: null,
          imageUrl: null,
          source: null,
          dietaryTypes: [],
          amenities: [],
          relatedRecipeIds: [],
        },
  )
  const [related, setRelated] = useState(restaurant?.relatedRecipes || [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        if (busy) return
        if (!form.dietaryTypes.length) {
          setError('Chọn ít nhất một chế độ ăn được khai báo.')
          return
        }
        if ((form.latitude === null) !== (form.longitude === null)) {
          setError('Vui lòng nhập cả vĩ độ và kinh độ hoặc để trống cả hai.')
          return
        }
        const amenities = [
          ...new Set(form.amenities.map((item) => item.trim()).filter(Boolean)),
        ]
        if (
          amenities.length > 30 ||
          amenities.some((item) => item.length > 120)
        ) {
          setError('Tối đa 30 tiện ích, mỗi mục không quá 120 ký tự.')
          return
        }
        setBusy(true)
        setError(null)
        try {
          const input = {
            ...form,
            amenities,
            relatedRecipeIds: related.map((item) => item.id),
          }
          if (restaurant) await restaurantApi.update(restaurant.id, input)
          else await restaurantApi.create(input)
          onSaved()
        } catch (reason) {
          setError(errorMessage(reason))
        } finally {
          setBusy(false)
        }
      }}
    >
      <fieldset disabled={busy} className="space-y-4">
        {(
          [
            ['name', 'Tên nhà hàng', 120, true],
            ['address', 'Địa chỉ', 300, true],
            ['district', 'Quận / khu vực', 120, false],
            ['contactPhone', 'Số điện thoại', 40, false],
            ['openingHours', 'Giờ mở cửa', 1000, false],
            ['source', 'Nguồn thông tin', 500, false],
          ] as const
        ).map(([key, label, maxLength, required]) => (
          <label key={key} className="block text-sm">
            {label}
            <input
              required={required}
              maxLength={maxLength}
              className={fieldClass}
              value={form[key] || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  [key]: e.target.value || (required ? '' : null),
                })
              }
            />
          </label>
        ))}
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
        <div className="grid sm:grid-cols-2 gap-3">
          {(
            [
              ['latitude', 'Vĩ độ', -90, 90, '0.000001'],
              ['longitude', 'Kinh độ', -180, 180, '0.000001'],
              ['priceFromVnd', 'Giá từ (VND)', 0, 1000000000, '1'],
              ['priceToVnd', 'Giá đến (VND)', 0, 1000000000, '1'],
            ] as const
          ).map(([key, label, min, max, step]) => (
            <label key={key} className="text-sm">
              {label}
              <input
                type="number"
                min={min}
                max={max}
                step={step}
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
        {(
          [
            ['websiteUrl', 'Website'],
            ['imageUrl', 'URL ảnh'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm">
            {label}
            <input
              type="url"
              pattern="https?://.*"
              maxLength={2048}
              className={fieldClass}
              value={form[key] || ''}
              onChange={(e) =>
                setForm({ ...form, [key]: e.target.value || null })
              }
            />
          </label>
        ))}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Chế độ ăn được khai báo</p>
          {Object.entries(dietLabels).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.dietaryTypes.includes(value as DietaryType)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dietaryTypes: e.target.checked
                      ? [...form.dietaryTypes, value as DietaryType]
                      : form.dietaryTypes.filter((item) => item !== value),
                  })
                }
              />
              {label}
            </label>
          ))}
          <p className="text-xs text-slate-500">
            Thông tin do nguồn khai báo, không phải chứng nhận món ăn hoặc an
            toàn dị ứng.
          </p>
        </div>
        <label className="block text-sm">
          Tiện ích (mỗi dòng một mục)
          <textarea
            className={fieldClass}
            value={form.amenities.join('\n')}
            onChange={(e) =>
              setForm({ ...form, amenities: e.target.value.split('\n') })
            }
          />
        </label>
        <RecordPicker
          resource="recipes"
          label="Công thức liên quan"
          value=""
          onChange={(item) => {
            if (
              !related.some((recipe) => recipe.id === item.id) &&
              related.length < 100
            )
              setRelated([...related, { ...item, imageUrl: null }])
          }}
        />
        {related.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.name}</span>
            <button
              type="button"
              className="fe1-link text-rose-700"
              onClick={() =>
                setRelated(related.filter((recipe) => recipe.id !== item.id))
              }
            >
              Bỏ liên kết
            </button>
          </div>
        ))}
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
        <button disabled={busy} className={primaryClass}>
          {busy ? 'Đang lưu...' : 'Lưu nhà hàng'}
        </button>
      </div>
    </form>
  )
}
