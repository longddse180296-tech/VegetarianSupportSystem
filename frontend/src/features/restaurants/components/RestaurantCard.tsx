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

/* ---------- Helpers ---------- */
const DIET_TAG_CLASS: Record<string, string> = {
  vegan: 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/30',
  'ovo-lacto': 'bg-[#FFF8E1] text-[#8D6E00] border-[#FFD54F]/40',
  ovo: 'bg-[#FFF3E0] text-[#BF6A00] border-[#FFB74D]/40',
  lacto: 'bg-[#FFF8E1] text-[#8D6E00] border-[#FFD54F]/40',
  raw: 'bg-[#E3F2FD] text-[#0D47A1] border-[#64B5F6]/40',
  'vegetarian-friendly':
    'bg-[#F3E5F5] text-[#6A1B9A] border-[#BA68C8]/40',
}

function dietPillClass(d: string): string {
  return (
    DIET_TAG_CLASS[d] ??
    'bg-[#F8FAF8] text-[#4B5563] border-[#E5E7EB]'
  )
}

/* ====================================================================== */
/* Main
/* ====================================================================== */

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  featured = false,
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
        className={`group relative flex overflow-hidden rounded-[16px] border transition-all duration-200 p-4 gap-4
          ${
          featured
            ? 'bg-gradient-to-br from-[#F1FAF3] via-white to-white border-[#C8E6C9]'
            : 'bg-white border-[#E5E7EB] hover:border-[#2E7D32]/30 hover:-translate-y-[1px]'
        }
          shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)]
          hover:shadow-[0_8px_20px_-4px_rgba(46,125,50,0.08),0_4px_12px_-2px_rgba(31,41,55,0.04)]
        `}
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
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
            />
          </button>
        </div>

        {/* ---- Right content ---- */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top badges row: diet type */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {restaurant.dietTypes.slice(0, 2).map((d) => (
              <span
                key={d}
                className={`inline-flex items-center rounded-full border px-2.5 py-[2px] text-[11px] font-bold leading-[16px] ${dietPillClass(d)}`}
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
            <h3 className="line-clamp-2 font-semibold text-[18px] leading-[26px] tracking-tight text-[#121C2A] group-hover:text-[#2E7D32]">
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
              {restaurant.address}, {restaurant.district}, {restaurant.city}
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
      className={`group flex flex-col overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white p-3
        transition-all duration-200 hover:-translate-y-[1px] hover:border-[#2E7D32]/30
        shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)]
      `}
    >
      <div className="relative overflow-hidden rounded-[12px] aspect-[4/3]">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
        />
      </div>

      <div className="mt-3 flex flex-col gap-1">
        {restaurant.dietTypes.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-[1px] text-[10px] font-bold ${dietPillClass(restaurant.dietTypes[0])}`}
            >
              {DIET_TYPE_LABELS[restaurant.dietTypes[0] as RestaurantDietType]?.replace(
                /\s*\(.*\)\s*/g,
                '',
              ) ?? restaurant.dietTypes[0]}
            </span>
          </div>
        )}
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-[22px] text-[#121C2A] group-hover:text-[#2E7D32]">
          {restaurant.name}
        </h3>
        <p className="flex items-center gap-1 text-[12px] leading-[18px] text-[#6B7280]">
          <MapPin size={12} className="text-[#2E7D32]" />
          {restaurant.district}, {restaurant.city}
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
