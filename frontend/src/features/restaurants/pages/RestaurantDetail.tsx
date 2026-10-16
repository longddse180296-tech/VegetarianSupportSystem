import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Coffee,
  Compass,
  Heart,
  MapPin,
  Map as MapIcon,
  Phone,
  Share2,
  Wallet,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  SkeletonLoader,
} from '../../../shared/components'
import {
  filterRestaurants,
  getRestaurantDetail,
  toggleRestaurantFavorite,
} from '../api/restaurantApi'
import { RestaurantCard } from '../components/RestaurantCard'
import type {
  Restaurant,
} from '../types/restaurant.types'

interface RestaurantDetailPageProps {
  restaurantId?: string
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

/* ================================================================== */
/* Main
/* ================================================================== */

const CORE_DIET_TYPE_MAP: Record<string, string> = {
  vegan: 'Thuần chay (Vegan)',
  lacto: 'Ăn chay có sữa (Lacto)',
  ovo: 'Chay có trứng (Ovo)',
  'ovo-lacto': 'Trứng & Sữa (Lacto-ovo)',
  raw: 'Thuần chay (Vegan)',
  'vegetarian-friendly': 'Trứng & Sữa (Lacto-ovo)',
}

export default function RestaurantDetail({
  restaurantId = '',
  onNavigate,
  isLoggedIn: _isLoggedIn,
}: RestaurantDetailPageProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [favorite, setFavorite] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const data = await getRestaurantDetail(restaurantId)
        if (!cancelled) {
          setRestaurant(data)
          setFavorite(false)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [restaurantId])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1500)
  }

  const openGoogleMaps = () => {
    if (!restaurant) return
    const query = encodeURIComponent(`${restaurant.name}, ${restaurant.address}, ${restaurant.district}, ${restaurant.city}`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer')
  }

  const handleToggleFavorite = async () => {
    if (!restaurant) return
    const next = !favorite
    try {
      await toggleRestaurantFavorite(restaurant.id, next)
      setFavorite(next)
      showToast(next ? '❤️ Đã lưu vào yêu thích' : 'Đã gỡ khỏi yêu thích')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể lưu yêu thích.')
    }
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      showToast('🔗 Đã sao chép liên kết nhà hàng vào bộ nhớ tạm!')
    } else {
      showToast('Đã copy link nhà hàng.')
    }
  }

  // Nearby restaurants come from the public API for the same supplied district.
  const [nearby, setNearby] = useState<Restaurant[]>([])
  useEffect(() => {
    if (!restaurant) return
    let cancelled = false
    ;(async () => {
      const all = await filterRestaurants({ city: restaurant.city })
      if (cancelled) return
      setNearby(all.items.filter((r) => r.id !== restaurant.id).slice(0, 3))
    })().catch(() => { if (!cancelled) setNearby([]) })
    return () => {
      cancelled = true
    }
  }, [restaurant])

  /* =========================================================== */
  /* Loading state                                               */
  /* =========================================================== */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAF8]">
        <div className="ui-page-container py-6">
          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<ArrowLeft size={13} />}
            onClick={() => onNavigate?.('/restaurants')}
            className="mb-5"
          >
            Quay lại danh sách nhà hàng
          </Button>
          <div className="grid gap-6 md:grid-cols-2">
            <SkeletonLoader count={1} variant="card" />
            <SkeletonLoader count={1} variant="card" />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <SkeletonLoader count={3} variant="card" />
          </div>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#F8FAF8]">
        <div className="ui-page-container py-6">
          <EmptyState
            title="Không tìm thấy nhà hàng này"
            description={`ID "${restaurantId || '(trống)'}" không tồn tại hoặc đã bị xóa.`}
            actionLabel="Quay lại trang nhà hàng"
            onAction={() => onNavigate?.('/restaurants')}
            icon={<Coffee size={36} className="text-[#2E7D32]" />}
          />
        </div>
      </div>
    )
  }

  /* =========================================================== */
  /* Helper short values                                         */
  /* =========================================================== */
  const primaryDietKey = restaurant.dietTypes[0]
  const coreDietLabel = primaryDietKey ? CORE_DIET_TYPE_MAP[primaryDietKey] : 'Chưa cập nhật chế độ ăn'

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#0E2A18] font-sans">
      <div className="ui-page-container flex flex-col gap-7 py-5">
        {/* ===== Breadcrumbs + Actions ===== */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#566F5F]"
            aria-label="breadcrumb"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onNavigate?.('/')}
              className="!p-0 !h-auto !text-[#1F7A3F] hover:!underline !font-semibold"
            >
              Trang chủ
            </Button>
            <span className="text-[#A6BAAE]">›</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onNavigate?.('/restaurants')}
              className="!p-0 !h-auto !text-[#1F7A3F] hover:!underline !font-semibold"
            >
              Nhà hàng chay
            </Button>
            <span className="text-[#A6BAAE]">›</span>
            <span className="font-bold text-[#1E3B26]">{restaurant.name}</span>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Share2 size={12} />}
              onClick={handleShare}
            >
              Chia sẻ
            </Button>
            <Button
              type="button"
              size="sm"
              variant={favorite ? 'secondary' : 'primary'}
              leftIcon={
                <Heart size={12} className={favorite ? 'fill-current' : ''} />
              }
              onClick={handleToggleFavorite}
            >
              {favorite ? 'Đã lưu' : 'Lưu yêu thích'}
            </Button>
          </div>
        </div>

        {/* ===== HERO 2 CỘT ===== */}
        <section className="grid grid-cols-1 items-start gap-6 sm:gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          {/* Gallery (left) */}
          <div className="relative">
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-[16px] bg-[#EDF5EF] shadow-[0_8px_24px_rgba(31,122,63,0.08)]"
            >
              {restaurant.imageUrl ? (
                <img src={restaurant.imageUrl} alt={restaurant.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm font-semibold text-[#54735E]">Chưa có ảnh nhà hàng</div>
              )}
            </div>
            {/* 2 thumbnail dưới */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(restaurant.galleryImages ?? []).slice(0, 2).map((src, idx) => (
                <div
                  key={idx}
                  className="aspect-[16/10] overflow-hidden rounded-[16px] bg-[#EDF5EF]"
                >
                  <img
                    src={src}
                    alt={`${restaurant.name} - ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Info block (right) */}
          <div className="flex flex-col gap-3.5 rounded-[16px] border border-[#E2EDE6] bg-white p-[22px] shadow-[0_8px_24px_rgba(31,122,63,0.04)]">
            {/* Core diet badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3.5 py-1 text-sm font-semibold text-[#2E7D32]">
                🌱 {coreDietLabel}
              </span>
            </div>

            {/* Tên */}
            <h1 className="m-0 text-[30px] sm:text-[34px] font-extrabold tracking-tight text-[#0E2A18] leading-[1.2]">
              {restaurant.name}
            </h1>

            {/* Contact block */}
            <div className="flex flex-col gap-2 rounded-[14px] border border-[#E6EFE9] bg-[#F7FBF8] p-3.5 text-[13px] font-medium leading-relaxed text-[#2F4638]">
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0 text-[#2E7D32]" />
                <span>
                  {restaurant.address}, {restaurant.district}, {restaurant.city}
                </span>
              </div>
              {restaurant.phoneNumber && <div className="flex items-center gap-2.5">
                <Phone size={15} className="shrink-0 text-[#2E7D32]" />
                <span>
                  Số điện thoại:{' '}
                  <a
                    href={`tel:${restaurant.phoneNumber.replace(/\s/g, '')}`}
                    className="font-bold text-[#2E7D32] hover:underline"
                  >
                    {restaurant.phoneNumber}
                  </a>
                </span>
              </div>}
              {restaurant.priceRangeVND.min > 0 && restaurant.priceRangeVND.max > 0 && <div className="flex items-center gap-2.5">
                <Wallet size={15} className="shrink-0 text-[#2E7D32]" />
                <span>
                  Khoảng giá tham khảo:{' '}
                  <strong className="text-[#2E7D32]">
                    {restaurant.priceRange || `${restaurant.priceRangeVND.min.toLocaleString('vi-VN')}đ - ${restaurant.priceRangeVND.max.toLocaleString('vi-VN')}đ / người`}
                  </strong>
                </span>
              </div>}
            </div>

            {/* Amenities badges */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#2F4638]">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#DFEAE3] bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-[#2E7D32]">✓</span> {coreDietLabel}
              </span>
              {(restaurant.amenities ?? []).map((amenity) => <span key={amenity} className="inline-flex items-center gap-1 rounded-full border border-[#DFEAE3] bg-white px-3 py-1.5 shadow-2xs"><span className="text-[#2E7D32]">✓</span> {amenity}</span>)}
              {restaurant.hasParking && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#DFEAE3] bg-white px-3 py-1.5 shadow-2xs">
                  <span className="text-[#2E7D32]">✓</span> Có chỗ đỗ xe
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-2 flex items-center gap-3">
              <Button
                type="button"
                variant="primary"
                leftIcon={<Compass size={15} />}
                onClick={openGoogleMaps}
                className="flex-1 !h-[42px] !rounded-[12px] !bg-[#2E7D32] hover:!bg-[#1B5E20] !font-bold text-sm"
              >
                Chỉ đường
              </Button>
              <Button
                type="button"
                variant="outline"
                leftIcon={<MapIcon size={15} />}
                onClick={openGoogleMaps}
                className="!h-[42px] !rounded-[12px] border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 text-sm px-4"
              >
                Xem trên bản đồ
              </Button>
            </div>
          </div>
        </section>

        {/* ===== SECTION: NHÀ HÀNG GẦN ĐÂY ===== */}
        <section>
          <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
            <h2
              className="relative m-0 pl-3 font-extrabold text-[#0E2A18]"
              style={{ fontSize: '19px', lineHeight: '26px' }}
            >
              <span
                aria-hidden
                className="absolute left-0 top-1 bottom-1 w-[3.5px] rounded-full bg-gradient-to-b from-[#1F7A3F] to-[#3FAE62]"
              />
              Nhà hàng khác trong khu vực
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onNavigate?.('/restaurants')}
              rightIcon={<ArrowRight size={12} />}
              className="!p-0 !h-auto !text-[12px] !font-bold !text-[#1F7A3F] hover:!underline"
            >
              Xem tất cả
            </Button>
          </div>
          {nearby.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <p className="text-sm text-text-muted">Chưa có nhà hàng khác trong khu vực.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {nearby.map((r) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  variant="compact"
                  onSelect={(id) => handleSelect(id, onNavigate)}
                  ctaLabel="Xem chi tiết"
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ===== Toast ===== */}
      {toast && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-[12px] font-bold text-white shadow-lg backdrop-blur"
        >
          {toast}
        </div>
      )}
    </div>
  )
}

/* ---------- Local helper (navigate with side effects) ---------- */
function handleSelect(
  id: string,
  onNavigate?: (path: string) => void,
) {
  onNavigate?.(`/restaurants/${encodeURIComponent(id)}`)
}
