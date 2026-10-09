import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChefHat,
  Clock,
  Eye,
  Flame,
  Heart,
  Leaf,
  Lightbulb,
  List,
  ListChecks,
  Play,
  Share2,
  Sparkles,
  Timer,
  Users,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  SkeletonLoader,
  StatusBadge,
} from '../../../shared/components'
import { getRecipeDetail, toggleFavorite } from '../api/recipeApi'
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

// Router injects recipeId and onNavigate, keep signature compatible.
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
      try {
        const data = await getRecipeDetail(recipeId)
        if (!cancelled) {
          setRecipe(data)
          setIsNotFound(data === null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [recipeId])

  const totalTime = useMemo(
    () => (recipe ? recipe.cookTimeMinutes + (recipe.prepTimeMinutes ?? 0) : 0),
    [recipe],
  )

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6faf7]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
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
          <SkeletonLoader count={1} variant="card" />
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SkeletonLoader count={3} variant="card" />
            </div>
            <div>
              <SkeletonLoader count={2} variant="card" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isNotFound || !recipe) {
    return (
      <div className="min-h-screen bg-[#f6faf7]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <EmptyState
            title="Không tìm thấy công thức này"
            description={`ID "${recipeId || '(trống)'}" không tồn tại hoặc đã bị xóa. Bạn có thể quay lại xem toàn bộ kho công thức hoặc gợi ý ngẫu nhiên một món để nấu.`}
            actionLabel="Quay lại danh sách công thức"
            onAction={() => onNavigate?.('/recipes')}
            icon={<ChefHat size={36} className="text-[#2e7d32]" />}
          />
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Sparkles size={13} />}
              onClick={() => onNavigate?.('/ai-chat')}
            >
              Hỏi AI gợi ý món nấu hôm nay
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Leaf size={13} />}
              onClick={() => onNavigate?.('/pantry')}
            >
              Gợi ý theo nguyên liệu trong tủ
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6faf7] text-[#1f2937]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
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

        {/* Cover */}
        <article className="overflow-hidden rounded-[20px] border border-[#e5e7eb] bg-white shadow-xs">
          <div className="relative h-[260px] w-full overflow-hidden sm:h-[340px]">
            <img
              src={recipe.coverImage}
              alt={recipe.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent" />
            <div className="absolute left-0 right-0 top-4 flex items-start justify-between px-5 sm:px-8">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  status="suitable"
                  label={DIET_CATEGORY_LABELS[recipe.dietCategory]}
                />
                <StatusBadge status="info" label={DIFFICULTY_LABELS[recipe.difficulty]} />
                {recipe.tags.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-slate-800 ring-1 ring-white/80 backdrop-blur"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="!bg-white/90 !text-slate-800"
                  leftIcon={<Share2 size={12} />}
                  onClick={() => showToast('Đã copy link công thức')}
                >
                  Chia sẻ
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={recipe.isFavorite ? 'danger' : 'primary'}
                  leftIcon={<Heart size={13} className={recipe.isFavorite ? 'fill-current' : ''} />}
                  isLoading={favLoading}
                  onClick={handleToggleFavorite}
                >
                  {recipe.isFavorite ? 'Đã yêu thích' : 'Lưu yêu thích'}
                </Button>
              </div>
            </div>

            <div className="absolute bottom-5 left-5 right-5 text-white sm:left-8 sm:right-8">
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight drop-shadow sm:text-3xl">
                {recipe.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] font-semibold text-white/90">
                <span className="inline-flex items-center gap-1">
                  <Users size={13} /> {recipe.servingSize} người ăn
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={13} /> Nấu: {recipe.cookTimeMinutes} phút
                </span>
                <span className="inline-flex items-center gap-1">
                  <Timer size={13} /> Tổng: {totalTime} phút
                </span>
                <span className="inline-flex items-center gap-1">
                  <Heart size={13} /> {recipe.favoriteCount.toLocaleString('vi-VN')}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye size={13} /> {recipe.viewCount.toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* Meta + Description */}
          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="text-sm leading-7 text-[#1f2937]">{recipe.description}</p>

              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#e8f5e9] text-[#2e7d32]">
                    <List size={14} />
                  </span>
                  <h2 className="text-[17px] font-extrabold tracking-tight">
                    Chuẩn bị nguyên liệu ({recipe.ingredients.length} mục)
                  </h2>
                </div>
                <div className="rounded-[16px] border border-[#e5e7eb] bg-[#fafefb] p-4">
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {recipe.ingredients.map((ig) => (
                      <li
                        key={ig.id}
                        className="flex items-center justify-between gap-3 rounded-[10px] border border-transparent px-3 py-2 hover:border-[#e5e7eb] hover:bg-white"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#2e7d32]" />
                          <span className="text-sm font-semibold text-[#1f2937]">{ig.name}</span>
                        </div>
                        <div className="text-right text-xs font-bold text-[#6b7280]">
                          <div>
                            {ig.amount} {ig.unit}
                          </div>
                          {ig.note && (
                            <div className="text-[10px] font-medium text-[#2e7d32]">
                              ({ig.note})
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Steps */}
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#2e7d32] text-white shadow-sm">
                    <Play size={14} />
                  </span>
                  <h2 className="text-[17px] font-extrabold tracking-tight">
                    Hướng dẫn chi tiết {recipe.steps.length} bước
                  </h2>
                </div>
                <ol className="space-y-4">
                  {recipe.steps.map((s) => (
                    <li
                      key={s.stepNo}
                      className="flex gap-4 rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-xs"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#2e7d32] text-sm font-extrabold text-white shadow-sm">
                        {s.stepNo}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15px] font-extrabold tracking-tight text-[#1f2937]">
                            {s.title || `Bước ${s.stepNo}`}
                          </h3>
                          {typeof s.durationMinutes === 'number' && s.durationMinutes > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2 py-0.5 text-[11px] font-extrabold text-[#2e7d32]">
                              <Timer size={10} /> {s.durationMinutes} phút
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm leading-7 text-[#1f2937]">
                          {s.description}
                        </p>
                        {s.tip && (
                          <div className="mt-3 inline-flex items-start gap-2 rounded-[12px] border border-amber-200 bg-amber-50/80 p-3 text-xs leading-6 text-amber-800">
                            <Lightbulb size={14} className="mt-0.5 flex-shrink-0 text-amber-600" />
                            <div>
                              <strong>Mẹo nấu ăn:</strong> {s.tip}
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              {/* Author */}
              <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={recipe.authorAvatar}
                    alt={recipe.authorName}
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-[#c8e6c9]"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold text-[#1f2937]">
                      {recipe.authorName}
                    </div>
                    <div className="truncate text-[11px] text-[#6b7280]">
                      Công thức đăng: {new Date(recipe.publishedAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="mt-3"
                  leftIcon={<ChefHat size={13} />}
                  onClick={() => showToast(`Đã theo dõi ${recipe.authorName}`)}
                >
                  Theo dõi tác giả
                </Button>
              </div>

              {/* Nutrition */}
              <div className="rounded-[16px] border border-[#c8e6c9] bg-[#e8f5e9]/70 p-4 shadow-xs">
                <div className="mb-3 flex items-center gap-2">
                  <Flame size={15} className="text-[#2e7d32]" />
                  <h3 className="text-[14px] font-extrabold text-[#1f2937]">
                    Thành phần dinh dưỡng / phần
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                  <div className="rounded-[10px] bg-white/80 p-3">
                    <div className="text-[#6b7280]">Năng lượng</div>
                    <div className="mt-0.5 text-lg font-extrabold text-[#2e7d32]">
                      {recipe.nutrition.kcal} <span className="text-xs">kcal</span>
                    </div>
                  </div>
                  <div className="rounded-[10px] bg-white/80 p-3">
                    <div className="text-[#6b7280]">Đạm</div>
                    <div className="mt-0.5 text-lg font-extrabold text-[#1f2937]">
                      {recipe.nutrition.proteinG} <span className="text-xs">g</span>
                    </div>
                  </div>
                  <div className="rounded-[10px] bg-white/80 p-3">
                    <div className="text-[#6b7280]">Carb</div>
                    <div className="mt-0.5 text-lg font-extrabold text-[#1f2937]">
                      {recipe.nutrition.carbsG} <span className="text-xs">g</span>
                    </div>
                  </div>
                  <div className="rounded-[10px] bg-white/80 p-3">
                    <div className="text-[#6b7280]">Chất xơ</div>
                    <div className="mt-0.5 text-lg font-extrabold text-[#1f2937]">
                      {recipe.nutrition.fiberG} <span className="text-xs">g</span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-[#2e7d32]">
                  Dinh dưỡng ước tính dựa trên phần ăn tiêu chuẩn, có thể thay đổi một chút tùy cách nấu
                  & kích thước nguyên liệu thực tế.
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  leftIcon={<ListChecks size={14} />}
                  onClick={() => onNavigate?.('/pantry')}
                >
                  Kiểm tra nguyên liệu trong tủ
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  leftIcon={<Sparkles size={14} />}
                  onClick={() =>
                    onNavigate?.(
                      `/ai-chat?prompt=${encodeURIComponent(
                        `Hỏi mẹo làm món ${recipe.title} ngon hơn`,
                      )}`,
                    )
                  }
                >
                  Hỏi AI mẹo làm món này ngon hơn
                </Button>
              </div>

              {/* Related tags */}
              <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-xs">
                <div className="mb-2 text-[12px] font-extrabold text-[#6b7280]">
                  Từ khóa liên quan
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recipe.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-[#e8f5e9] px-2.5 py-1 text-[11px] font-extrabold text-[#2e7d32]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </article>
      </div>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-[12px] font-bold text-white shadow-lg backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  )
}
