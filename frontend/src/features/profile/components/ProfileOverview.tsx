import React from 'react'
import {
  FileText,
  MessageSquare,
  Video,
  ArrowRight,
  ThumbsUp,
  Settings,
  Leaf,
  Activity,
  Flame,
  AlertTriangle,
  MapPin,
  Sparkles,
} from 'lucide-react'
import type { UserProfile, ProfileStats, RecentPost } from '../types'
import { Button } from '../../../shared/components'

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
  const getBMILabel = (cat: string) => {
    switch (cat) {
      case 'underweight':
        return 'Thiếu cân'
      case 'normal':
        return 'Chuẩn lý tưởng'
      case 'overweight':
        return 'Thừa cân'
      case 'obese':
        return 'Béo phì'
      default:
        return 'Bình thường'
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Quick Profile & Dietary Metrics Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Tóm tắt Hồ sơ Thể trạng &amp; Dinh dưỡng</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onGoToSettings}
            leftIcon={<Settings className="w-3.5 h-3.5 text-emerald-700" />}
          >
            Chỉnh sửa chỉ số &amp; ăn chay
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Diet type */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-slate-500">Chế độ ăn chay</span>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>{profile.dietaryType}</span>
            </span>
          </div>

          {/* BMI */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-slate-500">Thể trạng BMI</span>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {profile.metrics.bmi} ({getBMILabel(profile.metrics.bmiCategory)})
              </span>
            </span>
          </div>

          {/* TDEE */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-slate-500">Nhu cầu TDEE</span>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>{profile.metrics.tdeeKcal.toLocaleString()} kcal/ngày</span>
            </span>
          </div>

          {/* Allergies Count */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-slate-500">Cảnh báo dị ứng</span>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>{profile.allergies.length} thành phần</span>
            </span>
          </div>
        </div>

        {profile.preferredRegion && (
          <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Khu vực ưu tiên tìm nhà hàng:{' '}
              <strong className="text-slate-800">{profile.preferredRegion}</strong>
            </span>
          </div>
        )}
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
              onClick={() => onNavigate?.('/profile/my-articles')}
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
              onClick={() => onNavigate?.('/profile/my-comments')}
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
              onClick={() => onNavigate?.('/profile/my-videos')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline mt-2"
            >
              <span>Xem danh sách</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Posts Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-bold text-slate-900">Bài viết gần đây</h2>
            <p className="text-xs text-slate-500">
              Nội dung bạn đã xuất bản trên cộng đồng Vegetarian Support
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('/profile/my-articles')}
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
                  onClick={() => onNavigate?.(`/articles/edit/${post.id}`)}
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
