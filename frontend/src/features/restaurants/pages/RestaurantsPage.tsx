import { useEffect, useRef, useState } from 'react'
import {
  Compass,
  Navigation,
  Sparkles,
} from 'lucide-react'
import {
  PageHeading,
  EmptyState,
  SkeletonLoader,
} from '../../../shared/components'
import {
  filterRestaurants,
} from '../api/restaurantApi'
import { RestaurantCard } from '../components/RestaurantCard'
import { RestaurantFilterBar } from '../components/RestaurantFilter'
import type {
  Restaurant,
  RestaurantFilter as RestaurantFilterState,
} from '../types/restaurant.types'
import { DEFAULT_RESTAURANT_FILTER } from '../types/restaurant.types'
import AlertError from '../../../shared/components/AlertError'
import { profileApi } from '../../profile/api/profileApi'
import { useAuth } from '../../auth'

interface RestaurantsPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

export default function RestaurantsPage({
  onNavigate,
  isLoggedIn = false,
}: RestaurantsPageProps) {
  const { isAuthenticated } = useAuth()
  const canReadProfile = isLoggedIn || isAuthenticated
  const savedArea = useRef('')
  const [filter, setFilter] = useState<RestaurantFilterState>(DEFAULT_RESTAURANT_FILTER)
  const [items, setItems] = useState<Restaurant[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [selectedMapRestaurant, setSelectedMapRestaurant] = useState<Restaurant | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1800)
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Trình duyệt này không hỗ trợ định vị.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setFilter((current) => ({
          ...current,
          latitude: coords.latitude,
          longitude: coords.longitude,
          search: current.search === savedArea.current ? '' : current.search,
        }))
        showToast('Đã dùng vị trí hiện tại để tìm nhà hàng.')
      },
      () => showToast('Không lấy được vị trí. Bạn vẫn có thể tìm theo khu vực.'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    )
  }

  useEffect(() => {
    if (!canReadProfile) return
    let active = true
    void profileApi.getProfile().then((profile) => {
      if (!active) return
      const area = profile.preferredRegion?.trim()
      savedArea.current = area || ''
      if (area) setFilter(current => current.latitude === null && current.longitude === null && !current.search && current.city === 'all' ? { ...current, search: area } : current)
    }).catch(() => undefined)
    return () => { active = false }
  }, [canReadProfile])

  // Debounced filter update
  useEffect(() => {
    let cancelled = false
    const t = window.setTimeout(() => {
      ;(async () => {
        setIsLoading(true)
        setLoadError(null)
        try {
          const res = await filterRestaurants(filter)
          if (cancelled) return
          setItems(res.items)
          setTotalCount(res.totalCount)
          setSelectedMapRestaurant((prev) => res.items.find((item) => item.id === prev?.id) ?? res.items[0] ?? null)
        } catch (error) {
          if (!cancelled) {
            setItems([])
            setSelectedMapRestaurant(null)
            setLoadError(error instanceof Error ? error.message : 'Không thể tải nhà hàng.')
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
    showToast('Đã đặt lại toàn bộ bộ lọc.')
  }

  const handleSelect = (id: string) => {
    onNavigate?.(`/restaurants/${encodeURIComponent(id)}`)
  }

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#121C2A] font-sans">
      <div className="ui-page-container py-6">
        <PageHeading
          title="Nhà hàng chay gần bạn"
          description="Khám phá các nhà hàng và quán ăn chay gần vị trí hiện tại của bạn."
          breadcrumbs={[{label:'Trang chủ', onClick: () => onNavigate?.('/')}, {label:'Nhà hàng chay'}]}
        />

        {/* ===== Location permission banner ===== */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#C9E5D0] bg-gradient-to-r from-[#E7F7EB] to-[#F2FBF4] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5 text-[#143A23] text-sm font-semibold">
            <Compass size={18} className="shrink-0 text-[#2E7D32]" />
            <span>Cho phép truy cập vị trí để tìm nhà hàng chay gần bạn chính xác nhất.</span>
          </div>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="rounded-[10px] bg-[#2E7D32] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1B5E20]"
          >
            Cho phép vị trí
          </button>
        </div>

        {/* ===== Search + Filter bar ===== */}
        {filter.latitude === null && <p className="mb-4 text-sm text-text-muted">Chưa có tọa độ: tìm theo tên hoặc khu vực, có thể dùng khu vực đã lưu trong hồ sơ. Khoảng cách chỉ được tính khi có vị trí.</p>}
        <div className="mb-6">
          <RestaurantFilterBar
            filter={filter}
            onChange={updateFilter}
            onReset={resetFilter}
            totalCount={totalCount}
            isLoading={isLoading}
          />
        </div>

        {/* ===== MAIN 2-COLUMN LAYOUT ===== */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.15fr_0.95fr]">
          {/* ================= CỘT TRÁI: Danh sách nhà hàng ================= */}
          <div className="flex flex-col gap-4">
            {/* Restaurant List / SkeletonLoader / EmptyState */}
            {loadError ? <AlertError title="Không thể tải nhà hàng" message={loadError} onRetry={() => setFilter((current) => ({ ...current }))} /> : isLoading ? (
              <div className="flex flex-col gap-3.5">
                <SkeletonLoader count={6} variant="card" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                title="Không tìm thấy nhà hàng nào phù hợp"
                description="Bạn hãy thử nới lỏng bộ lọc tiện ích, giảm khoảng cách hoặc xóa từ khóa tìm kiếm để khám phá thêm địa điểm."
                actionLabel="Xóa bộ lọc"
                onAction={resetFilter}
                icon={<Sparkles size={40} className="text-[#2E7D32]" />}
              />
            ) : (
              <div className="flex flex-col gap-3.5">
                {items.map((r, idx) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedMapRestaurant(r)}
                    className="cursor-pointer"
                  >
                    <RestaurantCard
                      restaurant={r}
                      featured={idx === 0}
                      onSelect={handleSelect}
                      variant="horizontal"
                      onNavigate={onNavigate}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ================= CỘT PHẢI: BẢN ĐỒ TƯƠNG TÁC ĐƠN GIẢN, SẠCH SẼ ================= */}
          <div className="sticky top-20 flex flex-col overflow-hidden rounded-[16px] border border-[#DCE7DF] bg-white shadow-[0_8px_24px_rgba(31,122,63,0.06)]">
            <div className="p-5">
              <h2 className="text-lg font-semibold">Vị trí &amp; chỉ đường</h2>
              {filter.latitude !== null && filter.longitude !== null && (
                <iframe
                  title="Bản đồ vị trí tìm kiếm"
                  className="mt-4 h-64 w-full rounded-xl border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${filter.longitude - 0.02},${filter.latitude - 0.02},${filter.longitude + 0.02},${filter.latitude + 0.02}&layer=mapnik&marker=${filter.latitude},${filter.longitude}`}
                />
              )}
              {selectedMapRestaurant ? (
                <div className="mt-4 space-y-3">
                  <h3 className="font-semibold">{selectedMapRestaurant.name}</h3>
                  <p className="text-sm text-text-muted">{selectedMapRestaurant.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedMapRestaurant.name + ', ' + selectedMapRestaurant.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  ><Navigation size={16} /> Mở địa chỉ trên bản đồ</a>
                </div>
              ) : (
                <p className="mt-4 text-sm text-text-muted">Chọn một nhà hàng trong danh sách để xem địa chỉ và mở chỉ đường.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast popup */}
      {toast && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-10 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur transition-all"
        >
          {toast}
        </div>
      )}
    </div>
  )
}

