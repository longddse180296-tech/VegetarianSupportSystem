import React from 'react'
import { Activity, Flame, Target, Scale, Ruler, Sparkles } from 'lucide-react'
import type { BodyMetrics, GoalType } from '../types'

interface BodyMetricsCalculatorProps {
  metrics: BodyMetrics
  onChange: (metrics: BodyMetrics) => void
  preferredProteins: string[]
  disabled?: boolean
}

export const BodyMetricsCalculator: React.FC<BodyMetricsCalculatorProps> = ({
  metrics,
  onChange,
  preferredProteins,
  disabled = false,
}) => {
  const calculateBMI = (h: number, w: number) => {
    if (!h || !w || h <= 0) return { bmi: 22.5, category: 'normal' as const }
    const heightM = h / 100
    const raw = w / (heightM * heightM)
    const bmi = Math.round(raw * 10) / 10

    let category: 'underweight' | 'normal' | 'overweight' | 'obese' = 'normal'
    if (bmi < 18.5) category = 'underweight'
    else if (bmi < 23) category = 'normal'
    else if (bmi < 25) category = 'overweight'
    else category = 'obese'

    return { bmi, category }
  }

  const handleHeightChange = (heightCm: number) => {
    const { bmi, category } = calculateBMI(heightCm, metrics.weightKg)
    onChange({
      ...metrics,
      heightCm,
      bmi,
      bmiCategory: category,
    })
  }

  const handleWeightChange = (weightKg: number) => {
    const { bmi, category } = calculateBMI(metrics.heightCm, weightKg)
    onChange({
      ...metrics,
      weightKg,
      bmi,
      bmiCategory: category,
    })
  }

  const handleGoalChange = (goal: GoalType) => {
    let tdeeKcal = 1500
    let protein = 65
    let carbs = 210
    let fat = 42

    if (goal === 'weight_loss') {
      tdeeKcal = 1350
      protein = 75
      carbs = 160
      fat = 35
    } else if (goal === 'muscle_gain') {
      tdeeKcal = 1800
      protein = 95
      carbs = 240
      fat = 48
    }

    onChange({
      ...metrics,
      goal,
      tdeeKcal,
      dailyProteinGrams: protein,
      dailyCarbsGrams: carbs,
      dailyFatGrams: fat,
    })
  }

  const getBMIBadge = () => {
    switch (metrics.bmiCategory) {
      case 'underweight':
        return { label: 'Thiếu cân', color: 'bg-amber-100 text-amber-800' }
      case 'normal':
        return { label: 'Chuẩn lý tưởng (Cân đối)', color: 'bg-emerald-100 text-emerald-800' }
      case 'overweight':
        return { label: 'Thừa cân', color: 'bg-orange-100 text-orange-800' }
      case 'obese':
        return { label: 'Béo phì', color: 'bg-rose-100 text-rose-800' }
    }
  }

  const bmiBadge = getBMIBadge()

  // Calculate pointer position on visual bar: clamp between 5% and 95%
  // 15 -> 0%, 30 -> 100%
  const bmiPercentage = Math.min(Math.max(((metrics.bmi - 15) / 15) * 100, 5), 95)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">
            Đồng bộ Chỉ số Thể trạng &amp; Dinh dưỡng Cá nhân
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Chuẩn Á Đông
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Chỉ số này giúp thuật toán AI tính toán chính xác khẩu phần calo và vi chất dinh dưỡng cần
        thiết cho mỗi bữa ăn trong kế hoạch thực đơn của bạn.
      </p>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Height */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Ruler className="w-3.5 h-3.5 text-slate-400" />
            <span>Chiều cao</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <input
              type="number"
              value={metrics.heightCm}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              disabled={disabled}
              className="text-xl font-extrabold text-slate-900 w-16 bg-transparent border-b border-dashed border-slate-300 focus:border-emerald-500 focus:outline-none"
            />
            <span className="text-xs text-slate-500 font-semibold">cm</span>
          </div>
          <span className="text-[11px] text-slate-400">Tiêu chuẩn người lớn</span>
        </div>

        {/* Weight */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Scale className="w-3.5 h-3.5 text-slate-400" />
            <span>Cân nặng</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <input
              type="number"
              value={metrics.weightKg}
              onChange={(e) => handleWeightChange(Number(e.target.value))}
              disabled={disabled}
              className="text-xl font-extrabold text-slate-900 w-16 bg-transparent border-b border-dashed border-slate-300 focus:border-emerald-500 focus:outline-none"
            />
            <span className="text-xs text-slate-500 font-semibold">kg</span>
          </div>
          <span className="text-[11px] text-slate-400">Trọng lượng cơ thể</span>
        </div>

        {/* Live BMI */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Chỉ số BMI</span>
          </div>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">{metrics.bmi}</div>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded self-start ${bmiBadge.color}`}
          >
            {bmiBadge.label}
          </span>
        </div>

        {/* TDEE */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>TDEE Năng lượng</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {metrics.tdeeKcal.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Mục tiêu kcal / ngày</span>
        </div>
      </div>

      {/* Visual BMI Bar */}
      <div className="flex flex-col gap-2 p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Thang đo BMI chuẩn cộng đồng Á Đông</span>
          <span className="font-bold text-emerald-700">BMI hiện tại: {metrics.bmi}</span>
        </div>

        {/* Bar */}
        <div className="relative pt-3 pb-1">
          {/* Pointer */}
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
            style={{ left: `${bmiPercentage}%` }}
          >
            <div className="w-2.5 h-2.5 bg-emerald-800 rotate-45" />
          </div>

          <div className="w-full h-3 rounded-full flex overflow-hidden">
            <div className="h-full bg-blue-300 flex-1" title="Thiếu cân (< 18.5)" />
            <div className="h-full bg-emerald-500 flex-2" title="Chuẩn lý tưởng (18.5 - 22.9)" />
            <div className="h-full bg-amber-400 flex-1" title="Thừa cân (23.0 - 24.9)" />
            <div className="h-full bg-rose-500 flex-1" title="Béo phì (>= 25.0)" />
          </div>
        </div>

        {/* Labels under bar */}
        <div className="grid grid-cols-4 text-[10px] text-slate-500 text-center font-medium pt-1">
          <span>Thiếu cân (&lt; 18.5)</span>
          <span className="text-emerald-700 font-bold">Chuẩn (18.5 - 22.9)</span>
          <span>Thừa cân (23 - 24.9)</span>
          <span>Béo phì (≥ 25)</span>
        </div>
      </div>

      {/* Goal Selector */}
      <div className="flex flex-col gap-2">
        <label htmlFor="user-goal" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Target className="w-4 h-4 text-emerald-600" />
          <span>Mục tiêu thể chất &amp; sức khỏe</span>
        </label>
        <select
          id="user-goal"
          value={metrics.goal}
          onChange={(e) => handleGoalChange(e.target.value as GoalType)}
          disabled={disabled}
          className="w-full p-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="maintain">Duy trì cân nặng &amp; Tăng cường sinh lực</option>
          <option value="weight_loss">Giảm mỡ &amp; Thanh lọc cơ thể khoa học</option>
          <option value="muscle_gain">Tăng cơ thuần chay (High-Protein Vegan)</option>
          <option value="general_health">Sức khỏe tổng quát &amp; Tiêu hóa khỏe mạnh</option>
        </select>
      </div>

      {/* Macro Target Breakdown */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
        <span className="text-xs font-bold text-slate-800">
          Phân bổ Đa lượng Mục tiêu trong ngày ({metrics.tdeeKcal} kcal):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Protein */}
          <div className="p-2.5 rounded-lg bg-white border border-slate-200">
            <span className="text-xs text-slate-500 block">Đạm thực vật</span>
            <span className="text-sm font-bold text-slate-900">
              {metrics.dailyProteinGrams}g / ngày
            </span>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-emerald-600 h-full w-[20%]" />
            </div>
          </div>

          {/* Carbs */}
          <div className="p-2.5 rounded-lg bg-white border border-slate-200">
            <span className="text-xs text-slate-500 block">Tinh bột phức (Complex Carbs)</span>
            <span className="text-sm font-bold text-slate-900">
              {metrics.dailyCarbsGrams}g / ngày
            </span>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-amber-500 h-full w-[60%]" />
            </div>
          </div>

          {/* Fat */}
          <div className="p-2.5 rounded-lg bg-white border border-slate-200">
            <span className="text-xs text-slate-500 block">Chất béo tốt (Healthy Fat)</span>
            <span className="text-sm font-bold text-slate-900">
              {metrics.dailyFatGrams}g / ngày
            </span>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-sky-500 h-full w-[20%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Preferred Protein Sources */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Nguồn đạm thực vật ưu tiên trong bữa ăn:</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {preferredProteins.map((item) => (
            <span
              key={item}
              className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-medium border border-emerald-200"
            >
              ✓ {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
export default BodyMetricsCalculator
