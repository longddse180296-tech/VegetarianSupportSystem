import { useEffect, useState } from 'react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { useAuth } from '../../../auth/hooks/useAuth'
import { getStoredToken } from '../../../../shared/api/apiClient'
import { listMembers, type MemberPage } from '../../members/api/membersApi'

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))

export default function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps) {
  const { user, isAdmin, isLoading, logout } = useAuth()
  const [members, setMembers] = useState<MemberPage | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!isAdmin) return
    const token = getStoredToken()
    if (!token) return
    let active = true
    listMembers(token, '', 'all', 1)
      .then((result) => { if (active) { setMembers(result); setError('') } })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Không tải được số liệu thành viên.')
      })
    return () => { active = false }
  }, [isAdmin, retry])

  if (isLoading) return <main className="p-8">Đang kiểm tra phiên đăng nhập…</main>
  if (!isAdmin) return <main className="p-8"><p>Chỉ Admin được xem trang này.</p><button onClick={() => onNavigate('/auth/login')}>Đăng nhập</button></main>

  const total = members ? members.activeCount + members.lockedCount : null

  return <AdminLayout
    activeMenu="dashboard"
    pageTitle="Tổng quan hệ thống"
    pageSubtitle="Số liệu thành viên từ hệ thống hiện tại."
    adminName={user?.fullName ?? 'Admin'}
    adminEmail={user?.email ?? ''}
    availableNavIds={['dashboard', 'members']}
    onNavigate={onNavigate}
    onLogout={() => { void logout().then(() => onNavigate('/auth/login')) }}
  >
    {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      {error} <button className="ml-3 font-semibold underline" onClick={() => setRetry((value) => value + 1)}>Thử lại</button>
    </div>}
    <div className="grid gap-5 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"><p className="text-sm text-slate-500">Tổng tài khoản</p><strong className="mt-2 block text-3xl text-slate-900">{total ?? '—'}</strong></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"><p className="text-sm text-slate-500">Đang hoạt động</p><strong className="mt-2 block text-3xl text-emerald-700">{members?.activeCount ?? '—'}</strong></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"><p className="text-sm text-slate-500">Đã khóa</p><strong className="mt-2 block text-3xl text-rose-600">{members?.lockedCount ?? '—'}</strong></div>
    </div>
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-slate-900">Thành viên mới tham gia</h2>
        <button className="text-sm font-semibold text-emerald-700 hover:underline" onClick={() => onNavigate('/admin/members')}>Xem tất cả →</button>
      </div>
      {members?.items.length ? <ul className="divide-y divide-slate-100">
        {members.items.slice(0, 5).map((member) => <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
          <span><strong className="text-slate-900">{member.fullName}</strong><small className="ml-3 text-slate-500">{member.email}</small></span>
          <span className="text-slate-500">{formatDate(member.joinedAtUtc)}</span>
        </li>)}
      </ul> : <p className="text-sm text-slate-500">{members ? 'Chưa có thành viên.' : 'Đang tải dữ liệu…'}</p>}
    </section>
  </AdminLayout>
}
