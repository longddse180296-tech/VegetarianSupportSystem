import { useEffect, useState } from 'react'
import {
  Compass,
  Navigation,
  Sparkles,
  Utensils,
} from 'lucide-react'
import {
  EmptyState,
  SkeletonLoader,
} from '../../../shared/components'
import {
  filterRestaurants,
  getRestaurantDetail,
} from '../api/restaurantApi'
import { RestaurantCard } from '../components/RestaurantCard'
import { RestaurantFilterBar } from '../components/RestaurantFilter'
import type {
  Restaurant,
  RestaurantFilter as RestaurantFilterState,
} from '../types/restaurant.types'
import { DEFAULT_RESTAURANT_FILTER } from '../types/restaurant.types'

interface RestaurantsPageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

export default function RestaurantsPage({
  onNavigate,
  isLoggedIn: _isLoggedIn,
}: RestaurantsPageProps) {
  const [filter, setFilter] = useState<RestaurantFilterState>(DEFAULT_RESTAURANT_FILTER)
  const [items, setItems] = useState<Restaurant[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [selectedMapRestaurant, setSelectedMapRestaurant] = useState<Restaurant | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1800)
  }

  // Initial load
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const res = await filterRestaurants(DEFAULT_RESTAURANT_FILTER)
        if (cancelled) return
        setItems(res.items)
        setTotalCount(res.totalCount)
        if (res.items.length > 0) {
          setSelectedMapRestaurant(res.items[0])
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
        try {
          const res = await filterRestaurants(filter)
          if (cancelled) return
          setItems(res.items)
          setTotalCount(res.totalCount)
          setSelectedMapRestaurant((prev) => prev ?? (res.items.length > 0 ? res.items[0] : null))
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

  const handleBook = async (id: string) => {
    const r = await getRestaurantDetail(id)
    if (!r) return
    showToast(`📞 Đặt chỗ tại ${r.name}: ${r.phoneNumber}`)
  }

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#121C2A] font-['Inter']">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6">
        {/* ===== Breadcrumbs ===== */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12px] text-[#4E6558] font-semibold">
            <button
              type="button"
              onClick={() => onNavigate?.('/')}
              className="text-[#2E7D32] hover:underline font-semibold"
            >
              Trang chủ
            </button>
            <span className="text-[#B3C4B8]">›</span>
            <span className="font-bold text-[#0A1F14]">Nhà hàng chay</span>
          </nav>
        </div>

        {/* ===== Header ===== */}
        <header className="mb-5">
          <h1 className="text-[32px] sm:text-[36px] font-bold tracking-tight text-[#0A1F14] leading-[1.2]">
            Nhà hàng chay gần bạn
          </h1>
          <p className="mt-1.5 text-[15px] sm:text-[16px] text-[#6B7280] max-w-[760px] leading-relaxed">
            Khám phá các nhà hàng và quán ăn chay thanh tịnh, dinh dưỡng phù hợp gần vị trí hiện tại của bạn.
          </p>
        </header>

        {/* ===== Location permission banner ===== */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#C9E5D0] bg-gradient-to-r from-[#E7F7EB] to-[#F2FBF4] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5 text-[#143A23] text-sm font-semibold">
            <Compass size={18} className="shrink-0 text-[#2E7D32]" />
            <span>Cho phép truy cập vị trí để tìm nhà hàng chay gần bạn chính xác nhất.</span>
          </div>
          <button
            type="button"
            onClick={() => showToast('✅ Đã cấp phép định vị chính xác.')}
            className="rounded-[10px] bg-[#2E7D32] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1B5E20]"
          >
            Cho phép vị trí
          </button>
        </div>

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

        {/* ===== MAIN 2-COLUMN LAYOUT ===== */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.15fr_0.95fr]">
          {/* ================= CỘT TRÁI: Danh sách nhà hàng ================= */}
          <div className="flex flex-col gap-4">
            {/* Restaurant List / SkeletonLoader / EmptyState */}
            {isLoading ? (
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
                      onBook={handleBook}
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
            {/* Stylized SVG Interactive Map Canvas */}
            <div className="relative h-[560px] w-full bg-[#E5F2E8] overflow-hidden select-none">
              <svg
                viewBox="0 0 600 600"
                className="h-full w-full"
              >
                {/* Background lake water */}
                <path
                  d="M0,0 L320,0 C300,100 380,180 340,260 C300,320 220,300 180,380 C140,460 200,520 180,600 L0,600 Z"
                  fill="#CFE8F3"
                  opacity="0.85"
                />
                {/* Park green patches */}
                <path
                  d="M260,80 C310,60 380,90 370,150 C360,200 300,210 270,180 C240,150 220,100 260,80 Z"
                  fill="#BDE4C7"
                  opacity="0.9"
                />
                <path
                  d="M420,320 C490,300 560,340 550,420 C540,480 470,500 430,470 C390,440 370,360 420,320 Z"
                  fill="#BDE4C7"
                  opacity="0.8"
                />

                {/* Major streets & arterial roads */}
                <path d="M-20,160 L620,240" stroke="#FFFFFF" strokeWidth="18" fill="none" />
                <path d="M-20,160 L620,240" stroke="#F1C40F" strokeWidth="2.5" fill="none" strokeDasharray="8 6" />

                <path d="M120,-20 L380,620" stroke="#FFFFFF" strokeWidth="16" fill="none" />
                <path d="M380,-20 L160,620" stroke="#FFFFFF" strokeWidth="14" fill="none" />
                <path d="M-20,380 L620,320" stroke="#FFFFFF" strokeWidth="14" fill="none" />
                <path d="M220,100 C340,220 420,360 540,520" stroke="#E2ECE5" strokeWidth="10" fill="none" />

                {/* Street names text */}
                <text x="70" y="145" fontSize="11" fontWeight="bold" fill="#758B7D" letterSpacing="1">
                  ĐƯỜNG HOÀNG HOA THÁM
                </text>
                <text x="310" y="225" fontSize="10" fontWeight="bold" fill="#758B7D" letterSpacing="0.8">
                  PHỐ LIỄU GIAI
                </text>
                <text x="180" y="440" fontSize="10" fontWeight="bold" fill="#758B7D" letterSpacing="0.8">
                  ĐỘI CẤN
                </text>
                <text x="360" y="340" fontSize="10" fontWeight="bold" fill="#758B7D" letterSpacing="0.8">
                  KIM MÃ
                </text>

                {/* Current user location marker (pulsing blue dot) */}
                <g transform="translate(280, 240)">
                  <circle r="22" fill="#3B82F6" opacity="0.2">
                    <animate attributeName="r" values="10;26;10" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0.05;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle r="9" fill="#2563EB" stroke="#FFFFFF" strokeWidth="3" />
                  <circle r="3" fill="#FFFFFF" />
                </g>
              </svg>

              {/* Pin 1: An Nhiên Vegetarian (Selected pin) */}
              <div
                className="absolute top-[28%] left-[45%] -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                onClick={() => {
                  const r = items.find((x) => x.id === 'an-nhien') || items[0]
                  if (r) setSelectedMapRestaurant(r)
                }}
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 rounded-full bg-[#2E7D32] px-3 py-1.5 text-white shadow-lg ring-2 ring-white transition-transform group-hover:scale-105">
                    <Utensils size={13} className="text-white" />
                    <span className="text-xs font-bold whitespace-nowrap">An Nhiên</span>
                  </div>
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#2E7D32]" />
                </div>
              </div>

              {/* Pin 2: The Fernery */}
              <div
                className="absolute top-[18%] left-[72%] -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                onClick={() => {
                  const r = items.find((x) => x.id === 'the-fernery') || items[1]
                  if (r) setSelectedMapRestaurant(r)
                }}
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[#2E7D32] shadow-md border border-[#C9E5D0] transition-transform group-hover:scale-105">
                    <span className="h-2 w-2 rounded-full bg-[#2E7D32]" />
                    <span className="text-[11px] font-bold whitespace-nowrap">The Fernery</span>
                  </div>
                </div>
              </div>

              {/* Pin 3: Sen Vàng */}
              <div
                className="absolute top-[52%] left-[68%] -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                onClick={() => {
                  const r = items.find((x) => x.id === 'sen-vang') || items[3]
                  if (r) setSelectedMapRestaurant(r)
                }}
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[#2E7D32] shadow-md border border-[#C9E5D0] transition-transform group-hover:scale-105">
                    <span className="h-2 w-2 rounded-full bg-[#2E7D32]" />
                    <span className="text-[11px] font-bold whitespace-nowrap">Sen Vàng</span>
                  </div>
                </div>
              </div>

              {/* Pin 4: An Lạc */}
              <div
                className="absolute top-[68%] left-[48%] -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                onClick={() => {
                  const r = items.find((x) => x.id === 'an-lac') || items[2]
                  if (r) setSelectedMapRestaurant(r)
                }}
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[#2E7D32] shadow-md border border-[#C9E5D0] transition-transform group-hover:scale-105">
                    <span className="h-2 w-2 rounded-full bg-[#2E7D32]" />
                    <span className="text-[11px] font-bold whitespace-nowrap">An Lạc</span>
                  </div>
                </div>
              </div>

              {/* Selected Restaurant Popup Card */}
              {selectedMapRestaurant && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-30 rounded-[16px] bg-white p-3 shadow-[0_12px_28px_rgba(0,0,0,0.18)] border border-slate-100 transition-all">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[12px] bg-slate-100 mb-2.5">
                    <img
                      src={selectedMapRestaurant.imageUrl}
                      alt={selectedMapRestaurant.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h4 className="text-[15px] font-bold text-[#0A1F14] leading-tight line-clamp-1">
                    {selectedMapRestaurant.name}
                  </h4>
                  <div className="mt-1 flex items-center justify-between text-xs text-[#55695D]">
                    <span className="flex items-center gap-1 font-semibold text-[#2E7D32]">
                      <Navigation size={12} />
                      {selectedMapRestaurant.district}, {selectedMapRestaurant.city}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelect(selectedMapRestaurant.id)}
                    className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#2E7D32] py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1B5E20]"
                  >
                    Xem chi tiết →
                  </button>
                </div>
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

