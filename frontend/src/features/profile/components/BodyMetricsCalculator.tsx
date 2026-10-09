import React from 'react'
import {
  Activity,
  Flame,
  Target,
  Scale,
  Ruler,
  HeartPulse,
  Dumbbell,
  UserCheck,
  Check,
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
          color: 'bg-amber-100 text-amber-900 border-amber-200',
          advice: 'Khuyến nghị bổ sung các bữa phụ giàu hạt dinh dưỡng và đạm thực vật mật độ cao.',
        }
      case 'normal':
        return {
          label: 'Chuẩn lý tưởng (18.5 - 22.9)',
          color: 'bg-[#e8f5e9] text-[#1b5e20] border-emerald-300',
          advice: 'Thể trạng rất cân đối theo chuẩn Á Đông! Hãy tiếp tục duy trì chế độ hiện tại.',
        }
      case 'overweight':
        return {
          label: 'Thừa cân (23.0 - 24.9)',
          color: 'bg-orange-100 text-orange-900 border-orange-200',
          advice: 'Nên ưu tiên thực đơn thanh đạm, giảm dầu mỡ và tăng cường vận động nhẹ.',
        }
      case 'obese':
        return {
          label: 'Béo phì (≥ 25.0)',
          color: 'bg-rose-100 text-rose-900 border-rose-200',
          advice: 'Khuyến nghị áp dụng thực đơn thâm hụt calo khoa học và theo dõi chỉ số định kỳ.',
        }
    }
  }

  const bmiBadge = getBMIBadge()
  const clampedBMI = Math.min(Math.max(metrics.bmi, 15), 30)
  const bmiPercentage = ((clampedBMI - 15) / 15) * 100

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1f2937] leading-none">
              Chỉ số Thể trạng &amp; Nhu cầu Năng lượng Cá nhân
            </h3>
            <p className="text-[11px] text-[#6b7280] mt-0.5">
              Tính toán nhu cầu calo, đạm thực vật theo tiêu chuẩn Á Đông
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#e8f5e9] text-[#2e7d32] border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
          <HeartPulse className="w-3.5 h-3.5" />
          <span>Mifflin-St Jeor Formula</span>
        </span>
      </div>

      <p className="text-xs text-[#6b7280] leading-relaxed">
        Hệ thống tự động tính toán tỷ lệ trao đổi chất cơ bản (BMR), tổng năng lượng tiêu hao hàng ngày (TDEE) và phân bổ chất đạm thực vật chính xác để Trợ lý AI và Thực đơn tuần cá nhân hóa khẩu phần ăn cho bạn.
      </p>

      {/* Primary Input Grid (Gender, Age, Height, Weight, Activity, Goal) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 rounded-[16px] bg-[#f8faf8] border border-[#e5e7eb]">
        {/* Gender Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#1f2937] flex items-center gap-1">
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
              className={`rounded-[10px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                currentGender === 'male'
                  ? 'bg-[#2e7d32] text-white border-[#2e7d32] shadow-sm'
                  : 'bg-white text-[#1f2937] border-[#e5e7eb] hover:bg-slate-50'
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
              className={`rounded-[10px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                currentGender === 'female'
                  ? 'bg-[#2e7d32] text-white border-[#2e7d32] shadow-sm'
                  : 'bg-white text-[#1f2937] border-[#e5e7eb] hover:bg-slate-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>Nữ</span>
            </button>
          </div>
          <span className="text-[10px] text-[#6b7280]">Hiệu chỉnh công thức BMR</span>
        </div>

        {/* Age Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-age" className="text-xs font-semibold text-[#1f2937]">
            Tuổi của bạn <span className="text-rose-500">*</span>
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
              className="h-11 px-3.5 pr-12 w-full bg-white text-sm font-semibold text-[#1f2937] border border-[#e5e7eb] rounded-[10px] focus:outline-none focus:border-[#2e7d32] focus:ring-2 focus:ring-[#e8f5e9]"
            />
            <span className="absolute right-3.5 text-xs text-[#6b7280] font-semibold pointer-events-none">
              tuổi
            </span>
          </div>
          <span className="text-[10px] text-[#6b7280]">Độ tuổi từ 15 - 100</span>
        </div>

        {/* Height Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-height" className="text-xs font-semibold text-[#1f2937] flex items-center gap-1">
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
              className="h-11 px-3.5 pr-12 w-full bg-white text-sm font-semibold text-[#1f2937] border border-[#e5e7eb] rounded-[10px] focus:outline-none focus:border-[#2e7d32] focus:ring-2 focus:ring-[#e8f5e9]"
            />
            <span className="absolute right-3.5 text-xs text-[#6b7280] font-semibold pointer-events-none">
              cm
            </span>
          </div>
          <span className="text-[10px] text-[#6b7280]">Ví dụ: 165 cm</span>
        </div>

        {/* Weight Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-weight" className="text-xs font-semibold text-[#1f2937] flex items-center gap-1">
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
              className="h-11 px-3.5 pr-12 w-full bg-white text-sm font-semibold text-[#1f2937] border border-[#e5e7eb] rounded-[10px] focus:outline-none focus:border-[#2e7d32] focus:ring-2 focus:ring-[#e8f5e9]"
            />
            <span className="absolute right-3.5 text-xs text-[#6b7280] font-semibold pointer-events-none">
              kg
            </span>
          </div>
          <span className="text-[10px] text-[#6b7280]">Ví dụ: 55 kg</span>
        </div>

        {/* Activity Level Selector */}
        <div className="flex flex-col gap-1.5 lg:col-span-2">
          <Select
            label="Mức độ vận động thể chất hàng tuần"
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
            options={ACTIVITY_OPTIONS.map((opt) => ({
              value: opt.value,
              label: `${opt.label} - ${opt.desc}`,
            }))}
            helperText="Quyết định hệ số nhân hoạt động thể chất (1.2 đến 1.9)"
          />
        </div>

        {/* Goal Selector */}
        <div className="flex flex-col gap-1.5 lg:col-span-3">
          <Select
            label="Mục tiêu dinh dưỡng & thể hình cá nhân"
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
            options={GOAL_OPTIONS.map((g) => ({
              value: g.value,
              label: `${g.label} (${g.desc})`,
            }))}
            helperText="Hệ thống tự động bù/trừ năng lượng calo mục tiêu và lượng đạm thực vật"
          />
        </div>
      </div>

      {/* Calculated Results Dashboard (4 Cards with 16px radius) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BMI Card */}
        <div className="p-4 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b7280]">Chỉ số BMI Á Đông</span>
            <div className="w-8 h-8 rounded-[10px] bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#1f2937] tracking-tight tabular-nums">
              {metrics.bmi}
            </div>
            <div className="mt-2">
              <span
                className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${bmiBadge.color}`}
              >
                {bmiBadge.label}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#6b7280] leading-tight pt-2 border-t border-slate-100">
            {bmiBadge.advice}
          </p>
        </div>

        {/* TDEE Energy Card */}
        <div className="p-4 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b7280]">Nhu cầu Năng lượng (TDEE)</span>
            <div className="w-8 h-8 rounded-[10px] bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#1f2937] tracking-tight tabular-nums">
              {metrics.tdeeKcal.toLocaleString()}{' '}
              <span className="text-sm font-semibold text-[#6b7280]">kcal/ngày</span>
            </div>
            <div className="mt-2">
              <span className="inline-block text-[11px] font-semibold text-[#6b7280] bg-[#f8faf8] border border-[#e5e7eb] px-2 py-0.5 rounded-[6px]">
                Chuyển hóa BMR: ~{metrics.bmrKcal || 1450} kcal
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#6b7280] leading-tight pt-2 border-t border-slate-100">
            Đã hiệu chỉnh theo mục tiêu {GOAL_OPTIONS.find((g) => g.value === currentGoal)?.label}
          </p>
        </div>

        {/* Daily Protein Target */}
        <div className="p-4 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b7280]">Mục tiêu Đạm thực vật</span>
            <div className="w-8 h-8 rounded-[10px] bg-sky-50 text-sky-600 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#1f2937] tracking-tight tabular-nums">
              {metrics.dailyProteinGrams}{' '}
              <span className="text-sm font-semibold text-[#6b7280]">g/ngày</span>
            </div>
            <div className="mt-2">
              <span className="inline-block text-[11px] font-semibold text-[#1b5e20] bg-[#e8f5e9] border border-emerald-200 px-2.5 py-0.5 rounded-full">
                ~{(metrics.dailyProteinGrams / currentWeight).toFixed(1)}g / kg thể trọng
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#6b7280] leading-tight pt-2 border-t border-slate-100">
            Nguồn acid amin dồi dào từ đậu nành, đậu gà, hạt diêm mạch và nấm.
          </p>
        </div>

        {/* Goal Indicator Card */}
        <div className="p-4 rounded-[16px] bg-[#e8f5e9]/50 border border-emerald-200 shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1b5e20]">Chiến lược Dinh dưỡng</span>
            <div className="w-8 h-8 rounded-[10px] bg-[#2e7d32] text-white flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-[#1b5e20] leading-snug">
              {GOAL_OPTIONS.find((g) => g.value === currentGoal)?.label}
            </div>
            <p className="text-xs text-[#2e7d32] mt-1">
              Thực đơn 7 ngày sẽ tự động chọn món phù hợp mức năng lượng này.
            </p>
          </div>
          <div className="text-[11px] font-bold text-[#2e7d32] flex items-center gap-1.5 pt-2 border-t border-emerald-200/80">
            <Check className="w-3.5 h-3.5" />
            <span>Đang kích hoạt đồng bộ</span>
          </div>
        </div>
      </div>

      {/* Visual BMI Bar Gauge (DESIGN.md #255: 8px linear track, floating 16px circular pin) */}
      <div className="flex flex-col gap-3 p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)]">
        <div className="flex items-center justify-between text-xs text-[#1f2937] flex-wrap gap-2">
          <span className="font-bold">Thang đo BMI chuẩn cộng đồng Á Đông</span>
          <span className="font-bold text-[#2e7d32] bg-[#e8f5e9] px-3 py-1 rounded-full border border-emerald-200">
            BMI của bạn: {metrics.bmi} ({bmiBadge.label})
          </span>
        </div>

        {/* Gauge Bar */}
        <div className="relative pt-6 pb-2">
          {/* Floating Pin Indicator */}
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 z-10"
            style={{ left: `${bmiPercentage}%` }}
          >
            <div className="bg-[#1b5e20] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap mb-1">
              {metrics.bmi}
            </div>
            <div className="w-4 h-4 rounded-full bg-[#2e7d32] border-2 border-white ring-2 ring-emerald-300 shadow-sm" />
          </div>

          <div className="w-full h-2 rounded-full flex overflow-hidden shadow-inner bg-slate-100">
            <div className="h-full bg-amber-400 flex-[3.5]" title="Thiếu cân (< 18.5)" />
            <div className="h-full bg-[#2e7d32] flex-[4.4]" title="Chuẩn lý tưởng (18.5 - 22.9)" />
            <div className="h-full bg-orange-400 flex-[2.0]" title="Thừa cân (23.0 - 24.9)" />
            <div className="h-full bg-rose-500 flex-[5.1]" title="Béo phì (≥ 25.0)" />
          </div>
        </div>

        {/* Labels under bar */}
        <div className="grid grid-cols-4 text-[10px] sm:text-[11px] text-[#6b7280] text-center font-medium pt-1">
          <span>Thiếu cân (&lt; 18.5)</span>
          <span className="text-[#1b5e20] font-bold">Chuẩn lý tưởng (18.5 - 22.9)</span>
          <span>Thừa cân (23 - 24.9)</span>
          <span>Béo phì (≥ 25)</span>
        </div>
      </div>

      {/* Macronutrient Distribution Card */}
      <div className="p-5 rounded-[16px] bg-white border border-[#e5e7eb] shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#1f2937]">
            Phân bổ 3 nhóm chất đa lượng trong ngày ({metrics.tdeeKcal.toLocaleString()} kcal):
          </span>
          <span className="text-[11px] text-[#6b7280] font-medium">Tỷ lệ năng lượng chuẩn</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Protein */}
          <div className="p-4 rounded-[12px] bg-[#e8f5e9]/60 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1b5e20]">Đạm thực vật (Protein)</span>
              <span className="text-xs font-bold text-[#2e7d32]">
                {Math.round(((metrics.dailyProteinGrams * 4) / metrics.tdeeKcal) * 100)}%
              </span>
            </div>
            <div className="text-xl font-black text-[#1f2937] mt-1 tabular-nums">
              {metrics.dailyProteinGrams}g{' '}
              <span className="text-xs font-normal text-[#6b7280]">
                ({metrics.dailyProteinGrams * 4} kcal)
              </span>
            </div>
            <div className="w-full bg-emerald-200/60 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-[#2e7d32] h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round(((metrics.dailyProteinGrams * 4) / metrics.tdeeKcal) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="p-4 rounded-[12px] bg-amber-50/60 border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">Tinh bột phức (Carbs)</span>
              <span className="text-xs font-bold text-amber-700">
                {Math.round(((metrics.dailyCarbsGrams * 4) / metrics.tdeeKcal) * 100)}%
              </span>
            </div>
            <div className="text-xl font-black text-[#1f2937] mt-1 tabular-nums">
              {metrics.dailyCarbsGrams}g{' '}
              <span className="text-xs font-normal text-[#6b7280]">
                ({metrics.dailyCarbsGrams * 4} kcal)
              </span>
            </div>
            <div className="w-full bg-amber-200/60 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round(((metrics.dailyCarbsGrams * 4) / metrics.tdeeKcal) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Fats */}
          <div className="p-4 rounded-[12px] bg-sky-50/60 border border-sky-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-900">Chất béo tốt (Healthy Fats)</span>
              <span className="text-xs font-bold text-sky-700">
                {Math.round(((metrics.dailyFatGrams * 9) / metrics.tdeeKcal) * 100)}%
              </span>
            </div>
            <div className="text-xl font-black text-[#1f2937] mt-1 tabular-nums">
              {metrics.dailyFatGrams}g{' '}
              <span className="text-xs font-normal text-[#6b7280]">
                ({metrics.dailyFatGrams * 9} kcal)
              </span>
            </div>
            <div className="w-full bg-sky-200/60 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round(((metrics.dailyFatGrams * 9) / metrics.tdeeKcal) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BodyMetricsCalculator
