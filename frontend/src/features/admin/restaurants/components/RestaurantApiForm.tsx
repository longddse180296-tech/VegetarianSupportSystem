import { useState } from 'react'
import {
  Store,
  MapPin,
  Coins,
  Globe,
  Leaf,
  UtensilsCrossed,
  Check,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react'
import { Feedback } from '../../components/ApiWorkspace'
import {
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
import { uploadPublicImage } from '../../../../shared/api/publicImageApi'

interface FormErrors {
  name?: string
  address?: string
  contactPhone?: string
  latitude?: string
  longitude?: string
  priceFrom?: string
  priceTo?: string
  websiteUrl?: string
  dietaryType?: string
  amenities?: string
  featuredDishes?: string
}

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
          dietaryType:
            restaurant.dietaryType ??
            (restaurant.dietaryTypes.length === 1 ? restaurant.dietaryTypes[0] : null),
          amenities: restaurant.amenities,
          featuredDishes: Array.from({ length: 3 }, (_, index) => {
            const dish = restaurant.featuredDishes[index]
            return dish ? { name: dish.name, imageUrl: dish.imageUrl } : { name: '', imageUrl: null }
          }),
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
          dietaryType: null,
          amenities: [],
          featuredDishes: Array.from({ length: 3 }, () => ({ name: '', imageUrl: null })),
        },
  )

  // String state for inputs to avoid HTML5 number-input value hiding
  const [rawLatitude, setRawLatitude] = useState(
    restaurant?.latitude !== null && restaurant?.latitude !== undefined
      ? String(restaurant.latitude)
      : '',
  )
  const [rawLongitude, setRawLongitude] = useState(
    restaurant?.longitude !== null && restaurant?.longitude !== undefined
      ? String(restaurant.longitude)
      : '',
  )
  const [rawPriceFrom, setRawPriceFrom] = useState(
    restaurant?.priceFromVnd !== null && restaurant?.priceFromVnd !== undefined
      ? String(restaurant.priceFromVnd)
      : '',
  )
  const [rawPriceTo, setRawPriceTo] = useState(
    restaurant?.priceToVnd !== null && restaurant?.priceToVnd !== undefined
      ? String(restaurant.priceToVnd)
      : '',
  )

  const [busy, setBusy] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingFeaturedDishIndex, setUploadingFeaturedDishIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Comprehensive validator
  function validateAll(
    currentForm: RestaurantInput,
    latStr: string,
    lngStr: string,
    pfStr: string,
    ptStr: string,
  ): FormErrors {
    const errs: FormErrors = {}

    // 1. Tên nhà hàng
    if (!currentForm.name.trim()) {
      errs.name = 'Vui lòng nhập tên nhà hàng (tối đa 120 ký tự).'
    } else if (currentForm.name.trim().length > 120) {
      errs.name = 'Tên nhà hàng không được vượt quá 120 ký tự.'
    }

    // 2. Địa chỉ
    if (!currentForm.address.trim()) {
      errs.address = 'Vui lòng nhập địa chỉ nhà hàng (tối đa 300 ký tự).'
    } else if (currentForm.address.trim().length > 300) {
      errs.address = 'Địa chỉ không được vượt quá 300 ký tự.'
    }

    // 3. Số điện thoại (nếu có nhập)
    if (currentForm.contactPhone?.trim()) {
      const raw = currentForm.contactPhone.trim()
      if (/[a-zA-Z]/.test(raw)) {
        errs.contactPhone = 'Số điện thoại không được chứa chữ cái.'
      } else {
        const clean = raw.replace(/[\s.-]/g, '')
        const phoneRegex = /^(\+?84|0)(2[0-9]{9}|[35789][0-9]{8})$/
        if (!phoneRegex.test(clean)) {
          errs.contactPhone =
            'Số điện thoại không hợp lệ (ví dụ: 0901234567, 02838532932 hoặc +84901234567).'
        }
      }
    }

    // 4. Vĩ độ (Latitude)
    const latTrim = latStr.trim()
    const lngTrim = lngStr.trim()

    if (latTrim) {
      if (
        /[^0-9.-]/.test(latTrim) ||
        isNaN(Number(latTrim)) ||
        latTrim === '-' ||
        latTrim === '.'
      ) {
        errs.latitude =
          'Vĩ độ phải là số thập phân hợp lệ (ví dụ: 10.755833), không chứa chữ cái.'
      } else {
        const num = Number(latTrim)
        if (num < -90 || num > 90) {
          errs.latitude =
            'Vĩ độ phải nằm trong khoảng từ -90 đến 90 (tại Việt Nam khoảng 8.5 đến 23.5).'
        }
      }
    }

    // 5. Kinh độ (Longitude)
    if (lngTrim) {
      if (
        /[^0-9.-]/.test(lngTrim) ||
        isNaN(Number(lngTrim)) ||
        lngTrim === '-' ||
        lngTrim === '.'
      ) {
        errs.longitude =
          'Kinh độ phải là số thập phân hợp lệ (ví dụ: 106.667500), không chứa chữ cái.'
      } else {
        const num = Number(lngTrim)
        if (num < -180 || num > 180) {
          errs.longitude =
            'Kinh độ phải nằm trong khoảng từ -180 đến 180 (tại Việt Nam khoảng 102.0 đến 110.0).'
        }
      }
    }

    // Tọa độ phải nhập cả hai hoặc để trống cả hai
    if ((latTrim !== '') !== (lngTrim !== '')) {
      if (!latTrim) errs.latitude = 'Vui lòng nhập cả Vĩ độ khi đã có Kinh độ.'
      if (!lngTrim) errs.longitude = 'Vui lòng nhập cả Kinh độ khi đã có Vĩ độ.'
    }

    // 6. Giá từ (Price From)
    const pfTrim = pfStr.trim()
    const ptTrim = ptStr.trim()

    let numPf: number | null = null
    let numPt: number | null = null

    if (pfTrim) {
      if (/[^0-9]/.test(pfTrim) || isNaN(Number(pfTrim))) {
        errs.priceFrom =
          'Giá từ phải là số nguyên dương (không chứa chữ cái, dấu chấm hoặc số âm).'
      } else {
        numPf = Number(pfTrim)
        if (numPf < 0 || numPf > 1_000_000_000) {
          errs.priceFrom = 'Giá từ phải từ 0 đến 1.000.000.000 VND.'
        }
      }
    }

    // 7. Giá đến (Price To)
    if (ptTrim) {
      if (/[^0-9]/.test(ptTrim) || isNaN(Number(ptTrim))) {
        errs.priceTo =
          'Giá đến phải là số nguyên dương (không chứa chữ cái, dấu chấm hoặc số âm).'
      } else {
        numPt = Number(ptTrim)
        if (numPt < 0 || numPt > 1_000_000_000) {
          errs.priceTo = 'Giá đến phải từ 0 đến 1.000.000.000 VND.'
        }
      }
    }

    // So sánh Giá từ <= Giá đến
    if (numPf !== null && numPt !== null && numPf > numPt) {
      errs.priceTo = `Giá đến phải lớn hơn hoặc bằng Giá từ (${numPt.toLocaleString('vi-VN')} đ < ${numPf.toLocaleString('vi-VN')} đ).`
    }

    // 8. Website URL
    if (currentForm.websiteUrl?.trim()) {
      const url = currentForm.websiteUrl.trim()
      if (!/^https?:\/\/.+/i.test(url)) {
        errs.websiteUrl =
          'Website phải là đường dẫn URL hợp lệ bắt đầu bằng http:// hoặc https://'
      } else if (url.length > 2048) {
        errs.websiteUrl = 'URL không được vượt quá 2048 ký tự.'
      }
    }

    // 9. Chế độ ăn
    if (!currentForm.dietaryType) {
      errs.dietaryType = 'Vui lòng chọn đúng một chế độ ăn được khai báo.'
    }

    // 10. Tiện ích
    const validAmenities = currentForm.amenities
      .map((a) => a.trim())
      .filter(Boolean)
    if (validAmenities.length > 30) {
      errs.amenities = 'Tối đa 30 tiện ích.'
    } else if (validAmenities.some((a) => a.length > 120)) {
      errs.amenities = 'Mỗi tiện ích không được vượt quá 120 ký tự.'
    }

    // 11. Món ăn nổi bật: chính xác ba món, tự nhập và ảnh từ thiết bị
    if (currentForm.featuredDishes.length !== 3) {
      errs.featuredDishes = 'Nhà hàng phải có đúng 3 món ăn nổi bật.'
    } else if (currentForm.featuredDishes.some((dish) => !dish.name.trim() || !dish.imageUrl)) {
      errs.featuredDishes = 'Nhập tên và tải ảnh từ thiết bị cho cả 3 món ăn nổi bật.'
    } else if (
      new Set(currentForm.featuredDishes.map((dish) => dish.name.trim().toLocaleLowerCase())).size !==
      currentForm.featuredDishes.length
    ) {
      errs.featuredDishes = 'Tên 3 món ăn nổi bật không được trùng nhau.'
    }

    return errs
  }

  // Trigger real-time validation on any field update
  const runValidation = (
    updatedForm: RestaurantInput,
    lat: string = rawLatitude,
    lng: string = rawLongitude,
    pf: string = rawPriceFrom,
    pt: string = rawPriceTo,
  ) => {
    const errs = validateAll(updatedForm, lat, lng, pf, pt)
    setFieldErrors(errs)
    return errs
  }

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }))

  const isInvalid = (field: keyof FormErrors) => {
    return !!fieldErrors[field] && (touched[field] || touched.all)
  }

  const inputClass = (field: keyof FormErrors) => {
    const hasError = isInvalid(field)
    return `admin-field mt-1 w-full rounded-xl border bg-white p-3 text-sm transition-all outline-none disabled:bg-slate-50 ${
      hasError
        ? 'admin-field-error !border-rose-500 bg-rose-50/20 text-rose-900 !ring-2 !ring-rose-400/20 focus:!border-rose-600 focus:!ring-rose-500/20'
        : 'border-slate-200 text-slate-800 hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
    }`
  }

  const uploadImage = async (file?: File) => {
    if (!file || busy || uploadingImage) return
    setUploadingImage(true)
    setError(null)
    try {
      const imageUrl = await uploadPublicImage(file)
      const next = { ...form, imageUrl }
      setForm(next)
      runValidation(next)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setUploadingImage(false)
    }
  }

  const uploadFeaturedDishImage = async (index: number, file?: File) => {
    if (!file || busy || uploadingFeaturedDishIndex !== null) return
    setUploadingFeaturedDishIndex(index)
    setError(null)
    try {
      const imageUrl = await uploadPublicImage(file)
      const featuredDishes = form.featuredDishes.map((dish, dishIndex) =>
        dishIndex === index ? { ...dish, imageUrl } : dish,
      )
      const next = { ...form, featuredDishes }
      setForm(next)
      runValidation(next)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setUploadingFeaturedDishIndex(null)
    }
  }

  const renderError = (field: keyof FormErrors) => {
    if (!fieldErrors[field] || (!touched[field] && !touched.all)) return null
    return (
      <p
        id={`${field}-error`}
        role="alert"
        className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in duration-150"
      >
        <AlertCircle size={13} className="shrink-0 text-rose-500" aria-hidden="true" />
        <span>{fieldErrors[field]}</span>
      </p>
    )
  }

  return (
    <form
      className="admin-content-form space-y-5"
      aria-busy={busy}
      noValidate
      onSubmit={async (event) => {
        event.preventDefault()
        if (busy) return

        setTouched({ all: true })
        const errs = validateAll(
          form,
          rawLatitude,
          rawLongitude,
          rawPriceFrom,
          rawPriceTo,
        )
        setFieldErrors(errs)

        if (Object.keys(errs).length > 0) {
          setError(
            'Vui lòng kiểm tra lại các trường thông tin bị lỗi màu đỏ bên dưới.',
          )
          return
        }

        const trimmedName = form.name.trim()
        const trimmedAddress = form.address.trim()
        const lat = rawLatitude.trim() ? Number(rawLatitude.trim()) : null
        const lng = rawLongitude.trim() ? Number(rawLongitude.trim()) : null
        const pf = rawPriceFrom.trim() ? Number(rawPriceFrom.trim()) : null
        const pt = rawPriceTo.trim() ? Number(rawPriceTo.trim()) : null
        const amenities = [
          ...new Set(form.amenities.map((item) => item.trim()).filter(Boolean)),
        ]

        setBusy(true)
        setError(null)
        try {
          const input: RestaurantInput = {
            ...form,
            name: trimmedName,
            address: trimmedAddress,
            latitude: lat,
            longitude: lng,
            priceFromVnd: pf,
            priceToVnd: pt,
            amenities,
            featuredDishes: form.featuredDishes.map((dish) => ({
              name: dish.name.trim(),
              imageUrl: dish.imageUrl,
            })),
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
      <fieldset disabled={busy} className="space-y-5">
        {/* Section 1: Thông tin cơ bản */}
        <section aria-label="Thông tin cơ bản" className="space-y-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Store size={17} aria-hidden="true" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Thông tin cơ bản</h4>
              <p className="mt-0.5 text-xs text-slate-400">Tên, địa chỉ và thông tin liên hệ của nhà hàng chay.</p>
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Tên nhà hàng <span className="text-rose-500" aria-hidden="true">*</span>
            <input
              required
              maxLength={120}
              className={inputClass('name')}
              aria-invalid={isInvalid('name') ? 'true' : undefined}
              aria-describedby={isInvalid('name') ? 'name-error' : undefined}
              placeholder="Ví dụ: Bếp Xanh An Duyên"
              value={form.name}
              onBlur={() => markTouched('name')}
              onChange={(e) => {
                const next = { ...form, name: e.target.value }
                setForm(next)
                markTouched('name')
                runValidation(next)
              }}
            />
            {renderError('name')}
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Địa chỉ đầy đủ <span className="text-rose-500" aria-hidden="true">*</span>
            <input
              required
              maxLength={300}
              className={inputClass('address')}
              aria-invalid={isInvalid('address') ? 'true' : undefined}
              aria-describedby={isInvalid('address') ? 'address-error' : undefined}
              placeholder="Ví dụ: 10 Nguyễn Tri Phương, Phường 6, Quận 5, TP.HCM"
              value={form.address}
              onBlur={() => markTouched('address')}
              onChange={(e) => {
                const next = { ...form, address: e.target.value }
                setForm(next)
                markTouched('address')
                runValidation(next)
              }}
            />
            {renderError('address')}
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Quận / khu vực <span className="font-normal text-slate-400">(tùy chọn)</span>
              <input
                maxLength={120}
                className="admin-field mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Ví dụ: Quận 5, TP.HCM"
                value={form.district || ''}
                onChange={(e) => setForm({ ...form, district: e.target.value || null })}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Số điện thoại <span className="font-normal text-slate-400">(tùy chọn)</span>
              <input
                type="tel"
                maxLength={40}
                className={inputClass('contactPhone')}
                aria-invalid={isInvalid('contactPhone') ? 'true' : undefined}
                aria-describedby={isInvalid('contactPhone') ? 'contactPhone-error' : undefined}
                placeholder="Ví dụ: 028 3853 2932 hoặc 0901234567"
                value={form.contactPhone || ''}
                onBlur={() => markTouched('contactPhone')}
                onChange={(e) => {
                  const next = { ...form, contactPhone: e.target.value || null }
                  setForm(next)
                  markTouched('contactPhone')
                  runValidation(next)
                }}
              />
              {renderError('contactPhone')}
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Giờ mở cửa <span className="font-normal text-slate-400">(tùy chọn)</span>
              <input
                maxLength={1000}
                className="admin-field mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Ví dụ: 10:00 - 21:30 hàng ngày"
                value={form.openingHours || ''}
                onChange={(e) => setForm({ ...form, openingHours: e.target.value || null })}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Nguồn thông tin <span className="font-normal text-slate-400">(tùy chọn)</span>
              <input
                maxLength={500}
                className="admin-field mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Ví dụ: Fanpage, Google Maps, chủ quán..."
                value={form.source || ''}
                onChange={(e) => setForm({ ...form, source: e.target.value || null })}
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Mô tả nhà hàng <span className="font-normal text-slate-400">(tùy chọn)</span>
            <textarea
              maxLength={2000}
              rows={3}
              className="admin-field mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none resize-y hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Giới thiệu không gian quán, món ăn đặc trưng, trải nghiệm ẩm thực..."
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value || null })}
            />
          </label>
        </section>

        {/* Section 2: Vị trí & Khoảng giá */}
        <section aria-label="Vị trí và Khoảng giá" className="space-y-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <MapPin size={17} aria-hidden="true" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Vị trí & Khoảng giá</h4>
              <p className="mt-0.5 text-xs text-slate-400">Tọa độ địa lý (GPS) cho bản đồ và khoảng giá tham khảo.</p>
            </div>
          </div>

          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Vĩ độ (Latitude) <span className="font-normal text-slate-400">(-90 đến 90)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputClass('latitude')}
                  aria-invalid={isInvalid('latitude') ? 'true' : undefined}
                  aria-describedby={isInvalid('latitude') ? 'latitude-error' : undefined}
                  placeholder="Ví dụ: 10.755833"
                  value={rawLatitude}
                  onBlur={() => markTouched('latitude')}
                  onChange={(e) => {
                    const val = e.target.value
                    setRawLatitude(val)
                    markTouched('latitude')
                    runValidation(form, val, rawLongitude, rawPriceFrom, rawPriceTo)
                  }}
                />
                {renderError('latitude')}
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Kinh độ (Longitude) <span className="font-normal text-slate-400">(-180 đến 180)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputClass('longitude')}
                  aria-invalid={isInvalid('longitude') ? 'true' : undefined}
                  aria-describedby={isInvalid('longitude') ? 'longitude-error' : undefined}
                  placeholder="Ví dụ: 106.667500"
                  value={rawLongitude}
                  onBlur={() => markTouched('longitude')}
                  onChange={(e) => {
                    const val = e.target.value
                    setRawLongitude(val)
                    markTouched('longitude')
                    runValidation(form, rawLatitude, val, rawPriceFrom, rawPriceTo)
                  }}
                />
                {renderError('longitude')}
              </label>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Vị trí tại Việt Nam: Vĩ độ khoảng 8.5 – 23.5, Kinh độ khoảng 102.0 – 110.0 (phải nhập cả hai số hợp lệ hoặc để trống cả hai).
            </p>
          </div>

          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Giá từ (VND) <span className="font-normal text-slate-400">(tối thiểu)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={inputClass('priceFrom')}
                  aria-invalid={isInvalid('priceFrom') ? 'true' : undefined}
                  aria-describedby={isInvalid('priceFrom') ? 'priceFrom-error' : undefined}
                  placeholder="Ví dụ: 30000"
                  value={rawPriceFrom}
                  onBlur={() => markTouched('priceFrom')}
                  onChange={(e) => {
                    const val = e.target.value
                    setRawPriceFrom(val)
                    markTouched('priceFrom')
                    runValidation(form, rawLatitude, rawLongitude, val, rawPriceTo)
                  }}
                />
                {renderError('priceFrom')}
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Giá đến (VND) <span className="font-normal text-slate-400">(tối đa)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={inputClass('priceTo')}
                  aria-invalid={isInvalid('priceTo') ? 'true' : undefined}
                  aria-describedby={isInvalid('priceTo') ? 'priceTo-error' : undefined}
                  placeholder="Ví dụ: 150000"
                  value={rawPriceTo}
                  onBlur={() => markTouched('priceTo')}
                  onChange={(e) => {
                    const val = e.target.value
                    setRawPriceTo(val)
                    markTouched('priceTo')
                    runValidation(form, rawLatitude, rawLongitude, rawPriceFrom, val)
                  }}
                />
                {renderError('priceTo')}
              </label>
            </div>

            {/* Price Preview when valid */}
            {rawPriceFrom.trim() &&
              rawPriceTo.trim() &&
              !fieldErrors.priceFrom &&
              !fieldErrors.priceTo && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50/60 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  <Coins size={14} className="shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>
                    Khoảng giá tham khảo: {Number(rawPriceFrom).toLocaleString('vi-VN')} – {Number(rawPriceTo).toLocaleString('vi-VN')} VND
                  </span>
                </div>
              )}
          </div>
        </section>

        {/* Section 3: Hình ảnh & Website */}
        <section aria-label="Hình ảnh và Website" className="space-y-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Globe size={17} aria-hidden="true" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Hình ảnh & Website</h4>
              <p className="mt-0.5 text-xs text-slate-400">Trang chủ online và hình ảnh đại diện của nhà hàng.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Website / Fanpage <span className="font-normal text-slate-400">(tùy chọn)</span>
              <input
                type="url"
                className={inputClass('websiteUrl')}
                aria-invalid={isInvalid('websiteUrl') ? 'true' : undefined}
                aria-describedby={isInvalid('websiteUrl') ? 'websiteUrl-error' : undefined}
                placeholder="https://..."
                value={form.websiteUrl || ''}
                onBlur={() => markTouched('websiteUrl')}
                onChange={(e) => {
                  const next = { ...form, websiteUrl: e.target.value || null }
                  setForm(next)
                  markTouched('websiteUrl')
                  runValidation(next)
                }}
              />
              {renderError('websiteUrl')}
            </label>

            <div>
              <label htmlFor="restaurant-image-file" className="block text-sm font-medium text-slate-700">
                Ảnh đại diện <span className="font-normal text-slate-400">(tùy chọn)</span>
                <input
                  id="restaurant-image-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingImage}
                  className="admin-field mt-1 h-auto w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 transition-all outline-none file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-700 hover:border-slate-300 hover:file:bg-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-50"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    void uploadImage(file)
                  }}
                />
                <span className="mt-1.5 block text-xs font-normal leading-relaxed text-slate-400">
                  Chọn ảnh JPG, PNG hoặc WEBP từ thiết bị, tối đa 10 MB.
                </span>
              </label>

              {form.imageUrl && (
                <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <img
                    src={form.imageUrl}
                    alt="Xem trước ảnh nhà hàng"
                    className="size-12 rounded-md object-cover border border-slate-200 bg-white"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs text-slate-500">Xem trước ảnh đại diện</span>
                    <button
                      type="button"
                      className="mt-1 text-xs font-semibold text-rose-600 hover:underline"
                      onClick={() => {
                        const next = { ...form, imageUrl: null }
                        setForm(next)
                        runValidation(next)
                      }}
                    >
                      Bỏ ảnh
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 4: Chế độ ăn & Tiện ích */}
        <section aria-label="Chế độ ăn và Tiện ích" className="space-y-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Leaf size={17} aria-hidden="true" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Chế độ ăn & Tiện ích <span className="text-rose-500" aria-hidden="true">*</span>
              </h4>
              <p className="mt-0.5 text-xs text-slate-400">Chọn đúng một chế độ ăn mà nhà hàng khai báo và các tiện ích đi kèm.</p>
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Chế độ ăn phục vụ <span className="text-rose-500">*</span>
            </span>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {Object.entries(dietLabels).map(([value, label]) => {
                const checked = form.dietaryType === value as DietaryType
                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                      checked
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="restaurant-dietary-type"
                      className="size-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={checked}
                      onChange={() => {
                        const next = { ...form, dietaryType: value as DietaryType }
                        setForm(next)
                        markTouched('dietaryType')
                        runValidation(next)
                      }}
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                )
              })}
            </div>
            {renderError('dietaryType')}
            <p className="mt-2 text-xs text-slate-400">
              Thông tin do nguồn khai báo, không phải chứng nhận món ăn hoặc an toàn dị ứng.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Tiện ích <span className="font-normal text-slate-400">(mỗi dòng một tiện ích, tối đa 30 mục)</span>
              <textarea
                rows={3}
                className={inputClass('amenities')}
                aria-invalid={isInvalid('amenities') ? 'true' : undefined}
                aria-describedby={isInvalid('amenities') ? 'amenities-error' : undefined}
                placeholder="Ví dụ:&#10;Có chỗ đỗ ô tô&#10;Phòng riêng máy lạnh&#10;Thanh toán thẻ / chuyển khoản&#10;Giao hàng tận nơi"
                value={form.amenities.join('\n')}
                onBlur={() => markTouched('amenities')}
                onChange={(e) => {
                  const items = e.target.value.split('\n')
                  const next = { ...form, amenities: items }
                  setForm(next)
                  markTouched('amenities')
                  runValidation(next)
                }}
              />
              {renderError('amenities')}
            </label>
            {form.amenities.filter((item) => item.trim()).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.amenities
                  .filter((item) => item.trim())
                  .map((item, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200"
                    >
                      {item.trim()}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </section>

        {/* Section 5: Món ăn nổi bật */}
        <section aria-label="Món ăn nổi bật" className="space-y-4 pb-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <UtensilsCrossed size={17} aria-hidden="true" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Món ăn nổi bật <span className="text-rose-500" aria-hidden="true">*</span>
              </h4>
              <p className="mt-0.5 text-xs text-slate-400">
                Nhập đúng 3 món đặc trưng của nhà hàng. Đây là thực đơn riêng, không liên kết công thức hệ thống.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {form.featuredDishes.map((dish, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Món nổi bật {index + 1}
                </p>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <label className="block text-sm font-medium text-slate-700">
                    Tên món <span className="text-rose-500" aria-hidden="true">*</span>
                    <input
                      required
                      maxLength={120}
                      className={inputClass('featuredDishes')}
                      placeholder={`Ví dụ: Món chay đặc trưng ${index + 1}`}
                      value={dish.name}
                      onBlur={() => markTouched('featuredDishes')}
                      onChange={(event) => {
                        const featuredDishes = form.featuredDishes.map((currentDish, dishIndex) =>
                          dishIndex === index ? { ...currentDish, name: event.target.value } : currentDish,
                        )
                        const next = { ...form, featuredDishes }
                        setForm(next)
                        markTouched('featuredDishes')
                        runValidation(next)
                      }}
                    />
                  </label>
                  <div>
                    <label htmlFor={`restaurant-featured-dish-${index}`} className="block text-sm font-medium text-slate-700">
                      Ảnh món ăn <span className="text-rose-500" aria-hidden="true">*</span>
                      <input
                        id={`restaurant-featured-dish-${index}`}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingFeaturedDishIndex !== null}
                        className="admin-field mt-1 h-auto w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 transition-all outline-none file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-700 hover:border-slate-300 hover:file:bg-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          event.target.value = ''
                          void uploadFeaturedDishImage(index, file)
                        }}
                      />
                    </label>
                    {uploadingFeaturedDishIndex === index && (
                      <p className="mt-1.5 text-xs font-medium text-emerald-700">Đang tải ảnh...</p>
                    )}
                    {dish.imageUrl && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                        <img
                          src={dish.imageUrl}
                          alt={`Xem trước món nổi bật ${index + 1}`}
                          className="size-10 rounded-md border border-slate-200 object-cover"
                        />
                        <button
                          type="button"
                          className="text-xs font-semibold text-rose-600 hover:underline"
                          onClick={() => {
                            const featuredDishes = form.featuredDishes.map((currentDish, dishIndex) =>
                              dishIndex === index ? { ...currentDish, imageUrl: null } : currentDish,
                            )
                            const next = { ...form, featuredDishes }
                            setForm(next)
                            runValidation(next)
                          }}
                        >
                          Bỏ ảnh
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {renderError('featuredDishes')}
        </section>
      </fieldset>

      <Feedback error={error} />

      <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
        <button
          type="button"
          disabled={busy}
          className={secondaryClass}
          onClick={onCancel}
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={busy}
          className={`${primaryClass} inline-flex items-center gap-2`}
        >
          {busy ? (
            <LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <Check size={16} aria-hidden="true" />
          )}
          {busy ? 'Đang lưu...' : 'Lưu nhà hàng'}
        </button>
      </div>
    </form>
  )
}
