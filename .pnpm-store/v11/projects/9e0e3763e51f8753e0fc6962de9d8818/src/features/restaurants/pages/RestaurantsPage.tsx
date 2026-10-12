import { useEffect, useMemo, useState } from 'react'
import {
  Compass,
  ChevronDown,
  Expand,
  Leaf,
  LocateFixed,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Sparkles,
  Target,
  Utensils,
} from 'lucide-react'
import {
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
  const [profileOnly, setProfileOnly] = useState(true)
  const [geoOn, setGeoOn] = useState(true)
  const [sortPill, setSortPill] = useState<'distance_asc' | 'relevance' | 'rating_desc'>('distance_asc')
  const [dishChips, setDishChips] = useState<DishChip[]>([])
  const [selectedMapRestaurant, setSelectedMapRestaurant] = useState<Restaurant | null>(null)
  const [mapMode, setMapMode] = useState<'map' | 'satellite'>('map')
  const [searchOnMove, setSearchOnMove] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(14)

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
        const [res, chips] = await Promise.all([
          filterRestaurants(DEFAULT_RESTAURANT_FILTER),
          getDishChips(),
        ])
        if (cancelled) return
        setItems(res.items)
        setTotalCount(res.totalCount)
        setDishChips(chips)
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
    setSortPill('distance_asc')
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

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#121C2A] font-['Inter']">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6">
        {/* ===== Breadcrumbs + GEO button ===== */}
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

          <button
            type="button"
            onClick={() => {
              setGeoOn((v) => !v)
              showToast(geoOn ? 'Đã tạm tắt vị trí.' : 'Đã bật định vị gần bạn.')
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#DDE8E1] bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#2E7D32] shadow-sm transition hover:bg-[#EAF5EC]"
          >
            <LocateFixed size={14} className="text-[#2E7D32]" />
            Sử dụng vị trí hiện tại
          </button>
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

        {/* ===== MAIN 2-COLUMN LAYOUT ===== */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.15fr_0.95fr]">
          {/* ================= CỘT TRÁI: Danh sách nhà hàng ================= */}
          <div className="flex flex-col gap-4">
            {/* Smart profile filter card */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#E3EFE5] bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#E7F7EB] text-[#2E7D32]">
                  <Leaf size={20} />
                </div>
                <div className="flex flex-col">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-bold text-[#0A1F14]">
                      Chỉ hiển thị nhà hàng phù hợp với hồ sơ của tôi
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F7EB] px-2 py-[1px] text-[10.5px] font-extrabold text-[#2E7D32]">
                      <Sparkles size={10} /> Thông minh
                    </span>
                  </div>
                  <p className="m-0 text-[12px] text-[#55695D] leading-snug">
                    Hồ sơ của bạn: <strong className="text-[#2E7D32]">Thuần Chay (Vegan)</strong> – Tự động lọc các địa điểm đạt chuẩn.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={profileOnly}
                onClick={() => setProfileOnly((v) => !v)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
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
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <h2 className="inline-flex items-center gap-2 text-[17px] font-extrabold text-[#0A1F14]">
                <Target size={18} className="text-[#2E7D32]" />
                Gần vị trí của bạn
                <span className="rounded-full bg-[#E7F7EB] px-2.5 py-[2px] text-[11.5px] font-extrabold text-[#2E7D32]">
                  {totalCount || 18} địa điểm
                </span>
              </h2>
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#3A5244]">
                <span>Sắp xếp:</span>
                <button
                  type="button"
                  onClick={() =>
                    setSortPill((p) =>
                      p === 'distance_asc'
                        ? 'rating_desc'
                        : p === 'rating_desc'
                          ? 'relevance'
                          : 'distance_asc',
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#DCE7DF] bg-white px-3 py-1 text-[12px] font-extrabold text-[#0A1F14] shadow-sm hover:border-[#B7D9C1]"
                >
                  {sortPill === 'distance_asc'
                    ? 'Gần nhất'
                    : sortPill === 'rating_desc'
                      ? 'Đánh giá cao'
                      : 'Phù hợp nhất'}
                  <ChevronDown size={13} className="text-[#6B7280]" />
                </button>
              </div>
            </div>

            {/* Restaurant List / SkeletonLoader / EmptyState */}
            {isLoading ? (
              <div className="flex flex-col gap-3.5">
                <SkeletonLoader count={6} variant="card" />
              </div>
            ) : sortedItems.length === 0 ? (
              <EmptyState
                title="Không tìm thấy nhà hàng nào phù hợp"
                description="Bạn hãy thử nới lỏng bộ lọc tiện ích, giảm khoảng cách hoặc xóa từ khóa tìm kiếm để khám phá thêm địa điểm."
                actionLabel="Xóa bộ lọc"
                onAction={resetFilter}
                icon={<Sparkles size={40} className="text-[#2E7D32]" />}
              />
            ) : (
              <div className="flex flex-col gap-3.5">
                {sortedItems.map((r, idx) => (
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

            {/* Section: Đang tìm món này? */}
            <div className="mt-2 rounded-[16px] border border-[#E3EFE5] bg-white p-4 sm:p-5 shadow-sm">
              <h3 className="text-[15px] font-extrabold text-[#0A1F14] leading-tight">
                Đang tìm món này?
              </h3>
              <p className="mt-0.5 text-[12.5px] text-[#4E6558]">
                Chọn món ăn để tìm các nhà hàng có phục vụ món bạn thích:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {dishChips.map((d) => (
                  <button
                    type="button"
                    key={d.label}
                    onClick={() => {
                      updateFilter({ search: d.label })
                      showToast(`🔎 Đã lọc theo món "${d.label}" (${d.count} địa điểm).`)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#DDE5EC] bg-[#F0F4F8] px-3 py-1.5 text-[12px] font-semibold text-[#324253] transition hover:border-[#B7D9C1] hover:bg-[#EAF5EC]"
                  >
                    <span>{d.emoji}</span>
                    <span>{d.label} ({d.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ================= CỘT PHẢI: BẢN ĐỒ TƯƠNG TÁC CHUẨN FIGMA ================= */}
          <div className="sticky top-20 flex flex-col overflow-hidden rounded-[16px] border border-[#DCE7DF] bg-white shadow-[0_8px_24px_rgba(31,122,63,0.06)]">
            {/* Top map control bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E3EFE5] bg-[#F9FBF9] px-4 py-2.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#334D3E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchOnMove}
                  onChange={(e) => setSearchOnMove(e.target.checked)}
                  className="rounded text-[#2E7D32] focus:ring-[#2E7D32]"
                />
                <MapPin size={13} className="text-[#2E7D32]" />
                Tìm khi di chuyển bản đồ
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMapMode('map')}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                    mapMode === 'map'
                      ? 'bg-[#2E7D32] text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Bản đồ
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('satellite')}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                    mapMode === 'satellite'
                      ? 'bg-[#2E7D32] text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Vệ tinh
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Phóng to toàn màn hình bản đồ.')}
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                  title="Toàn màn hình"
                >
                  <Expand size={13} />
                </button>
              </div>
            </div>

            {/* Stylized SVG Interactive Map Canvas */}
            <div className="relative h-[560px] w-full bg-[#E5F2E8] overflow-hidden select-none">
              <svg
                viewBox="0 0 600 600"
                style={{
                  filter: mapMode === 'satellite' ? 'contrast(1.15) brightness(0.85) hue-rotate(-20deg)' : 'none',
                  transform: `scale(${zoomLevel / 14})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.3s ease-out',
                }}
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

              {/* Selected Restaurant Popup Card (floating over map top-center, exact Figma) */}
              {selectedMapRestaurant && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-30 rounded-[16px] bg-white p-3 shadow-[0_12px_28px_rgba(0,0,0,0.18)] border border-slate-100 transition-all">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[12px] bg-slate-100 mb-2.5">
                    <img
                      src={selectedMapRestaurant.imageUrl}
                      alt={selectedMapRestaurant.name}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute top-2 left-2 rounded-full bg-[#2E7D32] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      Đang mở cửa
                    </span>
                  </div>
                  <h4 className="text-[15px] font-bold text-[#0A1F14] leading-tight line-clamp-1">
                    {selectedMapRestaurant.name}
                  </h4>
                  <div className="mt-1 flex items-center justify-between text-xs text-[#55695D]">
                    <span className="flex items-center gap-1 font-semibold text-[#2E7D32]">
                      <Navigation size={12} />
                      Cách {selectedMapRestaurant.distanceKm.toFixed(1)} km
                    </span>
                    <span>{selectedMapRestaurant.district}, {selectedMapRestaurant.city}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelect(selectedMapRestaurant.id)}
                    className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#2E7D32] py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1B5E20]"
                  >
                    Xem chi tiết & Chỉ đường →
                  </button>
                </div>
              )}

              {/* Bottom right map control buttons */}
              <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => showToast('📍 Đã định vị vị trí hiện tại của bạn.')}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-slate-50"
                  title="Vị trí của bạn"
                >
                  <LocateFixed size={16} />
                </button>
                <div className="flex flex-col overflow-hidden rounded-[10px] bg-white shadow-md">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(z + 1, 18))}
                    className="flex h-8 w-8 items-center justify-center text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                    title="Phóng to"
                  >
                    <Plus size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(z - 1, 10))}
                    className="flex h-8 w-8 items-center justify-center text-slate-700 hover:bg-slate-50"
                    title="Thu nhỏ"
                  >
                    <Minus size={15} />
                  </button>
                </div>
              </div>
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
