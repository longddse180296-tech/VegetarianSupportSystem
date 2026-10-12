import React from 'react'
import { ShieldCheck } from 'lucide-react'
import type { DietCharacteristic } from '../types/mealPlans.types'

interface NutritionalBannerProps {
  characteristic: DietCharacteristic
}

export const NutritionalBanner: React.FC<NutritionalBannerProps> = ({
  characteristic,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-emerald-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
      {/* Left Column: Description & Shield */}
      <div className="flex items-start gap-4 max-w-2xl">
        <div className="w-12 h-12 rounded-2xl bg-[#EAF5EE] text-[#1E6531] flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-sm md:text-base">
              {characteristic.title}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF5EE] text-[#1E6531] border border-emerald-200/60">
              {characteristic.certBadge}
            </span>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            {characteristic.description}
          </p>
        </div>
      </div>

      {/* Right Column: Nutrition Metrics Grid */}
      <div className="w-full lg:w-auto grid grid-cols-3 sm:grid-cols-6 lg:flex lg:items-center gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 shrink-0 text-center">
        <div>
          <span className="text-[11px] text-gray-400 block leading-tight">Nhu cầu/ngày</span>
          <p className="font-extrabold text-sm text-gray-900 mt-1">
            {characteristic.targetKcal.toLocaleString()}{' '}
            <span className="text-[10px] font-normal text-gray-400">kcal</span>
          </p>
        </div>

        <div>
          <span className="text-[11px] text-gray-400 block leading-tight">Đạm (Protein)</span>
          <p className="font-extrabold text-sm text-gray-900 mt-1">
            {characteristic.targetProtein}g
          </p>
        </div>

        <div>
          <span className="text-[11px] text-gray-400 block leading-tight">Đường bột</span>
          <p className="font-extrabold text-sm text-gray-900 mt-1">
            {characteristic.targetCarbs}g
          </p>
        </div>

        <div>
          <span className="text-[11px] text-gray-400 block leading-tight">Chất béo tốt</span>
          <p className="font-extrabold text-sm text-gray-900 mt-1">
            {characteristic.targetFat}g
          </p>
        </div>

        <div>
          <span className="text-[11px] text-gray-400 block leading-tight">Chất xơ mịn</span>
          <p className="font-extrabold text-sm text-gray-900 mt-1">
            {characteristic.targetFiber}g
          </p>
        </div>

        <div>
          <span className="text-[11px] text-gray-400 block leading-tight">Vi chất ưu tiên</span>
          <p className="font-extrabold text-sm text-[#1E6531] mt-1 font-mono">
            {characteristic.targetMicronutrients}
          </p>
        </div>
      </div>
    </div>
  )
}
export default NutritionalBanner
