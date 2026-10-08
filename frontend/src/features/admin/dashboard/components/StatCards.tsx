import React from 'react'
import {
  Users,
  FileText,
  Video,
  MessageSquare,
  Layers,
  ArrowRight,
} from 'lucide-react'
import type { DashboardStats, StatMetric } from '../types/dashboard.types'

interface StatCardsProps {
  stats: DashboardStats
  onNavigate?: (path: string) => void
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, onNavigate }) => {
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'users':
        return <Users className="w-5 h-5 text-emerald-700" />
      case 'file-text':
        return <FileText className="w-5 h-5 text-sky-600" />
      case 'video':
        return <Video className="w-5 h-5 text-amber-600" />
      case 'message-square':
        return <MessageSquare className="w-5 h-5 text-purple-600" />
      case 'layers':
      default:
        return <Layers className="w-5 h-5 text-emerald-700" />
    }
  }

  const getBadgeStyle = (type: StatMetric['badgeType']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 text-emerald-800 border-emerald-100'
      case 'info':
        return 'bg-sky-50 text-sky-700 border-sky-100'
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-100'
      case 'neutral':
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-100'
    }
  }

  const cards = [
    stats.members,
    stats.articles,
    stats.videos,
    stats.comments,
    stats.categories,
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((item, idx) => (
        <div
          key={idx}
          className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
              {renderIcon(item.icon)}
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getBadgeStyle(
                item.badgeType
              )}`}
            >
              {item.badge}
            </span>
          </div>

          <div>
            <span className="text-xs text-gray-500 font-medium block">
              {item.title}
            </span>
            <span className="text-3xl font-extrabold text-gray-900 mt-1 block tracking-tight">
              {item.value}
            </span>
          </div>

          <div className="pt-2 border-t border-gray-50">
            <button
              type="button"
              onClick={() => onNavigate?.(item.linkPath)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 group"
            >
              <span>Xem chi tiết</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
