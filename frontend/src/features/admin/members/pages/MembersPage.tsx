import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { getStoredToken } from '../../../../shared/api/apiClient'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { MemberTable, type LiveMemberFilter } from '../components/MemberTable'
import { AdminDashboardPage } from '../../dashboard/pages/AdminDashboardPage'
import {
  ApiError, changeStatus, currentUser, getHistory, getMember, listMembers,
  type MemberDetail, type MemberPage, type StatusPage,
} from '../api/membersApi'
import './members.css'

const TOKEN_KEY = 'vegetarian.admin.accessToken'
const date = (value: string) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
const dateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))

interface MembersPageProps {
  onNavigate?: (path: string) => void
  initialView?: 'dashboard' | 'members'
}

export default function MembersPage({ onNavigate, initialView = 'members' }: MembersPageProps) {
  const { user, login: loginShared, logout: logoutShared } = useAuth()
  const [token, setToken] = useState(() => getStoredToken() ?? sessionStorage.getItem(TOKEN_KEY) ?? '')
  const [admin, setAdmin] = useState<{ id: string; fullName: string } | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<LiveMemberFilter['status']>('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<MemberPage | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [history, setHistory] = useState<StatusPage | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const [action, setAction] = useState<boolean | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [viewMode, setViewMode] = useState<'dashboard' | 'members'>(initialView)

  const signOut = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    void logoutShared()
    setToken('')
    setAdmin(null)
    setData(null)
    setMember(null)
    setSelectedId(null)
  }, [logoutShared])

  useEffect(() => {
    if (!token) return
    let active = true
    currentUser(token).then(user => {
      if (!active) return
      if (user.role !== 'Admin') { signOut(); setLoginError('Tài khoản này không có quyền Admin.'); return }
      setAdmin({ id: user.id, fullName: user.fullName })
    }).catch(() => { if (active) { signOut(); setLoginError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') } })
    return () => { active = false }
  }, [token, signOut])

  useEffect(() => {
    if (!token || !admin) return
    let active = true
    listMembers(token, search, status, page).then(result => { if (active) { setData(result); setListLoading(false) } })
      .catch((cause: unknown) => { if (active) { setListLoading(false); if (cause instanceof ApiError && cause.status === 401) signOut(); else setError(cause instanceof Error ? cause.message : 'Không tải được danh sách.') } })
    return () => { active = false }
  }, [token, admin, search, status, page, refresh, signOut])

  useEffect(() => {
    if (!selectedId || !token) return
    let active = true
    Promise.all([getMember(token, selectedId), getHistory(token, selectedId, historyPage)])
      .then(([detail, events]) => { if (active) { setMember(detail); setHistory(events) } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Không tải được chi tiết.') })
    return () => { active = false }
  }, [selectedId, token, historyPage, refresh])

  async function submitLogin(event: FormEvent) {
    event.preventDefault()
    setLoginError('')
    setLoginBusy(true)
    try {
      const user = await loginShared({ email, password })
      if (user.role !== 'Admin') { signOut(); setLoginError('Tài khoản này không có quyền Admin.'); return }
      const accessToken = getStoredToken()
      if (!accessToken) throw new Error('Không lưu được phiên đăng nhập.')
      setToken(accessToken)
      setPassword('')
    } catch (cause) { setLoginError(cause instanceof Error ? cause.message : 'Đăng nhập thất bại.') }
    finally { setLoginBusy(false) }
  }

  async function submitAction(event: FormEvent) {
    event.preventDefault()
    if (!member || action === null || !reason.trim()) return
    setBusy(true)
    setError('')
    try {
      await changeStatus(token, member.id, action, reason.trim())
      setAction(null)
      setReason('')
      setRefresh(value => value + 1)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không cập nhật được trạng thái.') }
    finally { setBusy(false) }
  }

  function selectMember(id: string) {
    setSelectedId(id)
    setHistoryPage(1)
    setMember(null)
    setHistory(null)
    setError('')
  }

  async function openStatusFromList(id: string) {
    setError('')
    try {
      const detail = await getMember(token, id)
      setMember(detail)
      setReason('')
      setAction(!detail.isLocked)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tải được thành viên.')
    }
  }

  function changeFilter(filter: LiveMemberFilter) {
    if (filter.search === search && filter.status === status && filter.page === page) return
    setListLoading(true)
    setSearch(filter.search)
    setStatus(filter.status)
    setPage(filter.page)
    setError('')
  }

  if (!token || !admin) return <main className="member-login-page"><form className="member-login" onSubmit={submitLogin}>
    <div className="brand-mark">✦</div><p className="eyebrow">VEGETARIAN SUPPORT · QUẢN TRỊ</p>
    <h1>Đăng nhập Admin</h1><p>Quản lý tài khoản thành viên và lịch sử khóa.</p>
    <label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="username" /></label>
    <label>Mật khẩu<input type="password" value={password} onChange={event => setPassword(event.target.value)} required autoComplete="current-password" /></label>
    {loginError && <p className="form-error" role="alert">{loginError}</p>}
    <button className="primary-button" disabled={loginBusy}>{loginBusy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
  </form></main>

  const maxHistoryPage = Math.max(1, Math.ceil((history?.totalCount ?? 0) / 10))

  return <AdminLayout
    activeMenu={viewMode === 'dashboard' ? 'dashboard' : 'members'}
    pageTitle={selectedId ? 'Chi tiết thành viên' : viewMode === 'dashboard' ? 'Tổng quan hệ thống' : 'Quản lý thành viên'}
    pageSubtitle={viewMode === 'dashboard' ? 'Số liệu tổng hợp hoạt động tài khoản, thành viên, đăng ký.' : 'Tìm kiếm tài khoản, xem chi tiết và quản lý trạng thái truy cập.'}
    adminName={admin.fullName}
    adminEmail={user?.email ?? ''}
    availableNavIds={['dashboard', 'members']}
    onNavigate={(path) => {
      if (path === '/admin/dashboard') setViewMode('dashboard')
      else if (path === '/admin/members') {
        setViewMode('members')
        setSelectedId(null)
      } else onNavigate?.(path)
    }}
    onLogout={() => { signOut(); onNavigate?.('/auth/login') }}
  >
      <div className="admin-content">
        {viewMode === 'dashboard' ? (
          <AdminDashboardPage
            onNavigate={(p: string) => {
              if (p === '/admin/members') setViewMode('members')
              else onNavigate?.(p)
            }}
          />
        ) : selectedId ? <>
          <div className="page-heading"><div><p className="eyebrow">QUẢN LÝ THÀNH VIÊN</p><h1>Chi tiết thành viên</h1><p>Thông tin tài khoản và lịch sử khóa/mở khóa.</p></div><button className="outline-button" onClick={() => { setSelectedId(null); setMember(null); setHistory(null); setError('') }}>← Quay lại danh sách</button></div>
          {member ? <>
            <section className="detail-hero"><div className="large-avatar">{member.fullName.slice(0, 1).toUpperCase()}</div><div className="detail-heading"><div><h2>{member.fullName}</h2><span className="role-tag">{member.role}</span><span className={`status-pill ${member.isLocked ? 'locked' : 'active'}`}>{member.isLocked ? 'Bị khóa' : 'Hoạt động'}</span></div><p>{member.email}</p></div><button className={member.isLocked ? 'primary-button' : 'danger-button'} disabled={!member.isLocked && member.id === admin.id} onClick={() => { setAction(!member.isLocked); setReason(''); setError('') }}>{member.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}</button></section>
            <div className="detail-grid"><div className="detail-card"><span>ID thành viên</span><strong className="mono">{member.id}</strong></div><div className="detail-card"><span>Ngày tham gia</span><strong>{date(member.joinedAtUtc)}</strong></div><div className="detail-card"><span>Trạng thái</span><strong>{member.isLocked ? 'Đang bị khóa' : 'Đang hoạt động'}</strong></div></div>
            {member.isLocked && <div className="lock-note"><strong>Lý do khóa hiện tại</strong><p>{member.currentLockReason}</p><small>Khóa lúc {member.lockedAtUtc ? dateTime(member.lockedAtUtc) : '—'}</small></div>}
            <section className="history-card"><div className="section-heading"><div><h2>Lịch sử khóa/mở khóa</h2><p>Admin thực hiện, thời điểm và lý do của từng thay đổi.</p></div><span className="count-tag">{history?.totalCount ?? 0} lần</span></div>
              {history?.items.length ? <div className="history-list">{history.items.map(item => <div className="history-item" key={item.id}><span className={`history-icon ${item.isLocked ? 'lock' : 'unlock'}`}>{item.isLocked ? '⌁' : '✓'}</span><div><strong>{item.isLocked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản'}</strong><p>{item.reason}</p><small>{item.adminName} · {dateTime(item.occurredAtUtc)}</small></div></div>)}</div> : <p className="empty-state">Chưa có lịch sử thay đổi trạng thái.</p>}
              {maxHistoryPage > 1 && <div className="pagination"><button disabled={historyPage <= 1} onClick={() => setHistoryPage(value => value - 1)}>Trước</button><span>Trang {historyPage} / {maxHistoryPage}</span><button disabled={historyPage >= maxHistoryPage} onClick={() => setHistoryPage(value => value + 1)}>Sau</button></div>}
            </section>
          </> : <p className="empty-state">Đang tải thành viên…</p>}
        </> : <>
          <MemberTable
            members={data?.items ?? []}
            totalCount={data?.totalCount ?? 0}
            activeCount={data?.activeCount ?? 0}
            lockedCount={data?.lockedCount ?? 0}
            currentPage={page}
            pageSize={10}
            currentAdminId={admin.id}
            filter={{ search, status, page }}
            onFilterChange={changeFilter}
            onSelectMember={selectMember}
            onRequestLockToggle={(item) => { void openStatusFromList(item.id) }}
            isLoading={listLoading}
          />
        </>}
        {error && <p className="form-error page-error" role="alert">{error}</p>}
      </div>
    {action !== null && member && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setAction(null) }}><form className="status-modal" onSubmit={submitAction} role="dialog" aria-modal="true" aria-labelledby="status-title"><span className={`stat-icon ${action ? 'red' : 'green'}`}>{action ? '⌁' : '✓'}</span><h2 id="status-title">{action ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}</h2><p>{action ? 'Thành viên sẽ không thể đăng nhập hoặc dùng JWT hiện có.' : 'Thành viên sẽ có thể đăng nhập và truy cập lại.'}</p><strong>{member.fullName}</strong><label>Lý do {action ? 'khóa' : 'mở khóa'} <span>*</span><textarea value={reason} maxLength={1000} onChange={event => setReason(event.target.value)} placeholder="Nhập lý do cụ thể…" required /></label><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setAction(null)}>Hủy</button><button className={action ? 'danger-button' : 'primary-button'} disabled={busy || !reason.trim()}>{busy ? 'Đang lưu…' : action ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}</button></div></form></div>}
  </AdminLayout>
}
