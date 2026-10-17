import React from 'react'
import { ArrowRight, MapPin } from 'lucide-react'
import { Button } from '../../../shared/components'
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

const FALLBACK_RESTAURANT_IMG =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  featured: _featured = false,
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

  // ---- Horizontal Variant (used on list page) ----
  if (variant === 'horizontal') {
    return (
      <article
        className={`ui-card ui-content-card group relative flex overflow-hidden p-4 gap-4 transition-all duration-200 ${
          isSelected ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/30' : ''
        }`}
      >
        {/* ---- Thumbnail (160px width) ---- */}
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
            className="relative block overflow-hidden rounded-[14px] w-[130px] sm:w-[165px] h-[135px] sm:h-[145px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/40"
            aria-label={`Mở chi tiết nhà hàng ${cleanName}`}
          >
            <img
              src={displayImage}
              alt={cleanName}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
            />
          </div>
        </div>

        {/* ---- Right content ---- */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top badges row: diet type */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {restaurant.dietTypes.slice(0, 2).map((d) => (
              <span key={d} className="ui-badge ui-badge-green">
                {DIET_TYPE_LABELS[d as RestaurantDietType]?.replace(/\s*\(.*\)\s*/g, '') ?? d}
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
            className="mb-1 w-full text-left cursor-pointer focus:outline-none"
          >
            <h3 title={cleanName} className="ui-card-title line-clamp-2 group-hover:text-primary">
              {cleanName}
            </h3>
          </div>

          {/* Address */}
          <p className="mb-3 flex items-start gap-1.5 text-[13px] leading-[20px] text-[#6B7280]">
            <MapPin size={14} className="mt-[2px] shrink-0 text-[#2E7D32]" />
            <span className="line-clamp-2">{displayAddress}</span>
          </p>

          {/* Bottom actions */}
          <div className="mt-auto flex items-center justify-between gap-2">
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={handleCTAClick}
              rightIcon={<ArrowRight size={13} />}
            >
              {ctaLabel}
            </Button>
            {onBook && restaurant.acceptsBooking && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onBook?.(restaurant.id)}
              >
                Đặt chỗ
              </Button>
            )}
          </div>
        </div>
      </article>
    )
  }

  // ---- Compact/grid card (used in Nearby on detail page) ----
  return (
    <article className="ui-card ui-content-card group flex flex-col overflow-hidden p-3">
      <div className="relative overflow-hidden rounded-[12px] aspect-[4/3]">
        <img
          src={displayImage}
          alt={cleanName}
          loading="lazy"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
        />
      </div>

      <div className="mt-3 flex flex-col gap-1">
        {restaurant.dietTypes.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1">
            <span className="ui-badge ui-badge-green">
              {DIET_TYPE_LABELS[restaurant.dietTypes[0] as RestaurantDietType]?.replace(
                /\s*\(.*\)\s*/g,
                '',
              ) ?? restaurant.dietTypes[0]}
            </span>
          </div>
        )}
        <h3 title={cleanName} className="ui-card-title line-clamp-2 group-hover:text-primary">
          {cleanName}
        </h3>
        <p className="flex items-center gap-1 text-[12px] leading-[18px] text-[#6B7280]">
          <MapPin size={12} className="shrink-0 text-[#2E7D32]" />
          <span className="truncate">{displayAddress}</span>
        </p>
        <div className="mt-2 flex items-center justify-end">
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handleCTAClick}
            rightIcon={<ArrowRight size={12} />}
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </article>
  )
}

export default RestaurantCard
