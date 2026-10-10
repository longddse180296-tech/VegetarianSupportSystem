import React, { useEffect, useState } from 'react'
import {
  Sparkles,
  Calendar,
  ChevronRight,
  Leaf,
  ArrowRight,
  Lock,
  Utensils,
} from 'lucide-react'
import { useAuth } from '../../auth'
import type { DietType } from '../types/mealPlans.types'
import { MealPlanCard, type RecommendedPlanItem } from '../components/MealPlanCard'
import { MealPlanSkeleton } from '../components/MealPlanSkeleton'

/* ─── Mock recommended plans for the public discovery page ──────────── */
const MOCK_RECOMMENDED_PLANS: RecommendedPlanItem[] = [
  {
    id: 'plan-vegan-detox-7d',
    title: 'Thực đơn Vegan Detox 7 ngày',
    description:
      'Thực đơn thanh lọc cơ thể hoàn toàn từ thực vật, giàu chất xơ và chất chống oxy hóa. Phù hợp cho người mới bắt đầu.',
    imageUrl:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=280&fit=crop',
    dietType: 'vegan',
    dietLabel: 'Thuần chay (Vegan)',
    mealsCount: 21,
    avgCalories: 1650,
    durationDays: 7,
    tags: ['Detox', 'Giàu xơ', 'Ít calo'],
    rating: 4.8,
    ratingCount: 124,
  },
  {
    id: 'plan-lacto-muscle-7d',
    title: 'Thực đơn tăng cơ Lacto-Vegetarian',
    description:
      'Kế hoạch bữa ăn giàu protein từ sữa và đậu nành, thiết kế cho người tập luyện cường độ vừa đến cao.',
    imageUrl:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=280&fit=crop',
    dietType: 'lacto',
    dietLabel: 'Lacto-Vegetarian',
    mealsCount: 21,
    avgCalories: 2200,
    durationDays: 7,
    tags: ['Tăng cơ', 'Giàu protein', 'Sữa OK'],
    rating: 4.6,
    ratingCount: 89,
  },
  {
    id: 'plan-ovo-balanced-7d',
    title: 'Thực đơn cân bằng Ovo-Vegetarian',
    description:
      'Thực đơn đa dạng kết hợp trứng và rau củ quả, đảm bảo đầy đủ vi chất và dễ nấu tại nhà.',
    imageUrl:
      'https://images.unsplash.com/photo-1543339308-d595c3a0c8a2?w=400&h=280&fit=crop',
    dietType: 'ovo',
    dietLabel: 'Ovo-Vegetarian',
    mealsCount: 21,
    avgCalories: 1800,
    durationDays: 7,
    tags: ['Cân bằng', 'Dễ nấu', 'Trứng OK'],
    rating: 4.7,
    ratingCount: 67,
  },
  {
    id: 'plan-lacto-ovo-family-7d',
    title: 'Thực đơn gia đình Lacto-Ovo',
    description:
      'Phù hợp cho cả gia đình với công thức đơn giản, dinh dưỡng đầy đủ từ sữa, trứng và thực vật.',
    imageUrl:
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=280&fit=crop',
    dietType: 'lacto-ovo',
    dietLabel: 'Lacto-Ovo Vegetarian',
    mealsCount: 21,
    avgCalories: 1900,
    durationDays: 7,
    tags: ['Gia đình', 'Đơn giản', 'Đầy đủ'],
    rating: 4.9,
    ratingCount: 203,
  },
  {
    id: 'plan-vegan-weightloss-7d',
    title: 'Thực đơn giảm cân Vegan',
    description:
      'Chương trình ăn chay thuần thực vật hỗ trợ giảm cân khoa học, giàu rau xanh và protein đậu.',
    imageUrl:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=280&fit=crop',
    dietType: 'vegan',
    dietLabel: 'Thuần chay (Vegan)',
    mealsCount: 21,
    avgCalories: 1400,
    durationDays: 7,
    tags: ['Giảm cân', 'Low-cal', 'Rau xanh'],
    rating: 4.5,
    ratingCount: 156,
  },
  {
    id: 'plan-lacto-ovo-sport-7d',
    title: 'Thực đơn thể thao Lacto-Ovo',
    description:
      'Tối ưu năng lượng cho người vận động nhiều với sự kết hợp protein từ trứng, sữa và đậu.',
    imageUrl:
      'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=280&fit=crop',
    dietType: 'lacto-ovo',
    dietLabel: 'Lacto-Ovo Vegetarian',
    mealsCount: 21,
    avgCalories: 2400,
    durationDays: 7,
    tags: ['Thể thao', 'Năng lượng', 'Protein cao'],
    rating: 4.7,
    ratingCount: 78,
  },
]

const DIET_FILTER_OPTIONS: { id: DietType | 'all'; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'vegan', label: 'Thuần chay' },
  { id: 'lacto', label: 'Lacto' },
  { id: 'ovo', label: 'Ovo' },
  { id: 'lacto-ovo', label: 'Lacto-Ovo' },
]

export interface MealPlansPublicProps {
  onNavigate?: (path: string) => void
}

