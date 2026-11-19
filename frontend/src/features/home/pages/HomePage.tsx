// BE2-06 | Trang chủ đọc công thức, nhà hàng, video và nội dung nổi bật qua API public.
// Chức năng: trang chủ và thông tin giới thiệu. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import { FeaturedSection, FeaturedRecipeCard, FeaturedCommunityCard, type HomeRecipeItem } from '../components/FeaturedContent'
import { useEffect, useState, type FormEvent } from 'react'
import {
  Check,
  Leaf,
  Search,
  Send,
  Sparkles,
} from 'lucide-react'

import { apiClient } from '../../../shared/api/apiClient'
import { getPopularFeaturedContent, type FeaturedContentItem } from '../../../shared/api/featuredContentApi'
import { Badge, EmptyState, SkeletonLoader } from '../../../shared/components'
import AlertError from '../../../shared/components/AlertError'



// Cấu trúc HomePageProps quy định dữ liệu trao đổi trong trang chủ và thông tin giới thiệu.
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


// Cấu trúc HomeRecipeItem quy định dữ liệu trao đổi trong trang chủ và thông tin giới thiệu.


// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (extractRecipeDietaryTypes); thuộc trang chủ và thông tin giới thiệu.
function extractRecipeDietaryTypes(declared?: number | string | null): string[] {
  const types = ['Vegan', 'LactoVegetarian', 'OvoVegetarian', 'LactoOvoVegetarian']
  const type = typeof declared === 'number' ? types[declared - 1] : declared
  return type && types.includes(type) ? [type] : []
}

// Cấu trúc HomeSection quy định dữ liệu trao đổi trong trang chủ và thông tin giới thiệu.
type HomeSection = 'recipes' | 'restaurants' | 'videos' | 'articles'

const SECTION_LABELS: Record<HomeSection, string> = {
  recipes: 'công thức',
  restaurants: 'nhà hàng nổi bật',
  videos: 'video nổi bật',
  articles: 'bài viết nổi bật',
}

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (publishedDate); thuộc trang chủ và thông tin giới thiệu.


// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (HomePage); thuộc trang chủ và thông tin giới thiệu.
export default function HomePage({ onNavigate, isLoggedIn: _isLoggedIn }: HomePageProps) {
  // Lưu dữ liệu và trạng thái thao tác của trang chủ và thông tin giới thiệu trong vòng đời màn hình.
  const [searchTerm, setSearchTerm] = useState('')
  const [recipes, setRecipes] = useState<HomeRecipeItem[]>([])
  const [videos, setVideos] = useState<FeaturedContentItem[]>([])
  const [restaurants, setRestaurants] = useState<FeaturedContentItem[]>([])
  const [articles, setArticles] = useState<FeaturedContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErrors, setLoadErrors] = useState<HomeSection[]>([])
  const [loadRevision, setLoadRevision] = useState(0)

  // Load real data from services
  // Đồng bộ dữ liệu theo thay đổi đầu vào; hủy hoặc bỏ qua kết quả cũ khi màn hình thay đổi.
  useEffect(() => {
    const controller = new AbortController()
    void (async () => {
        const results = await Promise.allSettled([
          apiClient.get<{ items: Array<{
            id: string; name: string; categoryName: string; cookTimeMinutes: number; prepTimeMinutes?: number
            caloriesPerServing: number | null; imageUrl: string | null
            declaredDietaryType?: number | string | null
          }> }>('/api/recipes?pageNumber=1&pageSize=4&rankByPopularity=true', { requiresAuth: false, signal: controller.signal }),
          getPopularFeaturedContent('Restaurant', controller.signal),
          getPopularFeaturedContent('Video', controller.signal),
          getPopularFeaturedContent('Article', controller.signal),
        ])
        if (controller.signal.aborted) return
        const [recipeResult, restaurantResult, videoResult, articleResult] = results

        if (recipeResult.status === 'fulfilled') {
          setRecipes(
            recipeResult.value.items.slice(0, 4).map((r) => ({
              id: r.id,
              title: r.name,
              tag: r.categoryName,
              cookTime: `${(r.prepTimeMinutes ?? 0) + r.cookTimeMinutes} phút`,
              calories: r.caloriesPerServing == null ? 'Chưa có dữ liệu calo' : `${Math.round(r.caloriesPerServing)} kcal`,
              imageUrl: r.imageUrl || '',
              dietaryTypes: extractRecipeDietaryTypes(r.declaredDietaryType),
            })),
          )
        }

        if (restaurantResult.status === 'fulfilled') setRestaurants(restaurantResult.value)
        if (videoResult.status === 'fulfilled') setVideos(videoResult.value)
        if (articleResult.status === 'fulfilled') setArticles(articleResult.value)
        const sections: HomeSection[] = ['recipes', 'restaurants', 'videos', 'articles']
        setLoadErrors(results.flatMap((result, index) => result.status === 'rejected' ? [sections[index]] : []))
        setLoading(false)
    })()
    return () => {
      controller.abort()
    }
  }, [loadRevision])

  // Thử lại việc lấy dữ liệu và đồng bộ trạng thái hiển thị (retryContent); thuộc trang chủ và thông tin giới thiệu.
  function retryContent() {
    setLoading(true)
    setLoadErrors([])
    setLoadRevision(revision => revision + 1)
  }

  // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (sectionState); thuộc trang chủ và thông tin giới thiệu.
  function sectionState(section: HomeSection, count: number) {
    if (loading && count === 0) return <SkeletonLoader count={3} variant="card" />
    if (loadErrors.includes(section)) return <AlertError title={`Chưa tải được ${SECTION_LABELS[section]}`} message="Vui lòng thử lại để xem nội dung mới nhất." onRetry={retryContent} />
    if (!loading && count === 0) return <EmptyState title={`Chưa có ${SECTION_LABELS[section]}`} description={section === 'recipes' ? 'Công thức sẽ xuất hiện khi được cập nhật và công khai.' : 'Nội dung đang công khai sẽ xuất hiện tại đây.'} />
    return null
  }

  // Kiểm tra dữ liệu trước khi gửi thao tác và xử lý kết quả trả về (handleSearchSubmit); thuộc trang chủ và thông tin giới thiệu.
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return
    onNavigate?.(`/recipes?q=${encodeURIComponent(searchTerm.trim())}`)
  }

  // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (handleQuickTagClick); thuộc trang chủ và thông tin giới thiệu.
  const handleQuickTagClick = (tag: string) => {
    setSearchTerm(tag)
    onNavigate?.(`/recipes?q=${encodeURIComponent(tag)}`)
  }

  // Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (handleGoToAiChat); thuộc trang chủ và thông tin giới thiệu.
  const handleGoToAiChat = (query?: string) => {
    if (query) {
      onNavigate?.(`/ai-chat?q=${encodeURIComponent(query)}`)
    } else {
      onNavigate?.('/ai-chat')
    }
  }

  // Hiển thị giao diện trang chủ và thông tin giới thiệu từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
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

      <FeaturedSection title="Công thức nổi bật" description="Những món chay được yêu thích, cho bữa ăn mỗi ngày thêm phong phú." path="/recipes" linkLabel="Tất cả công thức" onNavigate={onNavigate}>
        {sectionState('recipes', recipes.length)}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {recipes.map(recipe => <FeaturedRecipeCard key={recipe.id} recipe={recipe} onNavigate={onNavigate} />)}
        </div>
      </FeaturedSection>

      <FeaturedSection title="Video nổi bật" description="Theo dõi từng bước nấu ăn và thử thêm một món mới cùng cộng đồng." path="/videos" linkLabel="Tất cả video" onNavigate={onNavigate} muted>
        {sectionState('videos', videos.length)}
        <div className={videos.length === 1 ? 'grid gap-5' : videos.length === 2 ? 'grid gap-5 sm:grid-cols-2' : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'}>
          {videos.map(item => <FeaturedCommunityCard key={item.id} item={item} onNavigate={onNavigate} />)}
        </div>
      </FeaturedSection>

      <FeaturedSection title="Nhà hàng nổi bật" description="Tìm một địa chỉ ăn chay cho buổi hẹn và những ngày muốn đổi vị." path="/restaurants" linkLabel="Tất cả nhà hàng" onNavigate={onNavigate}>
        {sectionState('restaurants', restaurants.length)}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map(item => <FeaturedCommunityCard key={item.id} item={item} onNavigate={onNavigate} />)}
        </div>
      </FeaturedSection>

      <FeaturedSection title="Bài viết nổi bật" description="Chuyện ăn chay, kiến thức dinh dưỡng và những chia sẻ từ cộng đồng." path="/articles" linkLabel="Tất cả bài viết" onNavigate={onNavigate} muted>
        {sectionState('articles', articles.length)}
        <div className={articles.length === 1 ? 'grid gap-5' : articles.length === 2 ? 'grid gap-5 sm:grid-cols-2' : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'}>
          {articles.map(item => <FeaturedCommunityCard key={item.id} item={item} wide={articles.length === 1} onNavigate={onNavigate} />)}
        </div>
      </FeaturedSection>

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

            {/* Cột phải: Mô phỏng khung chat demo */}
            <div
              onClick={() => handleGoToAiChat()}
              className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm p-5 cursor-pointer hover:border-[#C8E6C9] transition"
            >
              {/* Header mini */}
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                    <Leaf size={14} className="fill-[#2E7D32]" />
                  </span>
                  <span className="text-[14px] font-bold text-[#111827]">
                    Vegetarian AI Assistant
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2E7D32]">
                  <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                  Đang hoạt động
                </span>
              </div>

              {/* Tin nhắn người dùng mẫu */}
              <div className="flex flex-col items-end">
                <div className="bg-[#2E7D32] text-white rounded-[16px] rounded-tr-none p-3.5 text-sm ml-auto max-w-[85%] shadow-xs leading-relaxed">
                  Bữa sáng đơn giản, 10 phút nấu nhanh và giàu đạm thực vật?
                </div>
                <span className="text-[10px] text-gray-400 mt-1 mr-1 font-medium">08:30</span>
              </div>

              {/* Tin nhắn AI trả lời mẫu */}
              <div className="mt-3 flex flex-col items-start">
                <div className="bg-[#E8F5E9] text-[#1F2937] rounded-[16px] rounded-tl-none p-4 text-sm leading-relaxed space-y-1.5 border border-[#C8E6C9]/60">
                  <p className="font-semibold text-[#2E7D32]">
                    Chào bạn! Gợi ý bữa sáng nhanh &amp; giàu đạm cho bạn:
                  </p>
                  <p>• Sinh tố chuối, yến mạch và hạt chia. (22g protein)</p>
                  <p>• Đậu hũ non xào nấm ăn kèm bánh mì nguyên cám (~18g protein)</p>
                  <p className="text-[12px] text-[#6B7280] pt-1">
                    Thời gian thực hiện chỉ khoảng 8 – 10 phút, cung cấp năng lượng dồi dào cho ngày mới!
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 ml-1 font-medium">08:31</span>
              </div>

              {/* Input giả lập ở dưới */}
              <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  placeholder="Nhập câu hỏi của bạn..."
                  className="flex-1 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2 text-sm text-[#9CA3AF] cursor-pointer focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Gửi câu hỏi sang trợ lý AI"
                  className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#2E7D32] text-white hover:bg-[#1B5E20] transition cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
