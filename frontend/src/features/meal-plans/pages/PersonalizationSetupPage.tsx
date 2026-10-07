import React, { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sparkles,
  ChevronRight,
  RotateCcw,
  Check,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import type {
  GeneratedPersonalizedPlan,
  PersonalizationFormValues,
} from '../types/mealPlans.types'
import {
  calculateBmiAndCalories,
  getDefaultPersonalizationValues,
  saveRecommendedPlan,
  submitPersonalizationPreferences,
} from '../api/mealPlansApi'
import { SetupStepper } from '../components/SetupStepper'
import { BodyInfoFormCard } from '../components/BodyInfoFormCard'
import { HealthGoalFormCard } from '../components/HealthGoalFormCard'
import { PantrySelectionFormCard } from '../components/PantrySelectionFormCard'
import { DietPreferenceFormCard } from '../components/DietPreferenceFormCard'
import { PersonalizationPreviewSection } from '../components/PersonalizationPreviewSection'

const personalizationSchema = z.object({
  gender: z.enum(['male', 'female']),
  heightCm: z.number().min(100, 'Chiều cao tối thiểu 100cm').max(250, 'Chiều cao tối đa 250cm'),
  weightKg: z.number().min(30, 'Cân nặng tối thiểu 30kg').max(250, 'Cân nặng tối đa 250kg'),
  age: z.number().min(10, 'Tuổi tối thiểu 10').max(120, 'Tuổi tối đa 120'),
  activityLevel: z.enum(['sedentary', 'moderate', 'active']),
  goal: z.enum(['maintain', 'weight-loss', 'muscle-gain', 'detox']),
  dietType: z.enum(['vegan', 'lacto', 'ovo', 'lacto-ovo']),
  availableIngredients: z.array(z.string()),
  allergens: z.array(z.string()),
  preferences: z.array(z.string()),
})

interface PersonalizationSetupPageProps {
  onNavigate?: (path: string) => void
}

export const PersonalizationSetupPage: React.FC<PersonalizationSetupPageProps> = ({
  onNavigate,
}) => {
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPersonalizedPlan | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const defaultValues = useMemo(() => getDefaultPersonalizationValues(), [])

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
  } = useForm<PersonalizationFormValues>({
    resolver: zodResolver(personalizationSchema),
    defaultValues,
  })

  // Watch fields reactively
  const watchedGender = useWatch({ control, name: 'gender' }) || 'male'
  const watchedHeight = useWatch({ control, name: 'heightCm' }) || 170
  const watchedWeight = useWatch({ control, name: 'weightKg' }) || 65
  const watchedAge = useWatch({ control, name: 'age' }) || 28
  const watchedActivity = useWatch({ control, name: 'activityLevel' }) || 'moderate'
  const watchedGoal = useWatch({ control, name: 'goal' }) || 'maintain'
  const watchedDiet = useWatch({ control, name: 'dietType' }) || 'vegan'
  const watchedIngredients = useWatch({ control, name: 'availableIngredients' }) || []
  const watchedAllergens = useWatch({ control, name: 'allergens' }) || []
  const watchedPreferences = useWatch({ control, name: 'preferences' }) || []

  // Real-time BMI and calorie calculation
  const bmiAnalysis = useMemo(() => {
    return calculateBmiAndCalories(
      watchedHeight,
      watchedWeight,
      watchedAge,
      watchedGender,
      watchedActivity,
      watchedGoal
    )
  }, [watchedHeight, watchedWeight, watchedAge, watchedGender, watchedActivity, watchedGoal])

  // Form submission handler
  const onSubmit = async (data: PersonalizationFormValues) => {
    try {
      setIsGenerating(true)
      setErrorMsg(null)
      const res = await submitPersonalizationPreferences(data)
      setGeneratedPlan(res)
      setToastMsg('Đã tạo thực đơn cá nhân hóa thành công!')
      setTimeout(() => setToastMsg(null), 3000)
    } catch {
      setErrorMsg('Không thể tạo thực đơn cá nhân hóa. Vui lòng thử lại.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReset = () => {
    reset(defaultValues)
    setGeneratedPlan(null)
    setToastMsg('Đã khôi phục các giá trị mặc định.')
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleSaveWeek = async () => {
    await saveRecommendedPlan()
    setToastMsg('Đã lưu toàn bộ thực đơn tuần vào mục cá nhân!')
    setTimeout(() => setToastMsg(null), 3000)
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      {/* 1. Breadcrumbs */}
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
        <span className="text-emerald-700 font-bold">Cá nhân hóa</span>
      </nav>

      {/* 2. Page Header & Standard Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Lập thực đơn cá nhân hóa
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Trả lời một số câu hỏi về thể trạng, mục tiêu sức khỏe và nguyên liệu bạn đang có.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EAF5EE] text-[#1E6531] border border-emerald-200/80 self-start md:self-auto shrink-0">
          Hệ thống tính toán theo chuẩn Viện Dinh Dưỡng
        </span>
      </div>

      {/* 3. Stepper Progress matching Figma */}
      <SetupStepper />

      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4. Main 2-Column Form Layout matching Figma */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 items-start">
          {/* Left Column: Thông tin cơ thể + Mục tiêu của bạn */}
          <div className="space-y-7">
            <BodyInfoFormCard
              register={register}
              setValue={setValue}
              gender={watchedGender}
              activityLevel={watchedActivity}
              bmiAnalysis={bmiAnalysis}
            />

            <HealthGoalFormCard
              currentGoal={watchedGoal}
              setValue={setValue}
            />
          </div>

          {/* Right Column: Nguyên liệu bạn đang có + Phân loại ăn chay, dị ứng, sở thích */}
          <div className="space-y-7">
            <PantrySelectionFormCard
              availableIngredients={watchedIngredients}
              setValue={setValue}
            />

            <DietPreferenceFormCard
              dietType={watchedDiet}
              allergens={watchedAllergens}
              preferences={watchedPreferences}
              setValue={setValue}
            />
          </div>
        </div>

        {/* 5. Generation CTA Bar matching Figma */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Sẵn sàng cá nhân hóa thực đơn?
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Hệ thống sẽ ghép nguyên liệu &amp; tính toán chuẩn dinh dưỡng chỉ cho bạn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
              <span>Đặt lại</span>
            </button>

            <button
              type="submit"
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-2xl bg-[#1E6531] hover:bg-[#164e25] disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>{isGenerating ? 'Đang tính toán...' : 'Tạo thực đơn tuần'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* 6. Detailed Live Preview of Generated Plan */}
      {generatedPlan && (
        <PersonalizationPreviewSection
          plan={generatedPlan}
          onSaveWeek={handleSaveWeek}
          onLoginClick={() => onNavigate?.('/auth/login')}
          onViewRecipe={() => onNavigate?.('/recipes')}
        />
      )}
    </div>
  )
}
export default PersonalizationSetupPage
