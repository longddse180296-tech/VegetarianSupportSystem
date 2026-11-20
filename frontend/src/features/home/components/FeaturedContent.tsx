import type { ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Clock, Eye, Flame, Leaf, MapPin, Play } from 'lucide-react'
import { ContentImage } from '../../../shared/components/ContentImage'
import { BACKEND_DIETARY_TYPE_LABELS, toBackendDietaryType } from '../../../shared/constants'
import type { FeaturedContentItem } from '../../../shared/api/featuredContentApi'

export interface HomeRecipeItem {
  id: string
  title: string
  tag: string
  cookTime: string
  calories: string
  imageUrl: string
  dietaryTypes: string[]
}

type Navigate = ((path: string) => void) | undefined

function ContentLink({ path, onNavigate, className, children }: {
  path: string; onNavigate: Navigate; className: string; children: ReactNode
}) {
  return <a href={`#${path}`} onClick={event => { if (onNavigate) { event.preventDefault(); onNavigate(path) } }}
    className={className}>{children}</a>
}

export function FeaturedSection({ title, description, path, linkLabel, onNavigate, children, muted = false }: {
  title: string; description: string; path: string; linkLabel: string; onNavigate: Navigate; children: ReactNode; muted?: boolean
}) {
  return <section className={muted ? 'border-y border-[#E8EDE5] bg-[#F3F7F1] py-10 sm:py-14' : 'py-10 sm:py-14'}>
    <div className="ui-page-container">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-7">
        <div className="max-w-2xl">
          <div className="mb-3 h-1 w-8 rounded-full bg-[#2E7D32]" aria-hidden="true" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
        </div>
        <ContentLink path={path} onNavigate={onNavigate}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#DCE6D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#28662D] transition-colors hover:border-[#2E7D32] hover:bg-[#F4F8F1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2E7D32]">
          {linkLabel}<ArrowRight size={15} />
        </ContentLink>
      </div>
      {children}
    </div>
  </section>
}

const cardClass = 'group flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-[#E1E8DD] bg-white text-left shadow-[0_2px_8px_rgba(25,50,25,0.03)] transition-all duration-200 hover:-translate-y-1 hover:border-[#B8CDB0] hover:shadow-[0_12px_28px_rgba(25,50,25,0.08)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2E7D32] motion-reduce:transform-none'
const imageClass = 'h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035] motion-reduce:transform-none'

function DietLabels({ values, overlay = false }: { values: string[]; overlay?: boolean }) {
  if (!values.length) return null
  return <div className="flex flex-wrap gap-1.5">
    {values.map(value => <span key={value} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:text-[11px] ${overlay ? 'bg-white/95 text-[#28662D] shadow-sm' : 'bg-[#F0F6EC] text-[#28662D]'}`}>
      <Leaf size={11} aria-hidden="true" />{BACKEND_DIETARY_TYPE_LABELS[toBackendDietaryType(value)!] || value}
    </span>)}
  </div>
}

function CardFooter({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs font-semibold text-[#28662D]">
    {children}<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F0F6EC] transition-colors group-hover:bg-[#2E7D32] group-hover:text-white"><ArrowUpRight size={15} /></span>
  </div>
}

export function FeaturedRecipeCard({ recipe, onNavigate }: { recipe: HomeRecipeItem; onNavigate: Navigate }) {
  return <ContentLink path={`/recipes/${encodeURIComponent(recipe.id)}`} onNavigate={onNavigate} className={cardClass}>
    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
      <ContentImage src={recipe.imageUrl} alt={recipe.title} className={imageClass} />
      <div className="absolute inset-x-3 bottom-3"><DietLabels values={recipe.dietaryTypes} overlay /></div>
    </div>
    <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#75836D]">{recipe.tag}</p>
      <h3 className="line-clamp-2 min-h-11 text-[16px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#28662D]">{recipe.title}</h3>
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><Clock size={13} />{recipe.cookTime}</span>
        <span className="inline-flex items-center gap-1.5"><Flame size={13} className="text-amber-600" />{recipe.calories}</span>
      </div>
      <CardFooter>Xem công thức</CardFooter>
    </div>
  </ContentLink>
}

export function FeaturedCommunityCard({ item, onNavigate, wide = false }: { item: FeaturedContentItem; onNavigate: Navigate; wide?: boolean }) {
  const video = item.contentType === 'Video'
  const restaurant = item.contentType === 'Restaurant'
  const path = `/${video ? 'videos' : restaurant ? 'restaurants' : 'articles'}/${encodeURIComponent(item.id)}`
  const date = item.publishedAt ? new Date(item.publishedAt) : null
  const dateLabel = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('vi-VN') : null
  const description = item.description?.replace(/^\[Chế độ:[^\]]+\]\s*/i, '').trim()
  return <ContentLink path={path} onNavigate={onNavigate} className={`${cardClass} ${wide ? 'lg:flex-row' : ''}`}>
    <div className={`relative overflow-hidden bg-slate-100 ${video ? 'aspect-video' : 'aspect-[16/10]'} ${wide ? 'lg:w-[46%] lg:shrink-0' : ''}`}>
      <ContentImage src={item.imageUrl} alt={item.title} className={imageClass} />
      {video && <>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#28662D] shadow-sm"><Play size={13} className="fill-current" />Xem video</span>
        {item.viewCount != null && <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1.5 text-[11px] text-white"><Eye size={12} />{item.viewCount.toLocaleString('vi-VN')}</span>}
      </>}
      {restaurant && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#28662D] shadow-sm"><MapPin size={12} />Nhà hàng chay</span>}
    </div>
    <div className={`flex min-w-0 flex-1 flex-col gap-3 p-5 ${wide ? 'lg:gap-5 lg:p-8' : ''}`}>
      {(restaurant || item.dietaryTypes.length > 0) && <div className={restaurant ? 'min-h-[52px]' : ''}><DietLabels values={item.dietaryTypes} /></div>}
      <h3 className={`line-clamp-2 font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#28662D] ${wide ? 'text-xl lg:text-2xl' : 'text-[17px]'}`}>{item.title}</h3>
      {restaurant && item.address && <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500"><MapPin size={14} className="mt-0.5 shrink-0 text-[#6A8560]" /><span className="line-clamp-2">{item.address}</span></p>}
      {description && <p className="line-clamp-2 text-[13px] leading-relaxed text-slate-500">{description}</p>}
      {!restaurant && (item.authorName || dateLabel) && <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
        {item.authorName && <span className="font-medium text-slate-600">{item.authorName}</span>}{dateLabel && <span>{dateLabel}</span>}
      </div>}
      <CardFooter>{restaurant ? 'Khám phá nhà hàng' : video ? 'Xem hướng dẫn' : 'Đọc bài viết'}</CardFooter>
    </div>
  </ContentLink>
}
