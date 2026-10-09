import {
  Clock,
  MapPin,
  Navigation,
  Star,
  Truck,
  Wallet,
} from 'lucide-react'
import {
  Button,
  StatusBadge,
} from '../../../shared/components'
import type { Restaurant, RestaurantDietType } from '../types/restaurant.types'
import {
  DIET_TYPE_LABELS,
  formatPriceRange,
  renderStars,
} from '../types/restaurant.types'

interface RestaurantCardProps {
  restaurant: Restaurant
  onSelect?: (id: string) => void
  onBook?: (id: string) => void
}

function mapDietBadge(
  d: RestaurantDietType,
):
  | 'suitable'
  | 'info'
  | 'insufficient'
  | 'warning'
  | 'neutral' {
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

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onSelect,
  onBook,
}) => {
  const ratingStars = renderStars(restaurant.rating)

  return (
    <article className="group flex flex-col overflow-hidden rounded-[16px] border border-[#e5e7eb] bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <button
        type="button"
        onClick={() => onSelect?.(restaurant.id)}
        className="relative block w-full text-left focus:outline-none"
        aria-label={`Mở chi tiết nhà hàng ${restaurant.name}`}
      >
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          loading="lazy"
          className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-80" />
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-[#1f2937] backdrop-blur">
          <Navigation size={12} className="text-[#2e7d32]" />
          {restaurant.distanceKm.toFixed(1)} km
        </span>
        <span className="absolute right-3 top-3 z-10">
          <StatusBadge
            size="sm"
            status={restaurant.hasDelivery ? 'suitable' : 'info'}
            label={restaurant.hasDelivery ? 'Có giao hàng' : 'Chỉ ăn tại chỗ'}
          />
        </span>
        <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-extrabold text-white backdrop-blur">
          <Clock size={12} /> {restaurant.openingHours}
        </span>
        <span className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2 py-1 text-[11px] font-extrabold text-amber-900 shadow">
          <Star size={12} className="fill-amber-900 stroke-amber-900" />
          <span className="font-bold">{restaurant.rating.toFixed(1)}</span>
          <span className="opacity-80">
            ({restaurant.reviewCount.toLocaleString('vi-VN')})
          </span>
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        {/* Diet badges */}
        <div className="flex flex-wrap gap-1.5">
          {restaurant.dietTypes.slice(0, 3).map((d) => (
            <StatusBadge
              key={d}
              size="sm"
              status={mapDietBadge(d)}
              label={DIET_TYPE_LABELS[d]}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => onSelect?.(restaurant.id)}
          className="text-left"
        >
          <h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug tracking-tight text-[#1f2937] group-hover:text-[#2e7d32]">
            {restaurant.name}
          </h3>
        </button>

        <p className="flex items-start gap-1.5 text-[12px] leading-5 text-[#6b7280]">
          <MapPin size={13} className="mt-0.5 flex-shrink-0 text-[#2e7d32]" />
          <span className="line-clamp-2">
            {restaurant.address}, {restaurant.district}, {restaurant.city}
          </span>
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-[#6b7280]">
          <span className="inline-flex items-center gap-1">
            <Wallet size={12} className="text-[#2e7d32]" />
            {formatPriceRange(
              restaurant.priceRangeVND.min,
              restaurant.priceRangeVND.max,
            )}
          </span>
          <span
            className="font-extrabold tracking-wide text-amber-600"
            title={`${restaurant.rating.toFixed(2)} / 5 (${restaurant.reviewCount} đánh giá)`}
          >
            {ratingStars}
          </span>
        </div>

        {/* Highlight chip */}
        <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-bold">
          {restaurant.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-full bg-[#e8f5e9] px-2 py-0.5 text-[#2e7d32]"
            >
              #{t}
            </span>
          ))}
        </div>

        {/* Tiện ích */}
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-[#6b7280]">
          {restaurant.hasParking && <span className="inline-flex items-center gap-1">🅿️ Để xe</span>}
          {restaurant.hasTakeAway && <span className="inline-flex items-center gap-1">🥡 Mang về</span>}
          {restaurant.acceptsBooking && <span className="inline-flex items-center gap-1">📞 Đặt chỗ</span>}
          {restaurant.hasDelivery && (
            <span className="inline-flex items-center gap-1">
              <Truck size={11} /> Giao hàng
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            variant="primary"
            fullWidth
            onClick={() => onSelect?.(restaurant.id)}
          >
            Xem chi tiết
          </Button>
          {restaurant.acceptsBooking && (
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

export default RestaurantCard
