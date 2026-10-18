import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ChefHat,
  Clock,
  Clock3,
  Flame,
  Play,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react'
import { Breadcrumb, Button, EmptyState, SkeletonLoader } from '../../../shared/components'
import {
  getRecipeDetail,
  getRecipes,
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
  fromSource?: string
}

// Curated distinct real food images for related recipes (replacing repetitive placeholder)
const DISTINCT_RELATED_IMAGES = [
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80', // Phở / súp nấm thanh đạm
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', // Salad ngũ sắc bơ hạt
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80', // Cà ri rau củ cốt dừa
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', // Món xào nấm tươi áp chảo
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80', // Cháo yến mạch hạt sen
  'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80', // Gỏi cuốn rau củ sốt tương
]

// Utility function to remove [Mẫu] / [Demo] prefixes from backend seeder
function cleanText(str?: string): string {
  if (!str) return ''
  return str
    .replace(/^\[(mẫu|demo)\]\s*/i, '')
    .replace(/\[(mẫu|demo)\]/gi, '')
    .trim()
}

// Check if step text is a placeholder instruction
function isInstructionPlaceholder(text?: string): boolean {
  if (!text) return true
  const lower = text.trim().toLowerCase()
  if (!lower) return true
  return (
    lower.includes('hướng dẫn mẫu') ||
    lower.includes('cần admin bổ sung') ||
    lower.includes('admin bổ sung') ||
    lower.includes('chế biến trước khi sử dụng')
  )
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipeId = '',
  onNavigate,
  fromSource,
}) => {
  const hashQuery =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.hash.split('?')[1] || '').get('from')
      : null
  const locationQuery =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('from')
      : null
  const rawFrom = (fromSource || hashQuery || locationQuery || '')
    .toLowerCase()
    .trim()
  const isFromMealPlans =
    rawFrom === 'meal-plans' ||
    rawFrom === 'meal-plan' ||
    rawFrom === 'mealplans' ||
    rawFrom === 'mealplan'

  const handleBack = () => {
    const target = isFromMealPlans ? '/meal-plans' : '/recipes'
    if (onNavigate) {
      onNavigate(target)
    } else if (typeof window !== 'undefined') {
      window.location.hash = target
    }
  }

  const backLabel = isFromMealPlans
    ? 'Quay lại thực đơn'
    : 'Quay lại danh sách công thức'

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([])
  const [relatedArticles, setRelatedArticles] = useState<RelatedBlogCard[]>([])
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideoCard[]>([])
  const [relatedRestaurants, setRelatedRestaurants] = useState<RelatedRestaurantCard[]>([])

  const [hasReportedMissing, setHasReportedMissing] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!recipeId) {
        setIsNotFound(true)
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setIsNotFound(false)
      try {
        const [data, allRecipes] = await Promise.all([
          getRecipeDetail(recipeId),
          getRecipes(),
        ])

        if (!cancelled) {
          if (!data) {
            setIsNotFound(true)
          } else {
            setRecipe(data)
            setIsNotFound(false)
          }

          // Related recipes: exclude current recipe, pick 3 with distinct real photos
          const others = (allRecipes.items || []).filter(
            (r) => r.id.toLowerCase() !== recipeId.toLowerCase(),
          )
          setRelatedRecipes(others.slice(0, 3))
        }

        if (!cancelled && data) {
          const [arts, vids, rests] = await Promise.all([
            getRelatedArticles(recipeId),
            getRelatedVideos(recipeId),
            getRelatedRestaurants(recipeId),
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
    window.setTimeout(() => setToast(null), 2000)
  }

  // Filter valid steps, excluding any placeholder text
  const validSteps = useMemo(() => {
    const steps = recipe?.steps
    if (!steps) return []
    return steps.filter((step) => {
      const text = step.instruction || step.description || step.title || ''
      return !isInstructionPlaceholder(text)
    })
  }, [recipe])

  const handleReportMissingSteps = () => {
    setHasReportedMissing(true)
    showToast('📢 Cảm ơn bạn! Đã gửi báo cáo thiếu hướng dẫn tới Ban biên tập để ưu tiên cập nhật.')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] py-8">
        <div className="mx-auto w-full max-w-[1140px] px-4 sm:px-6">
          <SkeletonLoader count={1} variant="text" className="w-48 mb-6 h-6" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            <div className="lg:col-span-6">
              <SkeletonLoader count={1} variant="card" className="h-[360px] w-full rounded-[20px]" />
            </div>
            <div className="lg:col-span-6 space-y-4">
              <SkeletonLoader count={1} variant="text" className="w-24 h-6" />
              <SkeletonLoader count={1} variant="text" className="w-3/4 h-10" />
              <SkeletonLoader count={3} variant="text" />
              <SkeletonLoader count={1} variant="card" className="h-28 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <SkeletonLoader count={1} variant="card" className="h-64 rounded-[16px]" />
            <SkeletonLoader count={1} variant="card" className="h-64 rounded-[16px]" />
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
            description={`Công thức bạn tìm kiếm không tồn tại hoặc đã được cập nhật. Bạn có thể quay lại để tiếp tục.`}
            actionLabel={backLabel}
            onAction={handleBack}
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

  const cleanRecipeTitle = cleanText(recipe.title)
  const cleanRecipeDesc = cleanText(recipe.description)

  return (
    <div className="min-h-screen bg-[#F8FAFB] text-[#1F2937] font-['Inter'] pb-16">
      <div className="mx-auto w-full max-w-[1140px] px-4 sm:px-6 pt-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            {
              label: 'Trang chủ',
              onClick: () =>
                onNavigate ? onNavigate('/') : (window.location.hash = '/'),
            },
            ...(isFromMealPlans
              ? [{ label: 'Thực đơn', onClick: handleBack }]
              : [{ label: 'Công thức', onClick: handleBack }]),
            { label: cleanRecipeTitle },
          ]}
        />

        {/* 1. TOP HERO SECTION */}
        <section className="mb-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left: Dish Image */}
          <div className="overflow-hidden rounded-[20px] shadow-sm border border-slate-200/80 bg-slate-100 lg:col-span-6">
            <img
              src={recipe.imageUrl || recipe.coverImage}
              alt={cleanRecipeTitle}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
              }}
              className="h-[340px] w-full object-cover sm:h-[400px] transition-transform duration-500 hover:scale-[1.02]"
            />
          </div>

          {/* Right: Info + Reordered Nutrition Grid (6 ô đảo ngược font) */}
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3.5 py-1 text-xs font-bold text-[#2E7D32] border border-emerald-200">
                <Sparkles size={12} />
                {recipe.dietType || 'Thuần chay (Vegan)'}
              </span>

              <h1 className="text-[28px] font-extrabold leading-[1.25] text-[#111827] sm:text-[34px] tracking-tight">
                {cleanRecipeTitle}
              </h1>

              {cleanRecipeDesc && (
                <p className="mt-3 text-[14.5px] leading-relaxed text-slate-600">
                  {cleanRecipeDesc}
                </p>
              )}
            </div>

            {/* 6-stat Nutrition Grid (ĐẢO NGƯỢC: Số to ở trên, Nhãn nhỏ ở dưới) */}
            <div className="mt-6 rounded-[18px] border border-slate-200 bg-white p-5 shadow-xs">
              <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-center sm:text-left">
                {/* 1. Chuẩn bị */}
                <div className="flex flex-col p-2.5 rounded-xl bg-slate-50/60 border border-slate-100/80">
                  <span className="text-[18px] sm:text-[20px] font-black text-[#111827] leading-none">
                    {prepTimeText}
                  </span>
                  <span className="mt-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">
                    Chuẩn bị
                  </span>
                </div>

                {/* 2. Nấu */}
                <div className="flex flex-col p-2.5 rounded-xl bg-slate-50/60 border border-slate-100/80">
                  <span className="text-[18px] sm:text-[20px] font-black text-[#111827] leading-none">
                    {cookTimeText}
                  </span>
                  <span className="mt-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">
                    Thời gian nấu
                  </span>
                </div>

                {/* 3. Tổng thời gian */}
                <div className="flex flex-col p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[18px] sm:text-[20px] font-black text-[#2E7D32] leading-none">
                    {totalTimeText}
                  </span>
                  <span className="mt-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-emerald-800">
                    Tổng thời gian
                  </span>
                </div>

                {/* 4. Khẩu phần */}
                <div className="flex flex-col p-2.5 rounded-xl bg-slate-50/60 border border-slate-100/80">
                  <span className="text-[18px] sm:text-[20px] font-black text-[#111827] leading-none">
                    {servingsText}
                  </span>
                  <span className="mt-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">
                    Khẩu phần
                  </span>
                </div>

                {/* 5. Năng lượng */}
                <div className="flex flex-col p-2.5 rounded-xl bg-slate-50/60 border border-slate-100/80">
                  <span className="text-[18px] sm:text-[20px] font-black text-[#111827] leading-none">
                    {caloriesText}
                  </span>
                  <span className="mt-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">
                    Năng lượng
                  </span>
                </div>

                {/* 6. Chất đạm */}
                <div className="flex flex-col p-2.5 rounded-xl bg-slate-50/60 border border-slate-100/80">
                  <span className="text-[18px] sm:text-[20px] font-black text-[#111827] leading-none">
                    {proteinText}
                  </span>
                  <span className="mt-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">
                    Chất đạm
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. INGREDIENTS & STEPS (2 COLUMNS) */}
        <section className="mb-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Cột trái: NGUYÊN LIỆU (Heading nổi bật hơn so với Cách thực hiện để tạo điểm bắt đầu thị giác) */}
          <div className="rounded-[20px] border-2 border-emerald-100 bg-white p-6 shadow-xs lg:col-span-5">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3.5">
              {/* Heading nổi bật: font size to hơn và font-black */}
              <h2 className="flex items-center gap-2.5 text-[21px] sm:text-[22px] font-black text-[#111827] tracking-tight">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2E7D32] text-white">
                  <UtensilsCrossed size={14} />
                </span>
                Nguyên liệu
              </h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-800">
                {recipe.ingredients.length} món
              </span>
            </div>

            {/* Danh sách nguyên liệu (XÓA BỎ TOÀN BỘ TIỀN TỐ [MẪU]) */}
            {recipe.ingredients.length === 0 ? (
              <div className="py-6 text-center text-[13.5px] text-slate-500">
                Đang cập nhật danh sách nguyên liệu chi tiết...
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recipe.ingredients.map((ig, idx) => {
                  const cleanedName = cleanText(ig.name)
                  const cleanedNote = cleanText(ig.note)
                  return (
                    <div
                      key={ig.id || `${ig.name}-${idx}`}
                      className="flex items-center justify-between py-3 text-[14px]"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">
                          {cleanedName}
                        </span>
                        {cleanedNote && (
                          <span className="text-[12px] text-slate-400">
                            {cleanedNote}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-emerald-800 bg-emerald-50/60 px-2.5 py-1 rounded-md text-[13px] whitespace-nowrap">
                        {ig.amount}
                        {ig.unit ? ` ${ig.unit}` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Cột phải: CÁCH THỰC HIỆN (Heading tiêu chuẩn + Xử lý Empty State nếu không có hướng dẫn) */}
          <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-xs lg:col-span-7">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h2 className="flex items-center gap-2 text-[17px] sm:text-[18px] font-bold text-[#374151]">
                <span className="h-2 w-2 rounded-full bg-[#2E7D32]" />
                Cách thực hiện
              </h2>
              {validSteps.length > 0 && (
                <span className="text-[12.5px] font-medium text-slate-500">
                  {validSteps.length} bước
                </span>
              )}
            </div>

            {/* Nếu mảng hướng dẫn trống HOẶC chứa placeholder text mẫu: render Empty State */}
            {validSteps.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-amber-200 bg-amber-50/40 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-xs mb-3.5">
                  <Clock3 size={28} />
                </div>
                <h3 className="text-[17px] font-bold text-slate-900">
                  Hướng dẫn chế biến đang được cập nhật
                </h3>
                <p className="mt-1.5 max-w-md text-[13.5px] leading-[22px] text-slate-600">
                  Đội ngũ Bếp Chay An Yên đang hoàn thiện các bước chế biến chi tiết cho món ăn này để đảm bảo chuẩn vị và giữ trọn dinh dưỡng.
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={hasReportedMissing}
                    onClick={handleReportMissingSteps}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-bold shadow-xs transition-all ${
                      hasReportedMissing
                        ? 'bg-emerald-100 text-emerald-800 cursor-default'
                        : 'bg-amber-600 text-white hover:bg-amber-700 hover:-translate-y-0.5'
                    }`}
                  >
                    <AlertCircle size={16} />
                    {hasReportedMissing
                      ? 'Đã báo cáo thiếu hướng dẫn'
                      : 'Báo cáo thiếu hướng dẫn'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {validSteps.map((step, idx) => {
                  const stepNum = step.stepNumber || step.stepNo || idx + 1
                  const instructionText =
                    cleanText(step.instruction || step.description || step.title || '')
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
            )}
          </div>
        </section>

        {/* 3. THÔNG TIN DINH DƯỠNG */}
        <section className="mb-12 rounded-[20px] border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="mb-5 flex items-center gap-2 text-[17px] font-bold text-[#111827]">
            <span className="h-2 w-2 rounded-full bg-[#2E7D32]" />
            Thông tin dinh dưỡng chi tiết
          </h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-[14px] border border-slate-200/90 bg-slate-50/50 p-4 text-center">
              <div className="text-[12.5px] font-semibold text-slate-500 uppercase tracking-wider">Năng lượng</div>
              <div className="mt-1 text-[22px] font-black text-[#2E7D32]">{caloriesText}</div>
            </div>

            <div className="rounded-[14px] border border-slate-200/90 bg-slate-50/50 p-4 text-center">
              <div className="text-[12.5px] font-semibold text-slate-500 uppercase tracking-wider">Protein</div>
              <div className="mt-1 text-[22px] font-black text-[#111827]">{proteinText}</div>
            </div>

            <div className="rounded-[14px] border border-slate-200/90 bg-slate-50/50 p-4 text-center">
              <div className="text-[12.5px] font-semibold text-slate-500 uppercase tracking-wider">Carbohydrate</div>
              <div className="mt-1 text-[22px] font-black text-[#111827]">{carbsText}</div>
            </div>

            <div className="rounded-[14px] border border-slate-200/90 bg-slate-50/50 p-4 text-center">
              <div className="text-[12.5px] font-semibold text-slate-500 uppercase tracking-wider">Chất béo</div>
              <div className="mt-1 text-[22px] font-black text-[#111827]">{fatText}</div>
            </div>
          </div>
        </section>



        {/* 5. CÔNG THỨC LIÊN QUAN (Mảng ảnh thật đa dạng, không trùng lặp) */}
        {relatedRecipes.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[20px] font-bold text-[#111827]">
                Công thức liên quan
              </h2>
              <span className="text-[13px] text-slate-500">
                Gợi ý các món chay dinh dưỡng cùng nhóm
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
              {relatedRecipes.map((rel, idx) => {
                const img =
                  rel.imageUrl && !rel.imageUrl.includes('photo-1546069901-ba9599a7e63c')
                    ? rel.imageUrl
                    : DISTINCT_RELATED_IMAGES[idx % DISTINCT_RELATED_IMAGES.length]

                return (
                  <article
                    key={rel.id || idx}
                    onClick={() => {
                      const query = isFromMealPlans ? '?from=meal-plans' : ''
                      const target = `/recipes/${encodeURIComponent(rel.id)}${query}`
                      if (onNavigate) {
                        onNavigate(target)
                      } else {
                        window.location.hash = target
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="group flex flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-md cursor-pointer"
                  >
                    <div className="h-[170px] w-full overflow-hidden bg-slate-100 relative">
                      <img
                        src={img}
                        alt={rel.title}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
                        }}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-slate-900/75 px-2.5 py-0.5 text-[11.5px] font-medium text-white backdrop-blur-md">
                        <Clock size={11} className="text-emerald-300" />
                        {rel.cookTimeMinutes} phút
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-2 text-[15.5px] font-bold text-[#111827] group-hover:text-[#2E7D32] transition-colors leading-[22px]">
                        {cleanText(rel.title)}
                      </h3>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                        <div className="flex items-baseline gap-1">
                          <Flame size={13} className="text-amber-500 self-center" />
                          <span className="text-[15px] font-black text-slate-900">
                            {rel.nutrition?.kcal || rel.calories || 300}
                          </span>
                          <span className="text-[11px] font-bold uppercase text-emerald-800">
                            kcal
                          </span>
                        </div>
                        <span className="text-[12px] font-bold text-[#2E7D32] group-hover:underline">
                          Xem chi tiết →
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* 6. BÀI VIẾT LIÊN QUAN */}
        {relatedArticles.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[20px] font-bold text-[#111827]">Bài viết liên quan</h2>
              <span className="text-[13px] text-slate-500">Kiến thức dinh dưỡng &amp; phong cách sống</span>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {relatedArticles.slice(0, 3).map((art, idx) => (
                <article
                  key={art.id || idx}
                  className="group flex flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:border-emerald-500/40"
                >
                  <div className="h-[160px] w-full overflow-hidden bg-slate-100">
                    <img
                      src={art.imageUrl}
                      alt={art.title}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80'
                      }}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="text-[12px] font-semibold text-slate-500">{art.author}</div>
                    <h3 className="mt-1 line-clamp-2 text-[15px] font-bold text-[#111827] group-hover:text-[#2E7D32] transition-colors">
                      {art.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-[20px] text-slate-500">
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
        )}

        {/* 7. VIDEO LIÊN QUAN */}
        {relatedVideos.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[20px] font-bold text-[#111827]">Video liên quan</h2>
              <span className="text-[13px] text-slate-500">
                Video hướng dẫn chế biến trực quan
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {relatedVideos.slice(0, 3).map((vid, idx) => {
                const vidImg =
                  vid.imageUrl && !vid.imageUrl.includes('photo-1546069901-ba9599a7e63c')
                    ? vid.imageUrl
                    : DISTINCT_RELATED_IMAGES[(idx + 2) % DISTINCT_RELATED_IMAGES.length]

                return (
                  <article
                    key={vid.id || idx}
                    className="group flex flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:border-emerald-500/40"
                  >
                    <div className="relative flex h-[160px] w-full items-center justify-center overflow-hidden bg-slate-900">
                      <img
                        src={vidImg}
                        alt={vid.title}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
                        }}
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
                      <span className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-0.5 text-[11px] font-bold text-white">
                        {vid.duration}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="text-[12px] font-semibold text-slate-500">{vid.channel}</div>
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
                )
              })}
            </div>
          </section>
        )}

        {/* 8. NHÀ HÀNG CÓ MÓN TƯƠNG TỰ */}
        {relatedRestaurants.length > 0 && (
          <section className="mb-10">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[20px] font-bold text-[#111827]">
                Nhà hàng có món tương tự
              </h2>
              <span className="text-[13px] text-slate-500">
                Địa điểm ẩm thực chay thanh tịnh gần bạn
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {relatedRestaurants.slice(0, 2).map((rest, idx) => (
                <div
                  key={rest.id || idx}
                  className="flex items-center justify-between gap-4 rounded-[18px] border border-slate-200 bg-white p-4 shadow-xs transition hover:border-emerald-500/40"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={rest.imageUrl}
                      alt={rest.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80'
                      }}
                      className="h-16 w-16 rounded-[14px] object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-bold text-[#111827]">
                        {rest.name}
                      </h3>
                      <p className="mt-0.5 truncate text-[12.5px] text-slate-500">
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
        )}

        {/* Nút quay lại danh sách công thức / thực đơn ở cuối trang */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex justify-start">
          <Button
            type="button"
            variant="outline"
            size="md"
            leftIcon={<ArrowLeft size={16} />}
            onClick={handleBack}
            className="!rounded-[12px] !border-slate-300 hover:!border-[#2E7D32] hover:!text-[#2E7D32] font-semibold"
          >
            {backLabel}
          </Button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-10 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2.5 text-[14px] font-semibold text-white shadow-lg backdrop-blur-md"
        >
          {toast}
        </div>
      )}
    </div>
  )
}

export default RecipeDetail
