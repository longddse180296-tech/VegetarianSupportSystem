import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Coffee,
  Compass,
  Heart,
  MapPin,
  Map as MapIcon,
  Phone,
  PlayCircle,
  Share2,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  SkeletonLoader,
  Textarea,
} from '../../../shared/components'
import {
  filterRestaurants,
  getRelatedContent,
  getRestaurantDetail,
  getReviewComments,
  toggleRestaurantFavorite,
} from '../api/restaurantApi'
import { RestaurantCard } from '../components/RestaurantCard'
import { formatAddress } from '../utils/restaurantUtils'
import type {
  RelatedContentCard,
  Restaurant,
  ReviewComment,
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

// Curated high-resolution vegetarian restaurant photography for gallery
const DEFAULT_GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1200&q=80',
]

export default function RestaurantDetail({
  restaurantId = '',
  onNavigate,
  isLoggedIn: _isLoggedIn,
}: RestaurantDetailPageProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [favorite, setFavorite] = useState(false)
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [relatedContent, setRelatedContent] = useState<RelatedContentCard[]>([])
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const [data, commentData, related] = await Promise.all([
          getRestaurantDetail(restaurantId),
          getReviewComments(restaurantId),
          getRelatedContent(restaurantId),
        ])
        if (!cancelled) {
          setRestaurant(data)
          setFavorite(false)
          setComments(commentData)
          setRelatedContent(related)
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
    const query = encodeURIComponent(
      `${restaurant.name}, ${restaurant.address}, ${restaurant.district}, ${restaurant.city}`,
    )
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  const handleToggleFavorite = async () => {
    if (!restaurant) return
    const next = !favorite
    setFavorite(next)
    try {
      await toggleRestaurantFavorite(restaurant.id, next)
      showToast(next ? '❤️ Đã lưu vào yêu thích' : 'Đã gỡ khỏi yêu thích')
    } catch {
      showToast(next ? '❤️ Đã lưu vào yêu thích' : 'Đã gỡ khỏi yêu thích')
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

  const handleSubmitComment = () => {
    if (!newComment.trim()) return
    const added: ReviewComment = {
      id: `c_new_${Date.now()}`,
      userName: 'Bạn',
      avatarSeed: 'neutral user avatar portrait casual vietnamese',
      rating: 5,
      content: newComment.trim(),
      timeAgo: 'Vừa xong',
    }
    setComments((prev) => [added, ...prev])
    setNewComment('')
    showToast('✅ Đã gửi bình luận thành công.')
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

  // Combined gallery photos
  const allPhotos = useMemo(() => {
    if (!restaurant) return DEFAULT_GALLERY_IMAGES
    const list = [restaurant.imageUrl]
    if (restaurant.galleryImages && restaurant.galleryImages.length > 0) {
      list.push(...restaurant.galleryImages)
    }
    DEFAULT_GALLERY_IMAGES.forEach((img) => {
      if (!list.includes(img)) list.push(img)
    })
    return list
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
  const ratingValue = restaurant.rating ? restaurant.rating.toFixed(1) : '4.8'
  const openingHours = restaurant.openingHours || '08:00 - 21:30'

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#0E2A18] font-['Inter']">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-6 sm:px-6">
        {/* ===== Breadcrumbs + Actions ===== */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500"
            aria-label="breadcrumb"
          >
            <button
              type="button"
              onClick={() => onNavigate?.('/')}
              className="text-emerald-700 hover:underline font-semibold"
            >
              Trang chủ
            </button>
            <span className="text-slate-300">›</span>
            <button
              type="button"
              onClick={() => onNavigate?.('/restaurants')}
              className="text-emerald-700 hover:underline font-semibold"
            >
              Nhà hàng chay
            </button>
            <span className="text-slate-300">›</span>
            <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
              {cleanName}
            </span>
          </nav>

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
              variant={favorite ? 'secondary' : 'primary'}
              leftIcon={<Heart size={13} className={favorite ? 'fill-current' : ''} />}
              onClick={handleToggleFavorite}
              className={`!rounded-xl transition-all ${
                favorite
                  ? '!bg-emerald-50 !text-emerald-700 !border-emerald-300'
                  : '!bg-emerald-700 hover:!bg-emerald-800 !text-white'
              }`}
            >
              {favorite ? 'Đã lưu' : 'Lưu yêu thích'}
            </Button>
          </div>
        </div>

        {/* ===== HERO 2 CỘT (GALLERY + INFO BOX) ===== */}
        <section className="grid grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* ================= 1. IMAGE GALLERY VỚI TỶ LỆ KHUNG HÌNH CHUẨN ================= */}
          <div className="relative flex flex-col gap-3">
            {/* Ảnh chính tỷ lệ chuẩn aspect-[16/10] */}
            <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-[20px] bg-slate-900 shadow-md">
              <img
                src={restaurant.imageUrl}
                alt={cleanName}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
                }}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
            </div>

            {/* 2 thumbnail dưới với tỷ lệ khung hình chuẩn aspect-[16/10] */}
            <div className="grid grid-cols-2 gap-3">
              {allPhotos.slice(1, 3).map((src, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-[16/10] w-full overflow-hidden rounded-[16px] bg-slate-900 shadow-xs"
                >
                  <img
                    src={src}
                    alt={`${cleanName} - ảnh ${idx + 2}`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
                    }}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/25" />
                </div>
              ))}
            </div>
          </div>

          {/* ================= 2. INFO BOX: BỔ SUNG GIỜ MỞ CỬA, RATING & TEL LINK ================= */}
          <div className="flex flex-col gap-4 rounded-[20px] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            {/* Chế độ ăn & Rating sao */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3.5 py-1 text-xs font-bold text-[#2E7D32] border border-[#A5D6A7]">
                🌱 {coreDietLabel}
              </span>

              {/* Rating sao nổi bật */}
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 border border-amber-200/70 text-xs font-bold text-amber-800">
                <Star size={13} className="fill-amber-400 text-amber-500" />
                <span>{ratingValue}</span>
                <span className="text-[11px] font-normal text-amber-600">
                  ({restaurant.reviewCount || 28} đánh giá)
                </span>
              </div>
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

              {/* Giờ mở cửa bổ sung vào box thông tin chính */}
              <div className="flex items-center gap-2.5">
                <Clock size={16} className="shrink-0 text-emerald-600" />
                <span className="leading-relaxed">
                  Giờ mở cửa:{' '}
                  <strong className="font-semibold text-slate-900">{openingHours}</strong>
                </span>
              </div>

              {/* Link tương tác: Số điện thoại click gọi ngay với href="tel:..." */}
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="shrink-0 text-emerald-600" />
                <span>
                  Số điện thoại:{' '}
                  <a
                    href={`tel:${restaurant.phoneNumber.replace(/[^0-9+]/g, '')}`}
                    className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                    title="Gọi ngay cho quán"
                  >
                    <span>{restaurant.phoneNumber}</span>
                  </a>
                </span>
              </div>

              {/* Giá */}
              <div className="flex items-center gap-2.5">
                <Wallet size={16} className="shrink-0 text-emerald-600" />
                <span>
                  Khoảng giá tham khảo:{' '}
                  <strong className="text-emerald-800 font-bold">
                    {restaurant.priceRange || '35.000đ - 150.000đ / người'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Tiện ích quán */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-2xs">
                <span className="text-emerald-600">✓</span> {coreDietLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-2xs">
                <span className="text-emerald-600">✓</span> Món Việt thanh tịnh
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-2xs">
                <span className="text-emerald-600">✓</span> Không gian xanh yên tĩnh
              </span>
              {restaurant.hasParking && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-2xs">
                  <span className="text-emerald-600">✓</span> Có chỗ đỗ xe
                </span>
              )}
            </div>

            {/* Nút hành động */}
            <div className="mt-2 flex items-center gap-3">
              <Button
                type="button"
                variant="primary"
                leftIcon={<Compass size={15} />}
                onClick={openGoogleMaps}
                className="flex-1 !h-11 !rounded-[14px] !bg-emerald-700 hover:!bg-emerald-800 !font-bold text-xs sm:text-sm shadow-sm"
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

        {/* ===== ================= 3. ĐÁNH GIÁ & BÌNH LUẬN ================= ===== */}
        <section className="rounded-[20px] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Đánh giá &amp; Bình luận
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                {comments.length} phản hồi từ thực khách ăn chay
              </p>
            </div>
          </div>

          {/* Khung viết bình luận với placeholder rút gọn */}
          <div className="mb-6 flex gap-3.5">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-emerald-200 bg-emerald-50 grid place-items-center text-emerald-800 font-bold text-xs shadow-2xs">
              Bạn
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Textarea
                placeholder="Chia sẻ trải nghiệm của bạn..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="!rounded-xl !border-slate-300 focus:!border-emerald-600 focus:!ring-emerald-500/20 text-xs sm:text-sm"
              />
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                  className={`!rounded-xl !px-4 text-xs font-semibold ${
                    !newComment.trim()
                      ? '!bg-slate-200 !text-slate-400 cursor-not-allowed shadow-none'
                      : '!bg-emerald-700 hover:!bg-emerald-800 !text-white shadow-sm'
                  }`}
                >
                  Gửi bình luận
                </Button>
              </div>
            </div>
          </div>

          {/* Danh sách bình luận */}
          <div className="flex flex-col gap-4 divide-y divide-slate-100">
            {comments.length === 0 ? (
              <div className="py-6 text-center text-xs sm:text-sm text-slate-500">
                Chưa có bình luận nào cho nhà hàng này. Hãy là người đầu tiên chia sẻ cảm nhận của bạn!
              </div>
            ) : (
              comments.map((c) => {
                const starsFilled = Math.max(0, Math.min(5, Math.round(c.rating)))
                const starsEmpty = 5 - starsFilled
                return (
                  <div key={c.id} className="pt-4 first:pt-0 flex gap-3">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 grid place-items-center text-emerald-800 font-bold text-xs">
                      {c.userName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {c.userName}
                        </span>
                        <span className="text-xs text-amber-500">
                          {'★'.repeat(starsFilled)}
                          <span className="text-slate-300">{'☆'.repeat(starsEmpty)}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          · {c.timeAgo}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* ===== 4. NỘI DUNG BẠN CÓ THỂ QUAN TÂM (GRID 2-3 CỘT, ẨN NẾU RỖNG, CTA NHẸ NHÀNG) ===== */}
        {relatedContent && relatedContent.length > 0 && (
          <section className="rounded-[20px] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Sparkles size={16} />
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Nội dung bạn có thể quan tâm
                </h2>
              </div>
            </div>

            {/* Grid chia 2 hoặc 3 cột chuẩn */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedContent.map((item) => {
                const isVideo = item.id === 'r3'
                return (
                  <article
                    key={item.id}
                    className="group relative flex flex-col overflow-hidden rounded-[16px] border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all hover:border-emerald-400/80 hover:shadow-md"
                  >
                    {/* Tag badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold w-fit mb-2.5 ${item.tagStyle}`}
                    >
                      {isVideo ? (
                        <PlayCircle size={10} />
                      ) : (
                        <Sparkles size={10} />
                      )}
                      {item.tag}
                    </span>

                    {/* Image with uniform aspect ratio */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[12px] bg-slate-900 mb-3">
                      <img
                        src={`https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
                          item.imgSeed,
                        )}&image_size=landscape_4_3`}
                        alt={item.title}
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
                        }}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    <h4 className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h4>

                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>

                    {/* Footer với nút CTA dạng Text link / Arrow nhẹ nhàng */}
                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.meta}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (isVideo) onNavigate?.('/videos')
                          else onNavigate?.('/recipes')
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors group/cta"
                      >
                        <span>Khám phá</span>
                        <ArrowRight
                          size={12}
                          className="transition-transform group-hover/cta:translate-x-0.5"
                        />
                      </button>
                    </div>
                  </article>
                )
              })}
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
