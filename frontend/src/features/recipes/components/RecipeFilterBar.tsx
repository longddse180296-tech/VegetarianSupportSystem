import React from 'react'
import { Clock, Flame, RotateCcw, Search } from 'lucide-react'
import { Button, Input, Select, type SelectOption } from '../../../shared/components'
import { getRecipeFilterOptions } from '../api/recipeApi'
import type { RecipeListFilter, RecipeSortOption } from '../types/recipe.types'
import { DEFAULT_RECIPE_FILTER } from '../types/recipe.types'

interface RecipeFilterBarProps {
  filter: RecipeListFilter
  onChange: (next: Partial<RecipeListFilter>) => void
  onReset: () => void
  totalCount?: number
  isLoading?: boolean
  category: string
  setCategory: (c: string) => void
  cookTimeTier: string
  setCookTimeTier: (c: string) => void
  kcalTier: string
  setKcalTier: (c: string) => void
  dietPill: string
  setDietPill: (c: string) => void
  matchProfile?: boolean
  setMatchProfile?: (v: boolean) => void
  /** Not rendered in bar UI anymore (keep contract, parent still uses it for sorting client-side). */
  sort?: RecipeSortOption
  setSort?: (v: RecipeSortOption) => void
}

export const RecipeFilterBar: React.FC<RecipeFilterBarProps> = ({
  filter,
  onChange,
  onReset,
  totalCount: _totalCount,
  isLoading: _isLoading = false,
  category,
  setCategory,
  cookTimeTier,
  setCookTimeTier,
  kcalTier,
  setKcalTier,
  dietPill,
  setDietPill,
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
    kcalTier !== 'all' ||
    dietPill !== 'all'

  return (
    <div
      className="rounded-[20px] border border-slate-200 bg-white p-5 md:p-6 shadow-xs transition-shadow"
    >
      {/* Search + Search/AI btns */}
      <div className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="Tìm kiếm công thức theo tên món hoặc nguyên liệu (đậu hũ, nấm, hạt sen...)"
              value={filter.search}
              onChange={(e) => onChange({ search: e.target.value })}
              leftIcon={<Search size={16} className="text-[#6B7280]" />}
              className="!h-11 !rounded-[12px] !border-slate-300 !pl-10 !pr-4 w-full text-[14px]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<Search size={15} />}
            onClick={() => onChange({ search: filter.search })}
            className="!h-11 !rounded-[12px] !bg-[#2E7D32] hover:!bg-[#1B5E20] !px-6 whitespace-nowrap w-full md:w-auto font-semibold"
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
    </div>

      {/* Row 2: Chế độ ăn chay (Diet pills) - Viền & chữ inactive đậm rõ nét, pb-5 mb-5 */}
      <div className="border-b border-slate-100 pt-5 pb-5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700">
            CHẾ ĐỘ ĂN CHAY
          </span>
          <span className="text-[11.5px] text-slate-500">
            Chọn để lọc theo trường phái ăn
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {DIET_PILLS.map((p) => {
            const active = dietPill === p.value
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setDietPill(p.value)}
                className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] transition-all duration-150 ${
                  active
                    ? 'border-2 border-[#2E7D32] bg-[#2E7D32] font-bold text-white shadow-xs'
                    : 'border-2 border-slate-300 bg-white font-semibold text-slate-800 hover:border-emerald-600 hover:bg-emerald-50/60 hover:text-emerald-900'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Row 3: Danh mục món ăn (Category pills) - Viền & chữ inactive đậm rõ nét, pb-5 mb-5 */}
      <div className="border-b border-slate-100 pt-5 pb-5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700">
            DANH MỤC MÓN ĂN
          </span>
          <span className="text-[11.5px] text-slate-500">
            Phân loại theo kiểu món
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {CATEGORY_PILLS.map((p) => {
            const active = category === p.value
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setCategory(p.value)}
                className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] transition-all duration-150 ${
                  active
                    ? 'border-2 border-[#2E7D32] bg-[#2E7D32] font-bold text-white shadow-xs'
                    : 'border-2 border-slate-300 bg-white font-semibold text-slate-800 hover:border-emerald-600 hover:bg-emerald-50/60 hover:text-emerald-900'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>
      {/* Row 4: Bộ lọc nhanh & Mức calo (Thời gian nấu & Kcal) */}
      <div className="pt-5 pb-2">
        <div className="mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-700">
          BỘ LỌC NHANH & MỨC CALO
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Dropdown Thời gian nấu */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
              <Clock size={14} className="text-emerald-700" />
              Thời gian nấu
            </label>
            <Select
              value={cookTimeTier}
              onChange={(e) => setCookTimeTier(e.target.value)}
              options={COOKTIME_OPTIONS}
              className="!h-11 !rounded-[12px] !border-slate-300 text-[13.5px] font-medium"
            />
          </div>

          {/* Dropdown Mức Calo */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
              <Flame size={14} className="text-amber-500" />
              Mức Calo (Kcal / Khẩu phần)
            </label>
            <Select
              value={kcalTier}
              onChange={(e) => setKcalTier(e.target.value)}
              options={KCAL_OPTIONS}
              className="!h-11 !rounded-[12px] !border-slate-300 text-[13.5px] font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
export default RecipeFilterBar
