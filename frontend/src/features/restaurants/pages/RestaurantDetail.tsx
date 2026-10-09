import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Clock,
  Heart,
  MapPin,
  Navigation,
  Phone,
  Star,
  Wallet,
  Globe,
  ParkingCircle,
  Calendar,
  Sparkles,
  Coffee,
  Share2,
  Truck,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  SkeletonLoader,
  StatusBadge,
} from '../../../shared/components'
import { getRestaurantDetail } from '../api/restaurantApi'
import { RestaurantCard } from '../components/RestaurantCard'
import type { Restaurant, RestaurantDietType } from '../types/restaurant.types'
import {
  DIET_TYPE_LABELS,
  formatPriceRange,
} from '../types/restaurant.types'

interface RestaurantDetailPageProps {
  restaurantId?: string
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

function mapDietBadge(
  d: RestaurantDietType,
): 'suitable' | 'info' | 'insufficient' | 'warning' | 'neutral' {
  switch (d) {
    case 'vegan':
      return 'suitable'
    case 'ovo-lacto':
    case 'ovo':
    case 'lacto':
      return 'insufficient'
    case 'raw':
      return 'info'
    case 'vegetarian-friendly':
      return 'warning'
    default:
      return 'neutral'
  }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6faf7]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
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
          <SkeletonLoader count={1} variant="card" />
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SkeletonLoader count={2} variant="card" />
            </div>
            <div>
              <SkeletonLoader count={3} variant="card" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#f6faf7]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <EmptyState
            title="Không tìm thấy nhà hàng này"
            description={`ID "${restaurantId || '(trống)'}" không tồn tại hoặc đã bị xóa khỏi danh sách. Bạn có thể quay lại xem toàn bộ quán ăn chay 3 tỉnh thành.`}
            actionLabel="Quay lại trang nhà hàng"
            onAction={() => onNavigate?.('/restaurants')}
            icon={<Coffee size={36} className="text-[#2e7d32]" />}
          />
        </div>
      </div>
    )
  }

  const stars = restaurant.rating
    .toFixed(1)
    .toString()
    .padEnd(3, '0')

  return (
    <div className="min-h-screen bg-[#f6faf7] text-[#1f2937]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<ArrowLeft size={13} />}
            onClick={() => onNavigate?.('/restaurants')}
          >
            Quay lại danh sách nhà hàng
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Share2 size={12} />}
              onClick={() => showToast('Đã copy link nhà hàng')}
            >
              Chia sẻ
            </Button>
            <Button
              type="button"
              variant={favorite ? 'danger' : 'primary'}
              size="sm"
              leftIcon={
                <Heart size={13} className={favorite ? 'fill-current' : ''} />
              }
              onClick={() => {
                setFavorite((v) => !v)
                showToast(favorite ? 'Đã gỡ khỏi yêu thích' : '❤️ Đã lưu vào yêu thích')
              }}
            >
              {favorite ? 'Đã yêu thích' : 'Lưu yêu thích'}
            </Button>
          </div>
        </div>

        <article className="overflow-hidden rounded-[20px] border border-[#e5e7eb] bg-white shadow-xs">
          {/* Cover */}
          <div className="relative h-[260px] w-full overflow-hidden sm:h-[320px]">
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
            <span className="absolute left-5 right-5 top-5 flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {restaurant.dietTypes.map((d) => (
                  <StatusBadge
                    key={d}
                    status={mapDietBadge(d)}
                    label={DIET_TYPE_LABELS[d]}
                  />
                ))}
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-extrabold text-slate-900 backdrop-blur">
                <Navigation size={12} className="text-[#2e7d32]" /> Cách bạn{' '}
                <strong>{restaurant.distanceKm.toFixed(1)} km</strong>
              </span>
            </span>
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight drop-shadow sm:text-3xl">
                {restaurant.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] font-semibold text-white/90">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} /> {restaurant.district}, {restaurant.city}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star size={13} className="fill-amber-400 stroke-amber-400" /> {stars} / 5 (
                  {restaurant.reviewCount.toLocaleString('vi-VN')} đánh giá)
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={13} /> {restaurant.openingHours}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Wallet size={13} />{' '}
                  {formatPriceRange(
                    restaurant.priceRangeVND.min,
                    restaurant.priceRangeVND.max,
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {/* Address */}
              <div className="rounded-[16px] border border-[#e5e7eb] bg-[#fafefb] p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#e8f5e9] text-[#2e7d32]">
                    <MapPin size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-extrabold">Địa chỉ nhà hàng</div>
                    <div className="mt-1 text-sm leading-6 text-[#1f2937]">
                      {restaurant.address}
                    </div>
                    <div className="mt-1 text-[11px] text-[#6b7280]">
                      Quận/Huyện: {restaurant.district} · TP. {restaurant.city}
                    </div>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="mt-5 rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-xs">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-[#2e7d32]" />
                  <h2 className="text-[16px] font-extrabold tracking-tight">
                    Điểm nổi bật của nhà hàng
                  </h2>
                </div>
                <ul className="space-y-2">
                  {restaurant.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 rounded-[10px] border border-transparent px-2 py-1.5 text-sm hover:border-[#e5e7eb] hover:bg-[#fafefb]"
                    >
                      <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#2e7d32] text-[11px] font-extrabold text-white">
                        {i + 1}
                      </span>
                      <span className="leading-6 text-[#1f2937]">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tags */}
              <div className="mt-5 flex flex-wrap gap-1.5">
                {restaurant.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[#e8f5e9] px-2.5 py-1 text-[11px] font-extrabold text-[#2e7d32]"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              {/* Gallery placeholder */}
              <div className="mt-5 rounded-[16px] border border-dashed border-[#c8e6c9] bg-white/60 p-4 text-center">
                <Coffee size={18} className="mx-auto mb-1 text-[#2e7d32]" />
                <div className="text-[13px] font-bold text-[#1f2937]">
                  Bộ sưu tập ảnh thực tế
                </div>
                <p className="mx-auto mt-1 max-w-lg text-[11px] leading-5 text-[#6b7280]">
                  Ảnh thực tế từ các reviewer cộng đồng sẽ sớm được cập nhật. Hiện tại bạn có thể
                  tham khảo ảnh đại diện phía trên hoặc mở trang chủ nhà hàng.
                </p>
              </div>

              {/* Related */}
              <div className="mt-5 rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-xs">
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-[15px] font-extrabold tracking-tight">
                    Nhà hàng cùng khu vực có thể bạn thích
                  </h3>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <RestaurantCard
                    restaurant={restaurant}
                    onSelect={(id) => onNavigate?.(`/restaurants/${encodeURIComponent(id)}`)}
                  />
                  <div className="flex items-center justify-center rounded-[16px] border border-dashed border-[#c8e6c9] bg-[#fafefb] p-5 text-center">
                    <div>
                      <MapPin size={22} className="mx-auto mb-1 text-[#2e7d32]" />
                      <div className="text-[13px] font-bold text-[#1f2937]">
                        Ghé thăm danh sách chính
                      </div>
                      <p className="mx-auto mt-1 max-w-xs text-[11px] leading-5 text-[#6b7280]">
                        Xem thêm các nhà hàng khác trong cùng quận, cùng thành phố bạn đang ở.
                      </p>
                      <div className="mt-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onNavigate?.('/restaurants')}
                        >
                          Xem tất cả
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-4">
              <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-xs">
                <h3 className="text-[14px] font-extrabold">Thông tin liên hệ & giờ mở cửa</h3>
                <dl className="mt-3 space-y-2 text-[12px]">
                  <div className="flex items-start gap-2">
                    <Clock size={13} className="mt-0.5 text-[#2e7d32]" />
                    <div>
                      <dt className="font-semibold text-[#6b7280]">Giờ mở cửa</dt>
                      <dd className="font-bold text-[#1f2937]">{restaurant.openingHours}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar size={13} className="mt-0.5 text-[#2e7d32]" />
                    <div>
                      <dt className="font-semibold text-[#6b7280]">Nghỉ</dt>
                      <dd className="font-bold text-[#1f2937]">{restaurant.closingDay}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone size={13} className="mt-0.5 text-[#2e7d32]" />
                    <div>
                      <dt className="font-semibold text-[#6b7280]">Điện thoại</dt>
                      <dd className="font-bold text-[#1f2937]">{restaurant.phoneNumber}</dd>
                    </div>
                  </div>
                  {restaurant.email && (
                    <div className="flex items-start gap-2">
                      <Globe size={13} className="mt-0.5 text-[#2e7d32]" />
                      <div>
                        <dt className="font-semibold text-[#6b7280]">Email</dt>
                        <dd className="truncate font-bold text-[#1f2937]">{restaurant.email}</dd>
                      </div>
                    </div>
                  )}
                  {restaurant.website && (
                    <div className="flex items-start gap-2">
                      <Globe size={13} className="mt-0.5 text-[#2e7d32]" />
                      <div>
                        <dt className="font-semibold text-[#6b7280]">Website</dt>
                        <dd className="truncate font-bold text-[#2e7d32]">
                          <a
                            href={restaurant.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {restaurant.website.replace(/^https?:\/\//, '')}
                          </a>
                        </dd>
                      </div>
                    </div>
                  )}
                </dl>
                <div className="mt-4 space-y-2">
                  <Button
                    type="button"
                    variant="primary"
                    fullWidth
                    leftIcon={<Phone size={13} />}
                    onClick={() => showToast(`☎️ Gọi nhà hàng: ${restaurant.phoneNumber}`)}
                  >
                    Gọi đặt bàn ngay
                  </Button>
                  {restaurant.acceptsBooking && (
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth
                      leftIcon={<Calendar size={13} />}
                      onClick={() => showToast('🎫 Đã mở form đặt chỗ (demo).')}
                    >
                      Đặt chỗ trước
                    </Button>
                  )}
                  {restaurant.hasDelivery && (
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      leftIcon={<Truck size={13} />}
                      onClick={() => showToast('🛵 Đã mở app giao hàng (Grab/Foody)...')}
                    >
                      Gọi ship đến nhà
                    </Button>
                  )}
                </div>
              </div>

              {/* Tiện ích */}
              <div className="rounded-[16px] border border-[#c8e6c9] bg-[#e8f5e9]/70 p-4 shadow-xs">
                <h3 className="mb-2 text-[14px] font-extrabold text-[#2e7d32]">
                  Tiện ích có tại nhà hàng
                </h3>
                <ul className="space-y-2 text-[12px] font-semibold text-[#1f2937]">
                  <li className="flex items-center gap-2">
                    <ParkingCircle size={14} className="text-[#2e7d32]" />
                    {restaurant.hasParking ? '✅ Có chỗ để xe ô tô / xe máy' : '❌ Không có chỗ đậu ô tô'}
                  </li>
                  <li className="flex items-center gap-2">
                    <Truck size={14} className="text-[#2e7d32]" />
                    {restaurant.hasDelivery ? '✅ Giao hàng tận nơi' : '❌ Chỉ ăn tại chỗ / mang về'}
                  </li>
                  <li className="flex items-center gap-2">
                    <Coffee size={14} className="text-[#2e7d32]" />
                    {restaurant.hasTakeAway ? '✅ Mang về / take-away' : '❌ Không dịch vụ take-away'}
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#2e7d32]" />
                    {restaurant.acceptsBooking ? '✅ Đặt bàn trước được' : '❌ Chỉ nhận khách trực tiếp'}
                  </li>
                </ul>
              </div>

              {/* Gợi ý món */}
              <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-xs">
                <h3 className="mb-2 text-[14px] font-extrabold">Gợi ý AI hôm nay ăn gì?</h3>
                <p className="text-[12px] leading-6 text-[#6b7280]">
                  Hãy cho AI biết bạn đang thèm phong vị Miền Bắc / Nam / Trung hay món nướng, canh,
                  hầm... AI sẽ đề xuất món phù hợp với quán này.
                </p>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() =>
                      onNavigate?.(
                        `/ai-chat?prompt=${encodeURIComponent(
                          `Đề xuất các món nên thử tại nhà hàng ${restaurant.name} (${restaurant.city}).`,
                        )}`,
                      )
                    }
                  >
                    Hỏi AI gợi ý món tại đây
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </article>
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-[12px] font-bold text-white shadow-lg backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  )
}
