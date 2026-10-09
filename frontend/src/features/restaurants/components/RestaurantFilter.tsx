import { Filter, Search, X } from 'lucide-react'
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
  totalCount: number
  isLoading?: boolean
  onSearch?: () => void
}

/* ---------- Constants ---------- */

type DistancePillValue = 'all' | '1' | '3' | '5' | '10'

const DISTANCE_OPTIONS: Array<{ value: DistancePillValue; label: string; km: 0 | 1 | 3 | 5 | 10 }> = [
  { value: 'all', label: 'Tất cả', km: 0 },
  { value: '1', label: '< 1 km', km: 1 },
  { value: '3', label: '< 3 km', km: 3 },
  { value: '5', label: '< 5 km', km: 5 },
  { value: '10', label: '< 10 km', km: 10 },
]

const DIET_PILL_OPTIONS: Array<{ value: RestaurantDietType; label: string }> = [
  { value: 'vegan', label: 'Thuần chay (Vegan)' },
  { value: 'lacto', label: 'Ăn chay có sữa (Lacto)' },
  { value: 'ovo', label: 'Ăn chay có trứng (Ovo)' },
  { value: 'ovo-lacto', label: 'Ăn chay có trứng sữa (Lacto-ovo)' },
  { value: 'raw', label: 'Chay dưỡng sinh' },
  { value: 'vegetarian-friendly', label: 'Cà phê chay' },
]

/* ---------- Helpers ---------- */

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

/* ---------- Exported Component ---------- */

export const RestaurantFilterBar: React.FC<RestaurantFilterBarProps> = ({
  filter,
  onChange,
  onReset,
  totalCount,
  isLoading = false,
  onSearch,
}) => {
  const activeDist = activeDistancePill(filter.distanceMaxKm)

  const runSearch = () => {
    if (typeof onSearch === 'function') onSearch()
    else onChange({ ...filter })
  }

  return (
    <div
      className="rounded-[16px] border border-[#E3EFE5] bg-white p-4 shadow-[0_8px_26px_-22px_rgba(16,52,30,0.25)] sm:p-5"
    >
      {/* ===== Search row ===== */}
      <div className="mb-4 flex items-center gap-2 rounded-[14px] border border-[#DDEAE0] bg-[#F5F9F6] px-3.5 py-1.5">
        <Search size={17} className="shrink-0 text-[#6B7280]" />
        <Input
          placeholder="Tìm kiếm nhà hàng hoặc khu vực (quận, phố, tên quán)..."
          value={filter.search}
          onChange={(e) => onChange({ search: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') runSearch()
          }}
          className="!h-10 !border-0 !bg-transparent !p-0 !shadow-none focus:!ring-0"
          fullWidth
        />
        <Button
          type="button"
          size="sm"
          variant="primary"
          leftIcon={<Search size={14} />}
          onClick={runSearch}
          className="!bg-[#2E7D32] hover:!bg-[#1B5E20]"
        >
          Tìm kiếm
        </Button>
      </div>

      {/* ===== Filter pills ===== */}
      <div className="flex flex-col gap-4">
        {/* Row 1: Khoảng cách pills */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <span className="text-[12px] font-bold uppercase tracking-[0.02em] text-[#3E5146] min-w-[96px]">
            Khoảng cách:
          </span>
          {DISTANCE_OPTIONS.map((opt) => {
            const active = activeDist === opt.value
            return (
              <Button
                type="button"
                key={opt.value}
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange({
                    distanceMaxKm: active
                      ? DEFAULT_RESTAURANT_FILTER.distanceMaxKm
                      : opt.km,
                  })
                }
                className={`rounded-full !h-[26px] !px-3 !py-[5px] !text-[12px] font-bold !leading-[16px] transition
                  ${
                    active
                      ? '!bg-[#2E7D32] !border-[#2E7D32] !text-white shadow-sm !hover:bg-[#1B5E20]'
                      : '!bg-[#F0F4F8] border border-[#DDE5EC] !text-[#324253] hover:!border-[#B7D9C1] hover:!bg-[#EAF5EC]'
                  }
                `}
              >
                {opt.label}
              </Button>
            )
          })}
        </div>

        {/* Row 2: Tiện ích diet pills */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <span className="text-[12px] font-bold uppercase tracking-[0.02em] text-[#3E5146] min-w-[96px]">
            Tiện ích:
          </span>
          {DIET_PILL_OPTIONS.map((opt) => {
            const active = filter.diet === opt.value
            return (
              <Button
                type="button"
                key={opt.value}
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange({
                    diet: (active ? 'all' : opt.value) as RestaurantDietType,
                  })
                }
                className={`rounded-full !h-[26px] !px-3 !py-[5px] !text-[12px] font-bold !leading-[16px] transition
                  ${
                    active
                      ? '!bg-[#2E7D32] !border-[#2E7D32] !text-white shadow-sm !hover:bg-[#1B5E20]'
                      : '!bg-[#F0F4F8] border border-[#DDE5EC] !text-[#324253] hover:!border-[#B7D9C1] hover:!bg-[#EAF5EC]'
                  }
                `}
              >
                {opt.label}
              </Button>
            )
          })}
        </div>

        {/* Row 3: Tổng số quán ăn + nút Xóa bộ lọc */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-extrabold text-[#2E7D32]">
            <Filter size={11} />
            {isLoading ? 'Đang tải...' : `${totalCount} quán ăn`}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            leftIcon={<X size={12} />}
            className="!rounded-full !text-[#6B7280] hover:!bg-[#F3F4F6] hover:!text-[#1F2937]"
          >
            Xóa bộ lọc
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RestaurantFilterBar
