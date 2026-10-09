import { Filter, RefreshCw, Search, SlidersHorizontal } from 'lucide-react'
import {
  Button,
  Input,
  Select,
  type SelectOption,
} from '../../../shared/components'
import type {
  RestaurantCity,
  RestaurantDietType,
  RestaurantFilter,
  RestaurantSortOption,
} from '../types/restaurant.types'
import {
  CITY_LABELS,
  DEFAULT_RESTAURANT_FILTER,
  DIET_TYPE_LABELS,
  SORT_LABELS,
} from '../types/restaurant.types'

interface RestaurantFilterProps {
  filter: RestaurantFilter
  onChange: (next: Partial<RestaurantFilter>) => void
  onReset: () => void
  totalCount: number
  isLoading?: boolean
}

const CITY_OPTIONS: SelectOption[] = [
  { value: 'all', label: CITY_LABELS['all'] },
  { value: 'Hà Nội', label: CITY_LABELS['Hà Nội'] },
  { value: 'TP.HCM', label: CITY_LABELS['TP.HCM'] },
  { value: 'Đà Nẵng', label: CITY_LABELS['Đà Nẵng'] },
]

const DIET_OPTIONS: SelectOption[] = [
  { value: 'all', label: DIET_TYPE_LABELS['all'] },
  { value: 'vegan', label: DIET_TYPE_LABELS['vegan'] },
  { value: 'ovo-lacto', label: DIET_TYPE_LABELS['ovo-lacto'] },
  { value: 'ovo', label: DIET_TYPE_LABELS['ovo'] },
  { value: 'lacto', label: DIET_TYPE_LABELS['lacto'] },
  { value: 'raw', label: DIET_TYPE_LABELS['raw'] },
  { value: 'vegetarian-friendly', label: DIET_TYPE_LABELS['vegetarian-friendly'] },
]

const SORT_OPTIONS: SelectOption[] = (
  Object.keys(SORT_LABELS) as RestaurantSortOption[]
).map((k) => ({ value: k, label: SORT_LABELS[k] }))

const RATING_OPTIONS: SelectOption[] = [
  { value: '0', label: 'Tất cả đánh giá' },
  { value: '3', label: 'Từ 3.0 ★' },
  { value: '3.5', label: 'Từ 3.5 ★' },
  { value: '4', label: 'Từ 4.0 ★' },
  { value: '4.5', label: 'Từ 4.5 ★' },
]

export const RestaurantFilterBar: React.FC<RestaurantFilterProps> = ({
  filter,
  onChange,
  onReset,
  totalCount,
  isLoading = false,
}) => {
  const isFiltering =
    filter.search.trim() !== '' ||
    filter.city !== DEFAULT_RESTAURANT_FILTER.city ||
    filter.diet !== DEFAULT_RESTAURANT_FILTER.diet ||
    filter.sort !== DEFAULT_RESTAURANT_FILTER.sort ||
    filter.ratingMin !== DEFAULT_RESTAURANT_FILTER.ratingMin ||
    filter.deliveryOnly !== DEFAULT_RESTAURANT_FILTER.deliveryOnly

  return (
    <div className="rounded-[20px] border border-[#e5e7eb] bg-white p-4 shadow-xs sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#e8f5e9] text-[#2e7d32]">
            <SlidersHorizontal size={15} />
          </span>
          <div>
            <div className="text-[15px] font-extrabold tracking-tight text-[#1f2937]">
              Bộ lọc nhà hàng & quán ăn chay
            </div>
            <div className="text-[11px] text-[#6b7280]">
              Lọc theo khu vực, chế độ ăn, mức đánh giá & tiện ích bạn cần.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#6b7280]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2.5 py-1 font-extrabold text-[#2e7d32]">
            <Filter size={11} />
            {isLoading ? 'Đang tải...' : `${totalCount} quán ăn`}
          </span>
          {isFiltering && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw size={12} />}
              onClick={onReset}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <Input
            label="Tìm nhà hàng / địa chỉ"
            size={13}
            placeholder="Tên quán, tên đường, quận, từ khóa..."
            value={filter.search}
            onChange={(e) => onChange({ search: e.target.value })}
            leftIcon={<Search size={14} />}
          />
        </div>
        <div className="md:col-span-2">
          <Select
            label="Thành phố"
            size={13}
            value={filter.city}
            onChange={(e) => onChange({ city: e.target.value as RestaurantCity })}
            options={CITY_OPTIONS}
          />
        </div>
        <div className="md:col-span-3">
          <Select
            label="Chế độ ăn chay"
            size={13}
            value={filter.diet}
            onChange={(e) => onChange({ diet: e.target.value as RestaurantDietType })}
            options={DIET_OPTIONS}
          />
        </div>
        <div className="md:col-span-1.5 md:col-span-2">
          <Select
            label="Đánh giá"
            size={13}
            value={String(filter.ratingMin)}
            onChange={(e) =>
              onChange({ ratingMin: Number(e.target.value || 0) })
            }
            options={RATING_OPTIONS}
          />
        </div>
        <div className="md:col-span-1">
          <Select
            label="Sắp xếp"
            size={13}
            value={filter.sort}
            onChange={(e) => onChange({ sort: e.target.value as RestaurantSortOption })}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="delivery-only"
            className={`inline-flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-1.5 text-[12px] font-extrabold transition ${
              filter.deliveryOnly
                ? 'border-[#2e7d32] bg-[#e8f5e9] text-[#2e7d32] shadow-sm'
                : 'border-[#e5e7eb] bg-white text-[#1f2937] hover:border-[#c8e6c9]'
            }`}
          >
            <input
              id="delivery-only"
              type="checkbox"
              className="h-3.5 w-3.5 accent-[#2e7d32]"
              checked={filter.deliveryOnly}
              onChange={(e) => onChange({ deliveryOnly: e.target.checked })}
            />
            Chỉ xem có giao hàng
          </label>
          <label
            htmlFor="fav-only"
            className={`inline-flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-1.5 text-[12px] font-extrabold transition ${
              filter.favoritesOnly
                ? 'border-rose-300 bg-rose-50 text-rose-700 shadow-sm'
                : 'border-[#e5e7eb] bg-white text-[#1f2937] hover:border-rose-200'
            }`}
          >
            <input
              id="fav-only"
              type="checkbox"
              className="h-3.5 w-3.5 accent-rose-500"
              checked={filter.favoritesOnly}
              onChange={(e) => onChange({ favoritesOnly: e.target.checked })}
            />
            Đã lưu yêu thích (demo)
          </label>
        </div>
      </div>
    </div>
  )
}

export default RestaurantFilterBar
