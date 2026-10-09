import { Check, Clock, Flame, Leaf } from 'lucide-react'
import { Button, SkeletonLoader } from '../../../shared/components'
import type { RecipeMatch } from '../types/pantry.types'

interface RecipeMatchListProps {
  matches: RecipeMatch[]
  isLoading: boolean
  onNavigate?: (path: string) => void
}

function MatchBar({ percent }: { percent: number }) {
  const color =
    percent >= 75
      ? 'bg-[#2e7d32]'
      : percent >= 50
        ? 'bg-[#f59e0b]'
        : 'bg-slate-300'
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full transition-all duration-300 ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  )
}

export const RecipeMatchList: React.FC<RecipeMatchListProps> = ({
  matches,
  isLoading,
  onNavigate,
}) => {
  if (isLoading) {
    return (
      <div className="mt-4">
        <SkeletonLoader count={4} variant="card" />
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="mt-4 rounded-[16px] border border-dashed border-[#c8e6c9] bg-white p-6 text-center">
        <Leaf size={24} className="mx-auto mb-2 text-[#2e7d32]" />
        <div className="text-sm font-bold text-[#1f2937]">
          Chưa có gợi ý món ăn nào phù hợp
        </div>
        <p className="mt-1 text-xs leading-5 text-[#6b7280]">
          Thêm nguyên liệu vào Tủ bếp (rau, đậu phụ, gạo lứt…) để tôi gợi ý các món ăn dựa trên những
          gì bạn đang có nhé.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {matches.map((m) => (
        <article
          key={m.id}
          className="flex flex-col overflow-hidden rounded-[16px] border border-[#e5e7eb] bg-white shadow-xs transition hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="relative overflow-hidden">
            <img
              src={m.cover}
              alt={m.title}
              loading="lazy"
              className="h-40 w-full object-cover transition duration-200 group-hover:scale-[1.02]"
            />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-[#2e7d32] ring-1 ring-[#c8e6c9]">
              <Leaf size={11} />
              {m.tag}
            </span>
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-2.5 py-1 text-[11px] font-extrabold text-white backdrop-blur">
              {m.matchPercent}% khớp
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-3 p-4">
            <div>
              <h4 className="line-clamp-1 text-[15px] font-extrabold tracking-tight text-[#1f2937]">
                {m.title}
              </h4>
              <p className="mt-0.5 line-clamp-1 text-xs text-[#6b7280]">{m.subtitle}</p>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-[#1f2937]">
                <span className="inline-flex items-center gap-1">
                  <Check size={11} />
                  Độ khớp nguyên liệu
                </span>
                <span className="text-[#2e7d32]">
                  {m.matchedIngredients.length} / {m.totalIngredients}
                </span>
              </div>
              <MatchBar percent={m.matchPercent} />
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] text-[#6b7280]">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2 py-0.5 font-semibold text-[#2e7d32]">
                <Flame size={11} /> {m.kcal} kcal
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold">
                <Clock size={11} /> {m.timeMin} phút
              </span>
            </div>

            {m.matchedIngredients.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-[#6b7280]">
                  Đã có trong tủ:
                </div>
                <div className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#2e7d32]">
                  {m.matchedIngredients.join(' · ')}
                </div>
              </div>
            )}

            {m.missingList.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-[#6b7280]">
                  Cần mua thêm (hoặc thay thế):
                </div>
                <div className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-600">
                  {m.missingList.join(' · ')}
                </div>
              </div>
            )}

            <div className="mt-auto pt-2">
              <Button
                type="button"
                size="sm"
                fullWidth
                variant="primary"
                onClick={() => onNavigate?.(`/recipes/${encodeURIComponent(m.id)}`)}
              >
                Xem chi tiết công thức
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default RecipeMatchList
