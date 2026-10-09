import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChefHat as _unused,
  Compass,
  Leaf,
  LocateFixed,
  Sparkles,
  Target,
  UtensilsCrossed,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  SkeletonLoader,
} from '../../../shared/components'
import {
  filterRestaurants,
  getDishChips,
  getRestaurantDetail,
} from '../api/restaurantApi'
import { RestaurantCard } from '../components/RestaurantCard'
import { RestaurantFilterBar } from '../components/RestaurantFilter'
import type {
  DishChip,
  Restaurant,
  RestaurantFilter as RestaurantFilterState,
} from '../types/restaurant.types'
import { DEFAULT_RESTAURANT_FILTER } from '../types/restaurant.types'

interface RestaurantListPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

export default function RestaurantList({
  onNavigate,
  isLoggedIn: _isLoggedIn,
}: RestaurantListPageProps) {
  const [filter, setFilter] =
    useState<RestaurantFilterState>(DEFAULT_RESTAURANT_FILTER)
  const [items, setItems] = useState<Restaurant[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [profileOnly, setProfileOnly] = useState(true)
  const [geoOn, setGeoOn] = useState(true)
  const [sortPill, setSortPill] = useState<'distance_asc' | 'relevance' | 'rating_desc'>(
    'distance_asc',
  )
  const [dishChips, setDishChips] = useState<DishChip[]>([])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1500)
  }

  // Initial load
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const [res, chips] = await Promise.all([
          filterRestaurants(DEFAULT_RESTAURANT_FILTER),
          getDishChips(),
        ])
        if (cancelled) return
        setItems(res.items)
        setTotalCount(res.totalCount)
        setDishChips(chips)
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
        try {
          const res = await filterRestaurants(filter)
          if (cancelled) return
          setItems(res.items)
          setTotalCount(res.totalCount)
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
    setSortPill('distance_asc')
  }

  const handleSelect = (id: string) => {
    onNavigate?.(`/restaurants/${encodeURIComponent(id)}`)
  }

  const handleBook = async (id: string) => {
    const r = await getRestaurantDetail(id)
    if (!r) return
    showToast(`📞 Đặt chỗ tại ${r.name}: ${r.phoneNumber}`)
  }

  const sortedItems = useMemo(() => {
    const arr = [...items]
    if (sortPill === 'distance_asc') {
      return arr.sort((a, b) => a.distanceKm - b.distanceKm)
    }
    if (sortPill === 'rating_desc') {
      return arr.sort((a, b) => b.rating - a.rating)
    }
    return arr
  }, [items, sortPill])

  /* ============================================================ */
  /*                                                              */
  /*                      RENDER                                  */
  /*                                                              */
  /* ============================================================ */
  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#121C2A] font-['Inter']">
      <div className="mx-auto w-full max-w-[1200px] px-[24px] py-6 sm:px-[16px]">
        {/* ===== Breadcrumb + GEO toggle ===== */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12px] text-[#4E6558] font-semibold">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onNavigate?.('/')}
              className="!p-0 !h-auto !text-[#1F7A3F] hover:!underline !font-semibold"
            >
              Trang chủ
            </Button>
            <span className="text-[#B3C4B8]">›</span>
            <span className="font-bold text-[#0A1F14]">Nhà hàng chay</span>
          </nav>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setGeoOn((v) => !v)
              showToast(geoOn ? 'Đã tạm tắt vị trí.' : 'Đã bật định vị gần bạn.')
            }}
            leftIcon={<LocateFixed size={13} />}
            className="rounded-full border border-[#DDE8E1] bg-white !text-[12px] !font-bold !text-[#1F7A3F] hover:!bg-[#EAF5EC] !h-[32px]"
          >
            Sử dụng vị trí hiện tại
          </Button>
        </div>

        {/* ===== Header ===== */}
        <header className="mb-5">
          <h1
            className="font-bold tracking-[-0.015em] text-[#0A1F14] sm:text-[26px] sm:leading-[34px]"
            style={{ fontSize: '36px', lineHeight: '44px' }}
          >
            Nhà hàng chay gần bạn
          </h1>
          <p
            className="mt-1.5 font-normal text-[#6B7280] max-w-[720px]"
            style={{ fontSize: '16px', lineHeight: '24px' }}
          >
            Khám phá các nhà hàng và quán ăn chay thanh tịnh, ăn uống đủ chất phù hợp gần với vị trí hiện tại của bạn.
          </p>
        </header>

        {/* ===== Location permission banner ===== */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#C9E5D0] bg-gradient-to-r from-[#E7F7EB] to-[#F2FBF4] px-4 py-3">
          <div className="flex items-start gap-2.5 text-[#143A23] font-semibold" style={{ fontSize: '13.5px', lineHeight: '1.4' }}>
            <Compass size={17} className="mt-[2px] shrink-0 text-[#1F7A3F]" />
            Cho phép truy cập vị trí để tìm nhà hàng chay gần bạn chính xác nhất.
          </div>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={() => showToast('✅ Đã cấp phép vị trí (demo).')}
          >
            Cho phép vị trí
          </Button>
        </div>

        {/* ===== Search + Filter bar ===== */}
        <div className="mb-6">
          <RestaurantFilterBar
            filter={filter}
            onChange={(patch) => {
              updateFilter(patch)
              if (patch.sort === 'distance_asc') setSortPill('distance_asc')
              if (patch.sort === 'rating_desc') setSortPill('rating_desc')
              if (patch.sort === 'relevance') setSortPill('relevance')
            }}
            onReset={resetFilter}
            totalCount={totalCount}
            isLoading={isLoading}
          />
        </div>

        {/* ===== MAIN 2-COL ===== */}
        <div className="w-full grid grid-cols-1 items-start gap-5 lg:grid lg:grid-cols-[1.25fr_0.95fr]">
          {/* ===== CỘT TRÁI: List ===== */}
          <div className="flex flex-col gap-4">
            {/* Profile banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#E3EFE5] bg-white p-3.5 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#E7F7EB] text-[#1F7A3F]">
                  <Leaf size={20} />
                </div>
                <div className="flex flex-col">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <strong className="text-[13.5px] text-[#0A1F14]">
                      Chỉ hiện thị nhà hàng phù hợp với hồ sơ của tôi
                    </strong>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F7EB] px-2 py-[1px] text-[10.5px] font-extrabold text-[#1F7A3F]">
                      <Sparkles size={10} /> Thông minh
                    </span>
                  </div>
                  <p className="m-0 text-[12.5px] text-[#55695D] leading-snug">
                    Hồ sơ của bạn: <strong className="text-[#1F7A3F]">Thuần chay (Vegan)</strong> • Tự động lọc các địa điểm đạt chuẩn.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={profileOnly}
                onClick={() => setProfileOnly((v) => !v)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setProfileOnly((v) => !v)
                  }
                }}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  profileOnly ? 'bg-[#2E7D32]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
                    profileOnly ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* List header + sort */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3
                className="inline-flex items-center gap-2 font-extrabold text-[#0A1F14]"
                style={{ fontSize: '17px', lineHeight: '24px' }}
              >
                <Target size={18} className="text-[#2E7D32]" />
                Gần vị trí của bạn
                <span className="rounded-full bg-[#E7F7EB] px-2 py-[2px] text-[11.5px] font-extrabold text-[#1F7A3F]">
                  {totalCount} địa điểm
                </span>
              </h3>
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#3A5244]">
                <span>Sắp xếp:</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSortPill((p) =>
                      p === 'distance_asc'
                        ? 'relevance'
                        : p === 'relevance'
                          ? 'rating_desc'
                          : 'distance_asc',
                    )
                  }
                  rightIcon={<ChevronDown size={12} />}
                  className="rounded-[10px] border border-[#DCE7DF] bg-white !px-2.5 !py-1 !text-[12px] !font-extrabold !text-[#0A1F14] hover:!border-[#B7D9C1] !h-[30px]"
                >
                  {sortPill === 'distance_asc'
                    ? 'Gần nhất'
                    : sortPill === 'rating_desc'
                      ? 'Đánh giá cao'
                      : 'Phù hợp nhất'}
                </Button>
              </div>
            </div>

            {/* Restaurant list */}
            {isLoading ? (
              <div className="flex flex-col gap-3.5">
                <SkeletonLoader count={4} variant="card" />
              </div>
            ) : sortedItems.length === 0 ? (
              <EmptyState
                title="Không tìm thấy nhà hàng nào phù hợp"
                description="Bạn hãy thử nới lỏng bộ lọc chế độ ăn, thay đổi khu vực hoặc xóa từ khóa tìm kiếm. Nhấn nút bên dưới để xem toàn bộ danh sách quán ăn chay 3 tỉnh thành."
                actionLabel="Xóa bộ lọc"
                onAction={resetFilter}
                icon={<Sparkles size={40} className="text-[#2E7D32]" />}
              />
            ) : (
              <div className="flex flex-col gap-3.5">
                {sortedItems.map((r, idx) => (
                  <RestaurantCard
                    key={r.id}
                    restaurant={r}
                    featured={idx === 0}
                    onSelect={handleSelect}
                    onBook={handleBook}
                    variant="horizontal"
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            )}

            {/* Dish chips: Đang tìm món này? */}
            <div className="rounded-[16px] border border-[#E3EFE5] bg-white p-4 sm:p-5 mt-1">
              <h4
                className="m-0 font-extrabold text-[#0A1F14]"
                style={{ fontSize: '15px', lineHeight: '22px' }}
              >
                Đang tìm món này?
              </h4>
              <p
                className="m-0 mt-0.5 text-[#4E6558]"
                style={{ fontSize: '12.5px', lineHeight: '18px' }}
              >
                Chọn món ăn để tìm các nhà hàng có phục vụ món bạn thích:
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {dishChips.map((d) => (
                  <Button
                    type="button"
                    key={d.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateFilter({ search: d.label })
                      showToast(`🔎 Đã lọc theo món "${d.label}" (${d.count} địa điểm).`)
                    }}
                    leftIcon={<span>{d.emoji}</span>}
                    className="rounded-full border border-[#DDE5EC] bg-[#F0F4F8] !px-2.5 !py-[6px] !text-[12px] !font-bold !text-[#324253] transition hover:!border-[#B7D9C1] hover:!bg-[#EAF5EC] !h-[28px]"
                  >
                    {d.label} ({d.count})
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* ===== CỘT PHẢI: MAP placeholder ===== */}
          <div className="hidden lg:block h-[640px] min-h-[400px] rounded-[16px] border border-[#E5E7EB] bg-[#E8F5E9]/50 p-2 sticky top-24 overflow-hidden">
            <div className="h-full w-full rounded-[10px] bg-gradient-to-br from-[#e8f5e9] via-[#c8e6c9] to-[#2E7D32]/30 grid place-items-center text-[#1f2937]">
              <p className="text-sm font-bold">🗺️ Bản đồ khu vực</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Toast ===== */}
      {toast && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-10 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2 font-semibold text-white shadow-lg backdrop-blur"
          style={{ fontSize: '13px', lineHeight: '20px' }}
        >
          {toast}
        </div>
      )}

      {/* Silence unused imports */}
      <span className="hidden">
        <UtensilsCrossed />
      </span>
    </div>
  )
}
