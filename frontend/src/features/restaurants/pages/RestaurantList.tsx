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

  const handleReload = async () => {
    setIsLoading(true)
    try {
      const res = await filterRestaurants(filter)
      setItems(res.items)
      setTotalCount(res.totalCount)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#1F2937] font-['Inter']">
      <div className="mx-auto w-full max-w-[1200px] px-[24px] py-10 sm:px-[16px]">
        {/* ============ HERO ============ */}
        <section
          className="mb-10 overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-gradient-to-br from-[#FFFFFF] via-[#FFFFFF] to-[#E8F5E9] p-8"
          style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="max-w-[720px] flex-1">
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2E7D32] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.02em] text-white shadow-sm"
                style={{ lineHeight: '16px' }}
              >
                <MapIcon size={14} />
                14+ quán ăn chay · 3 tỉnh thành
              </span>

              <h1
                className="mt-4 font-bold tracking-[-0.015em] text-[#121C2A] sm:text-[26px] sm:leading-[34px]"
                style={{ fontSize: '36px', lineHeight: '44px' }}
              >
                Khám phá quán ăn thuần thực vật yêu thích quanh bạn
              </h1>

              <p
                className="mt-4 font-normal text-[#6B7280]"
                style={{ fontSize: '16px', lineHeight: '28px' }}
              >
                Từ Hà Nội, Sài Gòn đến Đà Nẵng, tất cả các quán đều được cộng đồng review &amp; xác minh
                thực tế, dễ dàng lọc theo chế độ ăn bạn đang theo đuổi.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="primary"
                size="md"
                leftIcon={<ChefHat size={16} />}
                onClick={() => onNavigate?.('/ai-chat')}
              >
                Hỏi AI gợi ý quán gần tôi
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                leftIcon={<RefreshCw size={16} />}
                onClick={handleReload}
              >
                Làm mới
              </Button>
            </div>
          </div>

          {/* Stats row - 5 cards, gutter 24px */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {/* Tổng quán */}
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div
                className="flex items-center justify-between font-semibold uppercase tracking-[0.02em] text-[#6B7280]"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                Tổng quán ăn
                <UtensilsCrossed size={18} className="text-[#2E7D32]" />
              </div>
              <div
                className="mt-3 font-extrabold tabular-nums text-[#1F2937]"
                style={{ fontSize: '32px', lineHeight: '40px' }}
              >
                {totalCount}
              </div>
            </div>

            {/* Thuần thực vật */}
            <div
              className="rounded-[16px] border border-[#C8E6C9] bg-[#E8F5E9]/70 p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div
                className="flex items-center justify-between font-semibold uppercase tracking-[0.02em] text-[#2E7D32]"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                Thuần thực vật
                <Sparkles size={18} />
              </div>
              <div
                className="mt-3 font-extrabold tabular-nums text-[#2E7D32]"
                style={{ fontSize: '32px', lineHeight: '40px' }}
              >
                {stats.vegan}
              </div>
            </div>

            {/* Hà Nội */}
            <div
              className="rounded-[16px] border border-sky-200 bg-sky-50 p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div
                className="flex items-center justify-between font-semibold uppercase tracking-[0.02em] text-sky-700"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                Hà Nội
                <MapIcon size={18} />
              </div>
              <div
                className="mt-3 font-extrabold tabular-nums text-sky-700"
                style={{ fontSize: '32px', lineHeight: '40px' }}
              >
                {stats.hn}
              </div>
            </div>

            {/* TP.HCM */}
            <div
              className="rounded-[16px] border border-amber-200 bg-amber-50 p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div
                className="flex items-center justify-between font-semibold uppercase tracking-[0.02em] text-amber-700"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                TP. HCM
                <MapIcon size={18} />
              </div>
              <div
                className="mt-3 font-extrabold tabular-nums text-amber-700"
                style={{ fontSize: '32px', lineHeight: '40px' }}
              >
                {stats.hcm}
              </div>
            </div>

            {/* Đà Nẵng + rating */}
            <div
              className="rounded-[16px] border border-rose-200 bg-rose-50 p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div
                className="flex items-center justify-between font-semibold uppercase tracking-[0.02em] text-rose-700"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                Đà Nẵng
                <MapIcon size={18} />
              </div>
              <div className="mt-3 flex items-end gap-3">
                <div
                  className="font-extrabold tabular-nums text-rose-700"
                  style={{ fontSize: '32px', lineHeight: '40px' }}
                >
                  {stats.dn}
                </div>
                <div
                  className="mb-1 inline-flex items-center gap-1 font-semibold text-amber-600"
                  style={{ fontSize: '12px', lineHeight: '16px' }}
                >
                  <Star
                    size={14}
                    className="fill-amber-500 stroke-amber-500"
                  />
                  ⌀ {stats.avgRating.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FILTER BAR ============ */}
        <section className="mb-6">
          <RestaurantFilterBar
            filter={filter}
            onChange={updateFilter}
            onReset={resetFilter}
            totalCount={totalCount}
            isLoading={isLoading}
          />
        </section>

        {/* Applied filter badges + summary */}
        <header
          className="mb-6 flex flex-wrap items-center justify-between gap-3"
          style={{ fontSize: '12px', lineHeight: '16px' }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {filter.city !== 'all' && (
              <StatusBadge
                status="info"
                size="md"
                label={`Khu vực: ${
                  CITY_LABELS[filter.city as RestaurantCity] ?? filter.city
                }`}
              />
            )}
            {filter.diet !== 'all' && (
              <StatusBadge
                status="suitable"
                size="md"
                label={`Chế độ: ${
                  DIET_TYPE_LABELS[filter.diet as RestaurantDietType] ?? filter.diet
                }`}
              />
            )}
            {filter.ratingMin > 0 && (
              <StatusBadge
                status="warning"
                size="md"
                label={`Đánh giá ≥ ${filter.ratingMin.toFixed(1)} ★`}
              />
            )}
            {filter.deliveryOnly && (
              <StatusBadge
                status="suitable"
                size="md"
                label="Chỉ xem có giao hàng"
              />
            )}
            {!!filter.search.trim() && (
              <StatusBadge
                status="neutral"
                size="md"
                label={`Từ khóa: "${filter.search.trim()}"`}
              />
            )}
          </div>

          <div className="hidden font-medium text-[#6B7280] sm:block">
            <strong className="text-[#1F2937]">{stats.delivery}</strong> trong{' '}
            <strong className="text-[#1F2937]">{totalCount}</strong> quán có dịch vụ giao hàng.
          </div>
        </header>

        {/* ============ RESULTS ============ */}
        <section>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <SkeletonLoader count={6} variant="card" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Không tìm thấy nhà hàng nào phù hợp"
              description="Bạn hãy thử nới lỏng bộ lọc chế độ ăn, thay đổi khu vực hoặc xóa từ khóa tìm kiếm. Nhấn nút bên dưới để xem toàn bộ danh sách quán ăn chay 3 tỉnh thành."
              actionLabel="Xóa bộ lọc"
              onAction={resetFilter}
              icon={<Sparkles size={40} className="text-[#2E7D32]" />}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-10 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2 font-semibold text-white shadow-lg backdrop-blur"
          style={{ fontSize: '14px', lineHeight: '20px' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
