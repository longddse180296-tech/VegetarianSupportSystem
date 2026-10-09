import React from 'react'
import {
  Activity,
  Flame,
  Target,
  Scale,
  Ruler,
  Sparkles,
  Info,
  HeartPulse,
  Dumbbell,
  UserCheck,
} from 'lucide-react'
import type { BodyMetrics, GoalType, GenderType, ActivityLevel } from '../types'
import { calculateAllMetrics } from '../api/profileApi'
import { Select } from '../../../shared/components'

interface BodyMetricsCalculatorProps {
  metrics: BodyMetrics
  onChange: (metrics: BodyMetrics) => void
  preferredProteins: string[]
  disabled?: boolean
}

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  {
    value: 'sedentary',
    label: 'Ít vận động (Hệ số x1.2)',
    desc: 'Làm việc văn phòng, ít hoặc hầu như không tập thể dục',
  },
  {
    value: 'light',
    label: 'Vận động nhẹ (Hệ số x1.375)',
    desc: 'Tập thể thao nhẹ nhàng 1 - 3 buổi mỗi tuần',
  },
  {
    value: 'moderate',
    label: 'Vừa phải (Hệ số x1.55)',
    desc: 'Luyện tập thể dục thể thao 3 - 5 buổi mỗi tuần',
  },
  {
    value: 'active',
    label: 'Năng động (Hệ số x1.725)',
    desc: 'Vận động cường độ cao 6 - 7 ngày mỗi tuần',
  },
  {
    value: 'very_active',
    label: 'Rất năng động (Hệ số x1.9)',
    desc: 'Vận động viên hoặc lao động thể lực nặng 2 lần/ngày',
  },
]

const GOAL_OPTIONS: { value: GoalType; label: string; desc: string }[] = [
  {
    value: 'maintain',
    label: 'Duy trì cân nặng & Tăng cường sinh lực',
    desc: 'Giữ năng lượng ổn định, cân bằng dinh dưỡng thuần thực vật',
  },
  {
    value: 'weight_loss',
    label: 'Giảm mỡ & Thanh lọc cơ thể khoa học',
    desc: 'Thâm hụt 400 kcal/ngày, tăng cường chất xơ và đạm để giữ cơ',
  },
  {
    value: 'muscle_gain',
    label: 'Tăng cơ thuần chay (High-Protein Vegan)',
    desc: 'Dư thừa 350 kcal/ngày, nạp 1.8 - 2.0g protein/kg cân nặng',
  },
  {
    value: 'general_health',
    label: 'Sức khỏe tổng quát & Tiêu hóa khỏe mạnh',
    desc: 'Tối ưu vi chất dinh dưỡng, cân bằng hệ vi sinh đường ruột',
  },
]

