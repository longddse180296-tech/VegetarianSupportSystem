import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  Check,
  Clock,
  Flame,
  Leaf,
  MapPin,
  Play,
  Search,
  Sparkles,
} from 'lucide-react'
import { BACKEND_DIETARY_TYPE_LABELS, toBackendDietaryType } from '../../../shared/constants'
import { apiClient } from '../../../shared/api/apiClient'
import { getPublicFeaturedContent, type FeaturedContentItem } from '../../../shared/api/featuredContentApi'
import { Badge, EmptyState, SkeletonLoader } from '../../../shared/components'
import AlertError from '../../../shared/components/AlertError'

interface HomePageProps {
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
}

const QUICK_TAGS = ['Đậu hũ', 'Nấm', 'Salad bơ', 'Canh chua']

const AI_SAMPLE_QUESTIONS = [
  'Món này có chay không?',
  'Bữa sáng 10 phút nhiều đạm',
  'Gợi ý thực đơn hôm nay',
]


interface HomeRecipeItem {
  id: string
  title: string
  tag: string
  cookTime: string
  calories: string
  imageUrl: string
}

type HomeSection = 'recipes' | 'restaurants' | 'videos' | 'articles'

const SECTION_LABELS: Record<HomeSection, string> = {
  recipes: 'công thức',
  restaurants: 'nhà hàng nổi bật',
  videos: 'video nổi bật',
  articles: 'bài viết nổi bật',
}

function publishedDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('vi-VN')
}

