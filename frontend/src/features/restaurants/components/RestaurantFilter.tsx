import React, { useEffect, useState } from 'react'
import { RotateCcw, Search, X } from 'lucide-react'
import { Button, Input } from '../../../shared/components'
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
  const [searchInput, setSearchInput] = useState(filter.search)

  useEffect(() => {
    setSearchInput(filter.search)
  }, [filter.search])

  const handleSearchSubmit = () => {
    onChange({ search: searchInput.trim() })
  }

  const activeDist = activeDistancePill(filter.distanceMaxKm)
  const isFiltering = Boolean(
    filter.search.trim() ||
      filter.diet !== 'all' ||
      filter.distanceMaxKm > 0 ||
      filter.city !== 'all',
  )

  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-5 md:p-6 shadow-xs">
      {/* Row 1: Search bar */}
      <div className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1 w-full relative">
            <Input
              aria-label="Tìm nhà hàng"
              placeholder="Tìm kiếm nhà hàng hoặc khu vực (quận, tên đường, tên quán)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit()
              }}
              leftIcon={<Search size={16} className="text-slate-400" />}
              className="!h-11 !rounded-[12px] !border-slate-300 !pl-10 !pr-9 w-full text-[14px]"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  onChange({ search: '' })
                }}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                title="Xóa từ khóa"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<Search size={15} />}
            onClick={handleSearchSubmit}
            className="!h-11 !rounded-[12px] !bg-[#2E7D32] hover:!bg-[#1B5E20] !px-6 whitespace-nowrap w-full md:w-auto font-semibold shadow-xs"
          >
            Tìm kiếm
          </Button>
          {isFiltering && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              leftIcon={<RotateCcw size={14} />}
              onClick={onReset}
              className="!h-11 !rounded-[12px] !text-[#2E7D32] hover:!bg-emerald-50 !font-semibold text-[13px] whitespace-nowrap w-full md:w-auto"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      {/* Row 2: Chế độ ăn chay (Diet pills) */}
      <div className="border-b border-slate-100 pt-5 pb-5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700">
            CHẾ ĐỘ ĂN CHAY
          </span>
          <span className="text-[11.5px] text-slate-500">
            Chọn để lọc theo trường phái ăn
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {DIET_PILL_OPTIONS.map((opt) => {
            const active = filter.diet === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange({
                    diet: (active && opt.value !== 'all' ? 'all' : opt.value) as RestaurantDietType,
                  })
                }
                className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] transition-all duration-150 ${
                  active
                    ? 'border-2 border-[#2E7D32] bg-[#2E7D32] font-bold text-white shadow-xs'
                    : 'border-2 border-slate-300 bg-white font-semibold text-slate-800 hover:border-emerald-600 hover:bg-emerald-50/60 hover:text-emerald-900'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Row 3: Khoảng cách tìm kiếm (Distance pills) */}
      <div className="pt-5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700">
            KHOẢNG CÁCH TÌM KIẾM
          </span>
          <span className="text-[11.5px] text-slate-500">
            Lọc quán theo bán kính vị trí
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {DISTANCE_OPTIONS.map((opt) => {
            const active = activeDist === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange({
                    distanceMaxKm: active
                      ? DEFAULT_RESTAURANT_FILTER.distanceMaxKm
                      : opt.km,
                  })
                }
                className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] transition-all duration-150 ${
                  active
                    ? 'border-2 border-[#2E7D32] bg-[#2E7D32] font-bold text-white shadow-xs'
                    : 'border-2 border-slate-300 bg-white font-semibold text-slate-800 hover:border-emerald-600 hover:bg-emerald-50/60 hover:text-emerald-900'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Row 4: Active filters status */}
      {isFiltering && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Đang lọc theo:{' '}
            {[
              filter.search && `"${filter.search}"`,
              filter.distanceMaxKm > 0 && `Bán kính: < ${filter.distanceMaxKm} km`,
              filter.diet !== 'all' && `Chế độ: ${DIET_PILL_OPTIONS.find((d) => d.value === filter.diet)?.label ?? filter.diet}`,
              filter.city !== 'all' && `Khu vực: ${filter.city}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          <button
            type="button"
            onClick={onReset}
            className="font-bold text-[#2E7D32] hover:underline flex items-center gap-1"
          >
            <RotateCcw size={12} />
            <span>Xóa bộ lọc</span>
          </button>
        </div>
      )}
    </section>
  )
}

export default RestaurantFilterBar
