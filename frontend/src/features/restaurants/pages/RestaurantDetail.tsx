import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CarFront,
  ChefHat,
  Clock,
  Coffee,
  Compass,
  ExternalLink,
  Globe,
  Heart,
  MapPin,
  Navigation,
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
  StatusBadge,
  Textarea,
} from '../../../shared/components'
import {
  filterRestaurants,
  getRelatedContent,
  getRestaurantDetail,
  getRestaurantMenu,
  getReviewComments,
  getWeekHours,
} from '../api/restaurantApi'
import { RestaurantCard } from '../components/RestaurantCard'
import type {
  RelatedContentCard,
  Restaurant,
  RestaurantDietType,
  RestaurantDish,
  ReviewComment,
  WeekHour,
} from '../types/restaurant.types'
import {
  DIET_TYPE_LABELS,
  formatPriceRange,
} from '../types/restaurant.types'

interface RestaurantDetailPageProps {
  restaurantId?: string
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

/* ================================================================== */
/* Main
/* ================================================================== */

export default function RestaurantDetail({
  restaurantId = '',
  onNavigate,
  isLoggedIn: _isLoggedIn,
}: RestaurantDetailPageProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [favorite, setFavorite] = useState(false)
  const [menu, setMenu] = useState<RestaurantDish[]>([])
  const [weekHours, setWeekHours] = useState<WeekHour[]>([])
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [relatedContent, setRelatedContent] = useState<RelatedContentCard[]>([])
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const [data, menuData, hours, commentData, related] = await Promise.all([
          getRestaurantDetail(restaurantId),
          getRestaurantMenu(restaurantId),
          getWeekHours(restaurantId),
          getReviewComments(restaurantId),
          getRelatedContent(restaurantId),
        ])
        if (!cancelled) {
          setRestaurant(data)
          setFavorite(false)
          setMenu(menuData)
          setWeekHours(hours)
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
    showToast('✅ Đã gửi bình luận thành công (demo).')
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

  const ratingFormatted = restaurant.rating.toFixed(1)
  const priceShort = formatPriceRange(
    restaurant.priceRangeVND.min,
    restaurant.priceRangeVND.max,
  )
  const dietStrong = restaurant.dietTypes[0]
    ? DIET_TYPE_LABELS[restaurant.dietTypes[0] as RestaurantDietType] ?? 'Chay'
    : 'Chay'
  const highlightsJoined = restaurant.highlights.length
    ? restaurant.highlights.slice(0, 3)
    : ['Món ăn thanh đạm', 'Không gian đẹp', 'Phục vụ nhanh']

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
              leftIcon={<ArrowLeft size={12} />}
              onClick={() => onNavigate?.('/restaurants')}
            >
              Danh sách
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Share2 size={12} />}
              onClick={() => showToast('Đã copy link nhà hàng.')}
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
              onClick={() => {
                setFavorite((v) => !v)
                showToast(
                  favorite ? 'Đã gỡ khỏi yêu thích' : '❤️ Đã lưu vào yêu thích',
                )
              }}
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
              <span className="absolute left-3.5 top-3.5 z-10 inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/95 px-3 py-[5px] text-[11px] font-bold text-[#143A23] shadow-sm backdrop-blur">
                <span className="text-[#2E7D32]">✓</span> Không gian đã được kiểm duyệt
              </span>
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
            {/* Tag row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#55695D]">
                NHÀ HÀNG CHAY • {dietStrong.toUpperCase()}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[11.5px] font-bold text-[#2E7D32]">
                <span className="h-2 w-2 rounded-full bg-[#2E7D32]" /> Đang mở cửa • {restaurant.openingHours}
              </span>
            </div>

            {/* Tên */}
            <h1 className="m-0 text-[30px] sm:text-[34px] font-extrabold tracking-tight text-[#0E2A18] leading-[1.2]">
              {restaurant.name}
            </h1>

            {/* Distance */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#546C5C]">
              <span className="flex items-center gap-1 text-[#2E7D32]">
                <Navigation size={13} />
                Cách bạn {restaurant.distanceKm.toFixed(1)} km
              </span>
              <span className="text-slate-300">|</span>
              <span>{restaurant.district || 'Quận 1'}</span>
              <span className="text-slate-300">|</span>
              <span className="text-amber-700 font-bold">⭐ {ratingFormatted}</span>
            </div>

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
                <span className="text-[#2E7D32]">✓</span> Thuần chay 100%
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#DFEAE3] bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-[#2E7D32]">✓</span> Món Việt thanh tự
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#DFEAE3] bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-[#2E7D32]">✓</span> Không gian xanh yên tĩnh
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#DFEAE3] bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-[#2E7D32]">✓</span> Có chỗ đỗ ô tô
              </span>
            </div>

            {/* Action buttons */}
            <div className="mt-2 flex items-center gap-3">
              <Button
                type="button"
                variant="primary"
                leftIcon={<Compass size={15} />}
                onClick={() =>
                  showToast(`🧭 Mở lộ trình chỉ đường đến ${restaurant.name}`)
                }
                className="flex-1 !h-[42px] !rounded-[12px] !bg-[#2E7D32] hover:!bg-[#1B5E20] !font-bold text-sm"
              >
                Chỉ đường
              </Button>
              <Button
                type="button"
                variant="outline"
                leftIcon={<MapIcon size={15} />}
                onClick={() => showToast('🗺 Đang hiển thị vị trí trên bản đồ lớn.')}
                className="!h-[42px] !rounded-[12px] border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 text-sm px-4"
              >
                Xem trên bản đồ
              </Button>
            </div>
          </div>
        </section>

        {/* ===== SECTION: THÔNG TIN NHÀ HÀNG (6 cards) ===== */}
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
              Thông tin nhà hàng
            </h2>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3">
            <StatCard
              icon={<MapPin size={18} />}
              label="Địa chỉ chi tiết"
              value={`${restaurant.address}, ${restaurant.district}`}
              sub={`Khu vực trung tâm ${restaurant.city}`}
            />
            <StatCard
              icon={<Phone size={18} />}
              label="Số điện thoại"
              value={restaurant.phoneNumber}
              sub="Hỗ trợ đặt bàn và gọi món trước"
            />
            <StatCard
              icon={<Clock size={18} />}
              label="Giờ mở cửa"
              value={restaurant.openingHours}
              sub={`Phục vụ ngày cuối tuần: ${restaurant.closingDay}`}
            />
            <StatCard
              icon={<Wallet size={18} />}
              label="Mức giá tham khảo"
              value={priceShort}
              sub="Phù hợp cho cá nhân & nhóm"
            />
            <StatCard
              icon={<ChefHat size={18} />}
              label="Phong cách ẩm thực"
              value="Thuần chay Việt Nam đương đại"
              sub="Dưỡng sinh, thanh vị tự nhiên"
            />
            <StatCard
              icon={<CarFront size={18} />}
              label="Tiện ích không gian"
              value={`Biểu hoa, WiFi, Đỗ ô tô`}
              sub={
                restaurant.hasParking
                  ? 'Có phòng riêng và sân vườn thoáng'
                  : 'Có phòng riêng, chỗ đậu xe máy thoải mái'
              }
            />
          </div>
        </section>

        {/* ===== SECTION: GIỚI THIỆU ===== */}
        <section className="grid gap-6 rounded-[16px] border border-[#E2EDE6] bg-white p-5 sm:p-[22px] sm:grid-cols-[1.2fr_0.8fr] md:p-6">
          <div className="flex flex-col gap-3.5">
            <h3
              className="relative m-0 pl-3 font-extrabold text-[#0E2A18]"
              style={{ fontSize: '18px', lineHeight: '26px' }}
            >
              <span
                aria-hidden
                className="absolute left-0 top-1 bottom-1 w-[3.5px] rounded-full bg-gradient-to-b from-[#1F7A3F] to-[#3FAE62]"
              />
              Giới thiệu
            </h3>
            <p
              className="m-0 font-normal text-[#3A5244]"
              style={{ fontSize: '13.5px', lineHeight: '1.7' }}
            >
              {highlightsJoined[0]} · Sử dụng nguồn nguyên liệu rau củ hữu cơ tươi ngon mỗi ngày và vị tự nhiên.{' '}
              Không gian được bài trí mộc mạc với âm nhạc và nhiều cây xanh, mang đến trải nghiệm ẩm thực an lành,
              cân bằng dưỡng chất và xua tan căng thẳng thường nhật.
            </p>
            <div className="mt-1 flex flex-wrap gap-3">
              <div className="min-w-[180px] flex-1 rounded-[12px] border border-[#DCE9DF] bg-[#F4FAF5] p-3 sm:flex-none">
                <div
                  className="font-extrabold text-[#1F7A3F]"
                  style={{ fontSize: '20px', lineHeight: '26px' }}
                >
                  100%
                </div>
                <div className="text-[11.5px] font-semibold text-[#546C5C]">
                  Rau củ hữu cơ
                </div>
                {/* Fake progress */}
                <div className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-[#2E7D32]"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="min-w-[180px] flex-1 rounded-[12px] border border-[#F3E4D0] bg-[#FFF8F3] p-3 sm:flex-none">
                <div
                  className="font-extrabold text-[#C2561E]"
                  style={{ fontSize: '20px', lineHeight: '26px' }}
                >
                  0%
                </div>
                <div className="text-[11.5px] font-semibold text-[#546C5C]">
                  Phần nấu hóa học
                </div>
                <div className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-[#EF6C00]"
                    style={{ width: '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right image */}
          <div className="relative h-full min-h-[220px] overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-[#F4FAF5]">
            <img
              src={`${restaurant.imageUrl}&intro-right`}
              alt={`Không gian ${restaurant.name}`}
              className="h-full w-full min-h-[220px] object-cover"
            />
          </div>
        </section>

        {/* ===== SECTION: VỊ TRÍ & ĐƯỜNG ĐI + GIỜ MỞ CỬA ===== */}
        <section className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* Map column */}
          <div className="flex flex-col">
            <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
              <h2
                className="relative m-0 pl-3 font-extrabold text-[#0E2A18]"
                style={{ fontSize: '19px', lineHeight: '26px' }}
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-1 bottom-1 w-[3.5px] rounded-full bg-gradient-to-b from-[#1F7A3F] to-[#3FAE62]"
                />
                Vị trí & Đường đi
              </h2>
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#546C5C]">
                <span>🛵 5 phút xe máy</span>
                <span>🚶 12 phút đi bộ</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-[16px] border border-[#E2EDE6] bg-white shadow-[0_6px_18px_rgba(31,122,63,0.05)]">
              {/* Map header */}
              <div className="flex flex-wrap items-center gap-2.5 border-b border-[#E2EDE6] bg-[#F4FAF5] px-4 py-3 text-[12.5px] font-bold text-[#2F4638]">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#C6E3D2] bg-white px-2.5 py-[4px] text-[#1F7A3F]">
                  <MapPin size={11} className="text-[#1F7A3F]" />
                  An Nhiền Vegetarian
                </span>
                <span className="text-[#546C5C]">
                  <strong className="text-[#1F7A3F]">1.2 km</strong> từ vị trí của bạn
                </span>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    showToast('🗺 Đã mở Google Maps chỉ đường (demo).')
                  }
                  leftIcon={<Globe size={11} />}
                  className="ml-auto rounded-full !px-3 !py-[5px] !text-[11.5px] !font-bold !h-[28px]"
                >
                  Mở Google Maps chỉ đường
                </Button>
              </div>
              {/* Map body */}
              <div className="relative w-full" style={{ aspectRatio: '16 / 8' }}>
                <svg
                  viewBox="0 0 400 200"
                  preserveAspectRatio="xMidYMid slice"
                  className="h-full w-full"
                  aria-hidden
                >
                  <defs>
                    <linearGradient id="bgMap2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#D9F1DF" />
                      <stop offset="55%" stopColor="#EAF4FB" />
                      <stop offset="100%" stopColor="#E1F3E6" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="400" height="200" fill="url(#bgMap2)" />
                  {/* Parks */}
                  <circle cx="60" cy="150" r="28" fill="#CDEBD4" />
                  <rect x="260" y="20" width="80" height="50" rx="10" fill="#D6ECFE" opacity="0.7" />
                  <circle cx="320" cy="170" r="22" fill="#CDEBD4" />
                  {/* Roads */}
                  <path d="M-10,90 C110,90 180,60 280,80 C340,94 380,130 420,120" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" fill="none" />
                  <path d="M200,-10 C200,80 160,120 200,170 S280,200 280,210" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" fill="none" />
                  <path d="M40,-10 C100,80 60,120 120,180" stroke="#FFFFFF" strokeWidth="6" opacity="0.85" fill="none" />
                </svg>

                {/* Active pin + my marker */}
                <div
                  className="absolute left-[30%] top-[42%] -translate-x-1/2 -translate-y-full"
                  aria-hidden
                >
                  <div className="inline-flex items-center gap-1 rounded-full border-2 border-white bg-[#1F7A3F] px-2 py-1 text-[10px] font-extrabold text-white shadow">
                    <MapPin size={10} /> An Nhiền (1.2 km)
                  </div>
                </div>
                <div
                  className="absolute left-[56%] top-[48%] -translate-x-1/2 -translate-y-1/2"
                  aria-hidden
                >
                  <div className="relative">
                    <span className="block h-4 w-4 rounded-full border-[3px] border-white bg-[#2D7CFF] shadow" />
                    <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-[#2D7CFF] opacity-60" />
                  </div>
                </div>

                {/* Map bottom chips */}
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#DFEAE3] bg-white/96 px-2.5 py-1 text-[11.5px] font-bold text-[#2F4638] backdrop-blur">
                    🛵 Cách 5 phút đi xe máy
                  </span>
                  <span className="rounded-full border border-[#BFdAC8] bg-[#EDF8F1]/96 px-2.5 py-1 text-[11.5px] font-bold text-[#1F7A3F] backdrop-blur">
                    🚶 Giao thông thông thoáng
                  </span>
                </div>
              </div>

              {/* Map foot info */}
              <div className="mt-2 flex flex-wrap gap-2 px-4 pb-3 pt-1">
                <span className="rounded-full border border-[#E2EDE6] bg-white px-2.5 py-[4px] text-[11.5px] font-bold text-[#3A5244]">
                  🛵 Đường rộng rãi
                </span>
                <span className="rounded-full border border-[#BFdAC8] bg-[#EEF6F1] px-2.5 py-[4px] text-[11.5px] font-bold text-[#1F7A3F]">
                  🅿️ Gần bãi đậu xe công cộng
                </span>
              </div>
            </div>
          </div>

          {/* Hours column */}
          <aside className="flex flex-col gap-3.5">
            <h2
              className="relative m-0 pl-3 font-extrabold text-[#0E2A18]"
              style={{ fontSize: '19px', lineHeight: '26px' }}
            >
              <span
                aria-hidden
                className="absolute left-0 top-1 bottom-1 w-[3.5px] rounded-full bg-gradient-to-b from-[#1F7A3F] to-[#3FAE62]"
              />
              Giờ mở cửa chi tiết
            </h2>
            <div className="rounded-[16px] border border-[#E2EDE6] bg-white p-2.5 shadow-[0_4px_14px_rgba(31,122,63,0.04)]">
              <div className="flex flex-col gap-[2px]">
                {weekHours.map((wh) => (
                  <div
                    key={wh.day}
                    className={`flex items-center justify-between rounded-[10px] px-3 py-[10px] transition hover:bg-[#F5FAF6] ${
                      wh.isToday ? 'bg-[#E4F3E9]' : ''
                    }`}
                  >
                    <div className="inline-flex items-center gap-2 text-[13px] font-bold text-[#2F4638]">
                      <Calendar size={13} className="text-[#1F7A3F]" />
                      {wh.label}
                      {wh.isToday && (
                        <span className="rounded-full bg-[#1F7A3F] px-2 py-[2px] text-[10.5px] font-extrabold uppercase tracking-wider text-white">
                          Hôm nay
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[12.5px] font-bold text-[#3A5244]">
                      {wh.time}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-[10px] border border-[#F4E2CB] bg-[#FFF8F3] px-3 py-2 text-[11.5px] font-bold text-[#8A4A1B]">
                💡 Đặt chỗ trước cuối lúc 21:30 cùng ngày.
              </div>
            </div>
          </aside>
        </section>

        {/* ===== SECTION: MENU MÓN ĂN ===== */}
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
                Menu món ăn
              </h2>
              <p className="m-0 mt-1 text-[12.5px] font-semibold text-[#546C5C]">
                {menu.length > 0
                  ? `${menu.length} món được đầu bếp lựa chọn kỹ từ nguồn hữu cơ`
                  : 'Đang cập nhật menu nhà hàng...'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {menu.length === 0 ? (
              <SkeletonLoader count={4} variant="card" />
            ) : (
              menu.map((d) => {
                const priceFmt = d.priceVND
                  ? `${Math.round(d.priceVND / 1000)}.000 VNĐ`
                  : 'Liên hệ'
                return (
                  <article
                    key={d.id}
                    className="relative flex overflow-hidden rounded-[16px] border border-[#E2EDE6] bg-white p-3 shadow-[0_4px_14px_rgba(31,122,63,0.04)] transition hover:-translate-y-[1px] hover:border-[#2E7D32]/30"
                  >
                    <span
                      className={`absolute left-3 top-3 z-10 rounded-[6px] px-2.5 py-[3px] text-[10.5px] font-extrabold tracking-wide ${
                        d.tagColor ?? 'bg-[#1F7A3F] text-white'
                      }`}
                    >
                      {d.tag}
                    </span>
                    <div
                      className="shrink-0 overflow-hidden rounded-[12px] bg-[#E8F2EC]"
                      style={{ width: '150px', aspectRatio: '1 / 1' }}
                    >
                      <img
                        src={`https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
                          d.imgSeed,
                        )}&image_size=square_hd`}
                        alt={d.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 hover:scale-[1.04]"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5 pl-3 pt-6">
                      <h4
                        className="m-0 font-extrabold text-[#0E2A18]"
                        style={{ fontSize: '14.5px', lineHeight: '20px' }}
                      >
                        {d.name}
                      </h4>
                      <p
                        className="m-0 font-medium text-[#586F60] line-clamp-3"
                        style={{ fontSize: '12.5px', lineHeight: '1.55' }}
                      >
                        {d.desc}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-1">
                        <span className="text-[13px] font-extrabold text-[#1F7A3F]">
                          {priceFmt}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            showToast(
                              `📖 Đang mở công thức món "${d.name}" (demo).`,
                            )
                          }
                        >
                          Xem công thức
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
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

      {/* Silence unused */}
      <span className="hidden">
        <StatusBadge status="info" label="x" />
        <ExternalLink />
      </span>
    </div>
  )
}

/* ---------- Helper components ---------- */
function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-start gap-3.5 rounded-[14px] border border-[#E2EDE6] bg-white p-4 shadow-[0_4px_16px_rgba(31,122,63,0.03)]">
      <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[#E4F3E9] text-[#1F7A3F]">
        {icon}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-[11.5px] font-bold uppercase tracking-wide text-[#5E7769]">
          {label}
        </span>
        <span className="mt-[2px] truncate text-[14px] font-extrabold text-[#0E2A18]">
          {value}
        </span>
        {sub && (
          <span className="mt-[3px] text-[11.5px] font-semibold text-[#5E7769]">
            {sub}
          </span>
        )}
      </div>
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
