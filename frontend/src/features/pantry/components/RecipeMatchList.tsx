import { Clock, Flame, Leaf } from 'lucide-react'
import { Button, SkeletonLoader } from '../../../shared/components'
import type { RecipeMatch } from '../types/pantry.types'

interface RecipeMatchListProps {
  matches: RecipeMatch[]
  isLoading: boolean
  onNavigate?: (path: string) => void
}

export const RecipeMatchList: React.FC<RecipeMatchListProps> = ({
  matches,
  isLoading,
  onNavigate,
}) => {
  if (isLoading) {
    return (
      <div>
        <SkeletonLoader count={4} variant="card" />
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div
        className="rounded-[16px] border border-dashed border-[#C8E6C9] bg-white p-8 text-center"
        style={{ boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)' }}
      >
        <Leaf size={28} className="mx-auto mb-3 text-[#2E7D32]" />
        <div className="font-semibold text-[#1F2937]" style={{ fontSize: '16px', lineHeight: '24px' }}>
          Chưa có gợi ý món ăn nào phù hợp
        </div>
        <p className="mt-2 font-normal text-[#6B7280]" style={{ fontSize: '14px', lineHeight: '22px' }}>
          Thêm nguyên liệu vào Tủ bếp (rau, đậu phụ, gạo lứt…) để tôi gợi ý các món ăn dựa trên những
          gì bạn đang có nhé.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      {matches.map((m) => (
        <article
          key={m.id}
          className="flex overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white transition hover:-translate-y-[1px] hover:border-[#2E7D32]/30"
          style={{ boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)' }}
        >
          {/* Left: thumbnail */}
          <div
            className="relative w-[132px] shrink-0 overflow-hidden bg-slate-100 sm:w-[168px]"
          >
            <img
              src={m.cover}
              alt={m.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
            />
            <span
              className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 ring-1 ring-[#C8E6C9]"
              style={{ fontSize: '11px', lineHeight: '14px', fontWeight: 600, color: '#2E7D32' }}
            >
              <Leaf size={11} />
              {m.tag}
            </span>
          </div>

          {/* Right: info */}
          <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3
                  className="truncate font-semibold tracking-[-0.005em] text-[#1F2937]"
                  style={{ fontSize: '18px', lineHeight: '26px' }}
                  title={m.title}
                >
                  {m.title}
                </h3>
                <p
                  className="mt-1 truncate font-normal text-[#6B7280]"
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                >
                  {m.subtitle}
                </p>
              </div>

              {/* Pill % khớp */}
              <div className="text-right">
                <div
                  className="inline-flex items-center gap-1 rounded-full bg-[#1F2937] px-2.5 py-1 text-white"
                  style={{ fontSize: '12px', lineHeight: '16px', fontWeight: 700 }}
                >
                  {m.matchPercent}% khớp
                </div>
                <div
                  className="mt-1 font-medium tabular-nums text-[#6B7280]"
                  style={{ fontSize: '12px', lineHeight: '16px' }}
                >
                  {m.matchedIngredients.length} / {m.totalIngredients}
                </div>
              </div>
            </div>

            {/* Match bar (bg-[#2E7D32] fill per design) */}
            <div className="mt-3 flex items-center gap-3">
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${Math.min(100, Math.max(0, m.matchPercent))}%` }}
                  className="h-full rounded-full bg-[#2E7D32] transition-all"
                />
              </div>
              <span className="shrink-0 text-xs font-bold text-[#2E7D32]">
                {m.matchPercent}% khớp
              </span>
            </div>

            {/* Kcal / time pills */}
            <div className="mt-4 flex flex-wrap gap-2" style={{ fontSize: '12px', lineHeight: '16px' }}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] px-2.5 py-1 font-semibold text-[#C2410C]">
                <Flame size={12} /> {m.kcal.toLocaleString('vi-VN')} kcal
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-2.5 py-1 font-semibold text-[#1D4ED8]">
                <Clock size={12} /> {m.timeMin} phút
              </span>
            </div>

            {/* Ingredients info */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {m.matchedIngredients.length > 0 && (
                <div>
                  <div className="mb-1 font-semibold text-[#2E7D32]" style={{ fontSize: '12px', lineHeight: '16px' }}>
                    Đã có trong tủ
                  </div>
                  <div
                    className="line-clamp-2 font-medium text-[#1F2937]"
                    style={{ fontSize: '13px', lineHeight: '19px' }}
                  >
                    {m.matchedIngredients.join(' · ')}
                  </div>
                </div>
              )}
              {m.missingList.length > 0 && (
                <div>
                  <div className="mb-1 font-semibold text-amber-700" style={{ fontSize: '12px', lineHeight: '16px' }}>
                    Cần mua thêm
                  </div>
                  <div
                    className="line-clamp-2 font-medium text-[#1F2937]"
                    style={{ fontSize: '13px', lineHeight: '19px' }}
                  >
                    {m.missingList.join(' · ')}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="mt-auto pt-4">
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
