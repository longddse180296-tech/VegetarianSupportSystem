import { MapPin } from 'lucide-react'
import { Button } from '../../../shared/components'
import type { Restaurant, RestaurantDietType } from '../types/restaurant.types'
import { DIET_TYPE_LABELS } from '../types/restaurant.types'

interface RestaurantCardProps {
  restaurant: Restaurant
  featured?: boolean
  onSelect?: (id: string) => void
  onBook?: (id: string) => void
  variant?: 'default' | 'horizontal' | 'compact'
  ctaLabel?: string
  onNavigate?: (path: string) => void
}

/* ====================================================================== */
/* Main
/* ====================================================================== */

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  featured: _featured = false,
  onSelect,
  onBook,
  variant = 'horizontal',
  ctaLabel = 'Xem chi tiết',
  onNavigate,
}) => {
  const handleCTAClick = () => {
    if (onNavigate) {
      onNavigate(`/restaurants/${restaurant.id}`)
    } else {
      onSelect?.(restaurant.id)
    }
  }

  // ---- Horizontal Variant (used on list) ----
  if (variant === 'horizontal') {
    return (
      <article
        className="ui-card ui-content-card group relative flex overflow-hidden p-4 gap-4"
      >
        {/* ---- Thumbnail (168px, rounded-12) ---- */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={handleCTAClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCTAClick()
              }
            }}
            className="relative block overflow-hidden rounded-[14px] w-[168px] h-[160px] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/40"
            aria-label={`Mở chi tiết nhà hàng ${restaurant.name}`}
          >
            {restaurant.imageUrl ? (
              <img src={restaurant.imageUrl} alt={restaurant.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
            ) : (
              <span className="grid h-full w-full place-items-center bg-[#EDF5EF] text-xs font-semibold text-[#54735E]">Chưa có ảnh</span>
            )}
          </button>
        </div>

        {/* ---- Right content ---- */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top badges row: diet type */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {restaurant.dietTypes.slice(0, 2).map((d) => (
              <span
                key={d}
                className="ui-badge ui-badge-green"
              >
                {DIET_TYPE_LABELS[d as RestaurantDietType]?.replace(
                  /\s*\(.*\)\s*/g,
                  '',
                ) ?? d}
              </span>
            ))}
          </div>

          {/* Name */}
          <button
            type="button"
            onClick={handleCTAClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCTAClick()
              }
            }}
            className="mb-1 w-full text-left focus:outline-none"
          >
            <h3 className="ui-card-title line-clamp-2 group-hover:text-primary">
              {restaurant.name}
            </h3>
          </button>

          {/* Address */}
          <p className="mb-3 flex items-start gap-1.5 text-[13px] leading-[20px] text-[#6B7280]">
            <MapPin
              size={14}
              className="mt-[2px] shrink-0 text-[#2E7D32]"
            />
            <span className="line-clamp-2">
              {[restaurant.address, restaurant.district].filter(Boolean).join(', ')}
            </span>
          </p>

          {/* Bottom actions */}
          <div className="mt-auto flex items-center justify-between gap-2">
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={handleCTAClick}
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

  // ---- Compact/grid card (used in Nearby on detail) ----
  return (
    <article
      className="ui-card ui-content-card group flex flex-col overflow-hidden p-3"
    >
      <div className="relative overflow-hidden rounded-[12px] aspect-[4/3]">
        {restaurant.imageUrl ? (
          <img src={restaurant.imageUrl} alt={restaurant.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
        ) : (
          <span className="grid h-full w-full place-items-center bg-[#EDF5EF] text-xs font-semibold text-[#54735E]">Chưa có ảnh</span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        {restaurant.dietTypes.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1">
            <span
              className="ui-badge ui-badge-green"
            >
              {DIET_TYPE_LABELS[restaurant.dietTypes[0] as RestaurantDietType]?.replace(
                /\s*\(.*\)\s*/g,
                '',
              ) ?? restaurant.dietTypes[0]}
            </span>
          </div>
        )}
        <h3 className="ui-card-title line-clamp-2 group-hover:text-primary">
          {restaurant.name}
        </h3>
        <p className="flex items-center gap-1 text-[12px] leading-[18px] text-[#6B7280]">
          <MapPin size={12} className="text-[#2E7D32]" />
          {restaurant.district || restaurant.address}
        </p>
        <div className="mt-2 flex items-center justify-end">
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handleCTAClick}
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </article>
  )
}

export default RestaurantCard
