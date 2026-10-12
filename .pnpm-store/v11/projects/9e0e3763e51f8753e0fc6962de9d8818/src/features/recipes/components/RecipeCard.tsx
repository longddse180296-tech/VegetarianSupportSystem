import { useState } from 'react'
import { Clock, Flame, Heart, Leaf } from 'lucide-react'
import { Button } from '../../../shared/components'
import type { Recipe } from '../types/recipe.types'

interface RecipeCardProps {
  recipe: Recipe
  onSelect: (id: string) => void
  onToggleFavorite: (
    id: string,
    next: boolean,
  ) => Promise<{ ok: boolean; next: boolean }> | { ok: boolean; next: boolean }
  isTogglingFavorite?: boolean
}

const CATEGORY_PATTERNS: Array<{
  label: string
  cls: string
  match: (r: Recipe) => boolean
}> = [
  {
    label: 'MÓN CHÍNH',
    cls: 'bg-[#E6F3EC] text-[#2E7D32]',
    match: (r) =>
      /(gạo|cơm|xào|kho|rang|kế|hầm|đậu phụ|thập cẩm|hạt sen|dấm|ộp|lẩu|riêu)/.test(
        r.title.toLowerCase(),
      ) ||
      r.tags.some((t) => /(món chính|cơm nhà|bữa trưa|bữa tối)/.test(t)),
  },
  {
    label: 'MÓN NƯỚC',
    cls: 'bg-[#E6F3EC] text-[#2E7D32]',
    match: (r) => /(canh|cháo|nước|phở|hủ tiếu|bún|mì|riêu|chè|súp|cơm tấm)/.test(r.title.toLowerCase()),
  },
  {
    label: 'SALAD',
    cls: 'bg-[#E6F3EC] text-[#2E7D32]',
    match: (r) => /salad/.test(r.title.toLowerCase()),
  },
  {
    label: 'MÓN NHANH',
    cls: 'bg-[#E6F3EC] text-[#2E7D32]',
    match: (r) => r.cookTimeMinutes <= 20,
  },
]

function recipeCategory(r: Recipe): { label: string; cls: string } {
  const found = CATEGORY_PATTERNS.find((c) => c.match(r))
  return found ? { label: found.label, cls: found.cls } : { label: 'MÓN NỘP', cls: 'bg-[#E6F3EC] text-[#2E7D32]' }
}