export const BodyMetricsCalculator: React.FC<BodyMetricsCalculatorProps> = ({
  metrics,
  onChange,
  preferredProteins,
  disabled = false,
}) => {
  const currentAge = metrics.age || 26
  const currentGender = metrics.gender || 'female'
  const currentActivity = metrics.activityLevel || 'moderate'
  const currentHeight = metrics.heightCm || 165
  const currentWeight = metrics.weightKg || 52
  const currentGoal = metrics.goal || 'maintain'

  const updateMetrics = (
    newAge: number,
    newGender: GenderType,
    newHeight: number,
    newWeight: number,
    newActivity: ActivityLevel,
    newGoal: GoalType,
  ) => {
    const updated = calculateAllMetrics(
      newAge,
      newGender,
      newHeight,
      newWeight,
      newActivity,
      newGoal,
    )
    onChange(updated)
  }

  const getBMIBadge = () => {
    switch (metrics.bmiCategory) {
      case 'underweight':
        return {
          label: 'Thiếu cân (< 18.5)',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          advice: 'Khuyến nghị bổ sung các bữa phụ giàu hạt dinh dưỡng và đạm thực vật.',
        }
      case 'normal':
        return {
          label: 'Chuẩn lý tưởng (18.5 - 22.9)',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          advice: 'Thể trạng rất cân đối theo chuẩn Á Đông! Hãy tiếp tục duy trì chế độ hiện tại.',
        }
      case 'overweight':
        return {
          label: 'Thừa cân (23.0 - 24.9)',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          advice: 'Nên ưu tiên thực đơn thanh đạm, giảm dầu mỡ và tăng cường vận động nhẹ.',
        }
      case 'obese':
        return {
          label: 'Béo phì (≥ 25.0)',
          color: 'bg-rose-100 text-rose-800 border-rose-200',
          advice: 'Khuyến nghị áp dụng thực đơn thâm hụt calo khoa học và theo dõi chỉ số định kỳ.',
        }
    }
  }

  const bmiBadge = getBMIBadge()
  // Bar scale: 15 to 30 BMI
  const bmiPercentage = Math.min(Math.max(((metrics.bmi - 15) / 15) * 100, 4), 96)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">
            Chỉ số Thể trạng &amp; Nhu cầu Năng lượng Cá nhân
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <HeartPulse className="w-3.5 h-3.5" />
          <span>Chuẩn dinh dưỡng Á Đông</span>
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Hệ thống ứng dụng công thức khoa học <strong>Mifflin-St Jeor</strong> để ước tính năng lượng tiêu hao (TDEE)
        và phân bổ vi chất cần thiết đồng bộ cho việc xây dựng thực đơn 7 ngày và Trợ lý AI.
      </p>

      {/* Primary Input Grid: Gender, Age, Height, Weight, Activity, Goal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90">
        {/* Gender Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Giới tính sinh học</span>
            <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 h-11">
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                updateMetrics(
                  currentAge,
                  'male',
                  currentHeight,
                  currentWeight,
                  currentActivity,
                  currentGoal,
                )
              }
              className={`rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                currentGender === 'male'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>Nam</span>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                updateMetrics(
                  currentAge,
                  'female',
                  currentHeight,
                  currentWeight,
                  currentActivity,
                  currentGoal,
                )
              }
              className={`rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                currentGender === 'female'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>Nữ</span>
            </button>
          </div>
          <span className="text-[10px] text-slate-500">Dùng trong công thức tính chuyển hóa cơ bản (BMR)</span>
        </div>

        {/* Age Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-age" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <span>Tuổi</span>
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              id="user-age"
              type="number"
              min={15}
              max={100}
              value={currentAge}
              disabled={disabled}
              onChange={(e) => {
                const val = Math.max(15, Math.min(100, Number(e.target.value) || 25))
                updateMetrics(
                  val,
                  currentGender,
                  currentHeight,
                  currentWeight,
                  currentActivity,
                  currentGoal,
                )
              }}
              className="h-11 px-3.5 pr-12 w-full bg-white text-sm font-semibold text-slate-900 border border-slate-300 rounded-[10px] focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <span className="absolute right-3.5 text-xs text-slate-400 font-semibold pointer-events-none">
              tuổi
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Độ tuổi tiêu chuẩn từ 15 - 100 tuổi</span>
        </div>

        {/* Height Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-height" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Ruler className="w-3.5 h-3.5 text-slate-400" />
            <span>Chiều cao</span>
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              id="user-height"
              type="number"
              min={100}
              max={230}
              value={currentHeight}
              disabled={disabled}
              onChange={(e) => {
                const val = Number(e.target.value)
                updateMetrics(
                  currentAge,
                  currentGender,
                  val,
                  currentWeight,
                  currentActivity,
                  currentGoal,
                )
              }}
              className="h-11 px-3.5 pr-12 w-full bg-white text-sm font-semibold text-slate-900 border border-slate-300 rounded-[10px] focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <span className="absolute right-3.5 text-xs text-slate-400 font-semibold pointer-events-none">
              cm
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Ví dụ: 165 cm hoặc 170 cm</span>
        </div>

        {/* Weight Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-weight" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-slate-400" />
            <span>Cân nặng</span>
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              id="user-weight"
              type="number"
              min={30}
              max={200}
              value={currentWeight}
              disabled={disabled}
              onChange={(e) => {
                const val = Number(e.target.value)
                updateMetrics(
                  currentAge,
                  currentGender,
                  currentHeight,
                  val,
                  currentActivity,
                  currentGoal,
                )
              }}
              className="h-11 px-3.5 pr-12 w-full bg-white text-sm font-semibold text-slate-900 border border-slate-300 rounded-[10px] focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <span className="absolute right-3.5 text-xs text-slate-400 font-semibold pointer-events-none">
              kg
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Trọng lượng cơ thể hiện tại</span>
        </div>

        {/* Activity Level */}
        <div className="flex flex-col gap-1.5">
          <Select
            label="Mức độ vận động"
            required
            value={currentActivity}
            disabled={disabled}
            onChange={(e) =>
              updateMetrics(
                currentAge,
                currentGender,
                currentHeight,
                currentWeight,
                e.target.value as ActivityLevel,
                currentGoal,
              )
            }
          >
            {ACTIVITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <span className="text-[10px] text-slate-500">
            {ACTIVITY_OPTIONS.find((a) => a.value === currentActivity)?.desc}
          </span>
        </div>

        {/* Fitness / Health Goal */}
        <div className="flex flex-col gap-1.5">
          <Select
            label="Mục tiêu sức khỏe & thể chất"
            required
            value={currentGoal}
            disabled={disabled}
            onChange={(e) =>
              updateMetrics(
                currentAge,
                currentGender,
                currentHeight,
                currentWeight,
                currentActivity,
                e.target.value as GoalType,
              )
            }
          >
            {GOAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <span className="text-[10px] text-slate-500">
            {GOAL_OPTIONS.find((g) => g.value === currentGoal)?.desc}
          </span>
        </div>
      </div>

      {/* Calculated Result Dashboard: BMI & TDEE Stat Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BMI Result Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Chỉ số BMI Á Đông</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{metrics.bmi}</div>
            <div className="mt-2">
              <span
                className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border ${bmiBadge.color}`}
              >
                {bmiBadge.label}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight pt-2 border-t border-slate-100">
            {bmiBadge.advice}
          </p>
        </div>

        {/* TDEE Energy Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Nhu cầu Năng lượng (TDEE)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics.tdeeKcal.toLocaleString()}{' '}
              <span className="text-sm font-semibold text-slate-500">kcal/ngày</span>
            </div>
            <div className="mt-2">
              <span className="inline-block text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                Chuyển hóa BMR: ~{metrics.bmrKcal || 1450} kcal
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight pt-2 border-t border-slate-100">
            Đã hiệu chỉnh theo mục tiêu {GOAL_OPTIONS.find((g) => g.value === currentGoal)?.label}
          </p>
        </div>

        {/* Daily Protein Target */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Mục tiêu Đạm thực vật</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics.dailyProteinGrams}{' '}
              <span className="text-sm font-semibold text-slate-500">g/ngày</span>
            </div>
            <div className="mt-2">
              <span className="inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                ~{(metrics.dailyProteinGrams / currentWeight).toFixed(1)}g / kg thể trọng
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight pt-2 border-t border-slate-100">
            Cung cấp nguồn acid amin đầy đủ từ đậu, hạt và nấm.
          </p>
        </div>

        {/* Goal Indicator Card */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">Chiến lược Thực đơn</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base font-bold text-emerald-950 leading-snug">
              {GOAL_OPTIONS.find((g) => g.value === currentGoal)?.label}
            </div>
            <p className="text-xs text-emerald-800 mt-1">
              Thực đơn 7 ngày sẽ tự động chọn món phù hợp mức năng lượng này.
            </p>
          </div>
          <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 pt-2 border-t border-emerald-200/60">
            <span>✓ Đang kích hoạt đồng bộ</span>
          </div>
        </div>
      </div>

      {/* Visual BMI Bar Gauge */}
      <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-700 flex-wrap gap-2">
          <span className="font-bold text-slate-900">Thang đo BMI chuẩn cộng đồng Á Đông</span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            BMI của bạn: {metrics.bmi} ({bmiBadge.label})
          </span>
        </div>

        {/* Gauge Bar */}
        <div className="relative pt-4 pb-2">
          {/* Needle Indicator */}
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 z-10"
            style={{ left: `${bmiPercentage}%` }}
          >
            <div className="w-3 h-3 bg-emerald-900 rotate-45 shadow-sm" />
          </div>

          <div className="w-full h-3.5 rounded-full flex overflow-hidden shadow-inner">
            <div className="h-full bg-amber-300 flex-[3.5]" title="Thiếu cân (< 18.5)" />
            <div className="h-full bg-emerald-500 flex-[4.5]" title="Chuẩn lý tưởng (18.5 - 22.9)" />
            <div className="h-full bg-orange-400 flex-[2]" title="Thừa cân (23.0 - 24.9)" />
            <div className="h-full bg-rose-500 flex-[5]" title="Béo phì (≥ 25.0)" />
          </div>
        </div>

        {/* Labels under bar */}
        <div className="grid grid-cols-4 text-[10px] text-slate-500 text-center font-medium pt-1">
          <span>Thiếu cân (&lt; 18.5)</span>
          <span className="text-emerald-700 font-bold">Chuẩn lý tưởng (18.5 - 22.9)</span>
          <span>Thừa cân (23 - 24.9)</span>
          <span>Béo phì (≥ 25)</span>
        </div>
      </div>

      {/* Macronutrient Distribution Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">
            Phân bổ 3 nhóm chất đa lượng trong ngày ({metrics.tdeeKcal} kcal):
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Tỷ lệ năng lượng chuẩn</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Protein */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900">Đạm thực vật (Protein)</span>
              <span className="text-xs font-bold text-emerald-700">
                {Math.round(((metrics.dailyProteinGrams * 4) / metrics.tdeeKcal) * 100)}%
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {metrics.dailyProteinGrams}g{' '}
              <span className="text-xs font-normal text-slate-500">
                ({metrics.dailyProteinGrams * 4} kcal)
              </span>
            </div>
            <div className="w-full bg-emerald-200/60 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.round(((metrics.dailyProteinGrams * 4) / metrics.tdeeKcal) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">Tinh bột phức (Carbs)</span>
              <span className="text-xs font-bold text-amber-700">
                {Math.round(((metrics.dailyCarbsGrams * 4) / metrics.tdeeKcal) * 100)}%
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {metrics.dailyCarbsGrams}g{' '}
              <span className="text-xs font-normal text-slate-500">
                ({metrics.dailyCarbsGrams * 4} kcal)
              </span>
            </div>
            <div className="w-full bg-amber-200/60 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.round(((metrics.dailyCarbsGrams * 4) / metrics.tdeeKcal) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Fat */}
          <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-900">Chất béo lành mạnh (Fat)</span>
              <span className="text-xs font-bold text-sky-700">
                {Math.round(((metrics.dailyFatGrams * 9) / metrics.tdeeKcal) * 100)}%
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {metrics.dailyFatGrams}g{' '}
              <span className="text-xs font-normal text-slate-500">
                ({metrics.dailyFatGrams * 9} kcal)
              </span>
            </div>
            <div className="w-full bg-sky-200/60 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.round(((metrics.dailyFatGrams * 9) / metrics.tdeeKcal) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preferred Protein Sources */}
      <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Nguồn đạm thực vật ưu tiên được đề xuất trong thực đơn:</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {preferredProteins.map((item) => (
            <span
              key={item}
              className="text-xs px-2.5 py-1 rounded-lg bg-white text-emerald-800 font-semibold border border-slate-200 shadow-2xs flex items-center gap-1"
            >
              <span>✓</span>
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Mandatory Medical Disclaimer Banner (MVP Requirement Section 3) */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-amber-950 text-xs flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 leading-relaxed">
          <strong className="text-amber-900 font-bold">
            Khuyến cáo Dinh dưỡng &amp; Giới hạn Y khoa:
          </strong>
          <p>
            Chỉ số BMI, TDEE và các mục tiêu vi chất trên đây là kết quả tính toán tham khảo theo công thức
            khoa học, phục vụ việc xây dựng kế hoạch thực đơn cá nhân hóa trên hệ thống Vegetarian Support.{' '}
            <strong>Hệ thống không đưa ra chẩn đoán y khoa, phác đồ điều trị hay thay thế tư vấn y khoa chuyên sâu.</strong>{' '}
            Người có tình trạng bệnh lý đặc biệt (tim mạch, tiểu đường, phụ nữ mang thai) nên tham vấn bác sĩ chuyên khoa dinh dưỡng.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BodyMetricsCalculator
