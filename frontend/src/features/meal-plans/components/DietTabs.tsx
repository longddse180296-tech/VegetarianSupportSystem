import React from 'react'
import { Leaf, Milk, Egg, Utensils } from 'lucide-react'
import type { DietTabOption, DietType } from '../types/mealPlans.types'

interface DietTabsProps {
  tabs: DietTabOption[]
  activeTab: DietType
  onTabChange: (tabId: DietType) => void
}

export const DietTabs: React.FC<DietTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const renderIcon = (iconName: DietTabOption['icon'], isActive: boolean) => {
    const iconClass = `w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-emerald-700'}`
    switch (iconName) {
      case 'leaf':
        return <Leaf className={iconClass} />
      case 'milk':
        return <Milk className={iconClass} />
      case 'egg':
        return <Egg className={iconClass} />
      case 'utensils':
      default:
        return <Utensils className={iconClass} />
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`p-4 rounded-3xl text-left border transition-all flex flex-col justify-between gap-3 relative focus:outline-none ${
              isActive
                ? 'bg-[#1E6531] border-[#1E6531] text-white shadow-md'
                : 'bg-white border-slate-200/80 hover:border-emerald-300 text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            {/* Top row: Icon box & Badge */}
            <div className="flex items-center justify-between w-full">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-white/20' : 'bg-[#EAF5EE]'
                }`}
              >
                {renderIcon(tab.icon, isActive)}
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-emerald-100'
                    : 'bg-[#EAF5EE] text-[#1E6531] border border-emerald-100'
                }`}
              >
                {tab.badge}
              </span>
            </div>

            {/* Bottom info: Name & SubName */}
            <div>
              <h4 className={`font-bold text-sm leading-snug ${isActive ? 'text-white' : 'text-gray-900'}`}>
                {tab.name}
              </h4>
              <p
                className={`text-[11px] mt-0.5 truncate leading-tight ${
                  isActive ? 'text-emerald-100 font-medium' : 'text-gray-400'
                }`}
              >
                {tab.subName}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
export default DietTabs
