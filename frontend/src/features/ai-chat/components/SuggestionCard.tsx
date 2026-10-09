import { Clock, Flame, HandCoins, Leaf } from 'lucide-react'
import { Button } from '../../../shared/components'
import type { RecipeSuggestion } from '../types/aiChat.types'

interface SuggestionCardProps {
  recipe: RecipeSuggestion
  onNavigate?: (path: string) => void
  variant?: 'chat-inline' | 'hero-card'
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  recipe,
  onNavigate,
  variant = 'chat-inline',
}) => {
  const handleOpen = () => onNavigate?.(`/recipes/${encodeURIComponent(recipe.id)}`)

  if (variant === 'hero-card') {
    return (
      <article
        className="group overflow-hidden rounded-[16px] border border-[#e5e7eb] bg-white shadow-xs transition hover:shadow-md hover:-translate-y-0.5"
      >
        <div className="relative overflow-hidden">
          <img
            src={recipe.cover}
            alt={recipe.title}
            loading="lazy"
            className="h-40 w-full object-cover transition duration-200 group-hover:scale-[1.02]"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-[#2e7d32] shadow-xs ring-1 ring-[#c8e6c9]">
            <Leaf size={11} />
            {recipe.tag}
          </span>
        </div>
        <div className="p-4">
          <h4 className="line-clamp-1 text-sm font-extrabold tracking-tight text-[#1f2937]">
            {recipe.title}
          </h4>
          <p className="mt-1 line-clamp-1 text-xs text-[#6b7280]">{recipe.subtitle}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#6b7280]">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 font-semibold">
              <Flame size={12} /> {recipe.kcal} kcal
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 font-semibold">
              <Clock size={12} /> {recipe.timeMin} phút
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2 py-1 font-semibold text-[#2e7d32]">
              <HandCoins size={12} /> Thay thế
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="line-clamp-2 text-[11px] leading-4 text-[#6b7280]">
              {recipe.matchReason}
            </p>
            <Button type="button" size="sm" variant="primary" onClick={handleOpen}>
              Xem
            </Button>
          </div>
        </div>
      </article>
    )
  }

  // chat-inline variant (bên trong bong bóng AI)
  return (
    <article className="flex items-stretch gap-3 rounded-[12px] border border-[#c8e6c9] bg-white p-2 shadow-xs">
      <img
        src={recipe.cover}
        alt={recipe.title}
        loading="lazy"
        className="h-20 w-20 shrink-0 rounded-[10px] object-cover ring-1 ring-[#e5e7eb]"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h5 className="line-clamp-1 text-[13px] font-extrabold text-[#1f2937]">
            {recipe.title}
          </h5>
          <span className="shrink-0 rounded-full bg-[#e8f5e9] px-2 py-0.5 text-[10px] font-bold text-[#2e7d32]">
            {recipe.tag}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-[#6b7280]">{recipe.subtitle}</p>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[#6b7280]">
          <span className="inline-flex items-center gap-0.5 font-semibold">
            <Flame size={10} /> {recipe.kcal} kcal
          </span>
          <span className="inline-flex items-center gap-0.5 font-semibold">
            <Clock size={10} /> {recipe.timeMin} phút
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="line-clamp-1 text-[10px] leading-4 text-[#6b7280]">{recipe.matchReason}</p>
          <Button type="button" size="sm" variant="primary" onClick={handleOpen}>
            Xem chi tiết
          </Button>
        </div>
      </div>
    </article>
  )
}

export default SuggestionCard
