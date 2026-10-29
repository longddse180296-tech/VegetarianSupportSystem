// Chức năng: tra cứu và quản lý nhà hàng. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import { useEffect, useRef, useState } from 'react'
import {
  Compass,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { Badge, EmptyState, PageHeading, SkeletonCard } from '../../../shared/components'
import {
  filterRestaurants,
  getRestaurantDetail,
} from '../api/restaurantApi'
import { RestaurantCard } from '../components/RestaurantCard'
import { RestaurantFilterBar } from '../components/RestaurantFilter'
import { RestaurantRealMap } from '../components/RestaurantRealMap'
import type {
  Restaurant,
  RestaurantFilter as RestaurantFilterState,
} from '../types/restaurant.types'
import { DEFAULT_RESTAURANT_FILTER } from '../types/restaurant.types'
import { RestaurantLocationPicker, type RestaurantLocationSelection } from '../components/RestaurantLocationPicker'
import { hasRestaurantLocation } from '../utils/restaurantLocation'

// Cấu trúc RestaurantsPageProps quy định dữ liệu trao đổi trong tra cứu và quản lý nhà hàng.
interface RestaurantsPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

// Danh sách nhà hàng và vị trí dùng chung một mốc tọa độ để giữ đúng thứ tự gần nhất.
export default function RestaurantsPage({
  onNavigate,
  isLoggedIn: _isLoggedIn,
}: RestaurantsPageProps) {
  // Lưu dữ liệu và trạng thái thao tác của tra cứu và quản lý nhà hàng trong vòng đời màn hình.
  const [filter, setFilter] = useState<RestaurantFilterState>(DEFAULT_RESTAURANT_FILTER)
  const [items, setItems] = useState<Restaurant[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [selectedMapRestaurant, setSelectedMapRestaurant] = useState<Restaurant | null>(null)

  // Location Permission State: 'prompt' | 'granted' | 'denied'
  const [locationState, setLocationState] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [manualLocation, setManualLocation] = useState<RestaurantLocationSelection | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const locationRequest = useRef(0)
  const hasLocation = hasRestaurantLocation(filter)
  // Bỏ qua callback GPS đến muộn sau khi đổi sang chọn thủ công hoặc rời trang.
  useEffect(() => () => { locationRequest.current++ }, [])
  // Quay lại tab người dùng sau thao tác Admin thì lấy trạng thái công khai mới, giữ mốc vị trí/bộ lọc.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setFilter(previous => ({ ...previous }))
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (showToast); thuộc tra cứu và quản lý nhà hàng.
  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2200)
  }

  // Debounced filter update
  // Đồng bộ trạng thái hoặc tác động bên ngoài khi các phụ thuộc thay đổi.
  useEffect(() => {
    let cancelled = false
    const t = window.setTimeout(() => {
      ;(async () => {
        setIsLoading(true)
        setIsError(false)
        try {
          const res = await filterRestaurants(filter)
          if (cancelled) return
          setItems(res.items)
          setTotalCount(res.totalCount)
          setSelectedMapRestaurant((prev) =>
            prev && res.items.some((x) => x.id === prev.id)
              ? prev
              : res.items.length > 0
              ? res.items[0]
              : null,
          )
        } catch {
          if (!cancelled) {
            setIsError(true)
            setItems([])
            setTotalCount(0)
          }
        } finally {
          if (!cancelled) setIsLoading(false)
        }
      })()
    }, 200)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [filter])

  // Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (updateFilter); thuộc tra cứu và quản lý nhà hàng.
  const updateFilter = (patch: Partial<RestaurantFilterState>) => {
    // Không hiện khoảng cách của vị trí cũ trong lúc đang tải kết quả cho vị trí mới.
    setIsLoading(true)
    setFilter((prev) => ({ ...prev, ...patch }))
  }

  // Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (resetFilter); thuộc tra cứu và quản lý nhà hàng.
  const resetFilter = () => {
    setIsLoading(true)
    setFilter(previous => ({ ...DEFAULT_RESTAURANT_FILTER, latitude: previous.latitude, longitude: previous.longitude,
      sort: hasRestaurantLocation(previous) ? 'distance_asc' : 'relevance' }))
    showToast('Đã đặt lại toàn bộ bộ lọc.')
  }

  // Xử lý lựa chọn hoặc chuyển trạng thái giao diện theo thao tác người dùng (handleSelect); thuộc tra cứu và quản lý nhà hàng.
  const handleSelect = (id: string) => {
    onNavigate?.(`/restaurants/${encodeURIComponent(id)}`)
  }

  // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (handleBook); thuộc tra cứu và quản lý nhà hàng.
  const handleBook = async (id: string) => {
    const r = await getRestaurantDetail(id)
    if (!r) return
    showToast(`📞 Đặt chỗ tại ${r.name.replace(/^\[Demo\]\s*/i, '')}: ${r.phoneNumber}`)
  }

  // GPS chỉ dùng sau thao tác cho phép; tọa độ gửi về API dự án, không gửi sang dịch vụ tra cứu khu vực.
  const requestLocation = () => {
    if (isLocating) return
    if (!navigator.geolocation) {
      setLocationState('denied')
      setLocationError('Trình duyệt chưa hỗ trợ định vị. Bạn có thể chọn khu vực bên dưới.')
      return
    }
    const request = ++locationRequest.current
    setIsLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(position => {
      if (request !== locationRequest.current) return
      const latitude = Number(position.coords.latitude.toFixed(6))
      const longitude = Number(position.coords.longitude.toFixed(6))
      setIsLocating(false)
      if (!hasRestaurantLocation({ latitude, longitude })) {
        setLocationError('Chưa nhận được vị trí hợp lệ. Vui lòng thử lại hoặc chọn khu vực.')
        return
      }
      setLocationState('granted')
      setManualLocation(null)
      updateFilter({ latitude, longitude, city: 'all', sort: 'distance_asc' })
    }, error => {
      if (request !== locationRequest.current) return
      setIsLocating(false)
      setLocationState('denied')
      setLocationError(error.code === 1
        ? 'Bạn chưa cho phép truy cập vị trí. Hãy chọn khu vực hoặc bật quyền vị trí trong trình duyệt.'
        : 'Chưa lấy được vị trí hiện tại. Bạn có thể thử lại hoặc chọn khu vực bên dưới.')
    }, { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true })
  }
  const chooseManual = () => {
    locationRequest.current++
    setIsLocating(false)
    setLocationState('denied')
    setManualLocation(null)
    setLocationError(null)
    updateFilter({ latitude: undefined, longitude: undefined, city: 'all', distanceMaxKm: 0, sort: 'relevance' })
  }
  const changeManualLocation = (next: RestaurantLocationSelection | null) => {
    locationRequest.current++
    setIsLocating(false)
    setLocationError(null)
    setManualLocation(next)
    updateFilter({ latitude: next?.latitude, longitude: next?.longitude, city: 'all', distanceMaxKm: 0,
      sort: next ? 'distance_asc' : 'relevance' })
  }

  // Hiển thị giao diện tra cứu và quản lý nhà hàng từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="ui-page-container py-8 space-y-6">
      <PageHeading
        title="Nhà hàng chay gần bạn"
        description="Khám phá các nhà hàng và quán ăn chay thanh tịnh, dinh dưỡng phù hợp quanh khu vực của bạn."
        breadcrumbs={[
          { label: 'Trang chủ', onClick: () => onNavigate?.('/') },
          { label: 'Nhà hàng chay' },
        ]}
        eyebrow={<Badge icon={<MapPin size={14} />}>Địa điểm ẩm thực chay</Badge>}
      />

        {/* Vị trí tự động và thủ công cùng cập nhật mốc sắp xếp, không trộn vị trí cũ với khu vực mới. */}
        <section aria-label="Vị trí tìm nhà hàng" className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div className="flex min-w-0 gap-3 text-sm text-emerald-950">
              <Compass size={22} className="shrink-0" />
              <div>
                <h2 className="font-bold">{locationState === 'granted' ? 'Nhà hàng gần vị trí của bạn' : 'Chọn vị trí tìm nhà hàng'}</h2>
                <p className="mt-1 text-xs text-slate-600">{hasLocation
                  ? manualLocation ? 'Đang xếp gần nhất từ ' + manualLocation.label + '.' : 'Đang xếp nhà hàng theo khoảng cách gần nhất.'
                  : 'Cho phép định vị hoặc chọn khu vực để xem khoảng cách và nhà hàng gần nhất.'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {locationState !== 'denied' && <button type="button" onClick={chooseManual}
                className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-900">Chọn thủ công</button>}
              <button type="button" onClick={requestLocation} disabled={isLocating}
                className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
                {isLocating ? 'Đang lấy vị trí…' : locationState === 'granted' ? 'Cập nhật vị trí' : 'Dùng vị trí hiện tại'}
              </button>
            </div>
          </div>
          {locationError && <p role="status" className="text-xs text-amber-900">{locationError}</p>}
          {locationState === 'denied' && <RestaurantLocationPicker value={manualLocation} onChange={changeManualLocation} />}
          {hasLocation && <p className="text-xs text-slate-600">{manualLocation
            ? 'Khoảng cách ước tính theo đường chim bay từ tâm khu vực đã chọn.'
            : 'Khoảng cách ước tính theo đường chim bay từ vị trí thiết bị.'}</p>}
        </section>

        {/* ===== Search + Filter bar ===== */}
        <div className="mb-6">
          <RestaurantFilterBar
            filter={filter}
            onChange={updateFilter}
            onReset={resetFilter}
            totalCount={totalCount}
            isLoading={isLoading}
          />
        </div>


        {/* ===== MAIN LAYOUT: ĐẢO NGƯỢC TỈ LỆ (Danh sách 2/3, Bản đồ 1/3) ===== */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* ================= CỘT TRÁI (2/3 = 8 CỘT): Danh sách nhà hàng ================= */}
          <div className="flex flex-col gap-4 lg:col-span-8">

            {/* Restaurant List / SkeletonCard Grid / EmptyState */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : isError ? (
              <EmptyState
                title="Không thể kết nối đến máy chủ"
                description="Mất kết nối hoặc máy chủ phản hồi quá lâu, vui lòng thử lại."
                actionLabel="Thử lại"
                onAction={() => updateFilter({})}
                icon={<Sparkles size={40} className="text-red-500" />}
              />
            ) : items.length === 0 ? (
              <EmptyState
                title="Không có nhà hàng nào phù hợp"
                description="Bạn hãy thử nới lỏng bộ lọc khoảng cách, chọn quận/huyện khác hoặc xóa từ khóa tìm kiếm để khám phá thêm địa điểm."
                actionLabel="Xóa bộ lọc"
                onAction={resetFilter}
                icon={<Sparkles size={40} className="text-emerald-600" />}
              />
            ) : (
              <div className="flex flex-col gap-4">
                {items.map((r, idx) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedMapRestaurant(r)}
                    className="cursor-pointer transition-transform"
                  >
                    <RestaurantCard
                      restaurant={r}
                      showDistance={hasLocation}
                      featured={idx === 0}
                      isSelected={selectedMapRestaurant?.id === r.id}
                      onSelect={handleSelect}
                      onBook={handleBook}
                      variant="horizontal"
                      onNavigate={onNavigate}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ================= CỘT PHẢI (1/3 = 4 CỘT): BẢN ĐỒ THỰC TẾ LEAFLET ================= */}
          <div className="sticky top-20 flex flex-col overflow-hidden rounded-[20px] border border-slate-200/90 bg-white shadow-xs lg:col-span-4">
            <div className="h-[580px] w-full">
              <RestaurantRealMap
                restaurants={items}
                selectedRestaurant={selectedMapRestaurant}
                onSelectRestaurant={(r) => setSelectedMapRestaurant(r)}
                onNavigate={onNavigate}
              />
            </div>
          </div>
        </div>

      {/* Toast popup */}
      {toast && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-10 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur transition-all"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
