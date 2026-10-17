import React from 'react'
import { RotateCcw, Search, X } from 'lucide-react'
import type {
  RestaurantDietType,
  RestaurantFilter as RestaurantFilterState,
} from '../types/restaurant.types'
import { DEFAULT_RESTAURANT_FILTER } from '../types/restaurant.types'

interface RestaurantFilterBarProps {
  filter: RestaurantFilterState
  onChange: (next: Partial<RestaurantFilterState>) => void
  onReset: () => void
  totalCount?: number
  isLoading?: boolean
  onSearch?: () => void
}

/* ---------- Constants ---------- */

type DistancePillValue = 'all' | '1' | '3' | '5' | '10'

const DISTANCE_OPTIONS: Array<{
  value: DistancePillValue
  label: string
  km: 0 | 1 | 3 | 5 | 10
}> = [
  { value: 'all', label: 'Tất cả', km: 0 },
  { value: '1', label: '< 1 km', km: 1 },
  { value: '3', label: '< 3 km', km: 3 },
  { value: '5', label: '< 5 km', km: 5 },
  { value: '10', label: '< 10 km', km: 10 },
]

const DIET_PILL_OPTIONS: Array<{ value: RestaurantDietType; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'vegan', label: 'Thuần chay (Vegan)' },
  { value: 'lacto', label: 'Ăn chay có sữa (Lacto)' },
  { value: 'ovo', label: 'Chay có trứng (Ovo)' },
  { value: 'ovo-lacto', label: 'Trứng & Sữa (Lacto-ovo)' },
]

function activeDistancePill(km: RestaurantFilterState['distanceMaxKm']): DistancePillValue {
  switch (km) {
    case 1:
      return '1'
    case 3:
      return '3'
    case 5:
      return '5'
    case 10:
      return '10'
    case 0:
    default:
      return 'all'
  }
}

export const RestaurantFilterBar: React.FC<RestaurantFilterBarProps> = ({
  filter,
  onChange,
  onReset,
}) => {
  const activeDist = activeDistancePill(filter.distanceMaxKm)
  const hasLocation = filter.latitude !== null && filter.longitude !== null

  return (
    <div className="rounded-[20px] border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
      {/* ===== Search row ===== */}
      <div className="relative mb-4 flex items-center">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Tìm kiếm nhà hàng hoặc khu vực (quận, tên đường, tên quán)..."
          value={filter.search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="w-full rounded-[14px] border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        {filter.search.trim() && (
          <button
            type="button"
            onClick={() => onChange({ search: '' })}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ===== Filter pills ===== */}
      <div className="flex flex-col gap-3.5">
        {/* Row 1: Khoảng cách pills */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 min-w-[90px]">
            Khoảng cách:
          </span>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {DISTANCE_OPTIONS.map((opt) => {
              const active = activeDist === opt.value
              const disabled = opt.km > 0 && !hasLocation
              return (
                <button
                  type="button"
                  key={opt.value}
                  disabled={disabled}
                  title={disabled ? 'Cần bật định vị vị trí để lọc khoảng cách' : undefined}
                  onClick={() =>
                    onChange({
                      distanceMaxKm: active
                        ? DEFAULT_RESTAURANT_FILTER.distanceMaxKm
                        : opt.km,
                    })
                  }
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    disabled
                      ? 'opacity-40 cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                      : active
                      ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] font-semibold shadow-xs'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-100" />

        {/* Row 2: Chế độ ăn pills */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 min-w-[90px]">
            Chế độ ăn:
          </span>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {DIET_PILL_OPTIONS.map((opt) => {
              const active = filter.diet === opt.value
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() =>
                    onChange({
                      diet: (active && opt.value !== 'all' ? 'all' : opt.value) as RestaurantDietType,
                    })
                  }
                  className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
                    active
                      ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] font-semibold shadow-xs'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  {active && <span className="mr-1">✓</span>}
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Row 3: Nút Xóa bộ lọc */}
        {(filter.search ||
          filter.diet !== 'all' ||
          filter.distanceMaxKm > 0 ||
          filter.city !== 'all') && (
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <RotateCcw size={12} />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default RestaurantFilterBar
