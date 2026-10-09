import { useState } from 'react'
import { Clock, Eye, Heart } from 'lucide-react'
import { Button, StatusBadge } from '../../../shared/components'
import type {
  Recipe,
  RecipeDietCategory,
  RecipeDifficulty,
} from '../types/recipe.types'
import {
  DIET_CATEGORY_LABELS,
  DIFFICULTY_LABELS,
} from '../types/recipe.types'

interface RecipeCardProps {
  recipe: Recipe
  onSelect: (id: string) => void
  onToggleFavorite: (
    id: string,
    next: boolean,
  ) => Promise<{ ok: boolean; next: boolean }> | { ok: boolean; next: boolean }
  isTogglingFavorite?: boolean
}

function mapDietStatus(
  cat: RecipeDietCategory,
): 'suitable' | 'info' | 'insufficient' | 'danger' | 'neutral' | 'warning' | 'unsuitable' {
  switch (cat) {
    case 'vegan':
      return 'suitable'
    case 'ovo-lacto':
    case 'ovo':
    case 'lacto':
      return 'insufficient'
    case 'raw':
      return 'info'
    case 'low-fat':
    case 'high-protein':
      return 'warning'
    case 'quick':
      return 'neutral'
    default:
      return 'info'
  }
}

function diffPillClass(d: RecipeDifficulty) {
  if (d === 'easy') return 'border-[#C8E6C9] bg-[#E8F5E9] text-[#2E7D32]'
  if (d === 'medium') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-red-200 bg-red-50 text-red-700'
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onSelect,
  onToggleFavorite,
  isTogglingFavorite = false,
}) => {
  const [hoverHeart, setHoverHeart] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => {
      setToast((cur) => (cur === msg ? null : cur))
    }, 1600)
  }

  const activeHeart = recipe.isFavorite || hoverHeart

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white transition-all duration-200 hover:-translate-y-[2px] hover:border-[#2E7D32]/30"
      style={{ boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)' }}
    >
      {/* Cover */}
      <button
        type="button"
        onClick={() => onSelect(recipe.id)}
        className="relative block w-full text-left focus:outline-none"
        aria-label={`Mở chi tiết món ${recipe.title}`}
      >
        <img
          src={recipe.coverImage}
          alt={recipe.title}
          loading="lazy"
          className="h-[200px] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />

        {/* Favorite button overlay */}
        <span
          className="absolute right-3 top-3"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            size="sm"
            variant="ghost"
            isLoading={isTogglingFavorite}
            className={`h-10 w-10 !rounded-full !p-0 ring-1 ring-black/5 backdrop-blur-sm ${
              activeHeart
                ? '!bg-rose-50 hover:!bg-rose-100'
                : '!bg-white/90 hover:!bg-rose-50'
            }`}
            onMouseEnter={() => setHoverHeart(true)}
            onMouseLeave={() => setHoverHeart(false)}
            onClick={async (e) => {
              e.stopPropagation()
              const next = !recipe.isFavorite
              const r = await onToggleFavorite(recipe.id, next)
              if (r.ok) {
                showToast(r.next ? 'Đã lưu vào mục yêu thích ❤️' : 'Đã gỡ yêu thích')
              }
            }}
            aria-label={recipe.isFavorite ? 'Bỏ yêu thích' : 'Lưu yêu thích'}
          >
            <Heart
              size={18}
              strokeWidth={2.25}
              className={
                activeHeart
                  ? 'fill-rose-500 stroke-rose-600 transition-colors'
                  : 'stroke-slate-500 transition-colors'
              }
            />
          </Button>
        </span>

        {/* Diet category badge top-left */}
        <span className="absolute left-3 top-3">
          <StatusBadge
            size="md"
            status={mapDietStatus(recipe.dietCategory)}
            label={DIET_CATEGORY_LABELS[recipe.dietCategory]}
          />
        </span>

        {/* Cook time pill bottom-left */}
        <span
          aria-hidden
          className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 font-semibold text-[#1F2937] ring-1 ring-[#E5E7EB] backdrop-blur-sm"
          style={{ fontSize: '12px', lineHeight: '16px' }}
        >
          <Clock size={13} className="text-[#2E7D32]" />
          {recipe.cookTimeMinutes} phút
        </span>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Difficulty + ingredients count */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 font-semibold ${diffPillClass(recipe.difficulty)}`}
            style={{ fontSize: '12px', lineHeight: '16px' }}
          >
            {DIFFICULTY_LABELS[recipe.difficulty]}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[#F8FAF8] px-2.5 py-1 font-medium text-[#6B7280] ring-1 ring-[#E5E7EB]"
            style={{ fontSize: '12px', lineHeight: '16px' }}
          >
            {recipe.ingredients.length} nguyên liệu
          </span>
        </div>

        {/* Title & description */}
        <button
          type="button"
          onClick={() => onSelect(recipe.id)}
          className="group/title text-left"
        >
          <h3
            className="line-clamp-2 font-semibold tracking-[-0.005em] text-[#1F2937] transition-colors group-hover/title:text-[#2E7D32]"
            style={{ fontSize: '18px', lineHeight: '26px' }}
            title={recipe.title}
          >
            {recipe.title}
          </h3>
        </button>
        <p
          className="mt-2 line-clamp-2 font-normal text-[#6B7280]"
          style={{ fontSize: '14px', lineHeight: '22px' }}
        >
          {recipe.description}
        </p>

        {/* Stats row */}
        <div
          className="mt-4 flex flex-wrap items-center gap-3 font-medium text-[#6B7280]"
          style={{ fontSize: '12px', lineHeight: '16px' }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Eye size={13} />
            {recipe.viewCount.toLocaleString('vi-VN')} lượt xem
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Heart size={13} className="fill-rose-400 stroke-rose-500 text-rose-500" />
            {recipe.favoriteCount.toLocaleString('vi-VN')}
          </span>
        </div>

        {/* Footer CTA */}
        <div className="mt-auto pt-5">
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            onClick={() => onSelect(recipe.id)}
          >
            Xem chi tiết
          </Button>
        </div>
      </div>

      {/* Mini toast */}
      {toast && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute bottom-20 left-1/2 z-20 -translate-x-1/2 rounded-full bg-slate-900/85 px-4 py-2 font-semibold text-white shadow-md backdrop-blur"
          style={{ fontSize: '13px', lineHeight: '18px' }}
        >
          {toast}
        </div>
      )}
    </article>
  )
}

export default RecipeCard
