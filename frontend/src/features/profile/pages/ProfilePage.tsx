import React, { useState, useEffect } from 'react'
import { UserProfileShell } from '../components/UserProfileShell'
import { useAuth } from '../../auth'
import { profileApi } from '../api/profileApi'
import { ProfileOverview } from '../components/ProfileOverview'
import { ProfileSettingsForm } from '../components/ProfileSettingsForm'
import type { UserProfile, ProfileStats, RecentPost } from '../types'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ProfilePageProps {
  onNavigate?: (path: string) => void
  initialViewMode?: 'overview' | 'settings'
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigate,
  initialViewMode = 'overview',
}) => {
  const { user, updateUser } = useAuth()
  const [viewMode, setViewMode] = useState<'overview' | 'settings'>(initialViewMode)
  const [prevMode, setPrevMode] = useState<'overview' | 'settings'>(initialViewMode)

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
  const [reloadTrigger, setReloadTrigger] = useState(0)

  useEffect(() => {
    let isMounted = true
    const loadData = async () => {
      try {
        const [profData, statsData, postsData] = await Promise.all([
          profileApi.getProfile(),
          profileApi.getProfileStats(),
          profileApi.getRecentPosts(),
        ])
        if (isMounted) {
          setProfile(profData)
          setStats(statsData)
          setRecentPosts(postsData)
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

  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    setReloadTrigger((prev) => prev + 1)
  }

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    setIsUpdating(true)
    try {
      const updated = await profileApi.updateProfile(updates)
      setProfile(updated)
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

  const displayName = profile?.fullName || user?.fullName || 'Quang Duy'
  const displayEmail = profile?.email || user?.email || 'duy@gmail.com'
  const displayAvatar = profile?.avatarUrl || user?.avatarUrl
  const displayDiet = profile?.dietaryType || 'Chưa chọn chế độ ăn'

  return (
    <UserProfileShell
      activeTab="overview"
      onNavigate={onNavigate}
      userName={displayName}
      userEmail={displayEmail}
      avatarUrl={displayAvatar}
      dietaryType={displayDiet}
      statBadge={{ count: stats?.postCount ?? 12, label: 'Bài viết' }}
      breadcrumbs={[
        { label: 'Trang chủ', path: '/' },
        { label: 'Tài khoản', path: '/profile' },
        { label: viewMode === 'settings' ? 'Cài đặt hồ sơ & ăn chay' : 'Tổng quan & Thể trạng' },
      ]}
    >
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
            <h3 className="text-lg font-bold text-[#1f2937]">Không thể tải dữ liệu hồ sơ</h3>
            <p className="text-xs text-[#6b7280]">{error}</p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Loaded View Mode: Overview vs Settings */}
      {!isLoading && !error && profile && stats && (
        <>
          {viewMode === 'overview' ? (
            <ProfileOverview
              profile={profile}
              stats={stats}
              recentPosts={recentPosts}
              onGoToSettings={() => setViewMode('settings')}
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
