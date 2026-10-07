import React from 'react'
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { Activity, Sparkles, User } from 'lucide-react'
import type {
  ActivityLevel,
  BiologicalGender,
  BmiAnalysisResult,
  PersonalizationFormValues,
} from '../types/mealPlans.types'

interface BodyInfoFormCardProps {
  register: UseFormRegister<PersonalizationFormValues>
  setValue: UseFormSetValue<PersonalizationFormValues>
  gender: BiologicalGender
  activityLevel: ActivityLevel
  bmiAnalysis: BmiAnalysisResult
}

export const BodyInfoFormCard: React.FC<BodyInfoFormCardProps> = ({
  register,
  setValue,
  gender,
  activityLevel,
  bmiAnalysis,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm md:text-base">
            Thông tin cơ thể
          </h3>
        </div>

        <span className="text-xs text-gray-400 font-medium">Tự động tính BMI</span>
      </div>

      {/* Gender Toggle */}
      <div>
        <label className="text-xs font-bold text-gray-700 block mb-2">
          Giới tính sinh học
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setValue('gender', 'male')}
            className={`py-2 px-4 rounded-2xl text-xs font-bold transition-all border ${
              gender === 'male'
                ? 'bg-[#1E6531] text-white border-[#1E6531] shadow-xs'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Nam
          </button>
          <button
            type="button"
            onClick={() => setValue('gender', 'female')}
            className={`py-2 px-4 rounded-2xl text-xs font-bold transition-all border ${
              gender === 'female'
                ? 'bg-[#1E6531] text-white border-[#1E6531] shadow-xs'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Nữ
          </button>
        </div>
      </div>

      {/* Height, Weight, Age Inputs */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1">
            Chiều cao (cm)
          </label>
          <input
            type="number"
            {...register('heightCm', { valueAsNumber: true })}
            placeholder="170"
            className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1">
            Cân nặng (kg)
          </label>
          <input
            type="number"
            {...register('weightKg', { valueAsNumber: true })}
            placeholder="65"
            className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1">
            Tuổi
          </label>
          <input
            type="number"
            {...register('age', { valueAsNumber: true })}
            placeholder="28"
            className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Activity Level Cards */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 block">
          Mức độ vận động / Hoạt động thể chất
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Sedentary */}
          <div
            onClick={() => setValue('activityLevel', 'sedentary')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1 text-left ${
              activityLevel === 'sedentary'
                ? 'border-emerald-600 bg-[#EAF5EE] text-[#1E6531] shadow-xs'
                : 'border-slate-200/80 bg-white text-gray-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">Ít vận động</span>
              <Activity className="w-3.5 h-3.5 opacity-60" />
            </div>
            <p className="text-[11px] opacity-75 mt-0.5 leading-tight">
              Dưới 30 phút/ngày, ít hoặc không tập thể dục
            </p>
          </div>

          {/* Moderate */}
          <div
            onClick={() => setValue('activityLevel', 'moderate')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1 text-left ${
              activityLevel === 'moderate'
                ? 'border-emerald-600 bg-[#EAF5EE] text-[#1E6531] shadow-xs'
                : 'border-slate-200/80 bg-white text-gray-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">Hoạt động vừa</span>
              <Activity className="w-3.5 h-3.5 opacity-60" />
            </div>
            <p className="text-[11px] opacity-75 mt-0.5 leading-tight">
              30 - 60 phút/ngày, tập nhẹ/chạy bộ/yoga
            </p>
          </div>

          {/* Active */}
          <div
            onClick={() => setValue('activityLevel', 'active')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1 text-left ${
              activityLevel === 'active'
                ? 'border-emerald-600 bg-[#EAF5EE] text-[#1E6531] shadow-xs'
                : 'border-slate-200/80 bg-white text-gray-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">Hoạt động nhiều</span>
              <Activity className="w-3.5 h-3.5 opacity-60" />
            </div>
            <p className="text-[11px] opacity-75 mt-0.5 leading-tight">
              Trên 60 phút/ngày, vận động viên/gym cường độ cao
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Calculation Result Box matching Figma */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Chỉ số BMI:</span>
            <span className="text-lg font-extrabold text-gray-900 font-mono">
              {bmiAnalysis.bmi}
            </span>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border border-emerald-200/60 ${bmiAnalysis.categoryClass}`}
          >
            {bmiAnalysis.category}
          </span>
        </div>

        {/* BMI Range Pills */}
        <div className="grid grid-cols-3 gap-2 text-[10px] text-center font-semibold">
          <div
            className={`p-1.5 rounded-xl border ${
              bmiAnalysis.bmi < 18.5
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                : 'bg-white text-gray-400 border-gray-100'
            }`}
          >
            Thiếu cân: &lt; 18.5
          </div>
          <div
            className={`p-1.5 rounded-xl border ${
              bmiAnalysis.bmi >= 18.5 && bmiAnalysis.bmi <= 24.9
                ? 'bg-[#EAF5EE] text-[#1E6531] border-emerald-300 font-bold'
                : 'bg-white text-gray-400 border-gray-100'
            }`}
          >
            Bình thường: 18.5 - 24.9
          </div>
          <div
            className={`p-1.5 rounded-xl border ${
              bmiAnalysis.bmi > 24.9
                ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                : 'bg-white text-gray-400 border-gray-100'
            }`}
          >
            Thừa cân: &gt; 25.0
          </div>
        </div>

        {/* Note */}
        <div className="flex items-start gap-2 pt-1 text-[11px] text-gray-500 leading-relaxed">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <p>{bmiAnalysis.note}</p>
        </div>
      </div>
    </div>
  )
}
export default BodyInfoFormCard
