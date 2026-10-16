import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Coffee,
  Compass,
  Heart,
  MapPin,
  Map as MapIcon,
  Phone,
  PlayCircle,
  Share2,
  Sparkles,
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
    const query = encodeURIComponent(`${restaurant.name}, ${restaurant.address}, ${restaurant.district}, ${restaurant.city}`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer')
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

  // Nearby restaurants (mock same-city, different IDs)
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

  /* =========================================================== */
  /* Loading state                                               */
  /* =========================================================== */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAF8]">
        <div className="mx-auto w-full max-w-[1200px] px-[24px] py-6 sm:px-[16px]">
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
        <div className="mx-auto w-full max-w-[1200px] px-[24px] py-6 sm:px-[16px]">
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
  const primaryDietKey = restaurant.dietTypes[0] ?? 'vegan'
  const coreDietLabel = CORE_DIET_TYPE_MAP[primaryDietKey] ?? 'Thuần chay (Vegan)'

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#0E2A18] font-['Inter']">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-7 px-[24px] py-5 sm:px-[16px]">
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
              <img
                src={restaurant.imageUrl}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />
            </div>
            {/* 2 thumbnail dưới */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(restaurant.galleryImages && restaurant.galleryImages.length > 0
                ? restaurant.galleryImages.slice(0, 2)
                : [
                    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=600&q=80',
                  ]
              ).map((src, idx) => (
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
              <div className="flex items-center gap-2.5">
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
              </div>
              <div className="flex items-center gap-2.5">
                <Wallet size={15} className="shrink-0 text-[#2E7D32]" />
                <span>
                  Khoảng giá tham khảo:{' '}
                  <strong className="text-[#2E7D32]">
                    {restaurant.priceRange || '100.000đ - 250.000đ / người'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Amenities badges */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#2F4638]">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#DFEAE3] bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-[#2E7D32]">✓</span> {coreDietLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#DFEAE3] bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-[#2E7D32]">✓</span> Món Việt thanh tự
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#DFEAE3] bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-[#2E7D32]">✓</span> Không gian xanh yên tĩnh
              </span>
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

        {/* ===== SECTION: ĐÁNH GIÁ & BÌNH LUẬN ===== */}
        <section>
          <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                className="relative m-0 pl-3 font-extrabold text-[#0E2A18]"
                style={{ fontSize: '19px', lineHeight: '26px' }}
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-1 bottom-1 w-[3.5px] rounded-full bg-gradient-to-b from-[#1F7A3F] to-[#3FAE62]"
                />
                Đánh giá &amp; Bình luận
              </h2>
              <p className="m-0 mt-1 text-[12.5px] font-semibold text-[#546C5C]">
                {comments.length} phản hồi từ cộng đồng khách ăn chay
              </p>
            </div>
          </div>

          <div className="rounded-[16px] border border-[#E2EDE6] bg-white p-4 sm:p-5 shadow-[0_4px_14px_rgba(31,122,63,0.04)]">
            {/* Composer */}
            <div className="mb-4 flex gap-3">
              <div
                className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-[#C8E6C9] bg-[#E8F5E9] grid place-items-center text-[#1F7A3F] font-bold"
                aria-label="Avatar của bạn"
              >
                Bạn
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Textarea
                  label="Chia sẻ trải nghiệm của bạn tại nhà hàng này"
                  placeholder="Món ăn ngon không? Không gian thế nào? Nhân viên phục vụ có tận tâm không?..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                  >
                    Gửi bình luận
                  </Button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="my-4 h-px w-full bg-[#E5EFE8]" />

            {/* Comment list */}
            <div className="flex flex-col gap-4">
              {comments.map((c) => {
                const starsFilled = Math.max(0, Math.min(5, Math.round(c.rating)))
                const starsEmpty = 5 - starsFilled
                return (
                  <div
                    key={c.id}
                    className="flex gap-3 rounded-[12px] p-2 transition hover:bg-[#F7FBF8]"
                  >
                    <div
                      className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-[#DFEAE3] bg-[#F4FAF5] grid place-items-center text-[#1F7A3F] font-bold text-xs"
                      aria-label={`Avatar ${c.userName}`}
                    >
                      <img
                        src={`https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
                          c.avatarSeed,
                        )}&image_size=square`}
                        alt={c.userName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).style.display =
                            'none'
                        }}
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13.5px] font-extrabold text-[#0E2A18]">
                          {c.userName}
                        </span>
                        <span className="text-[11.5px] text-amber-600">
                          {'★'.repeat(starsFilled)}
                          <span className="text-[#D1D5DB]">
                            {'☆'.repeat(starsEmpty)}
                          </span>
                        </span>
                        <span className="text-[11px] text-[#6B7280] font-medium">
                          · {c.timeAgo}
                        </span>
                      </div>
                      <p
                        className="m-0 text-[13px] leading-[1.65] text-[#3A5244]"
                      >
                        {c.content}
                      </p>
                      <div className="mt-0.5 flex items-center">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            showToast(
                              `💬 Đã mở khung trả lời bình luận của ${c.userName} (demo).`,
                            )
                          }
                        >
                          Trả lời
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ===== SECTION: NỘI DUNG BẠN CÓ THỂ QUAN TÂM ===== */}
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
              Nội dung bạn có thể quan tâm
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {relatedContent.map((item) => {
              const isVideo = item.id === 'r3'
              return (
                <article
                  key={item.id}
                  className="relative flex flex-col gap-2.5 overflow-hidden rounded-[16px] border border-[#E2EDE6] bg-white p-3 pb-3 pt-9 shadow-[0_4px_14px_rgba(31,122,63,0.04)] transition hover:-translate-y-[1px] hover:border-[#2E7D32]/30"
                >
                  <span
                    className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-[6px] border px-2.5 py-[3px] text-[10.5px] font-extrabold ${item.tagStyle}`}
                  >
                    {isVideo ? (
                      <PlayCircle size={10} />
                    ) : item.id === 'r1' ? (
                      <BookOpen size={10} />
                    ) : (
                      <Sparkles size={10} />
                    )}
                    {item.tag}
                  </span>
                  <div
                    className="overflow-hidden rounded-[12px] bg-[#E8F2EC]"
                    style={{ aspectRatio: '5 / 3' }}
                  >
                    <img
                      src={`https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(item.imgSeed)}&image_size=landscape_4_3`}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                    />
                  </div>
                  <h4
                    className="m-0 font-extrabold text-[#0E2A18]"
                    style={{ fontSize: '14.5px', lineHeight: '20px' }}
                  >
                    {item.title}
                  </h4>
                  <p
                    className="m-0 font-medium text-[#586F60]"
                    style={{ fontSize: '12.5px', lineHeight: '1.55' }}
                  >
                    {item.desc}
                  </p>
                  <div className="mt-auto pt-1 text-[11.5px] font-semibold text-[#546C5C]">
                    {item.meta}
                  </div>
                </article>
              )
            })}
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
              Nhà hàng chay gần đây
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
              <SkeletonLoader count={3} variant="card" />
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