export default function HomePage({ onNavigate, isLoggedIn: _isLoggedIn }: HomePageProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [recipes, setRecipes] = useState<HomeRecipeItem[]>([])
  const [videos, setVideos] = useState<FeaturedContentItem[]>([])
  const [restaurants, setRestaurants] = useState<FeaturedContentItem[]>([])
  const [articles, setArticles] = useState<FeaturedContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErrors, setLoadErrors] = useState<HomeSection[]>([])
  const [loadRevision, setLoadRevision] = useState(0)

  // Load real data from services
  useEffect(() => {
    const controller = new AbortController()
    void (async () => {
        const results = await Promise.allSettled([
          apiClient.get<{ items: Array<{
            id: string; name: string; categoryName: string; cookTimeMinutes: number
            caloriesPerServing: number | null; imageUrl: string | null
          }> }>('/api/recipes?pageNumber=1&pageSize=4', { requiresAuth: false, signal: controller.signal }),
          getPublicFeaturedContent('Restaurant', controller.signal),
          getPublicFeaturedContent('Video', controller.signal),
          getPublicFeaturedContent('Article', controller.signal),
        ])
        if (controller.signal.aborted) return
        const [recipeResult, restaurantResult, videoResult, articleResult] = results

        if (recipeResult.status === 'fulfilled') {
          setRecipes(
            recipeResult.value.items.map((r) => ({
              id: r.id,
              title: r.name,
              tag: r.categoryName,
              cookTime: `${r.cookTimeMinutes} phút`,
              calories: r.caloriesPerServing == null ? 'Chưa có dữ liệu calo' : `${Math.round(r.caloriesPerServing)} kcal`,
              imageUrl: r.imageUrl || '',
            })),
          )
        }

        if (restaurantResult.status === 'fulfilled') {
          setRestaurants(restaurantResult.value)
        }

        if (videoResult.status === 'fulfilled') {
          setVideos(videoResult.value)
        }

        if (articleResult.status === 'fulfilled') {
          setArticles(articleResult.value)
        }
        const sections: HomeSection[] = ['recipes', 'restaurants', 'videos', 'articles']
        setLoadErrors(results.flatMap((result, index) => result.status === 'rejected' ? [sections[index]] : []))
        setLoading(false)
    })()
    return () => {
      controller.abort()
    }
  }, [loadRevision])

  function retryContent() {
    setLoading(true)
    setLoadErrors([])
    setLoadRevision(revision => revision + 1)
  }

  function sectionState(section: HomeSection, count: number) {
    if (loading && count === 0) return <SkeletonLoader count={3} variant="card" />
    if (loadErrors.includes(section)) return <AlertError title={`Chưa tải được ${SECTION_LABELS[section]}`} message="Vui lòng thử lại để xem nội dung mới nhất." onRetry={retryContent} />
    if (!loading && count === 0) return <EmptyState title={`Chưa có ${SECTION_LABELS[section]}`} description={section === 'recipes' ? 'Công thức sẽ xuất hiện khi được cập nhật và công khai.' : 'Nội dung sẽ xuất hiện khi được quản trị viên ghim và vẫn đang công khai.'} />
    return null
  }

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return
    onNavigate?.(`/recipes?q=${encodeURIComponent(searchTerm.trim())}`)
  }

  const handleQuickTagClick = (tag: string) => {
    setSearchTerm(tag)
    onNavigate?.(`/recipes?q=${encodeURIComponent(tag)}`)
  }

  const handleGoToAiChat = (query?: string) => {
    if (query) {
      onNavigate?.(`/ai-chat?q=${encodeURIComponent(query)}`)
    } else {
      onNavigate?.('/ai-chat')
    }
  }

  return (
    <div className="min-h-screen bg-[#FBFDFB] text-[#1F2937] font-sans">
      {/* =========================================================================
       * 1. HERO SECTION & THỐNG KÊ (TOP BANNER)
       * ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#E8F5E9]/60 via-[#F8FAF8] to-[#FBFDFB] border-b border-[#E8F5E9] py-12 lg:py-16">
        <div className="ui-page-container">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Cột trái */}
            <div className="lg:col-span-7 flex flex-col items-start gap-5">
              <Badge icon={<Leaf />}>NỀN TẢNG ẨM THỰC &amp; DINH DƯỠNG THỰC VẬT</Badge>

              <h1 className="ui-hero-title">
                Ăn chay lành mạnh, <br className="hidden sm:inline" />
                đơn giản hơn mỗi ngày
              </h1>

              <p className="text-[16px] text-[#4B5563] leading-relaxed max-w-[540px]">
                Khám phá công thức chay, thực đơn cá nhân hóa và nhận trợ giúp từ trợ lý AI dinh dưỡng.
              </p>

              {/* Cặp nút CTA */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate?.('/recipes')}
                  className="rounded-[10px] bg-[#2E7D32] hover:bg-[#1B5E20] px-6 py-3 text-[15px] font-semibold text-white shadow-sm transition active:scale-98"
                >
                  Khám phá công thức
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.('/ai-chat')}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[#2E7D32] bg-white hover:bg-[#E8F5E9] px-6 py-3 text-[15px] font-semibold text-[#2E7D32] transition active:scale-98"
                >
                  <Sparkles size={16} />
                  Tư vấn dinh dưỡng với AI
                </button>
              </div>

              {/* 3 Cam kết */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-[13px] font-semibold text-[#374151]">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>Khám phá công thức chay</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>Thông tin dinh dưỡng tham khảo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>Thực đơn cá nhân hóa</span>
                </div>
              </div>
            </div>

            {/* Cột phải: Ảnh đĩa salad tròn */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
              <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px]">
                {/* Vòng nền gradient nhẹ */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#C8E6C9]/40 to-transparent scale-105" />

                <img
                  src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80"
                  alt="Đĩa salad thuần chay ngũ sắc"
                  className="h-full w-full rounded-full object-cover shadow-2xl ring-8 ring-white"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 2. THANH TÌM KIẾM NHANH TOÀN HỆ THỐNG
       * ========================================================================= */}
      <section className="ui-page-container -mt-7 relative z-20">
        <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-4 sm:p-5 shadow-lg">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm công thức theo tên món ăn..."
                className="w-full rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] pl-10 pr-4 py-3 text-[14px] text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#2E7D32] focus:bg-white focus:outline-none transition"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto rounded-[10px] bg-[#2E7D32] hover:bg-[#1B5E20] px-8 py-3 text-[14px] font-semibold text-white transition active:scale-98 shrink-0"
            >
              Tìm kiếm
            </button>
          </form>

          {/* Quick Tags */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
            <span className="font-semibold text-[#6B7280]">Gợi ý từ khóa:</span>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickTagClick(tag)}
                className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1 font-medium text-[#4B5563] hover:border-[#C8E6C9] hover:bg-[#E8F5E9] hover:text-[#2E7D32] transition"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 3. SECTION: CÔNG THỨC NỔI BẬT
       * ========================================================================= */}
        <section className="ui-page-container py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-[#111827]">
                Công thức nổi bật
              </h2>
              <p className="mt-1 text-[14px] text-[#6B7280]">
                Tham khảo công thức trong hệ thống và lựa chọn món phù hợp với bạn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('/recipes')}
              className="inline-flex items-center gap-1 text-[14px] font-bold text-[#2E7D32] hover:underline"
            >
              Xem tất cả công thức
              <ArrowRight size={15} />
            </button>
          </div>

          {sectionState('recipes', recipes.length)}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recipes.map((recipe) => (
              <article
                key={recipe.id}
                className="group flex flex-col rounded-[16px] border border-[#E5E7EB] bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-[#C8E6C9] transition duration-200"
              >
                {/* Image & Tag */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  {recipe.imageUrl ? <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  /> : <div className="flex h-44 items-center justify-center text-sm text-slate-500">Chưa có ảnh</div>}
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 backdrop-blur px-2.5 py-0.5 text-[11px] font-bold text-[#2E7D32] shadow-xs">
                    {recipe.tag}
                  </span>
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <div className="flex items-center gap-3 text-[12px] text-[#6B7280] mb-1.5 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {recipe.cookTime}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Flame size={12} />
                        {recipe.calories}
                      </span>
                    </div>
                    <h3
                      onClick={() => onNavigate?.(`/recipes/${recipe.id}`)}
                      className="text-[15px] font-bold text-[#111827] hover:text-[#2E7D32] cursor-pointer transition line-clamp-1"
                    >
                      {recipe.title}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F3F4F6]">
                    <button
                      type="button"
                      onClick={() => onNavigate?.(`/recipes/${recipe.id}`)}
                      className="w-full rounded-[8px] bg-[#E8F5E9] hover:bg-[#2E7D32] text-[#2E7D32] hover:text-white py-2 text-[13px] font-bold transition text-center"
                    >
                      Xem công thức
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>


      {/* =========================================================================
       * 5. SECTION: VIDEO NẤU ĂN NỔI BẬT
       * ========================================================================= */}
        <section className="ui-page-container py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-[#111827]">
                Video nổi bật
              </h2>
              <p className="mt-1 text-[14px] text-[#6B7280]">
                Video được quản trị viên chọn để giới thiệu tới cộng đồng.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('/videos')}
              className="inline-flex items-center gap-1 text-[14px] font-bold text-[#2E7D32] hover:underline"
            >
              Xem tất cả video
              <ArrowRight size={15} />
            </button>
          </div>

          {sectionState('videos', videos.length)}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {videos.map((vid) => (
              <article
                key={vid.id}
                className="group flex flex-col rounded-[16px] border border-[#E5E7EB] bg-white overflow-hidden shadow-xs hover:shadow-md transition"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                  {vid.imageUrl ? <img
                    src={vid.imageUrl}
                    alt={vid.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105 opacity-90"
                  /> : <div className="flex h-full items-center justify-center text-sm text-white">Chưa có ảnh bìa</div>}

                  {/* Center Play Button */}
                  <button
                    type="button"
                    onClick={() => onNavigate?.(`/videos/${encodeURIComponent(vid.id)}`)}
                    aria-label={`Xem video ${vid.title}`}
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-[#2E7D32] shadow-xl group-hover:scale-110 transition duration-200">
                      <Play size={18} className="fill-[#2E7D32] ml-0.5" />
                    </span>
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="text-[15px] font-bold text-[#111827] leading-snug">
                    <button type="button" onClick={() => onNavigate?.(`/videos/${encodeURIComponent(vid.id)}`)} className="text-left hover:text-[#2E7D32] transition line-clamp-2">
                      {vid.title}
                    </button>
                  </h3>
                  {vid.authorName && <p className="mt-2 text-[12px] text-[#2E7D32] font-semibold">{vid.authorName}</p>}
                  {vid.description && <p className="mt-2 text-[13px] text-[#6B7280] line-clamp-3 leading-relaxed">{vid.description}</p>}
                  {(vid.viewCount != null || publishedDate(vid.publishedAt)) && <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-[#6B7280] font-medium">
                    {vid.viewCount != null && <span>{vid.viewCount.toLocaleString('vi-VN')} lượt xem</span>}
                    {publishedDate(vid.publishedAt) && <span>{publishedDate(vid.publishedAt)}</span>}
                  </div>}
                </div>
              </article>
            ))}
          </div>
        </section>

      {/* =========================================================================
       * 6. SECTION: NHÀ HÀNG CHAY
       * ========================================================================= */}
        <section className="bg-[#F8FAF8] border-y border-[#E5E7EB] py-16">
          <div className="ui-page-container">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-[#111827]">
                  Nhà hàng nổi bật
                </h2>
                <p className="mt-1 text-[14px] text-[#6B7280]">
                  Khám phá các nhà hàng được quản trị viên giới thiệu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('/restaurants')}
                className="inline-flex items-center gap-1 text-[14px] font-bold text-[#2E7D32] hover:underline"
              >
                Xem tất cả nhà hàng
                <ArrowRight size={15} />
              </button>
            </div>

            {sectionState('restaurants', restaurants.length)}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((res) => (
                <article
                  key={res.id}
                  className="group flex flex-col rounded-[16px] border border-[#E5E7EB] bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-[#C8E6C9] transition duration-200"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    {res.imageUrl ? (
                      <img
                        src={res.imageUrl}
                        alt={res.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="text-[16px] font-bold text-[#111827]">
                        <button type="button" onClick={() => onNavigate?.(`/restaurants/${encodeURIComponent(res.id)}`)} className="text-left hover:text-[#2E7D32] transition line-clamp-1">
                          {res.title}
                        </button>
                      </h3>
                      {res.address && <p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-[#6B7280] line-clamp-2 leading-relaxed">
                        <MapPin size={13} className="text-[#2E7D32] shrink-0 mt-0.5" />
                        <span>{res.address}</span>
                      </p>}
                      {res.description && <p className="mt-2 text-[13px] text-[#6B7280] line-clamp-3 leading-relaxed">{res.description}</p>}
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#F3F4F6]">
                      <div className="flex flex-wrap gap-1.5">
                        {res.dietaryTypes.map(diet => {
                          const dietaryType = toBackendDietaryType(diet)
                          return <span key={diet} className="inline-flex items-center rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-semibold text-[#2E7D32]">{dietaryType ? BACKEND_DIETARY_TYPE_LABELS[dietaryType] : diet}</span>
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate?.(`/restaurants/${encodeURIComponent(res.id)}`)}
                        className="rounded-[8px] bg-[#E8F5E9] hover:bg-[#2E7D32] text-[#2E7D32] hover:text-white px-3.5 py-1.5 text-[12px] font-bold transition"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

      {/* =========================================================================
       * 6b. SECTION: BÀI VIẾT NỔI BẬT
       * ========================================================================= */}
      <section className="ui-page-container my-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-[#111827]">
              Bài viết nổi bật
            </h2>
            <p className="mt-1 text-[14px] text-[#6B7280]">
              Chia sẻ kiến thức, kinh nghiệm và lối sống ăn chay khoa học từ cộng đồng.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('/articles')}
            className="inline-flex items-center gap-1 text-[14px] font-bold text-[#2E7D32] hover:underline cursor-pointer"
          >
            Xem tất cả bài viết
            <ArrowRight size={15} />
          </button>
        </div>

        {sectionState('articles', articles.length)}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <article
              key={art.id}
              onClick={() => onNavigate?.(`/articles/${encodeURIComponent(art.id)}`)}
              className="group flex flex-col rounded-[16px] border border-[#E5E7EB] bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-[#C8E6C9] transition duration-200 cursor-pointer"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                {art.imageUrl ? (
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-emerald-50 text-emerald-700">
                    <Leaf size={32} />
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between p-5 space-y-3">
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {art.dietaryTypes?.map(diet => {
                      const dietaryType = toBackendDietaryType(diet)
                      return (
                        <span key={diet} className="inline-flex items-center rounded-full bg-[#E8F5E9] px-2.5 py-0.5 text-[11px] font-semibold text-[#2E7D32]">
                          {dietaryType ? BACKEND_DIETARY_TYPE_LABELS[dietaryType] : diet}
                        </span>
                      )
                    })}
                  </div>

                  <h3 className="text-[16px] font-bold text-[#111827] line-clamp-2 group-hover:text-[#2E7D32] transition">
                    {art.title}
                  </h3>

                  {art.description && (
                    <p className="mt-2 text-[13px] text-[#6B7280] line-clamp-2 leading-relaxed">
                      {art.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{art.authorName || 'Tác giả ẩn danh'}</span>
                  {publishedDate(art.publishedAt) && <span>{publishedDate(art.publishedAt)}</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* =========================================================================
       * 7. SECTION: HỎI TRỢ LÝ DINH DƯỠNG AI
       * ========================================================================= */}
      <section className="ui-page-container my-12">
        <div className="rounded-[16px] border border-[#E5E7EB] bg-[#F0FDF4] p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Cột trái: Thông tin & điều hướng */}
            <div className="flex flex-col items-start">
              <span className="bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full text-xs font-semibold">
                TRỢ LÝ ẢO DINH DƯỠNG THỰC VẬT
              </span>

              <h2 className="text-2xl md:text-3xl font-bold text-[#111827] mt-3 mb-2">
                Hỏi trợ lý dinh dưỡng AI
              </h2>

              <p className="text-[15px] text-[#4B5563] leading-relaxed max-w-[500px]">
                Giải đáp thắc mắc dinh dưỡng, nguyên liệu thay thế, tính toán calo và nhận gợi ý bữa ăn phù hợp cho bạn trong tích tắc.
              </p>

              {/* Câu hỏi gợi ý để bắt đầu cuộc trò chuyện */}
              <div className="flex flex-wrap gap-2 pt-4">
                {AI_SAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleGoToAiChat(q)}
                    className="rounded-full border border-[#C8E6C9] bg-white px-3.5 py-1.5 text-xs font-medium text-[#2E7D32] hover:bg-[#E8F5E9] transition cursor-pointer"
                  >
                    💬 {q}
                  </button>
                ))}
              </div>

              {/* Nút hành động chính (CTA) */}
              <button
                type="button"
                onClick={() => handleGoToAiChat()}
                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-6 py-3 rounded-[10px] font-medium flex items-center gap-2 mt-6 w-fit cursor-pointer transition active:scale-98"
              >
                <Sparkles size={16} />
                <span>Bắt đầu chat với AI ngay</span>
              </button>
            </div>

            <div className="ui-card p-6">
              <h3 className="text-lg font-semibold text-primary">Trao đổi cùng trợ lý AI</h3>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                Mở cuộc trò chuyện để hỏi về nguyên liệu và chế độ ăn. Khi đăng nhập, trợ lý tham khảo hồ sơ bạn đã khai báo.
              </p>
              <p className="mt-3 text-xs text-text-muted">Câu trả lời được tải khi bạn gửi câu hỏi. Thông tin dinh dưỡng mang tính tham khảo.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
