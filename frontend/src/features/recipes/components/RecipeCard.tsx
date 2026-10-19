import { useState } from 'react'
import {
  Clock,
  Coffee,
  Flame,
  Salad as SaladIcon,
  Soup,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react'
import { Button } from '../../../shared/components'
import type { Recipe } from '../types/recipe.types'

interface RecipeCardProps {
  recipe: Recipe
  onSelect: (id: string) => void
  onToggleFavorite?: (
    id: string,
    next: boolean,
  ) => Promise<{ ok: boolean; next: boolean }> | { ok: boolean; next: boolean }
  isTogglingFavorite?: boolean
}

// Curated high quality diverse food images (replacing repetitive placeholder)
const DIVERSE_FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', // Rau xào nấm tươi
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', // Salad cầu vồng
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80', // Phở súp thanh đạm
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80', // Cháo yến mạch hạt sen
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80', // Cà ri nấm rau củ
  'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80', // Cuốn rau củ thanh mát
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', // Món chay áp chảo sốt
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80', // Salad ngũ cốc hạt
  'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80', // Cơm dinh dưỡng thực vật
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80', // Bánh ngũ cốc hạt
  'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80', // Bún chay nóng hổi
]

function getDiverseFoodImage(recipeId: string, title?: string, currentUrl?: string): string {
  if (currentUrl && currentUrl.startsWith('http')) {
    return currentUrl
  }
  const keyStr = `${recipeId || ''}-${title || ''}`
  let hash = 0
  for (let i = 0; i < keyStr.length; i++) {
    hash = (hash << 5) - hash + keyStr.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % DIVERSE_FOOD_IMAGES.length
  return DIVERSE_FOOD_IMAGES[index]
}

interface CategoryBadgeInfo {
  label: string
  icon: React.ReactNode
  tagCls: string
}

function resolveCategoryBadge(r: Recipe): CategoryBadgeInfo {
  const cat = (r.category || '').trim()
  const catLower = cat.toLowerCase()

  if (catLower.includes('bánh') || catLower.includes('tráng miệng')) {
    return {
      label: 'Bánh & Tráng miệng',
      icon: <Sparkles size={12} className="text-pink-600" />,
      tagCls: 'bg-pink-50/95 text-pink-800 border-pink-200/90',
    }
  }
  if (catLower.includes('uống')) {
    return {
      label: 'Đồ uống dinh dưỡng',
      icon: <Coffee size={12} className="text-violet-600" />,
      tagCls: 'bg-violet-50/95 text-violet-800 border-violet-200/90',
    }
  }
  if (catLower.includes('gỏi') || catLower.includes('salad')) {
    return {
      label: 'Gỏi & Salad',
      icon: <SaladIcon size={12} className="text-emerald-600" />,
      tagCls: 'bg-emerald-50/95 text-emerald-800 border-emerald-200/90',
    }
  }
  if (catLower.includes('canh') || catLower.includes('súp')) {
    return {
      label: 'Canh & Súp',
      icon: <Soup size={12} className="text-sky-600" />,
      tagCls: 'bg-sky-50/95 text-sky-800 border-sky-200/90',
    }
  }
  if (catLower.includes('bún') || catLower.includes('phở') || catLower.includes('mì')) {
    return {
      label: 'Bún, Phở & Mì',
      icon: <Soup size={12} className="text-cyan-700" />,
      tagCls: 'bg-cyan-50/95 text-cyan-900 border-cyan-200/90',
    }
  }
  if (catLower.includes('cuốn') || catLower.includes('chiên')) {
    return {
      label: 'Cuốn & Chiên giòn',
      icon: <UtensilsCrossed size={12} className="text-amber-700" />,
      tagCls: 'bg-amber-50/95 text-amber-900 border-amber-200/90',
    }
  }
  if (catLower.includes('kho') || catLower.includes('rim')) {
    return {
      label: 'Món Kho & Rim',
      icon: <Flame size={12} className="text-orange-600" />,
      tagCls: 'bg-orange-50/95 text-orange-800 border-orange-200/90',
    }
  }
  if (catLower.includes('xào') || catLower.includes('rau')) {
    return {
      label: 'Món Xào & Rau củ',
      icon: <UtensilsCrossed size={12} className="text-teal-700" />,
      tagCls: 'bg-teal-50/95 text-teal-900 border-teal-200/90',
    }
  }
  if (catLower.includes('cơm') || catLower.includes('xôi')) {
    return {
      label: 'Cơm & Xôi',
      icon: <UtensilsCrossed size={12} className="text-emerald-700" />,
      tagCls: 'bg-emerald-50/95 text-emerald-900 border-emerald-200/90',
    }
  }

  return {
    label: cat || 'Món chay',
    icon: <UtensilsCrossed size={12} className="text-emerald-700" />,
    tagCls: 'bg-emerald-50/95 text-emerald-900 border-emerald-200/90',
  }
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onSelect,
  onToggleFavorite: _onToggleFavorite,
  isTogglingFavorite: _isTogglingFavorite = false,
}) => {
  const [imageSrc, setImageSrc] = useState<string>(() =>
    getDiverseFoodImage(recipe.id, recipe.title, recipe.coverImage || recipe.imageUrl),
  )

  const categoryBadge = resolveCategoryBadge(recipe)
  const calories = recipe.nutrition?.kcal || recipe.calories || 320

  const handleSelect = () => onSelect(recipe.id)
  const handleSelectKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect()
    }
  }

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-md"
    >
      {/* Cover image wrap */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleSelect}
        onKeyDown={handleSelectKey}
        className="relative block w-full cursor-pointer overflow-hidden bg-slate-100 focus:outline-none"
        aria-label={`Mở chi tiết món ${recipe.title}`}
      >
        <img
          src={imageSrc}
          alt={recipe.title}
          loading="lazy"
          onError={() => {
            setImageSrc(getDiverseFoodImage(recipe.id, recipe.title))
          }}
          className="h-[196px] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Category top-left badge - Refined soft pill design with icon */}
        <div className="absolute left-3 top-3 flex items-center">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold shadow-xs backdrop-blur-md ${categoryBadge.tagCls}`}
          >
            {categoryBadge.icon}
            {categoryBadge.label}
          </span>
        </div>

        {/* Cook time bottom-left pill on image */}
        <div className="absolute bottom-3 left-3 flex items-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/75 px-2.5 py-1 text-[11.5px] font-medium text-white shadow-xs backdrop-blur-md">
            <Clock size={12} className="text-emerald-300" />
            {recipe.cookTimeMinutes} phút
          </span>
        </div>
      </div>

      {/* Body: All internal sections have consistent heights so sibling cards align horizontally */}
      <div className="flex flex-1 flex-col p-4 min-w-0">
        {/* Title: exactly 2 lines fixed height (48px) so all cards align horizontally */}
        <h3
          onClick={handleSelect}
          className="cursor-pointer font-bold tracking-tight text-[#111827] transition-colors line-clamp-2 hover:text-[#166534] h-[48px] leading-[24px]"
          style={{ fontSize: '16.5px', lineHeight: '24px' }}
          title={recipe.title}
        >
          {recipe.title}
        </h3>

        {/* Description: exactly 2 lines fixed height (38px) */}
        <p
          className="mt-1.5 line-clamp-2 text-[13px] font-normal leading-[19px] text-gray-500 h-[38px]"
        >
          {recipe.description || 'Công thức chay ngon, thanh tịnh và giàu dinh dưỡng.'}
        </p>

        {/* Nutrition highlight: Prominent Calorie with clear "kcal" label and balanced Diet Tag */}
        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3 h-[40px] min-h-[40px]">
          <div className="flex items-baseline gap-1.5 shrink-0">
            <Flame size={15} className="text-amber-500 self-center" />
            <span className="text-[17.5px] font-extrabold text-slate-900 leading-none">
              {calories}
            </span>
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-800">
              kcal
            </span>
          </div>

          {recipe.dietType && (
            <span
              className="inline-flex items-center justify-center text-[11px] font-semibold text-emerald-800 bg-emerald-50/90 px-2.5 py-1 rounded-md border border-emerald-200/80 whitespace-nowrap leading-none max-w-[155px] truncate"
              title={recipe.dietType}
            >
              {recipe.dietType}
            </span>
          )}
        </div>

        {/* Footer CTA: pinned to bottom using mt-auto so all buttons line up horizontally */}
        <div className="mt-auto pt-3.5">
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            onClick={handleSelect}
            className="!h-10 !rounded-[12px] !bg-[#E8F5E9] !text-[#2E7D32] hover:!bg-[#2E7D32] hover:!text-white transition-all font-semibold text-[13.5px]"
          >
            Xem công thức
          </Button>
        </div>
      </div>
    </article>
  )
}

export default RecipeCard
