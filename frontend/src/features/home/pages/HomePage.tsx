import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Flame,
  Leaf,
  MapPin,
  Play,
  Search,
  Send,
  Sparkles,
  User,
} from 'lucide-react'
import { listVideos, type VideoDetails } from '../../videos/api/backendVideos'
import { apiClient } from '../../../shared/api/apiClient'
import { EmptyState, SkeletonLoader } from '../../../shared/components'
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

interface HomeRestaurantItem {
  id: string
  name: string
  address: string
  distance: string
  imageUrl: string
}

interface HomeArticleItem {
  id: string
  title: string
  author: string
  date: string
  excerpt: string
  imageUrl: string
}

export default function HomePage({ onNavigate, isLoggedIn: _isLoggedIn }: HomePageProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [teaserInput, setTeaserInput] = useState('')
  const [recipes, setRecipes] = useState<HomeRecipeItem[]>([])
  const [videos, setVideos] = useState<VideoDetails[]>([])
  const [restaurants, setRestaurants] = useState<HomeRestaurantItem[]>([])
  const [articles, setArticles] = useState<HomeArticleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErrors, setLoadErrors] = useState<string[]>([])

  // Load real data from services
  useEffect(() => {
    let isMounted = true
    void (async () => {
        const results = await Promise.allSettled([
          apiClient.get<{ items: Array<{
            id: string; name: string; categoryName: string; cookTimeMinutes: number
            caloriesPerServing: number | null; imageUrl: string | null
          }> }>('/api/recipes?pageNumber=1&pageSize=4', { requiresAuth: false }),
          apiClient.get<{ items: Array<{
            id: string; name: string; address: string; distanceKm: number | null; imageUrl: string | null
          }> }>('/api/restaurants?pageNumber=1&pageSize=2', { requiresAuth: false }),
          listVideos(),
          apiClient.get<{ items: Array<{
            id: string; title: string; category: string; publishedAt: string; coverImageUrl: string | null
          }> }>('/api/articles?page=1&pageSize=3', { requiresAuth: false }),
        ])
        if (!isMounted) return
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
          setRestaurants(
            restaurantResult.value.items.map((res) => ({
              id: res.id,
              name: res.name,
              address: res.address,
              distance: res.distanceKm == null ? 'Chưa có khoảng cách' : `${res.distanceKm} km`,
              imageUrl: res.imageUrl || '',
            })),
          )
        }

        if (videoResult.status === 'fulfilled') {
          setVideos(videoResult.value.slice(0, 3))
        }

        if (articleResult.status === 'fulfilled') {
            setArticles(
              articleResult.value.items.map((a) => ({
                id: a.id,
                title: a.title,
                author: 'Thành viên',
                date: new Date(a.publishedAt).toLocaleDateString('vi-VN'),
                excerpt: a.category,
                imageUrl: a.coverImageUrl || '',
              })),
            )
        }
        const labels = ['công thức', 'nhà hàng', 'video', 'bài viết']
        setLoadErrors(results.flatMap((result, index) => result.status === 'rejected' ? [labels[index]] : []))
        setLoading(false)
    })()
    return () => {
      isMounted = false
    }
  }, [])

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return
    onNavigate?.(`/recipes?q=${encodeURIComponent(searchTerm.trim())}`)
  }

  const handleQuickTagClick = (tag: string) => {
    setSearchTerm(tag)
    onNavigate?.(`/recipes?q=${encodeURIComponent(tag)}`)
  }

  const handleTeaserSubmit = (e: FormEvent) => {
    e.preventDefault()
    onNavigate?.('/ai-chat')
  }

  return (
    <div className="min-h-screen bg-[#FBFDFB] text-[#1F2937] font-['Inter']">
      {/* =========================================================================
       * 1. HERO SECTION & THỐNG KÊ (TOP BANNER)
       * ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#E8F5E9]/60 via-[#F8FAF8] to-[#FBFDFB] border-b border-[#E8F5E9] py-12 lg:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Cột trái */}
            <div className="lg:col-span-7 flex flex-col items-start gap-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#C8E6C9] bg-white px-3.5 py-1.5 text-[12px] font-bold tracking-wider text-[#2E7D32] shadow-xs">
                <Leaf size={14} className="fill-[#2E7D32]" />
                NỀN TẢNG ẨM THỰC &amp; DINH DƯỠNG THỰC VẬT
              </span>

              <h1 className="text-[36px] sm:text-[46px] lg:text-[50px] font-extrabold tracking-tight text-[#111827] leading-[1.15]">
                Ăn chay lành mạnh, <br className="hidden sm:inline" />
                đơn giản hơn mỗi ngày
              </h1>

              <p className="text-[16px] text-[#4B5563] leading-relaxed max-w-[540px]">
                Khám phá hàng trăm công thức thuần chay, thực đơn cá nhân hóa và nhận trợ giúp từ trợ lý AI dinh dưỡng.
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
                  <span>100% Thuần thực vật</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>Chuẩn khoa học dinh dưỡng</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>Hơn 10.000+ người dùng</span>
                </div>
              </div>
            </div>

            {/* Cột phải: Ảnh đĩa salad tròn + Floating Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
              <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px]">
                {/* Vòng nền gradient nhẹ */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#C8E6C9]/40 to-transparent scale-105" />

                <img
                  src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80"
                  alt="Đĩa salad thuần chay ngũ sắc"
                  className="h-full w-full rounded-full object-cover shadow-2xl ring-8 ring-white"
                />

                {/* Floating Card: BMI */}
                <div className="absolute bottom-2 left-0 sm:-left-4 rounded-[14px] border border-[#E5E7EB] bg-white/95 backdrop-blur px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                        Chỉ số thể trạng
                      </div>
                      <div className="text-[13px] font-bold text-[#111827]">
                        BMI chuẩn 18.5 – 22.9
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Badge: Góc trên */}
                <div className="absolute top-4 right-0 sm:-right-2 rounded-[14px] border border-[#E5E7EB] bg-white/95 backdrop-blur px-3.5 py-2.5 shadow-lg flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                  <span className="text-[12px] font-bold text-[#111827]">
                    Công thức mới mỗi ngày
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 2. THANH TÌM KIẾM NHANH TOÀN HỆ THỐNG
       * ========================================================================= */}
      <section className="mx-auto max-w-[1240px] px-4 sm:px-6 -mt-7 relative z-20">
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
                placeholder="Tìm kiếm món ăn, bài viết, video..."
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
      <div className="mx-auto max-w-[1240px] px-4 pt-8 sm:px-6">
        {loading && <SkeletonLoader count={3} variant="card" />}
        {loadErrors.length > 0 && <AlertError title="Một số nội dung chưa tải được" message={`Không thể tải ${loadErrors.join(', ')}. Hãy tải lại trang để thử lại.`} />}
        {!loading && loadErrors.length === 0 && recipes.length + videos.length + articles.length + restaurants.length === 0 && (
          <EmptyState title="Chưa có nội dung công khai" description="Nội dung sẽ xuất hiện khi được cập nhật và công khai." />
        )}
      </div>
      {recipes.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-[#111827]">
                Công thức nổi bật
              </h2>
              <p className="mt-1 text-[14px] text-[#6B7280]">
                Được chuyên gia dinh dưỡng chọn lọc, cân bằng dưỡng chất và dễ nấu tại nhà.
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
      )}

      {/* =========================================================================
       * 4. SECTION: BÀI VIẾT MỚI NHẤT
       * ========================================================================= */}
      {articles.length > 0 && (
        <section className="bg-[#F8FAF8] border-y border-[#E5E7EB] py-16">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-[#111827]">
                  Bài viết mới nhất
                </h2>
                <p className="mt-1 text-[14px] text-[#6B7280]">
                  Cẩm nang khoa học dinh dưỡng và kinh nghiệm thực hành từ các chuyên gia.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('/articles')}
                className="inline-flex items-center gap-1 text-[14px] font-bold text-[#2E7D32] hover:underline"
              >
                Xem tất cả bài viết
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="group flex flex-col rounded-[16px] border border-[#E5E7EB] bg-white overflow-hidden shadow-xs hover:shadow-md transition"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                    {article.imageUrl ? <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    /> : <div className="flex h-44 items-center justify-center text-sm text-slate-500">Chưa có ảnh bìa</div>}
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="flex items-center gap-3 text-[12px] text-[#6B7280] mb-2 font-medium">
                        <span className="flex items-center gap-1 text-[#2E7D32] font-semibold">
                          <User size={12} />
                          {article.author}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {article.date}
                        </span>
                      </div>

                      <h3
                        onClick={() => onNavigate?.(`/articles/${article.id}`)}
                        className="text-[16px] font-bold text-[#111827] hover:text-[#2E7D32] cursor-pointer transition line-clamp-2 leading-snug"
                      >
                        {article.title}
                      </h3>

                      <p className="mt-2 text-[13px] text-[#6B7280] line-clamp-3 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F3F4F6]">
                      <button
                        type="button"
                        onClick={() => onNavigate?.(`/articles/${article.id}`)}
                        className="inline-flex items-center gap-1 text-[13px] font-bold text-[#2E7D32] hover:underline"
                      >
                        Đọc thêm
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
       * 5. SECTION: VIDEO NẤU ĂN NỔI BẬT
       * ========================================================================= */}
      {videos.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-[#111827]">
                Video nấu ăn nổi bật
              </h2>
              <p className="mt-1 text-[14px] text-[#6B7280]">
                Hướng dẫn trực quan từng bước giúp bạn tự tay chuẩn bị món chay thơm ngon.
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {videos.map((vid) => (
              <article
                key={vid.id}
                className="group flex flex-col rounded-[16px] border border-[#E5E7EB] bg-white overflow-hidden shadow-xs hover:shadow-md transition"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                  {vid.thumbnailUrl ? <img
                    src={vid.thumbnailUrl}
                    alt={vid.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105 opacity-90"
                  /> : <div className="flex h-full items-center justify-center text-sm text-white">Chưa có ảnh bìa</div>}

                  {/* Center Play Button */}
                  <button
                    type="button"
                    onClick={() => onNavigate?.(`/videos/${vid.id}`)}
                    aria-label="Xem video"
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-[#2E7D32] shadow-xl group-hover:scale-110 transition duration-200">
                      <Play size={18} className="fill-[#2E7D32] ml-0.5" />
                    </span>
                  </button>
                </div>

                <div className="p-4">
                  <h3
                    onClick={() => onNavigate?.(`/videos/${vid.id}`)}
                    className="text-[15px] font-bold text-[#111827] hover:text-[#2E7D32] cursor-pointer transition line-clamp-2 leading-snug"
                  >
                    {vid.title}
                  </h3>
                  <div className="mt-2 text-[12px] text-[#6B7280] font-medium">
                    {vid.viewCount.toLocaleString('vi-VN')} lượt xem
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
       * 6. SECTION: NHÀ HÀNG CHAY GẦN BẠN
       * ========================================================================= */}
      {restaurants.length > 0 && (
        <section className="bg-[#F8FAF8] border-y border-[#E5E7EB] py-16">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-[#111827]">
                  Nhà hàng chay
                </h2>
                <p className="mt-1 text-[14px] text-[#6B7280]">
                  Khám phá địa điểm và thông tin nhà hàng trong hệ thống.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('/restaurants')}
                className="inline-flex items-center gap-1 text-[14px] font-bold text-[#2E7D32] hover:underline"
              >
                Xem trên bản đồ
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* 2 Card Nhà hàng bên trái */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                {restaurants.map((res) => (
                  <article
                    key={res.id}
                    className="flex flex-col sm:flex-row items-stretch rounded-[16px] border border-[#E5E7EB] bg-white p-3.5 gap-4 shadow-xs hover:border-[#C8E6C9] transition"
                  >
                    {res.imageUrl ? <img
                      src={res.imageUrl}
                      alt={res.name}
                      className="h-32 sm:w-40 sm:h-auto rounded-[12px] object-cover shrink-0"
                    /> : <div className="flex h-32 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500 sm:w-40">Chưa có ảnh</div>}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-[15px] font-bold text-[#111827]">
                            {res.name}
                          </h3>
                        </div>
                        <p className="mt-1 text-[12px] text-[#6B7280] line-clamp-2">
                          {res.address}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#F3F4F6]">
                        <span className="flex items-center gap-1 text-[12px] font-semibold text-[#4B5563]">
                          <MapPin size={12} className="text-[#2E7D32]" />
                          {res.distance}
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigate?.(`/restaurants/${res.id}`)}
                          className="rounded-[8px] bg-[#E8F5E9] hover:bg-[#2E7D32] text-[#2E7D32] hover:text-white px-3.5 py-1.5 text-[12px] font-bold transition"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Khung bản đồ thu nhỏ bên phải */}
              <div className="lg:col-span-6">
                <div className="relative aspect-[16/10] w-full rounded-[16px] overflow-hidden border border-[#E5E7EB] shadow-xs group">
                  <img
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80"
                    alt="Ảnh minh họa bản đồ"
                    className="h-full w-full object-cover"
                  />

                  {/* Map Overlay Badge */}
                  <div className="absolute top-4 left-4 rounded-[10px] border border-[#E5E7EB] bg-white/95 backdrop-blur px-3 py-2 shadow-md flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2E7D32] text-white">
                      <MapPin size={13} />
                    </span>
                    <div>
                      <div className="text-[12px] font-bold text-[#111827]">
                        Tìm nhà hàng trên bản đồ
                      </div>
                      <div className="text-[10px] text-[#6B7280]">
                        Ảnh minh họa — mở danh sách để xem vị trí thực tế
                      </div>
                    </div>
                  </div>

                  {/* Button Mở rộng bản đồ */}
                  <div className="absolute bottom-4 right-4">
                    <button
                      type="button"
                      onClick={() => onNavigate?.('/restaurants')}
                      className="rounded-[8px] bg-[#2E7D32] hover:bg-[#1B5E20] px-4 py-2 text-[13px] font-semibold text-white shadow-md transition"
                    >
                      Mở rộng bản đồ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
       * 7. SECTION: HỎI TRỢ LÝ DINH DƯỠNG AI (INTERACTIVE TEASER)
       * ========================================================================= */}
      <section className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6">
        <div className="rounded-[20px] border border-[#C8E6C9] bg-gradient-to-br from-[#F0FDF4] via-white to-[#F0FDF4] p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Cột trái: Teaser Info */}
            <div className="lg:col-span-6 flex flex-col items-start gap-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C8E6C9] bg-[#E8F5E9] px-3 py-1 text-[12px] font-bold text-[#2E7D32]">
                <Sparkles size={13} />
                TRỢ LÝ ẢO DINH DƯỠNG THỰC VẬT
              </span>

              <h2 className="text-[28px] sm:text-[34px] font-extrabold tracking-tight text-[#111827] leading-tight">
                Hỏi trợ lý dinh dưỡng AI
              </h2>

              <p className="text-[15px] text-[#4B5563] leading-relaxed">
                Giải đáp thắc mắc dinh dưỡng, nguyên liệu thay thế, tính toán calo và nhận gợi ý bữa ăn phù hợp cho bạn trong tích tắc.
              </p>

              {/* Sample question chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {AI_SAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onNavigate?.('/ai-chat')}
                    className="rounded-full border border-[#C8E6C9] bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#2E7D32] hover:bg-[#E8F5E9] transition"
                  >
                    💬 {q}
                  </button>
                ))}
              </div>

              {/* CTA button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate?.('/ai-chat')}
                  className="rounded-[10px] bg-[#2E7D32] hover:bg-[#1B5E20] px-7 py-3 text-[15px] font-semibold text-white shadow-sm transition active:scale-98"
                >
                  Bắt đầu chat với AI ngay
                </button>
              </div>
            </div>

            {/* Cột phải: Chat Simulator Mockup */}
            <div className="lg:col-span-6">
              <div className="rounded-[16px] border border-[#E5E7EB] bg-white shadow-lg overflow-hidden">
                {/* Header chat box */}
                <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3 bg-[#F9FAFB]">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                      <Sparkles size={14} />
                    </span>
                    <span className="text-[13px] font-bold text-[#111827]">
                      Vegetarian AI Assistant
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2E7D32]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                    Đang hoạt động
                  </span>
                </div>

                {/* Messages conversation preview */}
                <div className="p-4 space-y-3.5 bg-white text-[13px] leading-relaxed">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="rounded-[14px] rounded-tr-none bg-[#2E7D32] text-white px-4 py-2.5 max-w-[85%] shadow-xs">
                      Bữa sáng đơn giản, 10 phút nấu nhanh và giàu đạm thực vật?
                    </div>
                  </div>

                  {/* Bot message */}
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32] mt-0.5">
                      <Leaf size={14} className="fill-[#2E7D32]" />
                    </span>
                    <div className="rounded-[14px] rounded-tl-none bg-[#E8F5E9] border border-[#C8E6C9] p-3 text-[#1F2937] max-w-[90%] space-y-1">
                      <p className="font-semibold text-[#2E7D32]">
                        Chào bạn! Gợi ý bữa sáng nhanh cho bạn:
                      </p>
                      <p>• Smoothie chuối, yến mạch &amp; bơ đậu phộng (~22g protein)</p>
                      <p>• Đậu hũ xào nấm ăn kèm bánh mì nguyên cám (~18g protein)</p>
                      <p className="text-[12px] text-[#6B7280] pt-1">
                        Thời gian thực hiện chỉ khoảng 8 – 10 phút, đầy đủ năng lượng cho cả buổi sáng!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Input simulator */}
                <form
                  onSubmit={handleTeaserSubmit}
                  className="border-t border-[#E5E7EB] p-2.5 bg-[#F9FAFB] flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={teaserInput}
                    onChange={(e) => setTeaserInput(e.target.value)}
                    placeholder="Nhập câu hỏi của bạn..."
                    className="flex-1 rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] text-[#1F2937] focus:border-[#2E7D32] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#2E7D32] text-white hover:bg-[#1B5E20] transition"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
