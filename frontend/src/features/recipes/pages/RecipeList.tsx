import { useEffect, useMemo, useState } from 'react'
import {
  ChefHat,
  Flame,
  Heart,
  Leaf,
  RefreshCw,
  Sparkles,
  Utensils,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  SkeletonLoader,
  StatusBadge,
} from '../../../shared/components'
import { getRecipes, toggleFavorite } from '../api/recipeApi'
import { RecipeCard } from '../components/RecipeCard'
import { RecipeFilterBar } from '../components/RecipeFilterBar'
import type {
  Recipe,
  RecipeListFilter,
} from '../types/recipe.types'
import { DEFAULT_RECIPE_FILTER } from '../types/recipe.types'

interface RecipeListProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

// Router injects onNavigate, keep signature compatible.
export default function RecipeList({ onNavigate, isLoggedIn: _isLoggedIn }: RecipeListProps) {
  const [filter, setFilter] = useState<RecipeListFilter>(DEFAULT_RECIPE_FILTER)
  const [items, setItems] = useState<Recipe[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [heroToast, setHeroToast] = useState<string | null>(null)

  const loadList = async (next: Partial<RecipeListFilter> = {}) => {
    const applied: RecipeListFilter = { ...filter, ...next }
    setIsLoading(true)
    try {
      const res = await getRecipes(applied)
      setItems(res.items)
      setTotalCount(res.totalCount)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial mount
  useEffect(() => {
    void loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter change: debounced search, instant other fields
  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadList()
    }, 250)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.search, filter.diet, filter.difficulty, filter.sort, filter.favoritesOnly])

  const updateFilter = (patch: Partial<RecipeListFilter>) => {
    setFilter((prev) => ({ ...prev, ...patch }))
  }

  const resetFilter = () => {
    setFilter(DEFAULT_RECIPE_FILTER)
  }

  const handleSelect = (id: string) => {
    onNavigate?.(`/recipes/${encodeURIComponent(id)}`)
  }

  const handleToggleFavorite = async (
    id: string,
    next: boolean,
  ): Promise<{ ok: boolean; next: boolean }> => {
    setTogglingId(id)
    try {
      const res = await toggleFavorite(id, next)
      setItems((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, isFavorite: res.isFavorite, favoriteCount: res.favoriteCount }
            : r,
        ),
      )
      setHeroToast(next ? 'Đã lưu vào yêu thích ❤️' : 'Đã gỡ khỏi mục yêu thích')
      window.setTimeout(() => setHeroToast(null), 1500)
      return { ok: true, next: res.isFavorite }
    } finally {
      setTogglingId(null)
    }
  }

  const stats = useMemo(() => {
    const favs = items.filter((i) => i.isFavorite).length
    const veganCount = items.filter((i) => i.dietCategory === 'vegan').length
    const quickCount = items.filter(
      (i) => i.cookTimeMinutes <= 25 || i.dietCategory === 'quick',
    ).length
    const totalKcal = items.reduce((acc, i) => acc + i.nutrition.kcal, 0)
    return { favs, veganCount, quickCount, totalKcal }
  }, [items])

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#1F2937] font-['Inter']">
      <div className="mx-auto w-full max-w-[1200px] px-[24px] py-10 sm:px-[16px]">
        {/* ============ HERO ============ */}
        <section
          className="mb-10 overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-gradient-to-br from-[#FFFFFF] via-[#FFFFFF] to-[#E8F5E9] p-8"
          style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="max-w-[720px] flex-1">
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2E7D32] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.02em] text-white shadow-sm"
                style={{ lineHeight: '16px' }}
              >
                <Sparkles size={14} />
                Cộng đồng 1,000+ công thức
              </span>

              {/* headline-lg: 36/44 bold 700 */}
              <h1
                className="mt-4 font-bold tracking-[-0.015em] text-[#121C2A] sm:text-[26px] sm:leading-[34px]"
                style={{ fontSize: '36px', lineHeight: '44px' }}
              >
                Khám phá kho công thức thuần thực vật thơm ngon
              </h1>

              {/* body-md 16/24 */}
              <p
                className="mt-4 font-normal text-[#6B7280]"
                style={{ fontSize: '16px', lineHeight: '28px' }}
              >
                Từ món cơm nhà đơn giản (đậu phụ xốt cà) đến bánh ngọt, phở, bún riêu, bánh mì… tất
                cả đều có hướng dẫn từng bước chi tiết. Bạn chọn món, nấu thôi.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Button
                type="button"
                size="md"
                variant="primary"
                leftIcon={<ChefHat size={16} />}
                onClick={() => onNavigate?.('/ai-chat')}
              >
                Hỏi AI gợi ý hôm nay ăn gì
              </Button>
              <Button
                type="button"
                size="md"
                variant="secondary"
                leftIcon={<RefreshCw size={16} />}
                onClick={() => void loadList()}
              >
                Làm mới
              </Button>
            </div>
          </div>

          {/* Stats row - 4 cards gutter 24px */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Tổng */}
            <div
              className="rounded-[16px] border border-[#E5E7EB] bg-white p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div
                className="flex items-center justify-between font-semibold uppercase tracking-[0.02em] text-[#6B7280]"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                Tổng công thức
                <Utensils size={18} className="text-[#2E7D32]" />
              </div>
              <div
                className="mt-3 font-extrabold tabular-nums text-[#1F2937]"
                style={{ fontSize: '32px', lineHeight: '40px' }}
              >
                {totalCount}
              </div>
            </div>

            {/* Thuần thực vật */}
            <div
              className="rounded-[16px] border border-[#C8E6C9] bg-[#E8F5E9]/70 p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div
                className="flex items-center justify-between font-semibold uppercase tracking-[0.02em] text-[#2E7D32]"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                Thuần thực vật
                <Leaf size={18} />
              </div>
              <div
                className="mt-3 font-extrabold tabular-nums text-[#2E7D32]"
                style={{ fontSize: '32px', lineHeight: '40px' }}
              >
                {stats.veganCount}
              </div>
            </div>

            {/* Nhanh ≤ 25 phút */}
            <div
              className="rounded-[16px] border border-amber-200 bg-amber-50 p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div
                className="flex items-center justify-between font-semibold uppercase tracking-[0.02em] text-amber-700"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                Nhanh ≤ 25 phút
                <Flame size={18} />
              </div>
              <div
                className="mt-3 font-extrabold tabular-nums text-amber-700"
                style={{ fontSize: '32px', lineHeight: '40px' }}
              >
                {stats.quickCount}
              </div>
            </div>

            {/* Yêu thích */}
            <div
              className="rounded-[16px] border border-rose-200 bg-rose-50 p-6"
              style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
            >
              <div
                className="flex items-center justify-between font-semibold uppercase tracking-[0.02em] text-rose-700"
                style={{ fontSize: '12px', lineHeight: '16px' }}
              >
                Yêu thích (trong bộ lọc)
                <Heart size={18} className="fill-rose-500 stroke-rose-600 text-rose-500" />
              </div>
              <div
                className="mt-3 font-extrabold tabular-nums text-rose-600"
                style={{ fontSize: '32px', lineHeight: '40px' }}
              >
                {stats.favs}
              </div>
            </div>
          </div>
        </section>

        {/* ============ FILTER BAR ============ */}
        <section className="mb-8">
          <RecipeFilterBar
            filter={filter}
            onChange={updateFilter}
            onReset={resetFilter}
            totalCount={totalCount}
            isLoading={isLoading}
          />
        </section>

        {/* ============ RESULT ============ */}
        <section>
          {/* Applied filter badges + summary */}
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status="info"
                size="md"
                label={`${items.length} kết quả${isLoading ? ' (đang tải)' : ''}`}
              />
              {filter.favoritesOnly && (
                <StatusBadge status="warning" size="md" label="Chỉ xem yêu thích" />
              )}
              {filter.diet !== 'all' && (
                <StatusBadge status="suitable" size="md" label={`Chế độ: ${filter.diet}`} />
              )}
              {filter.difficulty !== 'all' && (
                <StatusBadge
                  status="insufficient"
                  size="md"
                  label={`Độ khó: ${filter.difficulty}`}
                />
              )}
              {filter.search.trim() && (
                <StatusBadge
                  status="neutral"
                  size="md"
                  label={`Từ khóa: "${filter.search.trim()}"`}
                />
              )}
            </div>

            <div
              className="hidden font-medium text-[#6B7280] sm:block"
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              Năng lượng trung bình bộ lọc:{' '}
              <strong className="text-[#1F2937]">
                {items.length ? Math.round(stats.totalKcal / items.length) : 0} kcal / phần
              </strong>
            </div>
          </header>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <SkeletonLoader count={6} variant="card" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Không tìm thấy công thức nào phù hợp"
              description="Hãy thử từ khóa khác, nới lỏng độ khó, hoặc thay đổi chế độ ăn. Có thể nhấn nút bên dưới để quay về bộ lọc mặc định xem toàn bộ kho công thức."
              actionLabel="Xóa bộ lọc"
              onAction={resetFilter}
              icon={<Utensils size={40} className="text-[#2E7D32]" />}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  onSelect={handleSelect}
                  onToggleFavorite={handleToggleFavorite}
                  isTogglingFavorite={togglingId === r.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Hero toast feedback */}
      {heroToast && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-10 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2 font-semibold text-white shadow-lg backdrop-blur"
          style={{ fontSize: '14px', lineHeight: '20px' }}
        >
          {heroToast}
        </div>
      )}
    </div>
  )
}
