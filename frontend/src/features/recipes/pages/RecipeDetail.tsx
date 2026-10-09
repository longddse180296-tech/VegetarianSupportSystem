import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChefHat,
  Clock,
  Flame,
  Heart,
  Play,
  Users,
} from 'lucide-react'
import { Button, EmptyState, Input, SkeletonLoader } from '../../../shared/components'
import {
  getRecipeDetail,
  toggleFavorite,
  getRelatedArticles,
  getRelatedVideos,
} from '../api/recipeApi'
import type { Recipe } from '../types/recipe.types'
import {
  DIET_CATEGORY_LABELS,
  DIFFICULTY_LABELS,
} from '../types/recipe.types'

interface RecipeDetailProps {
  recipeId?: string
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

export default function RecipeDetail({
  recipeId = '',
  onNavigate,
  isLoggedIn: _isLoggedIn,
}: RecipeDetailProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({})
  const [relatedArticles, setRelatedArticles] = useState<any[]>([])
  const [relatedVideos, setRelatedVideos] = useState<any[]>([])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!recipeId) {
        setRecipe(null)
        setIsNotFound(true)
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setIsNotFound(false)
      setCheckedIds({})
      try {
        const data = await getRecipeDetail(recipeId)
        if (!cancelled) {
          setRecipe(data)
          setIsNotFound(data === null)
        }
        if (!cancelled && data) {
          const [arts, vids] = await Promise.all([
            getRelatedArticles(recipeId),
            getRelatedVideos(recipeId),
          ])
          setRelatedArticles(arts)
          setRelatedVideos(vids)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [recipeId])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1500)
  }

  const handleToggleFavorite = async () => {
    if (!recipe) return
    setFavLoading(true)
    try {
      const next = !recipe.isFavorite
      const res = await toggleFavorite(recipe.id, next)
      setRecipe((prev) =>
        prev
          ? { ...prev, isFavorite: res.isFavorite, favoriteCount: res.favoriteCount }
          : prev,
      )
      showToast(next ? 'Đã lưu vào mục yêu thích ❤️' : 'Đã gỡ khỏi yêu thích')
    } finally {
      setFavLoading(false)
    }
  }

