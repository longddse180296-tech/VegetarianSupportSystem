import { useEffect, useMemo, useState } from 'react'
import {
  ChefHat,
  Map as MapIcon,
  RefreshCw,
  Sparkles,
  Star,
  UtensilsCrossed,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  SkeletonLoader,
  StatusBadge,
} from '../../../shared/components'
import {
  filterRestaurants,
  getRestaurantDetail,
} from '../api/restaurantApi'
import { RestaurantCard } from '../components/RestaurantCard'
import { RestaurantFilterBar } from '../components/RestaurantFilter'
import type {
  Restaurant,
  RestaurantCity,
  RestaurantDietType,
  RestaurantFilter,
} from '../types/restaurant.types'
import {
  CITY_LABELS,
  DEFAULT_RESTAURANT_FILTER,
  DIET_TYPE_LABELS,
} from '../types/restaurant.types'

interface RestaurantListPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

export default function RestaurantList({
  onNavigate,
  isLoggedIn: _isLoggedIn,
}: RestaurantListPageProps) {
  const [filter, setFilter] = useState<RestaurantFilter>(DEFAULT_RESTAURANT_FILTER)
  const [items, setItems] = useState<Restaurant[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1500)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const res = await filterRestaurants(DEFAULT_RESTAURANT_FILTER)
        if (cancelled) return
        setItems(res.items)
        setTotalCount(res.totalCount)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

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

  const stats = useMemo(() => {
    const hn = items.filter((r) => r.city === 'Hà Nội').length
    const hcm = items.filter((r) => r.city === 'TP.HCM').length
    const dn = items.filter((r) => r.city === 'Đà Nẵng').length
    const vegan = items.filter((r) =>
      (r.dietTypes as unknown as string[]).includes('vegan'),
    ).length
    const avgRating =
      items.length === 0
        ? 0
        : items.reduce((a, r) => a + r.rating, 0) / items.length
    const delivery = items.filter((r) => r.hasDelivery).length
    return { hn, hcm, dn, vegan, avgRating, delivery }
  }, [items])

  const updateFilter = (patch: Partial<RestaurantFilter>) =>
    setFilter((prev) => ({ ...prev, ...patch }))

  const resetFilter = () => setFilter(DEFAULT_RESTAURANT_FILTER)

  const handleSelect = (id: string) => {
    onNavigate?.(`/restaurants/${encodeURIComponent(id)}`)
  }

  const handleBook = async (id: string) => {
    const r = await getRestaurantDetail(id)
    if (!r) return
    showToast(`📞 Đặt chỗ tại ${r.name}: ${r.phoneNumber}`)
  }

  return (
    <div className="min-h-screen bg-[#f6faf7] text-[#1f2937]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e5e7eb] bg-gradient-to-br from-white via-white to-[#e8f5e9] p-6 shadow-xs sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2e7d32] px-3 py-1 text-[11px] font-extrabold text-white shadow-sm">
                <MapIcon size={12} /> DANH SÁCH 14+ QUÁN ĂN CHAY 3 TỈNH THÀNH
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Khám phá quán ăn thuần thực vật yêu thích quanh bạn
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                Từ Hà Nội, Sài Gòn đến Đà Nẵng, tất cả các quán đều được cộng đồng review & xác minh
                thực tế, dễ dàng lọc theo chế độ ăn bạn đang theo đuổi.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                leftIcon={<ChefHat size={14} />}
                onClick={() => onNavigate?.('/ai-chat')}
              >
                Hỏi AI gợi ý quán gần tôi
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                leftIcon={<RefreshCw size={14} />}
                onClick={async () => {
                  setIsLoading(true)
                  try {
                    const res = await filterRestaurants(filter)
                    setItems(res.items)
                    setTotalCount(res.totalCount)
                  } finally {
                    setIsLoading(false)
                  }
                }}
              >
                Làm mới
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#6b7280]">
                Tổng quán ăn
              </div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-2xl font-extrabold text-[#1f2937]">{totalCount}</div>
                <UtensilsCrossed size={14} className="mb-1 text-[#2e7d32]" />
              </div>
            </div>
            <div className="rounded-[16px] border border-[#c8e6c9] bg-[#e8f5e9]/70 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#2e7d32]">
                Thuần thực vật 100%
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[#2e7d32]">{stats.vegan}</div>
            </div>
            <div className="rounded-[16px] border border-sky-200 bg-sky-50/80 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-sky-700">
                Hà Nội
              </div>
              <div className="mt-1 text-2xl font-extrabold text-sky-700">{stats.hn}</div>
            </div>
            <div className="rounded-[16px] border border-amber-200 bg-amber-50/80 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-amber-700">
                TP.HCM
              </div>
              <div className="mt-1 text-2xl font-extrabold text-amber-700">{stats.hcm}</div>
            </div>
            <div className="rounded-[16px] border border-rose-200 bg-rose-50/80 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-rose-700">
                Đà Nẵng
              </div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-2xl font-extrabold text-rose-700">{stats.dn}</div>
                <span className="mb-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                  <Star size={11} className="fill-amber-500 stroke-amber-500" />
                  ⌀ {stats.avgRating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter */}
        <section className="mb-5">
          <RestaurantFilterBar
            filter={filter}
            onChange={updateFilter}
            onReset={resetFilter}
            totalCount={totalCount}
            isLoading={isLoading}
          />
        </section>

        {/* Applied filter badges */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px]">
          {filter.city !== 'all' && (
            <StatusBadge
              status="info"
              size="sm"
              label={`Khu vực: ${CITY_LABELS[filter.city as RestaurantCity] ?? filter.city}`}
            />
          )}
          {filter.diet !== 'all' && (
            <StatusBadge
              status="suitable"
              size="sm"
              label={`Chế độ: ${DIET_TYPE_LABELS[filter.diet as RestaurantDietType] ?? filter.diet}`}
            />
          )}
          {filter.ratingMin > 0 && (
            <StatusBadge
              status="warning"
              size="sm"
              label={`Đánh giá ≥ ${filter.ratingMin.toFixed(1)} ★`}
            />
          )}
          {filter.deliveryOnly && (
            <StatusBadge status="suitable" size="sm" label="Chỉ xem có giao hàng" />
          )}
          {filter.search.trim() && (
            <StatusBadge
              status="neutral"
              size="sm"
              label={`Từ khóa: "${filter.search.trim()}"`}
            />
          )}
          <div className="ml-auto hidden text-[11px] text-[#6b7280] sm:block">
            <strong className="text-[#1f2937]">{stats.delivery}</strong> trong{' '}
            <strong className="text-[#1f2937]">{totalCount}</strong> quán có dịch vụ giao hàng.
          </div>
        </div>

        {/* Results */}
        <section>
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <SkeletonLoader count={6} variant="card" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Không tìm thấy nhà hàng nào phù hợp"
              description="Bạn hãy thử nới lỏng bộ lọc chế độ ăn, thay đổi khu vực hoặc xóa từ khóa tìm kiếm. Nhấn nút bên dưới để xem toàn bộ danh sách quán ăn chay 3 tỉnh thành."
              actionLabel="Xóa bộ lọc"
              onAction={resetFilter}
              icon={<Sparkles size={36} className="text-[#2e7d32]" />}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((r) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  onSelect={handleSelect}
                  onBook={handleBook}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-[12px] font-bold text-white shadow-lg backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  )
}
