import React, { useState, useEffect } from 'react'
import {
  FileDown,
  Check,
  AlertCircle,
} from 'lucide-react'
import {
  getMealPlanDetail,
  swapMealInDetail,
  regenerateFullMealPlanDetail,
  saveMealPlanDetail,
  exportMealPlanPdf,
} from '../api/mealPlansApi'
import type {
  MealPlanDetailData,
  DayOfWeek,
  DietType,
} from '../types/mealPlans.types'
import { DietSchoolTabs } from '../components/DietSchoolTabs'
import { PersonalizationBadgeBar } from '../components/PersonalizationBadgeBar'
import { DetailDaySelector } from '../components/DetailDaySelector'
import { DetailedMealSlotCard } from '../components/DetailedMealSlotCard'
import { DetailRightSidebar } from '../components/DetailRightSidebar'
import { DetailWeeklyOverview } from '../components/DetailWeeklyOverview'
import { DetailBottomBar } from '../components/DetailBottomBar'
import { MealPlanSkeleton } from '../components/MealPlanSkeleton'

interface MealPlanDetailPageProps {
  onNavigate?: (path: string) => void
  planId?: string
}

export const MealPlanDetailPage: React.FC<MealPlanDetailPageProps> = ({
  onNavigate,
  planId,
}) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MealPlanDetailData | null>(null)
  const [activeDay, setActiveDay] = useState<DayOfWeek>('mon')
  const [activeDiet, setActiveDiet] = useState<DietType>('vegan')
  const [isSwapping, setIsSwapping] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Load detail data
  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await getMealPlanDetail(planId)
        if (isMounted) {
          setData(res)
          setActiveDay(res.activeDay)
          setActiveDiet(res.dietType)
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Không thể tải chi tiết thực đơn cá nhân hóa.',
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
  }, [planId])

  // Swap handler
  const handleSelectSwapOption = async (slotId: string, optionId: string) => {
    try {
      setIsSwapping(true)
      const updatedSlot = await swapMealInDetail(slotId, optionId)

      setData((prev) => {
        if (!prev) return prev
        const newMeals = prev.meals.map((m) =>
          m.id === slotId
            ? {
                ...updatedSlot,
                swapOptions: m.swapOptions?.map((opt) => ({
                  ...opt,
                  isSelected: opt.id === optionId,
                })),
              }
            : m,
        )
        return {
          ...prev,
          meals: newMeals,
        }
      })

      showToast(`Đã đổi sang món "${updatedSlot.title}" thành công!`)
    } catch {
      showToast('Có lỗi xảy ra khi đổi món. Vui lòng thử lại.')
    } finally {
      setIsSwapping(false)
    }
  }

  // Regenerate handler
  const handleRegenerateAll = async () => {
    try {
      setIsRegenerating(true)
      const refreshed = await regenerateFullMealPlanDetail()
      setData(refreshed)
      setIsSaved(false)
      showToast('Đã tính toán và tạo lại toàn bộ thực đơn theo hồ sơ của bạn!')
    } catch {
      showToast('Không thể tạo lại thực đơn. Vui lòng thử lại.')
    } finally {
      setIsRegenerating(false)
    }
  }

  // Save handler
  const handleSavePlan = async () => {
    if (!data) return
    try {
      setIsSaving(true)
      const res = await saveMealPlanDetail(data)
      setIsSaved(true)
      showToast(res.message)
    } catch {
      showToast('Có lỗi xảy ra khi lưu thực đơn.')
    } finally {
      setIsSaving(false)
    }
  }

  // Export PDF
  const handleExportPdf = async () => {
    try {
      setIsExporting(true)
      const filename = await exportMealPlanPdf(activeDiet)
      showToast(`Đã xuất và tải xuống: ${filename}`)
    } catch {
      showToast('Không thể tải PDF. Vui lòng thử lại.')
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return <MealPlanSkeleton />
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          Không thể tải chi tiết thực đơn
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {error || 'Hệ thống đang gặp sự cố kết nối, xin vui lòng thử lại sau.'}
        </p>
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-7 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-md animate-in slide-in-from-top-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Breadcrumb & Tag */}
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
          <button
            type="button"
            onClick={() => onNavigate?.('/meal-plans')}
            className="hover:text-emerald-700 transition-colors"
          >
            Thực đơn
          </button>
          <span>&gt;</span>
          <span className="font-semibold text-slate-800">
            Thực đơn Dinh dưỡng Chay Cá nhân hóa
          </span>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs self-start sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          <span>Cá nhân hóa BMI &amp; Tủ bếp</span>
        </div>
      </div>

      {/* 2. Header and PDF Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Thực đơn Dinh dưỡng Chay Cá nhân hóa
          </h1>
          <p className="mt-1 text-xs md:text-sm text-slate-500 max-w-3xl leading-relaxed">
            Kế hoạch bữa ăn được tính toán tối ưu cân bằng dưỡng chất, vi chất và tận dụng tối đa nguyên liệu tủ bếp của bạn.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportPdf}
          disabled={isExporting}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 disabled:opacity-60 transition-all shrink-0 self-start md:self-auto"
        >
          <FileDown className="h-4 w-4 text-slate-500" />
          <span>{isExporting ? 'Đang xuất PDF...' : 'Tải thực đơn PDF'}</span>
        </button>
      </div>

      {/* 3. 4 Diet School Tabs */}
      <DietSchoolTabs
        activeDiet={activeDiet}
        onSelectDiet={(diet) => {
          setActiveDiet(diet)
          showToast(`Đã chuyển sang chế độ "${diet}". Dinh dưỡng tự động điều chỉnh.`)
        }}
      />

      {/* 4. Personalization Bar */}
      <PersonalizationBadgeBar
        info={data.personalization}
        onEditClick={() => onNavigate?.('/meal-plans/setup')}
      />

      {/* 5. Day Selector with Kcal */}
      <DetailDaySelector
        activeDay={activeDay}
        dayCalories={data.dayCalories}
        onSelectDay={(day) => setActiveDay(day)}
      />

      {/* 6. Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Meal Slots (7 cols on lg, or 8) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {data.meals.map((meal) => (
            <DetailedMealSlotCard
              key={meal.id}
              meal={meal}
              onViewRecipe={(recipeId) =>
                onNavigate?.(recipeId ? `/recipes/${recipeId}` : '/recipes')
              }
              onSelectSwapOption={handleSelectSwapOption}
              isSwapping={isSwapping}
            />
          ))}
        </div>

        {/* Right Column: Sidebar (5 cols on lg, or 4) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <DetailRightSidebar
            nutrition={data.dailyNutrition}
            pantry={data.pantry}
            todayGroceries={data.todayGroceries}
            aiAdvice={data.aiAdvice}
            onAskAiClick={() => onNavigate?.('/ai-chat')}
          />
        </div>
      </div>

      {/* 7. Weekly 7-Day Overview */}
      <section className="pt-2">
        <DetailWeeklyOverview overview={data.weeklyOverview} />
      </section>

      {/* 8. Bottom Action Bar */}
      <section className="pt-2">
        <DetailBottomBar
          dietType={activeDiet}
          onRegenerateAll={handleRegenerateAll}
          onEditPreferences={() => onNavigate?.('/meal-plans/setup')}
          onSavePlan={handleSavePlan}
          isRegenerating={isRegenerating}
          isSaving={isSaving}
          isSaved={isSaved}
        />
      </section>
    </div>
  )
}
export default MealPlanDetailPage
