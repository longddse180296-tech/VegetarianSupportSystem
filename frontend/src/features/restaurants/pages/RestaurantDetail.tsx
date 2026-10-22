import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Clock,
  Coffee,
  MapPin,
  Map as MapIcon,
  Navigation,
  Phone,
  Share2,
  Sparkles,
  Wallet,
} from 'lucide-react'
import {
  Badge,
  Button,
  EmptyState,
  PageHeading,
  SkeletonLoader,
} from '../../../shared/components'
import {
  filterRestaurants,
  getRestaurantDetail,
} from '../api/restaurantApi'
import { getStoredToken } from '../../../shared/api/apiClient'
import { findFavorite, toggleFavorite } from '../../favorites/api/favoritesApi'
import { RestaurantCard } from '../components/RestaurantCard'
import { formatAddress } from '../utils/restaurantUtils'
import type {
  Restaurant,
} from '../types/restaurant.types'

interface RestaurantDetailPageProps {
  restaurantId?: string
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

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
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const data = await getRestaurantDetail(restaurantId)
        if (!cancelled) {
          setRestaurant(data)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [restaurantId])

  useEffect(() => {
    if (!restaurantId || !getStoredToken()) return
    let active = true

    void findFavorite('Restaurant', restaurantId)
      .then((favorite) => {
        if (active) setSaved(Boolean(favorite))
      })
      .catch(() => {
        if (active) setSaved(false)
      })

    return () => {
      active = false
    }
  }, [restaurantId])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1500)
  }

  const openDirections = () => {
    if (!restaurant) return
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  const openGoogleMaps = () => {
    if (!restaurant) return
    const query = encodeURIComponent(
      `${restaurant.name}, ${restaurant.address}, ${restaurant.district}, ${restaurant.city}`,
    )
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      showToast('🔗 Đã sao chép liên kết nhà hàng vào bộ nhớ tạm!')
    } else {
      showToast('Đã copy link nhà hàng.')
    }
  }

  const toggleSavedRestaurant = async () => {
    if (!restaurantId) return
    if (!getStoredToken()) {
      onNavigate?.(`/auth/login?returnUrl=${encodeURIComponent(`/restaurants/${restaurantId}`)}`)
      return
    }

    setSaving(true)
    try {
      const nextSaved = await toggleFavorite('Restaurant', restaurantId, !saved)
      setSaved(nextSaved)
      showToast(nextSaved ? 'Đã lưu nhà hàng vào mục đã lưu.' : 'Đã bỏ lưu nhà hàng.')
    } catch {
      showToast('Không thể cập nhật mục đã lưu. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  // Nearby restaurants
  const [nearby, setNearby] = useState<Restaurant[]>([])
  useEffect(() => {
    if (!restaurant) return
    let cancelled = false
    ;(async () => {
      const all = await filterRestaurants({ city: restaurant.city })
      if (cancelled) return
      setNearby(all.items.filter((r) => r.id !== restaurant.id).slice(0, 3))
    })()
    return () => {
      cancelled = true
    }
  }, [restaurant])


  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAF8]">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
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
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
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

  const cleanName = restaurant.name.replace(/^\[Demo\]\s*/i, '')
  const displayAddress = formatAddress(
    restaurant.address,
    restaurant.district,
    restaurant.city,
  )
  const primaryDietKey = restaurant.dietTypes[0] ?? 'vegan'
  const coreDietLabel = CORE_DIET_TYPE_MAP[primaryDietKey] ?? 'Thuần chay (Vegan)'

  return (
    <div className="ui-page-container py-8 space-y-6">
      {/* ===== Header với Breadcrumbs theo chuẩn hệ thống ===== */}
      <PageHeading
        title="Nhà hàng chay gần bạn"
        description="Khám phá các nhà hàng và quán ăn chay thanh tịnh, dinh dưỡng phù hợp quanh khu vực của bạn."
        breadcrumbs={[
          { label: 'Trang chủ', onClick: () => onNavigate?.('/') },
          { label: 'Nhà hàng chay', onClick: () => onNavigate?.('/restaurants') },
          { label: 'Chi tiết nhà hàng' },
        ]}
        eyebrow={
          <Badge icon={<MapPin size={14} className="text-[#2E7D32]" />}>
            Địa điểm ẩm thực chay
          </Badge>
        }
      />

      <div className="flex w-full flex-col gap-8">
        {/* ===== Actions Bar (Chia sẻ & Yêu thích) ===== */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">
              {cleanName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Share2 size={13} />}
              onClick={handleShare}
              className="!rounded-xl !border-slate-300 !text-slate-700 hover:!bg-slate-50"
            >
              Chia sẻ
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={saving}
              leftIcon={<Bookmark size={13} className={saved ? 'fill-current' : ''} />}
              onClick={() => void toggleSavedRestaurant()}
              className={saved
                ? '!rounded-xl !border-amber-300 !bg-amber-50 !text-amber-800 hover:!bg-amber-100'
                : '!rounded-xl !border-slate-300 !text-slate-700 hover:!bg-slate-50'}
            >
              {saved ? 'Đã lưu' : 'Lưu nhà hàng'}
            </Button>
          </div>
        </div>

        {/* ===== HERO 2 CỘT (GALLERY + INFO BOX) ===== */}
        <section className="grid grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* ================= 1. ẢNH ĐẠI DIỆN CHÍNH THỰC TẾ ================= */}
          <div className="relative flex flex-col h-full">
            <div className="group relative aspect-[16/10] sm:aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[400px] w-full overflow-hidden rounded-[20px] bg-slate-900 shadow-md">
              <img
                src={restaurant.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'}
                alt={cleanName}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
                }}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
            </div>
          </div>

          {/* ================= 2. INFO BOX: THÔNG TIN THỰC TẾ TỪ HỆ THỐNG ================= */}
          <div className="flex flex-col gap-4 rounded-[20px] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            {/* Chế độ ăn & Trạng thái */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3.5 py-1 text-xs font-bold text-[#2E7D32] border border-[#A5D6A7]">
                🌱 {coreDietLabel}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#2E7D32] border border-emerald-200">
                ● Địa điểm ẩm thực chay
              </span>
            </div>

            {/* Tên nhà hàng */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug">
              {cleanName}
            </h1>

            {/* Khối Thông tin quan trọng (Địa chỉ, Điện thoại, Giờ mở cửa, Giá) */}
            <div className="flex flex-col gap-2.5 rounded-[16px] border border-slate-200/80 bg-slate-50/80 p-4 text-xs sm:text-sm text-slate-700">
              {/* Địa chỉ */}
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <span className="leading-relaxed">{displayAddress}</span>
              </div>

              {/* Giờ mở cửa */}
              {restaurant.openingHours && (
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="shrink-0 text-emerald-600" />
                  <span className="leading-relaxed">
                    Giờ mở cửa:{' '}
                    <strong className="font-semibold text-slate-900">{restaurant.openingHours}</strong>
                  </span>
                </div>
              )}

              {/* Link tương tác: Số điện thoại click gọi ngay với href="tel:..." */}
              {restaurant.phoneNumber && (
                <div className="flex items-center gap-2.5">
                  <Phone size={16} className="shrink-0 text-emerald-600" />
                  <span>
                    Số điện thoại:{' '}
                    <a
                      href={`tel:${restaurant.phoneNumber.replace(/[^0-9+]/g, '')}`}
                      className="font-bold text-[#2E7D32] hover:text-[#1B5E20] hover:underline inline-flex items-center gap-1"
                      title="Gọi ngay cho quán"
                    >
                      <span>{restaurant.phoneNumber}</span>
                    </a>
                  </span>
                </div>
              )}

              {/* Giá */}
              {restaurant.priceRange && (
                <div className="flex items-center gap-2.5">
                  <Wallet size={16} className="shrink-0 text-emerald-600" />
                  <span>
                    Khoảng giá tham khảo:{' '}
                    <strong className="text-emerald-800 font-bold">
                      {restaurant.priceRange}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Mô tả nhà hàng nếu có */}
            {restaurant.description && (
              <div className="rounded-[16px] border border-slate-100 bg-slate-50/50 p-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <p>{restaurant.description}</p>
              </div>
            )}

            {/* Tiện ích quán (Dữ liệu thực tế từ hệ thống) */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-2xs">
                <span className="text-emerald-600">✓</span> {coreDietLabel}
              </span>
              {restaurant.amenities && restaurant.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-2xs"
                >
                  <span className="text-emerald-600">✓</span> {amenity}
                </span>
              ))}
            </div>

            {/* Nút hành động */}
            <div className="mt-2 flex items-center gap-3">
              <Button
                type="button"
                variant="primary"
                leftIcon={<Navigation size={15} />}
                onClick={openDirections}
                className="flex-1 !h-11 !rounded-[14px] !bg-[#2E7D32] hover:!bg-[#1B5E20] !text-white !font-bold text-xs sm:text-sm shadow-xs"
              >
                Chỉ đường
              </Button>
              <Button
                type="button"
                variant="outline"
                leftIcon={<MapIcon size={15} />}
                onClick={openGoogleMaps}
                className="!h-11 !rounded-[14px] border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 text-xs sm:text-sm px-4"
              >
                Xem bản đồ
              </Button>
            </div>
          </div>
        </section>

        {/* ===== MÓN ĂN NỔI BẬT CỦA NHÀ HÀNG ===== */}
        {restaurant.featuredDishes && restaurant.featuredDishes.length > 0 && (
          <section className="rounded-[20px] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-[#2E7D32]">
                  <Sparkles size={16} />
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Món ăn nổi bật tại quán
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restaurant.featuredDishes.map((item) => (
                <article
                  key={item.id}
                  className="group relative flex flex-col overflow-hidden rounded-[16px] border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all hover:border-emerald-400/80 hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[12px] bg-slate-900 mb-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
                      }}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <h4 className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {item.name}
                  </h4>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ===== 5. NHÀ HÀNG GẦN ĐÂY ===== */}
        {nearby.length > 0 && (
          <section className="rounded-[20px] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Nhà hàng chay gần đây
              </h2>
              <button
                type="button"
                onClick={() => onNavigate?.('/restaurants')}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                <span>Xem tất cả</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {nearby.map((r) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  variant="compact"
                  onSelect={(id) => onNavigate?.(`/restaurants/${encodeURIComponent(id)}`)}
                  ctaLabel="Xem chi tiết"
                />
              ))}
            </div>
          </section>
        )}

        {/* Nút quay lại danh sách nhà hàng ở cuối trang */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-start">
          <Button
            type="button"
            variant="outline"
            size="md"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => onNavigate?.('/restaurants')}
            className="!rounded-[12px] !border-slate-300 hover:!border-[#2E7D32] hover:!text-[#2E7D32] font-semibold"
          >
            Quay lại danh sách nhà hàng
          </Button>
        </div>
      </div>

      {/* Toast message */}
      {toast && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
