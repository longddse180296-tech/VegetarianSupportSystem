import React from 'react'
import {
  FileText,
  MessageSquare,
  Video,
  ArrowRight,
  Calendar,
  ThumbsUp,
  Settings,
  Leaf,
  ChevronRight,
} from 'lucide-react'
import type { UserProfile, ProfileStats, RecentPost } from '../types'

interface ProfileOverviewProps {
  profile: UserProfile
  stats: ProfileStats
  recentPosts: RecentPost[]
  onGoToSettings: () => void
  onNavigate?: (path: string) => void
}

export const ProfileOverview: React.FC<ProfileOverviewProps> = ({
  profile,
  stats,
  recentPosts,
  onGoToSettings,
  onNavigate,
}) => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <button
          type="button"
          onClick={() => onNavigate?.('/')}
          className="hover:text-emerald-700 transition-colors"
        >
          Trang chủ
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">Tài khoản</span>
      </nav>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar circle */}
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-2xl flex items-center justify-center border-2 border-emerald-300 shadow-sm flex-shrink-0">
            {profile.fullName.charAt(0)}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {profile.fullName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <Leaf className="w-3 h-3 text-emerald-600" />
                <span>Hồ sơ: {profile.dietaryType}</span>
              </span>
            </div>
            <p className="text-sm text-slate-500">{profile.email}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Thành viên từ tháng 03/2024</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onGoToSettings}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <Settings className="w-4 h-4" />
          <span>Tài khoản &amp; Hồ sơ ăn chay</span>
        </button>
      </div>

      {/* 3 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Articles */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Bài viết của tôi</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{stats.postCount}</div>
            <button
              type="button"
              onClick={() => onNavigate?.('/my-articles')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline mt-2"
            >
              <span>Xem danh sách</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Comments */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Bình luận của tôi</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{stats.commentCount}</div>
            <button
              type="button"
              onClick={() => onNavigate?.('/my-articles')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline mt-2"
            >
              <span>Xem danh sách</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Videos */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Video của tôi</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{stats.videoCount}</div>
            <button
              type="button"
              onClick={() => onNavigate?.('/my-videos')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline mt-2"
            >
              <span>Xem danh sách</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Posts Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-bold text-slate-900">Bài viết gần đây</h2>
            <p className="text-xs text-slate-500">
              Nội dung bạn đã xuất bản trên cộng đồng Vegetarian Support
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('/my-articles')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Xem tất cả
          </button>
        </div>

        {/* Posts List */}
        <div className="flex flex-col gap-3">
          {recentPosts.map((post) => (
            <div
              key={post.id}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {post.category}
                  </span>
                  <span className="text-xs text-slate-400">{post.publishedDate}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{post.title}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                    <span>{post.likeCount}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>{post.commentCount}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => onNavigate?.(`/articles/${post.id}`)}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  Xem
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.(`/articles/${post.id}/edit`)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Chỉnh sửa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default ProfileOverview
