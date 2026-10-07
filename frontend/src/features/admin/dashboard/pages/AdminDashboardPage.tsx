import React, { useEffect, useState } from 'react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { getDashboardOverview } from '../api/dashboardApi'
import type { DashboardOverviewData } from '../types/dashboard.types'
import { StatCards } from '../components/StatCards'
import { QuickActions } from '../components/QuickActions'
import { RecentListsAndActivity } from '../components/RecentListsAndActivity'
import { ChartPlaceholder } from '../components/ChartPlaceholder'

interface AdminDashboardPageProps {
  onNavigate?: (path: string) => void
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigate,
}) => {
  const [data, setData] = useState<DashboardOverviewData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    let isMounted = true
    const loadOverview = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await getDashboardOverview()
        if (isMounted) {
          setData(res)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Không thể tải dữ liệu bảng điều khiển tổng quan'
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void loadOverview()
    return () => {
      isMounted = false
    }
  }, [refreshTrigger])

  return (
    <AdminLayout
      activeMenu="dashboard"
      pageTitle="Tổng quan hệ thống"
      pageSubtitle="Theo dõi và quản lý các nội dung chính trong hệ thống Vegetarian Support."
      onNavigate={onNavigate}
    >
      <div className="space-y-8 pb-12">
        {/* Top Status & Admin Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 -mt-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Hệ thống hoạt động ổn định
            </span>
          </div>

          <div className="flex items-center gap-2.5 bg-white border border-gray-200/80 px-3.5 py-1.5 rounded-2xl shadow-xs">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
              alt="Admin"
              className="w-6 h-6 rounded-full object-cover border border-emerald-200"
            />
            <span className="text-xs font-bold text-gray-800">Admin</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-3xl" />
              ))}
            </div>
            <div className="h-28 bg-gray-200 rounded-3xl" />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 h-80 bg-gray-200 rounded-3xl" />
              <div className="lg:col-span-2 h-80 bg-gray-200 rounded-3xl" />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-center text-red-700">
            <p className="text-xs font-bold mb-2">Đã xảy ra lỗi khi tải dữ liệu</p>
            <p className="text-xs text-red-600 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Loaded Content */}
        {!loading && !error && data && (
          <>
            {/* 1. Stat Cards (5 Cards) */}
            <StatCards stats={data.stats} onNavigate={onNavigate} />

            {/* 2. Quick Actions Shortcuts */}
            <QuickActions onNavigate={onNavigate} />

            {/* 3. Recent Articles & Videos vs Activities */}
            <RecentListsAndActivity
              articles={data.recentArticles}
              videos={data.recentVideos}
              activities={data.recentActivities}
              onNavigate={onNavigate}
            />

            {/* 4. Chart Growth Trends Placeholder */}
            <ChartPlaceholder />
          </>
        )}
      </div>
    </AdminLayout>
  )
}