export const MealPlansPublic: React.FC<MealPlansPublicProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeDietFilter, setActiveDietFilter] = useState<DietType | 'all'>('all')

  // Simulate smooth loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  const filteredPlans =
    activeDietFilter === 'all'
      ? MOCK_RECOMMENDED_PLANS
      : MOCK_RECOMMENDED_PLANS.filter((p) => p.dietType === activeDietFilter)

  /**
   * The Auth Wall:
   * Intercepts Guests and redirects to /login with returnUrl.
   * Authenticated users proceed directly to targetPath.
   */
  const navigateWithAuth = (targetPath: string) => {
    if (isAuthenticated) {
      onNavigate?.(targetPath)
    } else {
      // Store in session storage for state retrieval
      try {
        sessionStorage.setItem('returnUrl', targetPath)
      } catch {
        // ignore storage errors
      }
      onNavigate?.(`/login?returnUrl=${encodeURIComponent(targetPath)}`)
    }
  }

  const handleViewPlanDetail = (planId: string) => {
    navigateWithAuth(`/meal-plans/${planId}`)
  }

  const handleCreatePersonalized = () => {
    navigateWithAuth('/meal-plans/create')
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* ── 1. Breadcrumb ───────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <button
          type="button"
          onClick={() => onNavigate?.('/')}
          className="hover:text-emerald-700 transition-colors cursor-pointer"
        >
          Trang chủ
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-emerald-700 font-bold">Thực đơn</span>
      </nav>

      {/* ── 2. Hero Section / Banner ────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f4a24] via-[#1a6b37] to-[#22874a] p-8 md:p-10 lg:p-12 shadow-lg">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-emerald-300/30 rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/10 text-white/90 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Cá nhân hóa theo mục tiêu & chế độ ăn</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-[40px] font-black text-white tracking-tight leading-tight">
              Lập thực đơn chay{' '}
              <span className="text-emerald-300">7 ngày</span>{' '}
              phù hợp riêng cho bạn
            </h1>

            <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-xl">
              Hệ thống hỗ trợ tính toán nhu cầu dinh dưỡng, loại trừ dị ứng và gợi ý 21 bữa ăn
              chay cân bằng khoa học trong 7 ngày.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCreatePersonalized}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white text-[#1a6b37] text-sm font-bold shadow-md hover:bg-emerald-50 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Tạo thực đơn cá nhân hóa</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {!isAuthenticated && (
                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Yêu cầu đăng nhập</span>
                </span>
              )}

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => onNavigate?.('/meal-plans/my-plan')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-emerald-300" />
                  <span>Thực đơn của tôi</span>
                </button>
              )}
            </div>
          </div>

          {/* Decorative stats mini-card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 space-y-3 min-w-[200px] shrink-0 hidden lg:block">
            <div className="flex items-center gap-2 text-white/80 text-xs font-semibold">
              <Utensils className="w-3.5 h-3.5 text-emerald-300" />
              <span>Thống kê hệ thống</span>
            </div>
            <div className="space-y-2.5">
              <div>
                <p className="text-2xl font-black text-white">150+</p>
                <p className="text-[10px] text-white/60 font-medium">Công thức chay</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">4</p>
                <p className="text-[10px] text-white/60 font-medium">Chế độ ăn chay</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">7 ngày</p>
                <p className="text-[10px] text-white/60 font-medium">Kế hoạch tuần hoàn chỉnh</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Section Header: Recommended Plans ────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Thực đơn đề xuất
          </h2>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-lg">
            Khám phá các kế hoạch bữa ăn chay mẫu được gợi ý theo từng mục tiêu sức khỏe và chế độ ăn.
          </p>
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={() => onNavigate?.('/meal-plans/discover')}
            className="inline-flex items-center gap-1.5 self-start md:self-auto rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xem thực đơn theo chế độ ăn</span>
            <span className="text-slate-400">&rarr;</span>
          </button>
        )}
      </div>

      {/* ── 4. Diet Type Filter Tabs ────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {DIET_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setActiveDietFilter(opt.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              activeDietFilter === opt.id
                ? 'bg-[#1E6531] text-white border-[#1E6531] shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── 5. Plans Grid using MealPlanCard ────────────────────────── */}
      {loading ? (
        <MealPlanSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <MealPlanCard
              key={plan.id}
              plan={plan}
              isAuthenticated={isAuthenticated}
              onViewDetail={handleViewPlanDetail}
            />
          ))}
        </div>
      )}

      {filteredPlans.length === 0 && !loading && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80">
          <p className="text-slate-500 text-sm">
            Không có thực đơn nào phù hợp với bộ lọc hiện tại.
          </p>
        </div>
      )}

      {/* ── 6. Bottom CTA Section ───────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#EAF5EE] via-[#f0faf4] to-[#EAF5EE] rounded-3xl p-8 md:p-10 border border-emerald-200/60 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4 max-w-xl">
            <div className="w-12 h-12 rounded-2xl bg-[#1E6531] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Muốn thực đơn phù hợp riêng cho bạn?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nhập mục tiêu sức khỏe, mức độ vận động và các nguyên liệu dị ứng/loại trừ.
                Hệ thống sẽ gợi ý kế hoạch 21 bữa ăn chay cân bằng trong 7 ngày.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreatePersonalized}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1E6531] hover:bg-[#164e25] text-white text-sm font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <span>Tạo thực đơn cá nhân hóa</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  )
}

export default MealPlansPublic
