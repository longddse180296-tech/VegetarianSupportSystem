import React, { useEffect, useState } from 'react'
import { ArrowLeft, ChefHat, Play } from 'lucide-react'
import { Button, EmptyState, SkeletonLoader } from '../../../shared/components'
import {
  getRecipeDetail,
  getRelatedArticles,
  getRelatedRestaurants,
  getRelatedVideos,
} from '../api/recipeApi'
import type {
  Recipe,
  RelatedBlogCard,
  RelatedRestaurantCard,
  RelatedVideoCard,
} from '../types/recipe.types'

interface RecipeDetailProps {
  recipeId?: string
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipeId = '',
  onNavigate,
}) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<RelatedBlogCard[]>([])
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideoCard[]>([])
  const [relatedRestaurants, setRelatedRestaurants] = useState<RelatedRestaurantCard[]>([])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const targetId = recipeId || 'dau-hu-sot-nam'
      setIsLoading(true)
      setIsNotFound(false)
      try {
        const data = await getRecipeDetail(targetId)
        if (!cancelled) {
          if (!data) {
            setIsNotFound(true)
          } else {
            setRecipe(data)
            setIsNotFound(false)
          }
        }
        if (!cancelled && data) {
          const [arts, vids, rests] = await Promise.all([
            getRelatedArticles(targetId),
            getRelatedVideos(targetId),
            getRelatedRestaurants(targetId),
          ])
          if (!cancelled) {
            setRelatedArticles(data.relatedBlogs || arts)
            setRelatedVideos(data.relatedVideos || vids)
            setRelatedRestaurants(data.relatedRestaurants || rests)
          }
        }
      } catch {
        if (!cancelled) setIsNotFound(true)
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
    window.setTimeout(() => setToast(null), 1600)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] py-8">
        <div className="mx-auto w-full max-w-[1140px] px-4 sm:px-6">
          <SkeletonLoader count={1} variant="text" className="w-48 mb-6 h-6" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            <div className="lg:col-span-6">
              <SkeletonLoader count={1} variant="card" className="h-[360px] w-full" />
            </div>
            <div className="lg:col-span-6 space-y-4">
              <SkeletonLoader count={1} variant="text" className="w-24 h-6" />
              <SkeletonLoader count={1} variant="text" className="w-3/4 h-10" />
              <SkeletonLoader count={3} variant="text" />
              <SkeletonLoader count={1} variant="card" className="h-28 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <SkeletonLoader count={1} variant="card" className="h-64" />
            <SkeletonLoader count={1} variant="card" className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  if (isNotFound || !recipe) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] py-12">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <EmptyState
            title="Không tìm thấy công thức này"
            description={`ID "${recipeId || 'dau-hu-sot-nam'}" không tồn tại hoặc đã được cập nhật. Bạn có thể quay lại danh sách công thức chay để khám phá thêm.`}
            actionLabel="Quay lại danh sách công thức"
            onAction={() => onNavigate?.('/recipes')}
            icon={<ChefHat size={44} className="text-[#2E7D32]" />}
          />
        </div>
      </div>
    )
  }

  const prepTimeText = recipe.prepTime || `${recipe.prepTimeMinutes || 10} phút`
  const cookTimeText = recipe.cookTime || `${recipe.cookTimeMinutes || 20} phút`
  const totalTimeText =
    recipe.totalTime ||
    `${(recipe.prepTimeMinutes || 10) + (recipe.cookTimeMinutes || 20)} phút`
  const servingsText = `${recipe.servings || recipe.servingSize || 2} người`
  const caloriesText = `${recipe.calories || recipe.nutrition?.kcal || 320} kcal`
  const proteinText = `${recipe.protein || recipe.nutrition?.proteinG || 18}g`
  const carbsText = `${recipe.carbs || recipe.nutrition?.carbsG || 28}g`
  const fatText = `${recipe.fat || recipe.nutrition?.fatG || 14}g`

  return (
    <div className="min-h-screen bg-[#F8FAFB] text-[#1F2937] font-['Inter'] pb-16">
      <div className="mx-auto w-full max-w-[1140px] px-4 sm:px-6 pt-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-[13px] text-[#6B7280]">
          <button
            type="button"
            onClick={() => onNavigate?.('/')}
            className="hover:text-[#2E7D32] transition-colors"
          >
            Trang chủ
          </button>
          <span className="text-[#9CA3AF]">›</span>
          <button
            type="button"
            onClick={() => onNavigate?.('/recipes')}
            className="hover:text-[#2E7D32] transition-colors"
          >
            Công thức
          </button>
          <span className="text-[#9CA3AF]">›</span>
          <span className="font-semibold text-[#111827]">{recipe.title}</span>
        </nav>

        {/* 1. TOP HERO SECTION */}
        <section className="mb-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left: Dish Image */}
          <div className="overflow-hidden rounded-[16px] shadow-sm lg:col-span-6">
            <img
              src={recipe.imageUrl || recipe.coverImage}
              alt={recipe.title}
              className="h-[340px] w-full object-cover sm:h-[390px]"
            />
          </div>

          {/* Right: Info + 6-stat box */}
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              <span className="mb-3 inline-block rounded-full bg-[#E8F5E9] px-3.5 py-1 text-[12px] font-semibold text-[#2E7D32]">
                {recipe.category || 'Món chính'}
              </span>

              <h1 className="text-[28px] font-bold leading-[1.25] text-[#111827] sm:text-[34px]">
                {recipe.title}
              </h1>

              <p className="mt-3 text-[14.5px] leading-[24px] text-[#4B5563]">
                {recipe.description}
              </p>
            </div>

            {/* 6-stat grid box */}
            <div className="mt-6 rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-xs">
              <div className="grid grid-cols-3 gap-y-5 gap-x-2 text-center sm:text-left">
                {/* Col 1 */}
                <div>
                  <div className="text-[12px] font-medium text-[#6B7280]">Chuẩn bị</div>
                  <div className="mt-1 text-[15px] font-bold text-[#111827]">{prepTimeText}</div>
                </div>

                {/* Col 2 */}
                <div>
                  <div className="text-[12px] font-medium text-[#6B7280]">Thời gian nấu</div>
                  <div className="mt-1 text-[15px] font-bold text-[#111827]">{cookTimeText}</div>
                </div>

                {/* Col 3 */}
                <div>
                  <div className="text-[12px] font-medium text-[#6B7280]">Tổng thời gian</div>
                  <div className="mt-1 text-[15px] font-bold text-[#2E7D32]">{totalTimeText}</div>
                </div>

                {/* Col 1 Row 2 */}
                <div>
                  <div className="text-[12px] font-medium text-[#6B7280]">Khẩu phần</div>
                  <div className="mt-1 text-[15px] font-bold text-[#111827]">{servingsText}</div>
                </div>

                {/* Col 2 Row 2 */}
                <div>
                  <div className="text-[12px] font-medium text-[#6B7280]">Năng lượng</div>
                  <div className="mt-1 text-[15px] font-bold text-[#111827]">{caloriesText}</div>
                </div>

                {/* Col 3 Row 2 */}
                <div>
                  <div className="text-[12px] font-medium text-[#6B7280]">Chất đạm (Protein)</div>
                  <div className="mt-1 text-[15px] font-bold text-[#111827]">{proteinText}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. INGREDIENTS & STEPS (2 COLUMNS) */}
        <section className="mb-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Cột trái: Nguyên liệu */}
          <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-xs lg:col-span-5">
            <h2 className="mb-5 flex items-center gap-2 text-[17px] font-bold text-[#111827]">
              <span className="h-2 w-2 rounded-full bg-[#2E7D32]" />
              Nguyên liệu
            </h2>

            <div className="divide-y divide-[#F3F4F6]">
              {recipe.ingredients.map((ig, idx) => (
                <div
                  key={ig.id || `${ig.name}-${idx}`}
                  className="flex items-center justify-between py-3 text-[14px]"
                >
                  <span className="font-medium text-[#374151]">{ig.name}</span>
                  <span className="font-medium text-[#6B7280]">
                    {ig.amount}
                    {ig.unit ? ` ${ig.unit}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: Cách thực hiện */}
          <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-xs lg:col-span-7">
            <h2 className="mb-5 flex items-center gap-2 text-[17px] font-bold text-[#111827]">
              <span className="h-2 w-2 rounded-full bg-[#2E7D32]" />
              Cách thực hiện
            </h2>

            <div className="space-y-4">
              {recipe.steps.map((step, idx) => {
                const stepNum = step.stepNumber || step.stepNo || idx + 1
                const instructionText =
                  step.instruction || step.description || step.title || ''
                return (
                  <div key={stepNum} className="flex items-start gap-3.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8F5E9] text-[13px] font-bold text-[#2E7D32]">
                      {stepNum}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="mb-0.5 text-[14px] font-bold text-[#111827]">
                        Bước {stepNum}
                      </div>
                      <p className="text-[14px] leading-[22px] text-[#4B5563]">
                        {instructionText}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 3. THÔNG TIN DINH DƯỠNG */}
        <section className="mb-12 rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-xs">
          <h2 className="mb-5 flex items-center gap-2 text-[17px] font-bold text-[#111827]">
            <span className="h-2 w-2 rounded-full bg-[#2E7D32]" />
            Thông tin dinh dưỡng
          </h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {/* Box 1: Năng lượng */}
            <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-4 text-center">
              <div className="text-[13px] font-medium text-[#6B7280]">Năng lượng</div>
              <div className="mt-1 text-[22px] font-extrabold text-[#2E7D32]">{caloriesText}</div>
            </div>

            {/* Box 2: Protein */}
            <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-4 text-center">
              <div className="text-[13px] font-medium text-[#6B7280]">Protein</div>
              <div className="mt-1 text-[22px] font-extrabold text-[#111827]">{proteinText}</div>
            </div>

            {/* Box 3: Carbohydrate */}
            <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-4 text-center">
              <div className="text-[13px] font-medium text-[#6B7280]">Carbohydrate</div>
              <div className="mt-1 text-[22px] font-extrabold text-[#111827]">{carbsText}</div>
            </div>

            {/* Box 4: Chất béo */}
            <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-4 text-center">
              <div className="text-[13px] font-medium text-[#6B7280]">Chất béo</div>
              <div className="mt-1 text-[22px] font-extrabold text-[#111827]">{fatText}</div>
            </div>
          </div>

          <p className="mt-4 text-[12.5px] italic text-[#9CA3AF]">
            * Thông tin dinh dưỡng có mang tính tham khảo
          </p>
        </section>

        {/* 4. BÀI VIẾT LIÊN QUAN */}
        <section className="mb-12">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[20px] font-bold text-[#111827]">Bài viết liên quan</h2>
            <span className="text-[13px] text-[#6B7280]">Gợi ý được nhiều người quan tâm</span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {relatedArticles.slice(0, 3).map((art, idx) => (
              <article
                key={art.id || idx}
                className="group flex flex-col overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white shadow-xs transition hover:-translate-y-0.5 hover:border-[#2E7D32]/40"
              >
                <div className="h-[160px] w-full overflow-hidden bg-gray-100">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="text-[12px] font-semibold text-[#6B7280]">{art.author}</div>
                  <h3 className="mt-1 line-clamp-2 text-[15px] font-bold text-[#111827] group-hover:text-[#2E7D32] transition-colors">
                    {art.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-[20px] text-[#6B7280]">
                    {art.excerpt || art.desc}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      showToast(`📖 Đang mở bài viết: ${art.title}`)
                      onNavigate?.('/articles')
                    }}
                    className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-[#2E7D32] hover:underline"
                  >
                    Đọc thêm →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 5. VIDEO LIÊN QUAN */}
        <section className="mb-12">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[20px] font-bold text-[#111827]">Video liên quan</h2>
            <span className="text-[13px] text-[#6B7280]">
              Video hướng dẫn chế biến trực quan
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {relatedVideos.slice(0, 3).map((vid, idx) => (
              <article
                key={vid.id || idx}
                className="group flex flex-col overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white shadow-xs transition hover:-translate-y-0.5 hover:border-[#2E7D32]/40"
              >
                <div className="relative flex h-[160px] w-full items-center justify-center overflow-hidden bg-slate-900">
                  <img
                    src={vid.imageUrl}
                    alt={vid.title}
                    className="h-full w-full object-cover opacity-75 transition duration-300 group-hover:opacity-90"
                  />
                  <button
                    type="button"
                    aria-label={`Phát video ${vid.title}`}
                    onClick={() => {
                      showToast(`▶️ Đang mở video: ${vid.title}`)
                      onNavigate?.('/videos')
                    }}
                    className="absolute flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md transition hover:scale-110"
                  >
                    <Play size={20} className="translate-x-0.5 fill-slate-800" />
                  </button>
                  <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    {vid.duration}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="text-[12px] font-semibold text-[#6B7280]">{vid.channel}</div>
                  <h3 className="mt-1 line-clamp-2 text-[15px] font-bold text-[#111827] group-hover:text-[#2E7D32] transition-colors">
                    {vid.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      showToast(`▶️ Đang mở video: ${vid.title}`)
                      onNavigate?.('/videos')
                    }}
                    className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-[#2E7D32] hover:underline"
                  >
                    Xem video →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 6. NHÀ HÀNG CÓ MÓN TƯƠNG TỰ */}
        <section className="mb-10">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[20px] font-bold text-[#111827]">
              Nhà hàng có món tương tự
            </h2>
            <span className="text-[13px] text-[#6B7280]">
              Địa điểm chay có từng món ngon đậu hũ &amp; nấm thanh đạm
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {relatedRestaurants.slice(0, 2).map((rest, idx) => (
              <div
                key={rest.id || idx}
                className="flex items-center justify-between gap-4 rounded-[16px] border border-[#E5E7EB] bg-white p-4 shadow-xs transition hover:border-[#2E7D32]/40"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={rest.imageUrl}
                    alt={rest.name}
                    className="h-16 w-16 rounded-[12px] object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-bold text-[#111827]">
                      {rest.name}
                    </h3>
                    <p className="mt-0.5 truncate text-[12.5px] text-[#6B7280]">
                      {rest.address}
                    </p>
                    <div className="mt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          showToast(`📍 Xem nhà hàng: ${rest.name}`)
                          onNavigate?.(`/restaurants/${rest.id}`)
                        }}
                        className="!h-7 !rounded-[8px] !px-3 !text-[12px] !bg-[#2E7D32] hover:!bg-[#1B5E20]"
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[11.5px] font-bold text-[#2E7D32]">
                    {rest.distanceKm} km
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Back to list button */}
        <div className="mt-8 pt-4 border-t border-[#E5E7EB] flex justify-start">
          <Button
            type="button"
            variant="outline"
            size="md"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => onNavigate?.('/recipes')}
            className="!rounded-[12px] !border-[#E5E7EB] hover:!border-[#2E7D32]"
          >
            Quay lại danh sách công thức
          </Button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-10 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2 text-[14px] font-semibold text-white shadow-lg backdrop-blur"
        >
          {toast}
        </div>
      )}
    </div>
  )
}

export default RecipeDetail
