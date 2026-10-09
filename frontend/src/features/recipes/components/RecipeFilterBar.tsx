import { Heart, RotateCcw, Search, SlidersHorizontal } from 'lucide-react'
import {
  Button,
  Input,
  Select,
  type SelectOption,
} from '../../../shared/components'
import type {
  RecipeDietCategory,
  RecipeDifficulty,
  RecipeListFilter,
  RecipeSortOption,
} from '../types/recipe.types'
import {
  DEFAULT_RECIPE_FILTER,
  DIET_CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  SORT_LABELS,
} from '../types/recipe.types'

interface RecipeFilterBarProps {
  filter: RecipeListFilter
  onChange: (next: Partial<RecipeListFilter>) => void
  onReset: () => void
  totalCount: number
  isLoading?: boolean
}

const DIET_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả chế độ ăn' },
  ...(Object.keys(DIET_CATEGORY_LABELS) as RecipeDietCategory[]).map((k) => ({
    value: k,
    label: DIET_CATEGORY_LABELS[k],
  })),
]

const DIFF_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả độ khó' },
  ...(Object.keys(DIFFICULTY_LABELS) as RecipeDifficulty[]).map((k) => ({
    value: k,
    label: DIFFICULTY_LABELS[k],
  })),
]

const SORT_OPTIONS: SelectOption[] = (
  Object.keys(SORT_LABELS) as RecipeSortOption[]
).map((k) => ({ value: k, label: SORT_LABELS[k] }))

export const RecipeFilterBar: React.FC<RecipeFilterBarProps> = ({
  filter,
  onChange,
  onReset,
  totalCount,
  isLoading = false,
}) => {
  const isFiltering =
    filter.search.trim() !== '' ||
    filter.diet !== DEFAULT_RECIPE_FILTER.diet ||
    filter.difficulty !== DEFAULT_RECIPE_FILTER.difficulty ||
    filter.favoritesOnly !== DEFAULT_RECIPE_FILTER.favoritesOnly

  return (
    <div className="rounded-[20px] border border-[#e5e7eb] bg-white p-4 shadow-xs sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#e8f5e9] text-[#2e7d32]">
            <SlidersHorizontal size={15} />
          </span>
          <div>
            <div className="text-[15px] font-extrabold tracking-tight text-[#1f2937]">
              Bộ lọc công thức nấu ăn
            </div>
            <div className="text-[11px] text-[#6b7280]">
              Tìm theo tên hoặc nguyên liệu, lọc theo chế độ ăn, độ khó, hoặc chỉ xem món đã lưu.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#6b7280]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2.5 py-1 font-extrabold text-[#2e7d32]">
            {isLoading ? 'Đang tải...' : `${totalCount} công thức`}
          </span>
          {isFiltering && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<RotateCcw size={12} />}
              onClick={onReset}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-12">
        <div className="md:col-span-5">
          <Input
            label="Tìm công thức"
            size={13}
            placeholder="Tìm tên món, nguyên liệu, từ khóa..."
            value={filter.search}
            onChange={(e) => onChange({ search: e.target.value })}
            leftIcon={<Search size={14} />}
          />
        </div>
        <div className="md:col-span-2">
          <Select
            label="Chế độ ăn"
            size={13}
            value={filter.diet}
            onChange={(e) =>
              onChange({ diet: e.target.value as RecipeDietCategory | 'all' })
            }
            options={DIET_OPTIONS}
          />
        </div>
        <div className="md:col-span-2">
          <Select
            label="Độ khó"
            size={13}
            value={filter.difficulty}
            onChange={(e) =>
              onChange({ difficulty: e.target.value as RecipeDifficulty | 'all' })
            }
            options={DIFF_OPTIONS}
          />
        </div>
        <div className="md:col-span-2">
          <Select
            label="Sắp xếp"
            size={13}
            value={filter.sort}
            onChange={(e) => onChange({ sort: e.target.value as RecipeSortOption })}
            options={SORT_OPTIONS}
          />
        </div>
        <div className="flex items-end md:col-span-1">
          <button
            type="button"
            onClick={() => onChange({ favoritesOnly: !filter.favoritesOnly })}
            className={`flex h-[42px] w-full items-center justify-center gap-1.5 rounded-[10px] border px-3 text-[12px] font-extrabold transition ${
              filter.favoritesOnly
                ? 'border-rose-300 bg-rose-50 text-rose-700 shadow-sm ring-1 ring-rose-200'
                : 'border-[#e5e7eb] bg-white text-[#1f2937] hover:border-[#2e7d32]/40 hover:bg-[#f8faf8]'
            }`}
          >
            <Heart
              size={13}
              strokeWidth={2.25}
              className={
                filter.favoritesOnly
                  ? 'fill-rose-500 stroke-rose-600'
                  : 'stroke-[#6b7280]'
              }
            />
            Yêu thích
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecipeFilterBar
