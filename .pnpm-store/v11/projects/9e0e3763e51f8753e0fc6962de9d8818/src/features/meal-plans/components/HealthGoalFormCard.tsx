import React from 'react'
import type { UseFormSetValue } from 'react-hook-form'
import { Check, Target, TrendingDown, Dumbbell, Sparkles } from 'lucide-react'
import type { HealthGoal, PersonalizationFormValues } from '../types/mealPlans.types'

interface HealthGoalFormCardProps {
  currentGoal: HealthGoal
  setValue: UseFormSetValue<PersonalizationFormValues>
}

export const HealthGoalFormCard: React.FC<HealthGoalFormCardProps> = ({
  currentGoal,
  setValue,
}) => {
  const goals: {
    id: HealthGoal
    title: string
    description: string
    icon: React.ReactNode
  }[] = [
    {
      id: 'maintain',
      title: 'Duy trì cân nặng',
      description: 'Giữ mức năng lượng ổn định hàng ngày với vi chất tối ưu',
      icon: <Target className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'weight-loss',
      title: 'Giảm cân khoa học',
      description: 'Thâm hụt calo lành mạnh, giàu chất xơ, hạn chế đói',
      icon: <TrendingDown className="w-4 h-4 text-teal-600" />,
    },
    {
      id: 'muscle-gain',
      title: 'Tăng cơ & Thể lực',
      description: 'Tập trung đạm thực vật chất lượng cao hỗ trợ phát triển cơ bắp',
      icon: <Dumbbell className="w-4 h-4 text-emerald-700" />,
    },
    {
      id: 'detox',
      title: 'Thanh lọc cơ thể',
      description: 'Ưu tiên rau củ quả tươi, hỗ trợ tiêu hóa và đào thải độc tố',
      icon: <Sparkles className="w-4 h-4 text-lime-600" />,
    },
  ]

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-sm md:text-base">
          Mục tiêu của bạn
        </h3>
        <span className="text-xs text-gray-400 font-medium">Chọn 1 mục tiêu</span>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {goals.map((g) => {
          const isSelected = currentGoal === g.id

          return (
            <div
              key={g.id}
              onClick={() => setValue('goal', g.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 text-left ${
                isSelected
                  ? 'border-emerald-600 bg-[#EAF5EE] text-[#1E6531] shadow-xs'
                  : 'border-slate-200/80 bg-white text-gray-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-white shadow-xs flex items-center justify-center">
                    {g.icon}
                  </div>
                  <span className="font-bold text-xs">{g.title}</span>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <p className="text-[11px] opacity-75 leading-relaxed">
                {g.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default HealthGoalFormCard
