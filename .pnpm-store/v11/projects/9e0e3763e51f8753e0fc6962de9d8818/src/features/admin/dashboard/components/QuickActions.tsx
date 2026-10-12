import React from 'react'
import {
  Users,
  FileText,
  Video,
  MessageSquare,
  Layers,
} from 'lucide-react'

interface QuickActionsProps {
  onNavigate?: (path: string) => void
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  const actions = [
    {
      title: 'Quản lý thành viên',
      desc: 'Xem danh sách, phân quyền...',
      icon: Users,
      iconColor: 'text-emerald-700 bg-emerald-50 border-emerald-100',
      path: '/admin/members',
    },
    {
      title: 'Quản lý bài viết',
      desc: 'Duyệt bài, phân loại...',
      icon: FileText,
      iconColor: 'text-sky-700 bg-sky-50 border-sky-100',
      path: '/admin/articles',
    },
    {
      title: 'Quản lý video',
      desc: 'Quản lý video công thức...',
      icon: Video,
      iconColor: 'text-amber-700 bg-amber-50 border-amber-100',
      path: '/admin/videos',
    },
    {
      title: 'Quản lý bình luận',
      desc: 'Kiểm duyệt phản hồi...',
      icon: MessageSquare,
      iconColor: 'text-purple-700 bg-purple-50 border-purple-100',
      path: '/admin/comments',
    },
    {
      title: 'Quản lý danh mục',
      desc: 'Thiết lập danh mục...',
      icon: Layers,
      iconColor: 'text-emerald-700 bg-emerald-50 border-emerald-100',
      path: '/admin/categories',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900">Thao tác nhanh</h3>
        <span className="text-xs text-gray-400">Phím tắt điều hướng quản trị</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {actions.map((act, idx) => {
          const IconComp = act.icon
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onNavigate?.(act.path)}
              className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all text-left flex flex-col gap-3 group"
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${act.iconColor}`}
              >
                <IconComp className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                  {act.title}
                </h4>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 leading-snug">
                  {act.desc}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
