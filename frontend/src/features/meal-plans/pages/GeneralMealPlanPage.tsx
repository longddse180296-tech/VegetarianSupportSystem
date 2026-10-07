import React, { useEffect, useState } from 'react'
import {
  FileDown,
  Sliders,
  ChevronRight,
  AlertCircle,
  Check,
  Calendar,
} from 'lucide-react'
import type { DietType, GeneralMealPlanData, MealSlot } from '../types/mealPlans.types'
import {
  DIET_TABS,
  exportMealPlanPdf,
  getGeneralMealPlan,
  swapMeal,
} from '../api/mealPlansApi'
import { DietTabs } from '../components/DietTabs'
import { NutritionalBanner } from '../components/NutritionalBanner'
import { MealPlanCard } from '../components/MealPlanCard'
import { DailyNutritionCard } from '../components/DailyNutritionCard'
import { AiNutritionAdviceCard } from '../components/AiNutritionAdviceCard'
import { DailyShoppingCard } from '../components/DailyShoppingCard'
import { MealPlanSkeleton } from '../components/MealPlanSkeleton'

interface GeneralMealPlanPageProps {
  onNavigate?: (path: string) => void
}

export const GeneralMealPlanPage: React.FC<GeneralMealPlanPageProps> = ({
  onNavigate,
}) => {
  const [activeDiet, setActiveDiet] = useState<DietType>('vegan')
  const [planData, setPlanData] = useState<GeneralMealPlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await getGeneralMealPlan(activeDiet)
        if (isMounted) {
          setPlanData(res)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi khi tải thực đơn dinh dưỡng')
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
  }, [activeDiet])

  const handleSwapMeal = async (_mealId: string, slot: MealSlot) => {
    try {
      const newMeal = await swapMeal(activeDiet, slot)
      setPlanData((prev) => {
        if (!prev) return null
        return {
          ...prev,
          meals: prev.meals.map((m) => (m.slot === slot ? newMeal : m)),
        }
      })
      setToastMsg(`Đã đổi món mới cho ${newMeal.slotLabel}!`)
      setTimeout(() => setToastMsg(null), 3000)
    } catch {
      setError('Không thể đổi món, vui lòng thử lại sau.')
    }
  }

  const handleExportPdf = async () => {
    try {
      setIsExporting(true)
      const filename = await exportMealPlanPdf(activeDiet)
      setToastMsg(`Đã tạo file "${filename}" thành công!`)
      setTimeout(() => setToastMsg(null), 3000)
    } catch {
      setError('Lỗi khi tải file PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      {/* 1. Breadcrumb matching Figma */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <button
          type="button"
          onClick={() => onNavigate?.('/')}
          className="hover:text-emerald-700 transition-colors"
        >
          Trang chủ
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-700">Thực đơn</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-emerald-700 font-bold">Thực đơn theo chế độ ăn</span>
      </nav>

      {/* 2. Page Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Thực đơn dinh dưỡng chay khoa học
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Khám phá kế hoạch bữa ăn được tính toán cân bằng dinh dưỡng, vi chất và tỷ lệ thực vật tối ưu theo từng trường phái ăn chay.
          </p>
        </div>

        {/* Top Right Actions matching Figma */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate?.('/meal-plans/my-plan')}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Thực đơn của bạn</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs disabled:opacity-50"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>{isExporting ? 'Đang xuất PDF...' : 'Tải thực đơn PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate?.('/meal-plans/recommended')}
            className="px-4 py-2.5 rounded-2xl bg-[#1E6531] hover:bg-[#164e25] text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Sliders className="w-4 h-4" />
            <span>Tùy biến theo BMI</span>
          </button>
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
            onClick={() => setActiveDiet(activeDiet)}
            className="font-bold underline ml-3"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 3. Diet School Selection Tabs */}
      <DietTabs
        tabs={DIET_TABS}
        activeTab={activeDiet}
        onTabChange={setActiveDiet}
      />

      {/* Loading Skeleton */}
      {loading ? (
        <MealPlanSkeleton />
      ) : planData ? (
        <>
          {/* 4. Nutritional Characteristic Banner */}
          <NutritionalBanner characteristic={planData.characteristic} />

          {/* 5. Main 2-Column Layout matching Figma */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column (2 Cols): Meals List */}
            <div className="lg:col-span-2 space-y-5">
              {/* Meals List Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                    Kế hoạch 4 bữa trong ngày
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF5EE] text-[#1E6531]">
                    100% Plant-Based
                  </span>
                </div>

                <span className="text-xs text-gray-400">
                  Tổng cộng: 4 món chính & phụ
                </span>
              </div>

              {/* 4 Meal Cards */}
              <div className="space-y-4">
                {planData.meals.map((meal) => (
                  <MealPlanCard
                    key={meal.id}
                    meal={meal}
                    onSwap={(id, slot) => handleSwapMeal(id, slot)}
                    onViewRecipe={() => onNavigate?.('/recipes')}
                  />
                ))}
              </div>
            </div>

            {/* Right Column (1 Col): Summaries and Sidecards */}
            <div className="space-y-5 sticky top-24">
              {/* Daily Nutrition Macro Card */}
              <DailyNutritionCard summary={planData.macroSummary} />

              {/* AI Nutrition Assistant Card */}
              <AiNutritionAdviceCard
                advice={planData.aiAdvice}
                onOpenAiChat={() => onNavigate?.('/ai-chat')}
              />

              {/* Daily Shopping Checklist */}
              <DailyShoppingCard initialItems={planData.shoppingList} />
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80">
          <p className="text-slate-500 text-sm">Không tìm thấy thông tin thực đơn.</p>
        </div>
      )}
    </div>
  )
}
export default GeneralMealPlanPage
