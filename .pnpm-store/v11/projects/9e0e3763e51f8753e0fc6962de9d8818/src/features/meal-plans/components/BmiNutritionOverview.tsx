import React from 'react'
import {
  Activity,
  Flame,
  TrendingUp,
  Layers,
  Droplet,
  PackageCheck,
  CheckCircle2,
} from 'lucide-react'
import type { MyBmiNutritionMetric } from '../types/mealPlans.types'

interface BmiNutritionOverviewProps {
  metrics: MyBmiNutritionMetric[]
}

export const BmiNutritionOverview: React.FC<BmiNutritionOverviewProps> = ({
  metrics,
}) => {
  const getIconForType = (type: MyBmiNutritionMetric['type']) => {
    switch (type) {
      case 'calories':
        return <Flame className="h-4 w-4 text-emerald-600" />
      case 'protein':
        return <TrendingUp className="h-4 w-4 text-emerald-600" />
      case 'carbs':
        return <Layers className="h-4 w-4 text-blue-600" />
      case 'fat':
        return <Droplet className="h-4 w-4 text-indigo-600" />
      case 'pantry':
        return <PackageCheck className="h-4 w-4 text-emerald-600" />
      default:
        return <Activity className="h-4 w-4 text-emerald-600" />
    }
  }

  const getIconBgForType = (type: MyBmiNutritionMetric['type']) => {
    switch (type) {
      case 'calories':
        return 'bg-emerald-50 text-emerald-600'
      case 'protein':
        return 'bg-emerald-50 text-emerald-600'
      case 'carbs':
        return 'bg-blue-50 text-blue-600'
      case 'fat':
        return 'bg-indigo-50 text-indigo-600'
      case 'pantry':
        return 'bg-emerald-50 text-emerald-600'
      default:
        return 'bg-emerald-50 text-emerald-600'
    }
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
              Dinh dưỡng tham chiếu theo BMI của bạn
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Ước tính tự động dựa trên chỉ số BMI và nguyên liệu sẵn có, không phải nhật ký theo dõi calo thực tế.
          </p>
        </div>

        <span className="self-start sm:self-center shrink-0 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-xs font-bold text-emerald-800">
          Chuẩn thể trạng người Việt
        </span>
      </div>

      {/* 5 Cards Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {metrics.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-emerald-200 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500 leading-tight">
                {item.label}
              </span>
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${getIconBgForType(
                  item.type,
                )}`}
              >
                {getIconForType(item.type)}
              </div>
            </div>

            <div className="mt-3">
              <div className="text-xl font-black text-slate-900 tracking-tight">
                {item.value}
              </div>
              <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                {item.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
