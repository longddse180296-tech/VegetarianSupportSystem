import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
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

interface RestaurantsPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

// Popular districts for manual location selection fallback
const POPULAR_DISTRICTS = [
  { value: 'all', label: 'Tất cả Quận / Huyện' },
  { value: 'Quận 1', label: 'Quận 1, TP.HCM' },
  { value: 'Quận 3', label: 'Quận 3, TP.HCM' },
  { value: 'Quận 7', label: 'Quận 7, TP.HCM' },
  { value: 'Thủ Đức', label: 'TP. Thủ Đức, TP.HCM' },
  { value: 'Bình Thạnh', label: 'Bình Thạnh, TP.HCM' },
  { value: 'Ba Đình', label: 'Ba Đình, Hà Nội' },
  { value: 'Hoàn Kiếm', label: 'Hoàn Kiếm, Hà Nội' },
  { value: 'Tây Hồ', label: 'Tây Hồ, Hà Nội' },
  { value: 'Hải Châu', label: 'Hải Châu, Đà Nẵng' },
  { value: 'Sơn Trà', label: 'Sơn Trà, Đà Nẵng' },
]

interface AmberDistrictSelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}

function AmberDistrictSelect({ value, onChange, options }: AmberDistrictSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value) || options[0]

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative inline-block text-left min-w-[210px]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Chọn Quận / Huyện"
        className={`h-9 w-full flex items-center justify-between gap-2 rounded-xl border bg-white px-3 text-xs font-semibold text-amber-950 transition-all duration-150 outline-none cursor-pointer shadow-2xs ${
          isOpen
            ? 'border-amber-500 ring-2 ring-amber-400/30'
            : 'border-amber-300 hover:border-amber-400 hover:bg-amber-50/40'
        }`}
      >
        <span className="truncate flex items-center gap-1.5">
          <MapPin size={13} className="text-amber-600 shrink-0" />
          <span className="truncate">{selected.label}</span>
        </span>
        <ChevronDown
          size={14}
          className={`text-amber-700 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute left-0 top-full mt-1.5 w-full min-w-[220px] z-50 rounded-xl border border-amber-200/90 bg-white p-1.5 shadow-xl shadow-amber-950/10 max-h-60 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-100"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                type="button"
                role="option"
                key={opt.value}
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-amber-100 text-amber-950 font-bold'
                    : 'text-slate-700 hover:bg-amber-50 hover:text-amber-950 font-medium'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={13} className="text-amber-700 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function RestaurantsPage({
  onNavigate,
  isLoggedIn: _isLoggedIn,
}: RestaurantsPageProps) {
  const [filter, setFilter] = useState<RestaurantFilterState>(DEFAULT_RESTAURANT_FILTER)
  const [items, setItems] = useState<Restaurant[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [selectedMapRestaurant, setSelectedMapRestaurant] = useState<Restaurant | null>(null)

  // Location Permission State: 'prompt' | 'granted' | 'denied'
  const [locationState, setLocationState] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all')

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2200)
  }

  // Initial load
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      setIsError(false)
      try {
        const res = await filterRestaurants(DEFAULT_RESTAURANT_FILTER)
        if (cancelled) return
        setItems(res.items)
        setTotalCount(res.totalCount)
        if (res.items.length > 0) {
          setSelectedMapRestaurant(res.items[0])
        }
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
    return () => {
      cancelled = true
    }
  }, [])

  // Debounced filter update
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

  const updateFilter = (patch: Partial<RestaurantFilterState>) => {
    setFilter((prev) => ({ ...prev, ...patch }))
  }

  const resetFilter = () => {
    setFilter(DEFAULT_RESTAURANT_FILTER)
    setSelectedDistrict('all')
    showToast('Đã đặt lại toàn bộ bộ lọc.')
  }

  const handleSelect = (id: string) => {
    onNavigate?.(`/restaurants/${encodeURIComponent(id)}`)
  }

  const handleBook = async (id: string) => {
    const r = await getRestaurantDetail(id)
    if (!r) return
    showToast(`📞 Đặt chỗ tại ${r.name.replace(/^\[Demo\]\s*/i, '')}: ${r.phoneNumber}`)
  }

  // Handle Geolocation Request
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState('denied')
      showToast('Trình duyệt không hỗ trợ định vị tự động. Vui lòng chọn quận/huyện.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState('granted')
        const lat = Number(position.coords.latitude.toFixed(6))
        const lng = Number(position.coords.longitude.toFixed(6))
        updateFilter({ latitude: lat, longitude: lng })
        showToast('✅ Đã xác định vị trí hiện tại thành công!')
      },
      (_err) => {
        setLocationState('denied')
        showToast('Không thể lấy vị trí tự động. Hãy chọn Quận/Huyện thủ công bên dưới.')
      },
      { timeout: 8000 },
    )
  }

  // Handle Manual District Selection with corresponding center coordinates
  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district)
    const districtCoords: Record<string, { lat: number; lng: number }> = {
      'Quận 1': { lat: 10.7769, lng: 106.7008 },
      'Quận 3': { lat: 10.7841, lng: 106.6868 },
      'Quận 7': { lat: 10.7295, lng: 106.7219 },
      'Thủ Đức': { lat: 10.85, lng: 106.7717 },
      'Bình Thạnh': { lat: 10.803, lng: 106.709 },
      'Ba Đình': { lat: 21.0359, lng: 105.8198 },
      'Hoàn Kiếm': { lat: 21.0285, lng: 105.8542 },
      'Tây Hồ': { lat: 21.0673, lng: 105.8241 },
      'Hải Châu': { lat: 16.0471, lng: 108.2068 },
      'Sơn Trà': { lat: 16.07, lng: 108.235 },
    }

    if (district === 'all') {
      updateFilter({ city: 'all' })
    } else {
      const coords = districtCoords[district]
      updateFilter({
        city: district,
        ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
      })
    }
  }

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

        {/* ===== Location Banner with Fallback Manual Selection ===== */}
        {locationState === 'prompt' && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 to-teal-50/70 p-4 sm:px-5 shadow-xs">
            <div className="flex items-center gap-3 text-emerald-950 text-xs sm:text-sm font-semibold">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Compass size={20} />
              </span>
              <span>Cho phép truy cập vị trí để tìm nhà hàng chay gần bạn chính xác nhất.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLocationState('denied')}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Chọn thủ công
              </button>
              <button
                type="button"
                onClick={requestLocation}
                className="rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] px-4 py-2 text-xs font-bold text-white shadow-xs transition"
              >
                Cho phép vị trí
              </button>
            </div>
          </div>
        )}

        {/* Fallback UI: Khi người dùng từ chối hoặc chọn tìm thủ công theo Quận/Huyện */}
        {locationState === 'denied' && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-amber-200 bg-amber-50/80 p-4 sm:px-5 shadow-xs">
            <div className="flex items-center gap-3 text-amber-950 text-xs sm:text-sm font-medium">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <MapPin size={18} />
              </span>
              <div>
                <strong className="font-bold">Tìm thủ công theo Quận/Huyện:</strong>
                <p className="text-xs text-amber-800/90">Chọn khu vực để xem danh sách quán ăn chay tương ứng.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AmberDistrictSelect
                value={selectedDistrict}
                onChange={handleDistrictChange}
                options={POPULAR_DISTRICTS}
              />

              <button
                type="button"
                onClick={requestLocation}
                className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100/50 transition-colors"
              >
                <Compass size={13} />
                <span>Bật lại định vị</span>
              </button>
            </div>
          </div>
        )}

        {/* Granted state indicator */}
        {locationState === 'granted' && (
          <div className="mb-5 flex items-center justify-between rounded-[16px] border border-emerald-200 bg-emerald-50/60 px-4 py-2.5 text-xs text-emerald-900">
            <span className="flex items-center gap-2 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
              Đang định vị quanh vị trí của bạn (bán kính ưu tiên 10km)
            </span>
            <button
              type="button"
              onClick={() => setLocationState('denied')}
              className="text-emerald-700 underline font-semibold hover:text-emerald-800"
            >
              Đổi khu vực
            </button>
          </div>
        )}

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
