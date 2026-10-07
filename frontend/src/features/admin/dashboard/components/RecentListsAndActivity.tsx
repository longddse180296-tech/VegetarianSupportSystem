import React from 'react'
import {
  FileText,
  Play,
  Eye,
  Edit3,
  Clock,
  MessageSquare,
  Tag,
  UserCheck,
} from 'lucide-react'
import type {
  RecentActivityItem,
  RecentArticleItem,
  RecentVideoItem,
} from '../types/dashboard.types'

interface RecentListsAndActivityProps {
  articles: RecentArticleItem[]
  videos: RecentVideoItem[]
  activities: RecentActivityItem[]
  onNavigate?: (path: string) => void
}

export const RecentListsAndActivity: React.FC<RecentListsAndActivityProps> = ({
  articles,
  videos,
  activities,
  onNavigate,
}) => {
  const getActivityIcon = (type: RecentActivityItem['type']) => {
    switch (type) {
      case 'article':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        )
      case 'video':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Play className="w-4 h-4" />
          </div>
        )
      case 'comment':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
        )
      case 'category':
        return (
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4" />
          </div>
        )
      case 'user':
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
        )
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left Column (3/5): Recent Articles & Recent Videos */}
      <div className="lg:col-span-3 space-y-6">
        {/* Recent Articles Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-bold">📑</span>
              <h3 className="text-sm font-bold text-gray-900">Bài viết mới nhất</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('/admin/articles')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Xem tất cả →
            </button>
          </div>

          <div className="space-y-3">
            {articles.map((art) => (
              <div
                key={art.id}
                className="p-3.5 rounded-2xl bg-gray-50/60 hover:bg-gray-50 border border-gray-100/80 flex items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-gray-900 truncate">
                    {art.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 text-[11px] font-medium hidden sm:inline-block">
                    {art.authorName}
                  </span>
                  <span className="text-gray-400 text-[11px] hidden md:inline-block">
                    {art.publishedAt}
                  </span>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <button
                      type="button"
                      onClick={() => onNavigate?.('/articles/art-1')}
                      className="p-1 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors"
                      title="Xem bài viết"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate?.(`/articles/editor/${art.id}`)}
                      className="p-1 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors"
                      title="Chỉnh sửa bài viết"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Videos Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-bold">🎬</span>
              <h3 className="text-sm font-bold text-gray-900">Video mới nhất</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('/admin/videos')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Xem tất cả →
            </button>
          </div>

          <div className="space-y-3">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="p-3.5 rounded-2xl bg-gray-50/60 hover:bg-gray-50 border border-gray-100/80 flex items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Play className="w-3 h-3 fill-emerald-700" />
                  </div>
                  <span className="font-semibold text-gray-900 truncate">
                    {vid.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 text-[11px] font-medium hidden sm:inline-block">
                    {vid.authorName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold font-mono">
                    {vid.duration}
                  </span>
                  <span className="text-gray-400 text-[11px] hidden md:inline-block">
                    {vid.publishedAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column (2/5): Recent Activity Timeline */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 h-full flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-gray-900">Hoạt động gần đây</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
              Thời gian thực
            </span>
          </div>

          <div className="space-y-4 flex-1">
            {activities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-2xl bg-gray-50/60 border border-gray-100 flex items-start gap-3 text-xs"
              >
                {getActivityIcon(act.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-gray-900 truncate">
                      {act.actorName}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {act.timeAgo}
                    </span>
                  </div>
                  <p className="text-gray-600 text-[11px] leading-relaxed">
                    {act.actionText}{' '}
                    {act.targetTitle && (
                      <span className="font-semibold text-gray-800">
                        {act.targetTitle}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
