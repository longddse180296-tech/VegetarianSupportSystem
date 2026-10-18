import React from 'react'
import { ArrowRight, MapPin, Star } from 'lucide-react'
import type { Restaurant, RestaurantDietType } from '../types/restaurant.types'
import { DIET_TYPE_LABELS } from '../types/restaurant.types'
import { formatAddress } from '../utils/restaurantUtils'

interface RestaurantCardProps {
  restaurant: Restaurant
  featured?: boolean
  onSelect?: (id: string) => void
  onBook?: (id: string) => void
  variant?: 'default' | 'horizontal' | 'compact'
  ctaLabel?: string
  onNavigate?: (path: string) => void
  isSelected?: boolean
}

/* ---------- Helpers ---------- */
const DIET_TAG_CLASS: Record<string, string> = {
  vegan: 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]',
  'ovo-lacto': 'bg-[#FFF8E1] text-[#8D6E00] border-[#FFE082]',
  ovo: 'bg-[#FFF3E0] text-[#BF6A00] border-[#FFCC80]',
  lacto: 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]',
  raw: 'bg-[#E3F2FD] text-[#0D47A1] border-[#90CAF9]',
  'vegetarian-friendly': 'bg-[#F3E5F5] text-[#6A1B9A] border-[#CE93D8]',
}

function dietPillClass(d: string): string {
  return DIET_TAG_CLASS[d] ?? 'bg-[#F8FAF8] text-[#4B5563] border-[#E5E7EB]'
}

const FALLBACK_RESTAURANT_IMG = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  featured = false,
  onSelect,
  onBook,
  variant = 'horizontal',
  ctaLabel = 'Xem chi tiết',
  onNavigate,
  isSelected = false,
}) => {
  const [imgError, setImgError] = React.useState(false)
  const displayImage = imgError || !restaurant.imageUrl ? FALLBACK_RESTAURANT_IMG : restaurant.imageUrl

  const handleCTAClick = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (onNavigate) {
      onNavigate(`/restaurants/${restaurant.id}`)
    } else {
      onSelect?.(restaurant.id)
    }
  }

  const cleanName = restaurant.name.replace(/^\[Demo\]\s*/i, '')
  const displayAddress = formatAddress(
    restaurant.address,
    restaurant.district,
    restaurant.city,
  )

  const ratingValue = restaurant.rating ? restaurant.rating.toFixed(1) : '4.8'

  // ---- Horizontal Variant (used on list page) ----
  if (variant === 'horizontal') {
    return (
      <article
        className={`group relative flex overflow-hidden rounded-[20px] border transition-all duration-300 p-4 gap-4 sm:gap-5 ${
          isSelected
            ? 'bg-emerald-50/40 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
            : featured
            ? 'bg-gradient-to-br from-[#F1FAF3] via-white to-white border-[#C8E6C9]'
            : 'bg-white border-slate-200/90 hover:border-emerald-400/80 hover:-translate-y-0.5'
        } shadow-xs hover:shadow-lg`}
      >
        {/* ---- Thumbnail (160px width, rounded-16) ---- */}
        <div className="relative shrink-0">
          <div
            role="button"
            tabIndex={0}
            onClick={handleCTAClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCTAClick()
              }
            }}
            className="relative block overflow-hidden rounded-[16px] w-[130px] sm:w-[165px] h-[135px] sm:h-[145px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            aria-label={`Mở chi tiết nhà hàng ${cleanName}`}
          >
            <img
              src={displayImage}
              alt={cleanName}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </div>
        </div>

        {/* ---- Right content ---- */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top badges row: diet type */}
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {restaurant.dietTypes.map((d) => (
              <span
                key={d}
                className={`inline-flex items-center rounded-full border px-2.5 py-[2px] text-[11px] font-bold leading-none ${dietPillClass(
                  d,
                )}`}
              >
                {DIET_TYPE_LABELS[d as RestaurantDietType] ?? d}
              </span>
            ))}
          </div>

          {/* Name */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleCTAClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCTAClick()
              }
            }}
            className="w-full text-left cursor-pointer focus:outline-none"
          >
            <h3 
              title={cleanName}
              className="line-clamp-2 font-bold text-[16px] sm:text-[18px] leading-snug tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors"
            >
              {cleanName}
            </h3>
          </div>

          {/* Address with formatted & deduplicated district/city */}
          <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500 leading-normal">
            <MapPin size={13} className="mt-[2px] shrink-0 text-emerald-600" />
            <span className="line-clamp-1">{displayAddress}</span>
          </p>

          {/* Đánh giá ⭐ */}
          <div className="mt-2.5 flex items-center text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              <Star size={12} className="fill-amber-400 text-amber-500" />
              <span>{ratingValue}</span>
              <span className="text-[10px] font-normal text-amber-600">
                ({restaurant.reviewCount || 24})
              </span>
            </span>
          </div>

          {/* Bottom actions: Outline/Ghost button */}
          <div className="mt-auto pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {onBook && restaurant.acceptsBooking && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onBook(restaurant.id)
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Đặt chỗ
                </button>
              )}

              {/* Nút Xem chi tiết: Outline / Ghost button thanh lịch */}
              <button
                type="button"
                onClick={handleCTAClick}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50/60 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 transition-all hover:bg-emerald-600 hover:text-white hover:border-emerald-600 group/btn shadow-2xs"
              >
                <span>{ctaLabel}</span>
                <ArrowRight
                  size={13}
                  className="transition-transform group-hover/btn:translate-x-0.5"
                />
              </button>
            </div>
          </div>
        </div>
      </article>
    )
  }

  // ---- Compact/grid card (used in Nearby on detail page) ----
  return (
    <article className="group flex flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/80 shadow-xs hover:shadow-md">
      <div className="relative overflow-hidden rounded-[14px] aspect-[4/3] bg-slate-900">
        <img
          src={displayImage}
          alt={cleanName}
          loading="lazy"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1.5">
        {restaurant.dietTypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-[1px] text-[10px] font-bold ${dietPillClass(
                restaurant.dietTypes[0],
              )}`}
            >
              {DIET_TYPE_LABELS[
                restaurant.dietTypes[0] as RestaurantDietType
              ] ?? restaurant.dietTypes[0]}
            </span>
          </div>
        )}

        <h3
          title={cleanName}
          className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900 group-hover:text-emerald-700 transition-colors"
        >
          {cleanName}
        </h3>

        <p className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={12} className="shrink-0 text-emerald-600" />
          <span className="truncate">{displayAddress}</span>
        </p>

        {/* Đánh giá ⭐ */}
        <div className="mt-1 flex items-center text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
            <Star size={11} className="fill-amber-400 text-amber-500" />
            <span>{ratingValue}</span>
          </span>
        </div>

        {/* Outline CTA button */}
        <div className="mt-auto pt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={handleCTAClick}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors group/btn"
          >
            <span>{ctaLabel}</span>
            <ArrowRight
              size={12}
              className="transition-transform group-hover/btn:translate-x-0.5"
            />
          </button>
        </div>
      </div>
    </article>
  )
}

export default RestaurantCard
