import React, { useState, useEffect } from 'react'
import { UserLayout } from '../../../app/layouts/UserLayout'
import { useAuth } from '../../auth'
import { profileApi } from '../api/profileApi'
import { ProfileOverview } from '../components/ProfileOverview'
import { ProfileSettingsForm } from '../components/ProfileSettingsForm'
import type { UserProfile, ProfileStats, RecentPost } from '../types'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ProfilePageProps {
  onNavigate?: (path: string) => void
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth()
  const [viewMode, setViewMode] = useState<'overview' | 'settings'>('overview')
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
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <UserLayout
      activeMenu="profile"
      onNavigate={onNavigate}
      userName={profile?.fullName || user?.fullName || 'Người dùng'}
      userEmail={profile?.email || user?.email || 'nguyen.an@example.com'}
      userRole={user?.role || 'User'}
      onLogout={async () => {
        await logout()
        onNavigate?.('/auth/login')
      }}
    >
      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto animate-pulse">
          <div className="h-6 w-36 bg-slate-200 rounded" />
          <div className="h-40 bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-3">
              <div className="h-6 w-48 bg-slate-200 rounded" />
              <div className="h-4 w-64 bg-slate-200 rounded" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-28 bg-white rounded-2xl border border-slate-200" />
            <div className="h-28 bg-white rounded-2xl border border-slate-200" />
            <div className="h-28 bg-white rounded-2xl border border-slate-200" />
          </div>
          <div className="h-64 bg-white rounded-2xl border border-slate-200" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="w-full max-w-md mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-slate-900">Không thể tải dữ liệu hồ sơ</h3>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
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
    </UserLayout>
  )
}
export default ProfilePage
