import { RotateCcw, Search, Sparkles } from 'lucide-react'
import { Button, Input, Select, type SelectOption } from '../../../shared/components'
import {
  getRecipeFilterOptions,
} from '../api/recipeApi'
import type {
  RecipeListFilter,
  RecipeSortOption,
} from '../types/recipe.types'
import { DEFAULT_RECIPE_FILTER } from '../types/recipe.types'

interface RecipeFilterBarProps {
  filter: RecipeListFilter
  onChange: (next: Partial<RecipeListFilter>) => void
  onReset: () => void
  totalCount: number
  isLoading?: boolean
  category: string
  setCategory: (c: string) => void
  cookTimeTier: string
  setCookTimeTier: (c: string) => void
  kcalTier: string
  setKcalTier: (c: string) => void
  dietPill: string
  setDietPill: (c: string) => void
  matchProfile: boolean
  setMatchProfile: (v: boolean) => void
  /** Not rendered in bar UI anymore (keep contract, parent still uses it for sorting client-side). */
  sort?: RecipeSortOption
  setSort?: (v: RecipeSortOption) => void
  onOpenAI: () => void
}

export const RecipeFilterBar: React.FC<RecipeFilterBarProps> = ({
  filter,
  onChange,
  onReset,
  totalCount,
  isLoading = false,
  category,
  setCategory,
  cookTimeTier,
  setCookTimeTier,
  kcalTier,
  setKcalTier,
  dietPill,
  setDietPill,
  matchProfile,
  setMatchProfile,
  onOpenAI,
}) => {
  const options = getRecipeFilterOptions()

  const DIET_PILLS = options.dietPills
  const CATEGORY_PILLS = options.categoryPills
  const COOKTIME_OPTIONS: SelectOption[] = options.cookTimeOptions
  const KCAL_OPTIONS: SelectOption[] = options.kcalOptions

  const isFiltering =
    filter.search.trim() !== '' ||
    filter.diet !== DEFAULT_RECIPE_FILTER.diet ||
    filter.difficulty !== DEFAULT_RECIPE_FILTER.difficulty ||
    category !== 'all' ||
    cookTimeTier !== 'all' ||
    kcalTier !== 'all'

  return (
    <div
      className="rounded-[20px] border border-[#E5E7EB] bg-white px-5 py-4"
      style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
    >
      {/* Search + Search/AI btns */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <Input
            size={14}
            placeholder="Tìm kiếm công thức theo tên món hoặc nguyên liệu (đậu hũ, nấm, hạt sen...)"
            value={filter.search}
            onChange={(e) => onChange({ search: e.target.value })}
            leftIcon={<Search size={16} className="text-[#6B7280]" />}
            className="!h-11 !rounded-[14px] !px-4"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<Search size={15} />}
            onClick={() => onChange({ search: filter.search })}
            className="!h-11 !rounded-[14px] !px-5"
          >
            Tìm kiếm
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            leftIcon={<Sparkles size={15} className="text-[#2e7d32] group-hover:text-white" />}
            onClick={onOpenAI}
            className="group !h-11 !rounded-[14px] !px-5 !border-[#2e7d32] !text-[#2e7d32] !bg-[#e8f5e9] hover:!bg-[#2e7d32] hover:!text-white transition-colors"
          >
            Khám phá theo Tủ bếp AI
          </Button>
        </div>
      </div>

      {/* Diet pills row */}
      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="text-[12px] font-bold uppercase tracking-[0.02em] text-[#6B7280]">
            DANH MỤC MÓN ĂN <span className="ml-1 text-[10px]">CHẾ ĐỘ ĂN CỦA BẠN:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {DIET_PILLS.map((p) => {
              const active = dietPill === p.value
              return (
                <Button
                  key={p.value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDietPill(p.value)}
                  className={`rounded-full ${
                    active
                      ? '!bg-[#2E7D32] !text-white hover:!bg-[#1B5E20]'
                      : '!border !border-[#E5E7EB] !bg-white !text-[#4B5563] hover:!bg-[#F5FBF6]'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full mr-1 ${
                      active ? 'bg-white' : 'bg-[#2E7D32]'
                    }`}
                  />
                  {p.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Match profile toggle */}
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-[#6B7280]">
            Tự động lọc theo Hồ sơ của tôi
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={matchProfile}
            onClick={() => setMatchProfile(!matchProfile)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
              matchProfile ? 'bg-[#2E7D32]' : 'bg-[#D1D5DB]'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                matchProfile ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div className="mt-3 flex flex-col gap-2">
        <div className="text-[12px] font-bold uppercase tracking-[0.02em] text-[#6B7280]">
          DANH MỤC MÓN ĂN
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_PILLS.map((p) => {
            const active = category === p.value
            return (
              <Button
                key={p.value}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCategory(p.value)}
                className={`rounded-full ${
                  active
                    ? '!bg-[#2E7D32] !text-white hover:!bg-[#1B5E20]'
                    : '!border !border-[#E5E7EB] !bg-white !text-[#4B5563] hover:!bg-[#F5FBF6]'
                }`}
              >
                {p.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Cook time + Kcal selectors */}
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-end md:gap-4">
          <div className="flex-1 min-w-[220px]">
            <div className="mb-1.5 text-[12px] font-semibold text-[#6B7280]">
              Thời gian nấu
            </div>
            <Select
              value={cookTimeTier}
              onChange={(e) => setCookTimeTier(e.target.value)}
              options={COOKTIME_OPTIONS}
              className="!rounded-[12px]"
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <div className="mb-1.5 text-[12px] font-semibold text-[#6B7280]">
              Mức Calo (Kcal / Khẩu phần)
            </div>
            <Select
              value={kcalTier}
              onChange={(e) => setKcalTier(e.target.value)}
              options={KCAL_OPTIONS}
              className="!rounded-[12px]"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 md:min-w-[160px]">
          {isFiltering ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              leftIcon={<RotateCcw size={12} />}
              onClick={onReset}
              className="!h-10 !rounded-[12px] !text-[#6B7280] w-full md:w-auto"
            >
              Xóa bộ lọc
            </Button>
          ) : isLoading ? (
            <span className="text-[12px] font-semibold text-[#6B7280]">
              Đang tải...
            </span>
          ) : (
            <span className="text-[12px] font-semibold text-[#6B7280]">
              {totalCount} công thức
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecipeFilterBar
