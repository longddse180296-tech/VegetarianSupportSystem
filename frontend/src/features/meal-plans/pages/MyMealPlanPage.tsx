import React, { useState, useEffect } from 'react'
import { Calendar, Check, AlertCircle, Lock, Plus } from 'lucide-react'
import { useAuth } from '../../auth'
import {
  getMyWeeklyMealPlan,
  swapWeeklyMeal,
  applySavedPlanToWeekly,
  exportWeeklyShoppingList,
} from '../api/mealPlansApi'
import type {
  MyWeeklyPlanData,
  DayOfWeek,
  WeeklyCalendarDay,
} from '../types/mealPlans.types'
import { MyPlanBanner } from '../components/MyPlanBanner'
import { WeeklyCalendarHeader } from '../components/WeeklyCalendarHeader'
import { WeeklyMealCard } from '../components/WeeklyMealCard'
import { BmiNutritionOverview } from '../components/BmiNutritionOverview'
import { SavedPlansSection } from '../components/SavedPlansSection'
import { WeeklyProTipCard } from '../components/WeeklyProTipCard'
import { ShoppingListModal } from '../components/ShoppingListModal'
import { AiImportModal } from '../components/AiImportModal'
import { MealPlanSkeleton } from '../components/MealPlanSkeleton'

interface MyMealPlanPageProps {
  onNavigate?: (path: string) => void
}

export const MyMealPlanPage: React.FC<MyMealPlanPageProps> = ({
  onNavigate,
}) => {
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<MyWeeklyPlanData | null>(null)
  const [activeDay, setActiveDay] = useState<DayOfWeek>('mon')
  const [swappingMealId, setSwappingMealId] = useState<string | null>(null)
  const [applyingPlanId, setApplyingPlanId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Modals state
  const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Load weekly plan
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await getMyWeeklyMealPlan()
        if (isMounted) {
          setData(res)
          setActiveDay(res.activeDay)
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Không thể tải dữ liệu kế hoạch tuần.',
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void fetchData()
    return () => {
      isMounted = false
    }
  }, [isAuthenticated])

  // Swap meal handler
  const handleSwapMeal = async (mealId: string) => {
    if (!data) return
    try {
      setSwappingMealId(mealId)
      const newMeal = await swapWeeklyMeal(activeDay, mealId)

      setData((prev) => {
        if (!prev) return prev
        const updatedDays = prev.days.map((day) => {
          if (day.id !== activeDay) return day
          return {
            ...day,
            meals: day.meals.map((m) => (m.id === mealId ? newMeal : m)),
          }
        })
        return {
          ...prev,
          days: updatedDays,
        }
      })

      showToast(`Đã đổi sang món "${newMeal.title}" thành công!`)
    } catch {
      showToast('Có lỗi xảy ra khi đổi món. Vui lòng thử lại.')
    } finally {
      setSwappingMealId(null)
    }
  }

  // Swap first meal shortcut
  const handleSwapFirstMeal = () => {
    const activeDayData = data?.days.find((d) => d.id === activeDay)
    if (activeDayData && activeDayData.meals.length > 0) {
      void handleSwapMeal(activeDayData.meals[0].id)
    }
  }

  // Apply saved plan
  const handleApplySavedPlan = async (planId: string) => {
    try {
      setApplyingPlanId(planId)
      const res = await applySavedPlanToWeekly(planId)
      const updated = await getMyWeeklyMealPlan()
      setData(updated)
      showToast(res.message)
    } catch {
      showToast('Có lỗi xảy ra khi áp dụng thực đơn.')
    } finally {
      setApplyingPlanId(null)
    }
  }

  // Export shopping list
  const handleExportShoppingList = async () => {
    if (!data) return
    try {
      setIsExporting(true)
      const res = await exportWeeklyShoppingList(data.weekRange)
      showToast(res.message)
      setIsShoppingModalOpen(true)
    } catch {
      showToast('Không thể xuất danh sách. Vui lòng thử lại.')
    } finally {
      setIsExporting(false)
    }
  }

  // ─── 1. Auth Gate for Guest ──────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 animate-in fade-in duration-200">
        <div className="max-w-md mx-auto text-center bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Đăng nhập để xem Thực đơn của bạn
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Kế hoạch ăn chay 7 ngày, đổi món và danh sách mua sắm được cá nhân hóa cho từng tài khoản. Hãy đăng nhập để truy cập hoặc tạo thực đơn mới.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate?.('/recipes')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Khám phá món chay
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('/auth/login')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#1E6531] hover:bg-[#164e25] text-white text-xs font-bold transition-colors shadow-sm"
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── 2. Loading State ───────────────────────────────────────────────────
  if (loading) {
    return <MealPlanSkeleton />
  }

  // ─── 3. Error or Empty State ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center space-y-4 animate-in fade-in duration-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          Không thể tải kế hoạch thực đơn
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-[#184d28] px-5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-[#123e1f]"
        >
          Tải lại trang
        </button>
      </div>
    )
  }

  if (!data || data.days.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center space-y-5 animate-in fade-in duration-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EAF5EE] text-[#1E6531] shadow-xs">
          <Calendar className="h-8 w-8" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h2 className="text-xl font-extrabold text-slate-900">
            Bạn chưa có thực đơn cá nhân hóa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Hãy thiết lập chỉ số cơ thể, mục tiêu và tủ bếp để hệ thống gợi ý thực đơn 7 ngày phù hợp nhất cho bạn.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.('/meal-plans/setup')}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#1E6531] hover:bg-[#164e25] px-6 py-3 text-xs font-bold text-white shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo thực đơn cá nhân hóa ngay</span>
        </button>
      </div>
    )
  }

  const activeDayData: WeeklyCalendarDay | undefined = data.days.find(
    (d) => d.id === activeDay,
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-md animate-in slide-in-from-top-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Breadcrumb & Week Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <button
            type="button"
            onClick={() => onNavigate?.('/recipes')}
            className="hover:text-emerald-700 transition-colors"
          >
            Trang chủ
          </button>
          <span>&gt;</span>
          <span className="font-semibold text-slate-800">Thực đơn</span>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs self-start sm:self-auto">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          <span>Tuần hiện tại: {data.weekRange}</span>
        </div>
      </div>

      {/* Main Page Title and Subtitle with Link to General Guide */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Thực đơn của bạn
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Quản lý kế hoạch bữa ăn chay hằng tuần và tạo thực đơn phù hợp với mục tiêu của bạn.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.('/meal-plans/discover')}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-700 active:scale-95 transition-all"
        >
          <span>Khám phá thực đơn chuẩn</span>
          <span className="text-slate-400">&rarr;</span>
        </button>
      </div>

      {/* Top Emerald Banner */}
      <MyPlanBanner
        onCreateNewPlan={() => onNavigate?.('/meal-plans/setup')}
        onOpenAiImport={() => setIsAiModalOpen(true)}
      />

      {/* Section 1: Weekly Calendar & Day Slots */}
      <section className="space-y-5">
        <WeeklyCalendarHeader
          weekRange={data.weekRange}
          days={data.days}
          activeDay={activeDay}
          onSelectDay={(dayId) => setActiveDay(dayId)}
          onSwapMeal={handleSwapFirstMeal}
          onExportShoppingList={() => setIsShoppingModalOpen(true)}
          onEditWeek={() => onNavigate?.('/meal-plans/setup')}
          isExportingShoppingList={isExporting}
        />

        {/* 3 Meal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeDayData?.meals.map((meal) => (
            <WeeklyMealCard
              key={meal.id}
              meal={meal}
              onViewRecipe={(recipeId) =>
                onNavigate?.(recipeId ? `/recipes/${recipeId}` : '/recipes')
              }
              onSwapMeal={handleSwapMeal}
              isSwapping={swappingMealId === meal.id}
            />
          ))}
        </div>
      </section>

      {/* Section 2: Reference BMI Nutrition Overview */}
      <section className="pt-2">
        <BmiNutritionOverview metrics={data.bmiMetrics} />
      </section>

      {/* Section 3: Saved Meal Plans & History */}
      <section className="pt-2">
        <SavedPlansSection
          savedPlans={data.savedPlans}
          onViewPlanDetail={(planId) =>
            onNavigate?.(`/meal-plans/detail/${planId}`)
          }
          onApplyPlan={handleApplySavedPlan}
          applyingPlanId={applyingPlanId}
        />
      </section>

      {/* Section 4: Pro Tip Box */}
      <section className="pt-2">
        <WeeklyProTipCard
          proTip={data.proTip}
          onActionClick={() => onNavigate?.('/articles')}
        />
      </section>

      {/* Modals */}
      <ShoppingListModal
        isOpen={isShoppingModalOpen}
        onClose={() => setIsShoppingModalOpen(false)}
        weekRange={data.weekRange}
        onDownloadPdf={handleExportShoppingList}
      />

      <AiImportModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onImportPrompt={(prompt) => {
          showToast(`Đã nhận chỉ dẫn từ AI: "${prompt.slice(0, 30)}..."`)
          onNavigate?.('/meal-plans/setup')
        }}
        onNavigateToAiChat={() => onNavigate?.('/ai-chat')}
      />
    </div>
  )
}
