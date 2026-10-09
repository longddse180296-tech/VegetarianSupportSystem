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

function mapDietStatus(cat: RecipeDietCategory): 'suitable' | 'info' | 'insufficient' | 'danger' | 'neutral' | 'warning' | 'unsuitable' {
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

function diffPillColor(d: RecipeDifficulty) {
  if (d === 'easy') return 'bg-[#e8f5e9] text-[#2e7d32]'
  if (d === 'medium') return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-700'
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
    <article className="group relative flex flex-col overflow-hidden rounded-[16px] border border-[#e5e7eb] bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
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
          className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
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
            className={`h-9 w-9 !rounded-full !p-0 shadow-sm ring-1 ring-black/5 backdrop-blur-sm ${
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
              size={16}
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
            size="sm"
            status={mapDietStatus(recipe.dietCategory)}
            label={DIET_CATEGORY_LABELS[recipe.dietCategory]}
          />
        </span>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${diffPillColor(recipe.difficulty)}`}
          >
            {DIFFICULTY_LABELS[recipe.difficulty]}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#6b7280]">
            <Clock size={12} className="text-[#2e7d32]" /> {recipe.cookTimeMinutes} phút
          </span>
        </div>
        <button
          type="button"
          onClick={() => onSelect(recipe.id)}
          className="text-left"
        >
          <h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug tracking-tight text-[#1f2937] group-hover:text-[#2e7d32]">
            {recipe.title}
          </h3>
        </button>
        <p className="line-clamp-2 text-[12px] leading-5 text-[#6b7280]">
          {recipe.description}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-1 text-[11px] font-semibold text-[#6b7280]">
          <span className="inline-flex items-center gap-1">
            <Eye size={12} />
            {recipe.viewCount.toLocaleString('vi-VN')}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart size={12} className="fill-rose-400 stroke-rose-500 text-rose-500" />
            {recipe.favoriteCount.toLocaleString('vi-VN')}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#f8faf8] px-2 py-0.5 ring-1 ring-[#e5e7eb]">
            {recipe.ingredients.length} nguyên liệu
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => onSelect(recipe.id)}
          >
            Xem chi tiết
          </Button>
        </div>
      </div>

      {/* Mini toast */}
      {toast && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-slate-900/85 px-3 py-1.5 text-[11px] font-bold text-white shadow-md backdrop-blur">
          {toast}
        </div>
      )}
    </article>
  )
}

export default RecipeCard