function dietLabelClass(cat: Recipe['dietCategory']) {
  if (cat === 'vegan')
    return { label: '100% Vegan', cls: 'bg-[#E6F3EC] text-[#2E7D32]' }
  if (cat === 'ovo-lacto')
    return { label: 'Lacto-veg', cls: 'bg-[#EEF2FF] text-[#4F46E5]' }
  if (cat === 'lacto')
    return { label: 'Lacto', cls: 'bg-[#FEF3C7] text-[#92400E]' }
  if (cat === 'ovo')
    return { label: 'Ovo', cls: 'bg-[#FEF3C7] text-[#92400E]' }
  if (cat === 'raw')
    return { label: 'Raw food', cls: 'bg-[#DBEAFE] text-[#1E40AF]' }
  if (cat === 'low-fat')
    return { label: 'Ít béo', cls: 'bg-[#FCE7F3] text-[#9D174D]' }
  if (cat === 'high-protein')
    return { label: 'Cao đạm', cls: 'bg-[#FDF2F8] text-[#9A3412]' }
  return { label: 'Nhanh', cls: 'bg-[#F3E8FF] text-[#6B21A8]' }
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onSelect,
  onToggleFavorite,
  isTogglingFavorite = false,
}) => {
  const [toast, setToast] = useState<string | null>(null)
  const [hoverHeart, setHoverHeart] = useState(false)
  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => {
      setToast((cur) => (cur === msg ? null : cur))
    }, 1600)
  }
  const activeHeart = recipe.isFavorite || hoverHeart
  const cat = recipeCategory(recipe)
  const diet = dietLabelClass(recipe.dietCategory)

  const handleSelect = () => onSelect(recipe.id)
  const handleSelectKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect()
    }
  }
  const handleFav = async () => {
    const next = !recipe.isFavorite
    const r = await onToggleFavorite(recipe.id, next)
    if (r.ok) {
      showToast(r.next ? 'Đã lưu vào yêu thích ❤️' : 'Đã gỡ khỏi yêu thích')
    }
  }

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white transition-all duration-200 hover:-translate-y-[1px] hover:border-[#2E7D32]/30"
      style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
    >
      {/* Cover */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleSelect}
        onKeyDown={handleSelectKey}
        className="relative block w-full cursor-pointer text-left focus:outline-none"
        aria-label={`Mở chi tiết món ${recipe.title}`}
      >
        <img
          src={recipe.coverImage}
          alt={recipe.title}
          loading="lazy"
          className="h-[196px] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />

        {/* Category top-left badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.02em] ring-1 ring-white/70 backdrop-blur ${cat.cls}`}
          >
            {cat.label}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.02em] ring-1 ring-white/70 backdrop-blur ${diet.cls}`}
          >
            <Leaf size={11} />
            {diet.label}
          </span>
        </div>

        {/* Favorite heart top-right */}
        <div
          className="absolute right-3 top-3"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            size="sm"
            variant="ghost"
            isLoading={isTogglingFavorite}
            className={`h-9 w-9 !rounded-full !p-0 ring-1 ring-black/5 backdrop-blur ${
              activeHeart
                ? '!bg-rose-50 hover:!bg-rose-100'
                : '!bg-white/90 hover:!bg-rose-50'
            }`}
            onMouseEnter={() => setHoverHeart(true)}
            onMouseLeave={() => setHoverHeart(false)}
            onClick={handleFav}
            aria-label={recipe.isFavorite ? 'Bỏ yêu thích' : 'Lưu yêu thích'}
          >
            <Heart
              size={17}
              strokeWidth={2.25}
              className={
                activeHeart
                  ? 'fill-rose-500 stroke-rose-600 transition-colors'
                  : 'stroke-slate-500 transition-colors'
              }
            />
          </Button>
        </div>

        {/* Bottom overlay: time + kcal pills */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[12px] font-semibold text-[#1F2937] ring-1 ring-[#E5E7EB] backdrop-blur">
            <Clock size={13} className="text-[#2E7D32]" />
            {recipe.cookTimeMinutes} phút
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[12px] font-semibold text-[#1F2937] ring-1 ring-[#E5E7EB] backdrop-blur">
            <Flame size={13} className="text-[#F97316]" />
            {recipe.nutrition.kcal} kcal
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
        <h3
          className="line-clamp-2 font-semibold tracking-[-0.005em] text-[#1F2937] transition-colors group-hover:text-[#2E7D32]"
          style={{ fontSize: '17px', lineHeight: '24px' }}
          title={recipe.title}
        >
          {recipe.title}
        </h3>
        <p
          className="mt-1.5 line-clamp-2 font-normal text-[#6B7280]"
          style={{ fontSize: '13.5px', lineHeight: '20px' }}
        >
          {recipe.description}
        </p>

        {/* Ingredient progress */}
        <div className="mt-3 flex items-center justify-between text-[12px] font-medium text-[#2E7D32]">
          <span className="inline-flex items-center gap-1 text-[#2E7D32]">
            <Leaf size={11} /> Tỷ lệ thực vật
          </span>
          <span className="font-bold tabular-nums">
            {recipe.dietCategory === 'ovo-lacto' || recipe.dietCategory === 'ovo' || recipe.dietCategory === 'lacto'
              ? '95%'
              : '100%'}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E8F5E9]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#4CAF50] to-[#2E7D32]"
            style={{
              width:
                recipe.dietCategory === 'ovo-lacto' ||
                recipe.dietCategory === 'ovo' ||
                recipe.dietCategory === 'lacto'
                  ? '95%'
                  : '100%',
            }}
          />
        </div>

        {/* Footer CTA */}
        <div className="mt-auto pt-4">
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            leftIcon={<Leaf size={14} />}
            onClick={handleSelect}
            className="!rounded-[12px] !bg-[#e8f5e9] !text-[#2e7d32] hover:!bg-[#2e7d32] hover:!text-white transition-colors"
          >
            Xem công thức
          </Button>
        </div>
      </div>

      {/* Mini toast */}
      {toast && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute bottom-20 left-1/2 z-20 -translate-x-1/2 rounded-full bg-slate-900/85 px-4 py-2 text-[13px] font-semibold text-white shadow-md backdrop-blur"
          style={{ lineHeight: '18px' }}
        >
          {toast}
        </div>
      )}
    </article>
  )
}

export default RecipeCard
