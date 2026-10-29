// Chức năng: hồ sơ và nhu cầu dinh dưỡng cá nhân. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import React, { useState, useEffect } from 'react'
import { UserProfileShell } from '../components/UserProfileShell'
import { useAuth } from '../../auth'
import { profileApi } from '../api/profileApi'
import { ProfileOverview } from '../components/ProfileOverview'
import { ProfileSettingsForm } from '../components/ProfileSettingsForm'
import type { UserProfile, ProfileStats, RecentPost } from '../types'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { getDietaryTypeLabel } from '../../../shared/constants'

// Cấu trúc ProfilePageProps quy định dữ liệu trao đổi trong hồ sơ và nhu cầu dinh dưỡng cá nhân.
interface ProfilePageProps {
  onNavigate?: (path: string) => void
  initialViewMode?: 'overview' | 'settings'
}

// Lấy hoặc lọc danh sách theo điều kiện và phạm vi hiện tại (ProfilePage); thuộc hồ sơ và nhu cầu dinh dưỡng cá nhân.
export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigate,
  initialViewMode = 'overview',
}) => {
  const { user, updateUser } = useAuth()
  // Lưu dữ liệu và trạng thái thao tác của hồ sơ và nhu cầu dinh dưỡng cá nhân trong vòng đời màn hình.
  const [viewMode, setViewMode] = useState<'overview' | 'settings'>(
    initialViewMode,
  )
  const [prevMode, setPrevMode] = useState<'overview' | 'settings'>(
    initialViewMode,
  )

  if (initialViewMode !== prevMode) {
    setPrevMode(initialViewMode)
    setViewMode(initialViewMode)
  }

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [contentWarning, setContentWarning] = useState<string | null>(null)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  // Đồng bộ dữ liệu theo thay đổi đầu vào; hủy hoặc bỏ qua kết quả cũ khi màn hình thay đổi.
  useEffect(() => {
    let isMounted = true
    // Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (loadData); thuộc hồ sơ và nhu cầu dinh dưỡng cá nhân.
    const loadData = async () => {
      try {
        const [profData, statsData, postsData] = await Promise.allSettled([
          profileApi.getProfile(),
          profileApi.getProfileStats(),
          profileApi.getRecentPosts(),
        ])
        if (isMounted) {
          if (profData.status === 'rejected') throw profData.reason
          const actualStats =
            statsData.status === 'fulfilled'
              ? statsData.value
              : { postCount: null, commentCount: null, videoCount: null }
          setProfile(profData.value)
          setStats(actualStats)
          setRecentPosts(
            postsData.status === 'fulfilled' ? postsData.value : [],
          )
          setContentWarning(
            Object.values(actualStats).some((value) => value === null) ||
              postsData.status === 'rejected'
              ? 'Một số dữ liệu bài viết/video/bình luận chưa tải được. Thông tin hồ sơ vẫn sử dụng được.'
              : null,
          )
          setError(null)
          setIsLoading(false)
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof Error) {
            setError(err.message)
          } else {
            setError('Không thể tải thông tin hồ sơ. Vui lòng thử lại.')
          }
          setIsLoading(false)
        }
      }
    }
    void loadData()
    return () => {
      isMounted = false
    }
  }, [reloadTrigger])

  // Thử lại việc lấy dữ liệu và đồng bộ trạng thái hiển thị (handleRetry); thuộc hồ sơ và nhu cầu dinh dưỡng cá nhân.
  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    setReloadTrigger((prev) => prev + 1)
  }

  // Ghi nhận thay đổi dữ liệu và cập nhật kết quả cho bên gọi (handleUpdateProfile); thuộc hồ sơ và nhu cầu dinh dưỡng cá nhân.
  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    setIsUpdating(true)
    try {
      const updated = await profileApi.updateProfile(updates)
      setProfile(updated)
      setSaveNotice('Đã lưu hồ sơ.')
      if (updateUser) {
        updateUser({
          fullName: updated.fullName,
          avatarUrl: updated.avatarUrl,
        })
      }
      setViewMode('overview')
    } finally {
      setIsUpdating(false)
    }
  }

  const displayName = profile?.fullName || user?.fullName || 'Thành viên'
  const displayEmail = profile?.email || user?.email || ''
  const displayAvatar = profile?.avatarUrl || user?.avatarUrl
  const displayDiet = getDietaryTypeLabel(profile?.dietaryType)

  // Hiển thị giao diện hồ sơ và nhu cầu dinh dưỡng cá nhân từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <UserProfileShell
      activeTab="overview"
      onNavigate={onNavigate}
      userName={displayName}
      userEmail={displayEmail}
      avatarUrl={displayAvatar}
      dietaryType={displayDiet}
      breadcrumbs={[
        { label: 'Trang chủ', path: '/' },
        { label: 'Tài khoản', path: '/profile' },
        {
          label:
            viewMode === 'settings'
              ? 'Cài đặt hồ sơ & ăn chay'
              : 'Tổng quan & Thể trạng',
        },
      ]}
    >
      {saveNotice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-primary-light p-4 text-sm text-primary">{saveNotice}</p>}
      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="flex flex-col gap-6 w-full animate-pulse">
          <div className="h-44 bg-white rounded-[16px] border border-[#e5e7eb] p-6 flex flex-col justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-200" />
              <div className="space-y-2">
                <div className="h-5 w-48 bg-slate-200 rounded" />
                <div className="h-3 w-32 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="h-10 w-full bg-slate-100 rounded-[10px]" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="h-28 bg-white rounded-[16px] border border-[#e5e7eb]" />
            <div className="h-28 bg-white rounded-[16px] border border-[#e5e7eb]" />
            <div className="h-28 bg-white rounded-[16px] border border-[#e5e7eb]" />
            <div className="h-28 bg-white rounded-[16px] border border-[#e5e7eb]" />
          </div>

          <div className="h-64 bg-white rounded-[16px] border border-[#e5e7eb]" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="w-full my-8 bg-white rounded-[16px] border border-rose-200 p-8 shadow-sm text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-[#1f2937]">
              Không thể tải dữ liệu hồ sơ
            </h3>
            <p className="text-xs text-[#6b7280]">{error}</p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="fe1-btn fe1-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Loaded View Mode: Overview vs Settings */}
      {contentWarning && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900"
        >
          {contentWarning}
          <button className="fe1-control ml-3 underline" onClick={handleRetry}>
            Thử lại
          </button>
        </p>
      )}
      {!isLoading && !error && profile && stats && (
        <>
          {viewMode === 'overview' ? (
            <ProfileOverview
              profile={profile}
              stats={stats}
              recentPosts={recentPosts}
              onGoToSettings={() => { setSaveNotice(null); setViewMode('settings') }}
              onNavigate={onNavigate}
            />
          ) : (
            <ProfileSettingsForm
              initialProfile={profile}
              onSave={handleUpdateProfile}
              onBackToOverview={() => setViewMode('overview')}
              onNavigate={onNavigate}
              isLoading={isUpdating}
            />
          )}
        </>
      )}
    </UserProfileShell>
  )
}

export default ProfilePage
