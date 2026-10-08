import React, { useEffect, useState } from 'react'
import {
  ChevronRight,
  Sparkles,
  Check,
  X,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../../auth'
import type {
  DayOfWeek,
  MealReplacementOption,
  RecommendedMealItem,
  RecommendedMealPlanData,
} from '../types/mealPlans.types'
import {
  getRecommendedMealPlan,
  regenerateRecommendedPlan,
  saveRecommendedPlan,
  swapRecommendedMeal,
} from '../api/mealPlansApi'
import { PersonalizationInfoCard } from '../components/PersonalizationInfoCard'
import { DaySelectorTabs } from '../components/DaySelectorTabs'
import { RecommendedMealCard } from '../components/RecommendedMealCard'
import { MealReplacementPanel } from '../components/MealReplacementPanel'
import { RecommendedNutritionSummaryCard } from '../components/RecommendedNutritionSummaryCard'
import { WeeklyOverviewSection } from '../components/WeeklyOverviewSection'
import { MealPlanSkeleton } from '../components/MealPlanSkeleton'

interface RecommendedMealPlanPageProps {
  onNavigate?: (path: string) => void
}

export const RecommendedMealPlanPage: React.FC<RecommendedMealPlanPageProps> = ({
  onNavigate,
}) => {
  const { isAuthenticated } = useAuth()
  const [planData, setPlanData] = useState<RecommendedMealPlanData | null>(null)
  const [activeDay, setActiveDay] = useState<DayOfWeek>('mon')
  const [loading, setLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showSaveBanner, setShowSaveBanner] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Swapping state: tracks currently active meal for replacement
  const [activeSwapMeal, setActiveSwapMeal] = useState<RecommendedMealItem | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await getRecommendedMealPlan()
        if (isMounted) {
          setPlanData(res)
          // Default active swap to lunch if available
          const currentDayObj = res.days.find((d) => d.dayId === res.activeDay)
          const lunchMeal = currentDayObj?.meals.find((m) => m.slot === 'lunch')
          if (lunchMeal) {
            setActiveSwapMeal(lunchMeal)
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi khi tải thực đơn đề xuất')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchData()
    return () => {
      isMounted = false
    }
  }, [])

  const currentDayPlan = planData?.days.find((d) => d.dayId === activeDay) || planData?.days[0]

  const handleSelectDay = (dayId: DayOfWeek) => {
    setActiveDay(dayId)
    setActiveSwapMeal(null) // reset swap panel on day switch
  }

  const handleToggleSwap = (meal: RecommendedMealItem) => {
    if (activeSwapMeal?.id === meal.id) {
      setActiveSwapMeal(null)
    } else {
      setActiveSwapMeal(meal)
    }
  }

  const handleApplyReplacement = async (option: MealReplacementOption) => {
    if (!activeSwapMeal) return
    try {
      const updatedMeal = await swapRecommendedMeal(activeDay, activeSwapMeal.id, option)
      setPlanData((prev) => {
        if (!prev) return null
        return {
          ...prev,
          days: prev.days.map((d) => {
            if (d.dayId !== activeDay) return d
            return {
              ...d,
              meals: d.meals.map((m) => (m.id === activeSwapMeal.id ? updatedMeal : m)),
            }
          }),
        }
      })
      setActiveSwapMeal(null)
      setToastMsg(`Đã đổi sang "${option.title}" thành công!`)
      setTimeout(() => setToastMsg(null), 3000)
    } catch {
      setError('Lỗi khi đổi món.')
    }
  }

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true)
      const res = await regenerateRecommendedPlan()
      setPlanData(res)
      setToastMsg('Đã tạo lại toàn bộ thực đơn 7 ngày mới!')
      setTimeout(() => setToastMsg(null), 3000)
    } catch {
      setError('Không thể tạo lại thực đơn.')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleSavePlan = async () => {
    if (!isAuthenticated) {
      setToastMsg('Vui lòng đăng nhập để lưu thực đơn vào tài khoản.')
      setTimeout(() => {
        onNavigate?.('/login')
      }, 800)
      return
    }
    try {
      await saveRecommendedPlan()
      setIsSaved(true)
      setShowSaveBanner(true)
      setToastMsg('Đã lưu thực đơn thành công! Đang chuyển đến Thực đơn của bạn...')
      setTimeout(() => {
        onNavigate?.('/meal-plans')
      }, 1000)
    } catch {
      setError('Lỗi khi lưu thực đơn.')
    }
  }

  // Get replacements for active swap meal
  const currentReplacementOptions =
    (activeSwapMeal && planData?.replacements[activeSwapMeal.id]) ||
    (planData && Object.values(planData.replacements)[0]) ||
    []

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      {/* 1. Top Save Success Banner matching Figma */}
      {showSaveBanner && (
        <div className="p-4 bg-[#EAF5EE] rounded-3xl border border-emerald-200 shadow-xs flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-[#1E6531] leading-tight">
              Đã lưu thực đơn thành công! Bạn có thể xem lại bất kỳ lúc nào trong mục Thực đơn của bạn.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate?.('/meal-plans/my-plan')}
              className="text-xs font-bold text-[#1E6531] hover:underline flex items-center gap-1"
            >
              <span>Xem thực đơn của tôi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowSaveBanner(false)}
              className="p-1 text-emerald-600 hover:text-emerald-900 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Breadcrumbs & Badges */}
      <div className="space-y-2">
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <button
            type="button"
            onClick={() => onNavigate?.('/')}
            className="hover:text-emerald-700 transition-colors"
          >
            Trang chủ
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <button
            type="button"
            onClick={() => onNavigate?.('/meal-plans')}
            className="hover:text-emerald-700 transition-colors"
          >
            Thực đơn
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-emerald-700 font-bold">Thực đơn đề xuất</span>
        </nav>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#EAF5EE] text-[#1E6531] border border-emerald-200">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>Được cá nhân hóa theo BMI & Dị ứng</span>
        </span>
      </div>

      {/* 3. Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Thực đơn được đề xuất cho bạn
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Dựa trên thông tin cơ thể, mục tiêu, nguyên liệu và sở thích của bạn, hệ thống đã tạo một kế hoạch bữa ăn chay trong 7 ngày.
        </p>

        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium">
          <span>💡</span>
          <span>Gợi ý: Bạn có thể đổi từng món ăn nếu muốn trước khi lưu thực đơn chính thức.</span>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void handleRegenerate()}
            className="font-bold underline ml-3"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <MealPlanSkeleton />
      ) : planData ? (
        <div className="space-y-8">
          {/* 4. User Personalization Parameters Card */}
          <PersonalizationInfoCard
            info={planData.userInfo}
            onEdit={() => onNavigate?.('/meal-plans/setup')}
          />

          {/* 5. 7-Day Selector Tabs & Action Bar */}
          <DaySelectorTabs
            days={planData.days}
            activeDay={activeDay}
            onSelectDay={handleSelectDay}
            onRegenerate={() => void handleRegenerate()}
            onEditProfile={() => onNavigate?.('/meal-plans/setup')}
            onSavePlan={() => void handleSavePlan()}
            isRegenerating={isRegenerating}
            isSaved={isSaved}
          />

          {/* 6. Daily Meals Grid (3 Cards matching Figma) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {currentDayPlan?.meals.map((meal) => (
              <RecommendedMealCard
                key={meal.id}
                meal={meal}
                isSwappingActive={activeSwapMeal?.id === meal.id}
                onToggleSwap={handleToggleSwap}
                onViewRecipe={() => onNavigate?.('/recipes')}
              />
            ))}
          </div>

          {/* 7. Interactive Replacement Panel (opens when a meal is chosen for swap) */}
          {activeSwapMeal && (
            <MealReplacementPanel
              currentMeal={activeSwapMeal}
              options={currentReplacementOptions}
              onSelectReplacement={handleApplyReplacement}
              onClose={() => setActiveSwapMeal(null)}
              onExploreMore={() => onNavigate?.('/recipes')}
            />
          )}

          {/* 8. Nutritional & Pantry Utilization Summary */}
          <RecommendedNutritionSummaryCard
            nutrition={planData.nutritionSummary}
            pantry={planData.pantryUtilization}
          />

          {/* 9. Weekly 7-Day Overview & AI Explanation */}
          <WeeklyOverviewSection
            overview={planData.weeklyOverview}
            aiExplanation={planData.aiExplanation}
          />
        </div>
      ) : null}
    </div>
  )
}
export default RecommendedMealPlanPage
