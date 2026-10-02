import React, { useState, useEffect } from 'react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { useAuth } from '../../../auth'
import { membersApi } from '../api/membersApi'
import { MemberTable } from '../components/MemberTable'
import { MemberDetailView } from '../components/MemberDetailView'
import { LockMemberModal } from '../components/LockMemberModal'
import { AdminDashboardOverview } from '../components/AdminDashboardOverview'
import type { MemberSummary, MemberDetail, MemberStats, MemberFilter } from '../types'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface MembersPageProps {
  onNavigate?: (path: string) => void
  initialView?: 'dashboard' | 'members'
}

export const MembersPage: React.FC<MembersPageProps> = ({
  onNavigate,
  initialView = 'members',
}) => {
  const { user, logout } = useAuth()
  const [currentView, setCurrentView] = useState<'dashboard' | 'list' | 'detail'>(
    initialView === 'dashboard' ? 'dashboard' : 'list',
  )
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [stats, setStats] = useState<MemberStats | null>(null)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [filter, setFilter] = useState<MemberFilter>({
    page: 1,
    pageSize: 7,
    status: 'all',
    sortBy: 'newest',
  })
  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null)
  const [lockTargetMember, setLockTargetMember] = useState<MemberSummary | null>(null)
  const [isLockModalOpen, setIsLockModalOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLocking, setIsLocking] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  // Sync view when initialView prop changes
  const [prevInitialView, setPrevInitialView] = useState(initialView)
  if (prevInitialView !== initialView) {
    setPrevInitialView(initialView)
    setCurrentView(initialView === 'dashboard' ? 'dashboard' : 'list')
  }

  // Load members and stats
  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        const [membersRes, statsRes] = await Promise.all([
          membersApi.getMembers(filter),
          membersApi.getMemberStats(),
        ])
        if (isMounted) {
          setMembers(membersRes.items)
          setTotalCount(membersRes.total)
          setStats(statsRes)
          setError(null)
          setIsLoading(false)
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof Error) {
            setError(err.message)
          } else {
            setError('Không thể tải dữ liệu thành viên.')
          }
          setIsLoading(false)
        }
      }
    }
    void fetchData()
    return () => {
      isMounted = false
    }
  }, [filter, reloadTrigger])

  const handleSelectMember = async (id: string) => {
    setIsLoading(true)
    try {
      const detail = await membersApi.getMemberDetail(id)
      setSelectedMember(detail)
      setCurrentView('detail')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenLockModal = (target: MemberSummary) => {
    setLockTargetMember(target)
    setIsLockModalOpen(true)
  }

  const handleConfirmLockToggle = async (memberId: string, reason?: string) => {
    setIsLocking(true)
    try {
      const res = await membersApi.toggleLockMember(memberId, reason)
      setFeedbackMessage(res.message)
      setTimeout(() => setFeedbackMessage(null), 4000)

      // If we are currently viewing this member's detail, update it
      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember(res.member)
      }

      setReloadTrigger((prev) => prev + 1)
    } finally {
      setIsLocking(false)
    }
  }

  let pageTitle = 'Quản lý thành viên'
  let pageSubtitle = 'Quản lý danh sách thành viên đã đăng ký và xem nội dung của họ.'

  if (currentView === 'dashboard') {
    pageTitle = 'Tổng quan hệ thống'
    pageSubtitle = 'Theo dõi và quản lý các nội dung chính trong hệ thống Vegetarian Support.'
  } else if (currentView === 'detail') {
    pageTitle = 'Chi tiết thành viên'
    pageSubtitle = 'Xem thông tin định danh và quản trị nội dung do thành viên đăng tải.'
  }

  return (
    <AdminLayout
      activeMenu={currentView === 'dashboard' ? 'dashboard' : 'members'}
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      onNavigate={(path) => {
        if (path === '/admin/dashboard') {
          setCurrentView('dashboard')
        } else if (path === '/admin/members') {
          setCurrentView('list')
        } else {
          onNavigate?.(path)
        }
      }}
      adminName={user?.fullName || 'Quản trị viên Admin'}
      adminEmail={user?.email || 'admin@vegetariansupport.vn'}
      onLogout={async () => {
        await logout()
        onNavigate?.('/auth/login')
      }}
    >
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold shadow-sm">
          ✓ {feedbackMessage}
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true)
              setError(null)
              setReloadTrigger((p) => p + 1)
            }}
            className="flex items-center gap-1 font-bold text-rose-700 hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Thử lại
          </button>
        </div>
      )}

      {/* View router */}
      {currentView === 'dashboard' ? (
        <AdminDashboardOverview onNavigateToMembers={() => setCurrentView('list')} />
      ) : currentView === 'detail' && selectedMember ? (
        <MemberDetailView
          member={selectedMember}
          onBack={() => setCurrentView('list')}
          onRequestLockToggle={() => handleOpenLockModal(selectedMember)}
          isLoading={isLoading}
        />
      ) : (
        stats && (
          <MemberTable
            members={members}
            stats={stats}
            totalCount={totalCount}
            currentPage={filter.page || 1}
            pageSize={filter.pageSize || 7}
            filter={filter}
            onFilterChange={(newF) => {
              setIsLoading(true)
              setFilter(newF)
            }}
            onSelectMember={handleSelectMember}
            onRequestLockToggle={handleOpenLockModal}
            isLoading={isLoading}
          />
        )
      )}

      {/* Lock/Unlock Modal */}
      <LockMemberModal
        member={lockTargetMember}
        isOpen={isLockModalOpen}
        onClose={() => {
          setIsLockModalOpen(false)
          setLockTargetMember(null)
        }}
        onConfirm={handleConfirmLockToggle}
        isLoading={isLocking}
      />
    </AdminLayout>
  )
}
export default MembersPage