  const nutrition = useMemo(() => {
    if (recipe?.nutrition) return recipe.nutrition
    return { kcal: 320, proteinG: 14, carbsG: 38, fatG: 12, fiberG: 0 }
  }, [recipe])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFB]">
        <div className="mx-auto w-full max-w-[1168px] px-[24px] py-8 sm:px-[16px]">
          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<ArrowLeft size={13} />}
            onClick={() => onNavigate?.('/recipes')}
            className="mb-5"
          >
            Quay lại danh sách công thức
          </Button>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <SkeletonLoader count={1} variant="card" />
            </div>
            <div className="lg:col-span-5">
              <SkeletonLoader count={2} variant="card" />
            </div>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <SkeletonLoader count={1} variant="card" />
            <SkeletonLoader count={1} variant="card" />
          </div>
        </div>
      </div>
    )
  }

  if (isNotFound || !recipe) {
    return (
      <div className="min-h-screen bg-[#F8FAFB]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <EmptyState
            title="Không tìm thấy công thức này"
            description={`ID "${recipeId || '(trống)'}" không tồn tại hoặc đã bị xóa. Quay lại danh sách để xem các công thức khác.`}
            actionLabel="Quay lại danh sách công thức"
            onAction={() => onNavigate?.('/recipes')}
            icon={<ChefHat size={36} className="text-[#2E7D32]" />}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen text-[#1F2937] font-['Inter']"
      style={{ background: 'linear-gradient(180deg,#F8FAFB 0%,#F1F8F3 35%,#F8FAFB 70%)' }}
    >
      <div className="mx-auto w-full max-w-[1168px] px-[24px] py-7 sm:px-[16px]">
        {/* Breadcrumb + Back */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-[#6B7280]">
            <button
              type="button"
              onClick={() => onNavigate?.('/')}
              className="hover:text-[#2E7D32]"
            >
              Trang chủ
            </button>
            <span className="text-[#9CA3AF]">›</span>
            <button
              type="button"
              onClick={() => onNavigate?.('/recipes')}
              className="hover:text-[#2E7D32]"
            >
              Công thức
            </button>
            <span className="text-[#9CA3AF]">›</span>
            <span className="line-clamp-1 max-w-[260px] text-[#1F2937]">{recipe.title}</span>
          </div>
        </div>

        {/* 1. Cover */}
        <img
          src={recipe.coverImage}
          alt=""
          className="h-80 w-full object-cover rounded-[16px]"
        />

        {/* Title + description below cover */}
        <div className="mt-6">
          <h1
            className="font-extrabold tracking-[-0.01em] text-[#121C2A]"
            style={{ fontSize: '30px', lineHeight: '38px' }}
          >
            {recipe.title}
          </h1>
          <p className="mt-2 text-[14.5px] font-normal leading-[24px] text-[#6B7280]">
            {recipe.description}
          </p>
        </div>

        {/* 2. Tags + CTA row (flex justify-between) */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-bold text-[#2E7D32]">
              {DIET_CATEGORY_LABELS[recipe.dietCategory]}
            </span>
            <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-bold text-[#2E7D32]">
              {DIFFICULTY_LABELS[recipe.difficulty]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              leftIcon={<Heart />}
              isLoading={favLoading}
              onClick={handleToggleFavorite}
            >
              Lưu yêu thích
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => showToast('🍳 Bắt đầu thực hiện công thức!')}
            >
              Bắt đầu nấu
            </Button>
          </div>
        </div>

        {/* 3. Stats 4 cột */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 rounded-[16px] border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF7ED] text-[#F97316]">
              <Flame size={16} />
            </div>
            <div>
              <div className="text-[11.5px] font-semibold text-[#6B7280]">Năng lượng</div>
              <div className="text-[15px] font-extrabold tabular-nums text-[#1F2937]">
                {nutrition.kcal} kcal
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0FDF4] text-[#2E7D32]">
              <Users size={16} />
            </div>
            <div>
              <div className="text-[11.5px] font-semibold text-[#6B7280]">Khẩu phần</div>
              <div className="text-[15px] font-extrabold tabular-nums text-[#1F2937]">
                {recipe.servingSize} người
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
              <Clock size={16} />
            </div>
            <div>
              <div className="text-[11.5px] font-semibold text-[#6B7280]">Thời gian nấu</div>
              <div className="text-[15px] font-extrabold tabular-nums text-[#1F2937]">
                {recipe.cookTimeMinutes} phút
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FEF3C7] text-[#92400E]">
              <ChefHat size={16} />
            </div>
            <div>
              <div className="text-[11.5px] font-semibold text-[#6B7280]">Độ khó</div>
              <div className="text-[15px] font-extrabold tabular-nums text-[#1F2937]">
                {DIFFICULTY_LABELS[recipe.difficulty]}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bảng Nutrition Facts */}
        <section className="mt-6 rounded-[16px] bg-white p-5">
          <h2
            className="mb-4 flex items-center gap-2 font-extrabold tracking-[-0.005em] text-[#121C2A]"
            style={{ fontSize: '18px', lineHeight: '26px' }}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#2E7D32]" />
            Thông tin dinh dưỡng
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-[14px] border border-[#C8E6C9] bg-white p-4 text-[#2E7D32] shadow-xs">
              <div className="text-[12px] font-semibold text-[#6B7280]">Calories (kcal)</div>
              <div
                className="mt-1 text-center text-[22px] font-extrabold tabular-nums text-[#2E7D32]"
                style={{ lineHeight: '28px' }}
              >
                {nutrition.kcal}
              </div>
            </div>
            <div className="rounded-[14px] border border-[#BFDBFE] bg-white p-4 shadow-xs">
              <div className="text-[12px] font-semibold text-[#6B7280]">Protein (g)</div>
              <div
                className="mt-1 text-center text-[22px] font-extrabold tabular-nums text-[#1D4ED8]"
                style={{ lineHeight: '28px' }}
              >
                {nutrition.proteinG}
              </div>
            </div>
            <div className="rounded-[14px] border border-[#FDE68A] bg-white p-4 shadow-xs">
              <div className="text-[12px] font-semibold text-[#6B7280]">Carbs (g)</div>
              <div
                className="mt-1 text-center text-[22px] font-extrabold tabular-nums text-[#92400E]"
                style={{ lineHeight: '28px' }}
              >
                {nutrition.carbsG}
              </div>
            </div>
            <div className="rounded-[14px] border border-[#FECDD3] bg-white p-4 shadow-xs">
              <div className="text-[12px] font-semibold text-[#6B7280]">Fat (g)</div>
              <div
                className="mt-1 text-center text-[22px] font-extrabold tabular-nums text-[#9F1239]"
                style={{ lineHeight: '28px' }}
              >
                {nutrition.fatG}
              </div>
            </div>
          </div>
        </section>

        {/* 5. Nguyên liệu + Steps (2 cột) */}
        <section className="mt-7 grid gap-6 md:grid-cols-2">
          {/* Nguyên liệu */}
          <div
            className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-xs"
          >
            <h2
              className="mb-4 flex items-center gap-2 font-extrabold tracking-[-0.005em] text-[#121C2A]"
              style={{ fontSize: '18px', lineHeight: '26px' }}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#2E7D32]" />
              Danh sách nguyên liệu
            </h2>
            <ul className="divide-y divide-[#E5E7EB] rounded-[14px] border border-[#E5E7EB] bg-white">
              {recipe.ingredients.map((ig) => {
                const checked = !!checkedIds[ig.id]
                return (
                  <li
                    key={ig.id}
                    className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-[#F5FBF6]"
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setCheckedIds((prev) => ({
                            ...prev,
                            [ig.id]: !prev[ig.id],
                          }))
                        }
                      />
                      <span className="font-bold text-[#2E7D32] mr-2">
                        {ig.amount}
                        {ig.unit ? ` ${ig.unit}` : ''}
                      </span>
                      <span
                        className={`font-medium ${
                          checked
                            ? 'line-through text-[#9CA3AF]'
                            : 'text-[#1F2937]'
                        }`}
                      >
                        {ig.name}
                        {ig.note && (
                          <span className="ml-1 text-[11.5px] text-[#2E7D32]">
                            ({ig.note})
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* 6. Steps */}
          <div
            className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-xs"
          >
            <h2
              className="mb-4 flex items-center gap-2 font-extrabold tracking-[-0.005em] text-[#121C2A]"
              style={{ fontSize: '18px', lineHeight: '26px' }}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#2E7D32]" />
              Các bước thực hiện
            </h2>
            <ol className="space-y-4">
              {recipe.steps.map((s) => (
                <li key={s.stepNo} className="flex gap-3">
                  <span className="h-8 w-8 rounded-full bg-[#2E7D32] text-white grid place-items-center inline-flex shrink-0 text-sm font-bold">
                    {s.stepNo}
                  </span>
                  <div className="min-w-0 flex-1">
                    {s.title ? (
                      <h3 className="text-[14.5px] font-extrabold text-[#121C2A]">
                        {s.title}
                      </h3>
                    ) : null}
                    <p
                      className="mt-1 font-normal text-[#4B5563]"
                      style={{ fontSize: '14px', lineHeight: '22px' }}
                    >
                      {s.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 7. Bài viết liên quan */}
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2
              className="font-extrabold tracking-[-0.005em] text-[#121C2A]"
              style={{ fontSize: '20px', lineHeight: '28px' }}
            >
              Bài viết liên quan
            </h2>
            <button
              type="button"
              onClick={() => onNavigate?.('/articles')}
              className="text-[12.5px] font-semibold text-[#2E7D32] hover:underline"
            >
              Xem thêm công thức dinh dưỡng
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedArticles.map((a, i) => (
              <div
                key={a.title + i}
                className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white shadow-xs transition hover:-translate-y-[1px] hover:border-[#2E7D32]/30"
              >
                <div className="relative h-[160px] w-full overflow-hidden bg-gradient-to-br from-[#DCFCE7] to-[#A7F3D0]">
                  {a.img ? (
                    <img
                      src={a.img}
                      alt={a.title}
                      className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[40px]">
                      {a.emoji}
                    </div>
                  )}
                  <span
                    className={`absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.02em] ring-1 ring-white/70 ${a.tagCls}`}
                  >
                    {a.tag}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="text-[12px] font-semibold text-[#6B7280]">{a.author}</div>
                  <h3 className="mt-1 line-clamp-2 text-[15px] font-bold text-[#121C2A] group-hover:text-[#2E7D32]">
                    {a.title}
                  </h3>
                  <p
                    className="mt-1.5 line-clamp-2 text-[13px] text-[#6B7280]"
                    style={{ lineHeight: '20px' }}
                  >
                    {a.desc}
                  </p>
                  <button
                    type="button"
                    onClick={() => showToast(`📖 Đang mở: ${a.title}`)}
                    className="mt-3 inline-flex w-fit items-center gap-1 text-[12.5px] font-bold text-[#2E7D32] hover:underline"
                  >
                    Đọc thêm →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Video liên quan */}
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2
              className="font-extrabold tracking-[-0.005em] text-[#121C2A]"
              style={{ fontSize: '20px', lineHeight: '28px' }}
            >
              Video liên quan
            </h2>
            <button
              type="button"
              onClick={() => onNavigate?.('/videos')}
              className="text-[12.5px] font-semibold text-[#2E7D32] hover:underline"
            >
              Video hướng dẫn chế biến trực quan
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedVideos.map((v, i) => (
              <div
                key={v.title + i}
                className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white shadow-xs transition hover:-translate-y-[1px] hover:border-[#2E7D32]/30"
              >
                <div className="relative h-[160px] w-full overflow-hidden bg-slate-900">
                  {v.img ? (
                    <img
                      src={v.img}
                      alt={v.title}
                      className="h-full w-full object-cover opacity-80 transition group-hover:scale-[1.03] group-hover:opacity-95"
                    />
                  ) : null}
                  <button
                    type="button"
                    aria-label="Play video"
                    onClick={() => showToast(`▶️ Đang mở video: ${v.title}`)}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg ring-4 ring-white/10">
                      <Play size={22} className="translate-x-[2px]" />
                    </span>
                  </button>
                  <span className="absolute bottom-2 right-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[11px] font-bold text-white">
                    {v.duration}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="text-[12px] font-semibold text-[#6B7280]">{v.channel}</div>
                  <h3 className="mt-1 line-clamp-2 text-[15px] font-bold text-[#121C2A] group-hover:text-[#2E7D32]">
                    {v.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => showToast(`▶️ Đang mở video: ${v.title}`)}
                    className="mt-3 inline-flex w-fit items-center gap-1 text-[12.5px] font-bold text-[#2E7D32] hover:underline"
                  >
                    Xem video →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {toast && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-10 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2 text-[14px] font-semibold text-white shadow-lg backdrop-blur"
          style={{ lineHeight: '20px' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
