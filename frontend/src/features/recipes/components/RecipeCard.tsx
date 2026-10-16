import { useState } from 'react'
import { Clock, Heart, Leaf } from 'lucide-react'
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

function recipeCategory(recipe: Recipe): { label: string; cls: string } {
  return { label: recipe.category || 'Chưa phân loại', cls: 'bg-primary-light text-primary' }
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
      className="ui-card ui-content-card group relative flex h-full flex-col overflow-hidden"
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
        {recipe.coverImage ? (
          <img src={recipe.coverImage} alt={recipe.title} loading="lazy" className="h-[196px] w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-[196px] w-full place-items-center bg-primary-light text-sm text-text-muted">Chưa có ảnh công thức</div>
        )}

        {/* Category top-left badge */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className="ui-badge ui-badge-green"
          >
            {cat.label}
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

        {/* Bottom overlay: cook time pill */}
        <div className="absolute bottom-3 left-3 flex items-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[12px] font-semibold text-[#1F2937] ring-1 ring-[#E5E7EB] backdrop-blur">
            <Clock size={13} className="text-[#2E7D32]" />
            {recipe.cookTimeMinutes} phút
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
        <h3
          className="ui-card-title line-clamp-2 transition-colors group-hover:text-primary"
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
