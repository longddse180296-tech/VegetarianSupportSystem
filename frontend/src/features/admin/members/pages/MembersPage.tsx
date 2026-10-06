import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { getStoredToken } from '../../../../shared/api/apiClient'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
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
}

export default function MembersPage({ onNavigate }: MembersPageProps) {
  const { user, login: loginShared, logout: logoutShared } = useAuth()
  const [token, setToken] = useState(() => getStoredToken() ?? sessionStorage.getItem(TOKEN_KEY) ?? '')
  const [admin, setAdmin] = useState<{ id: string; fullName: string } | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<MemberPage | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [history, setHistory] = useState<StatusPage | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const [action, setAction] = useState<boolean | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

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
    const timeout = window.setTimeout(() => { setPage(1); setSearch(searchInput) }, 300)
    return () => window.clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    if (!token || !admin) return
    let active = true
    listMembers(token, search, status, page).then(result => { if (active) setData(result) })
      .catch((cause: unknown) => { if (active) { if (cause instanceof ApiError && cause.status === 401) signOut(); else setError(cause instanceof Error ? cause.message : 'Không tải được danh sách.') } })
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

  if (!token || !admin) return <main className="member-login-page"><form className="member-login" onSubmit={submitLogin}>
    <div className="brand-mark">✦</div><p className="eyebrow">VEGETARIAN SUPPORT · QUẢN TRỊ</p>
    <h1>Đăng nhập Admin</h1><p>Quản lý tài khoản thành viên và lịch sử khóa.</p>
    <label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="username" /></label>
    <label>Mật khẩu<input type="password" value={password} onChange={event => setPassword(event.target.value)} required autoComplete="current-password" /></label>
    {loginError && <p className="form-error" role="alert">{loginError}</p>}
    <button className="primary-button" disabled={loginBusy}>{loginBusy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
  </form></main>

  const total = data ? data.activeCount + data.lockedCount : 0
  const maxPage = Math.max(1, Math.ceil((data?.totalCount ?? 0) / 10))
  const maxHistoryPage = Math.max(1, Math.ceil((history?.totalCount ?? 0) / 10))

  return <AdminLayout
    activeMenu="members"
    pageTitle={selectedId ? 'Chi tiết thành viên' : 'Quản lý thành viên'}
    pageSubtitle="Tìm kiếm tài khoản, xem chi tiết và quản lý trạng thái truy cập."
    adminName={admin.fullName}
    adminEmail={user?.email ?? ''}
    onNavigate={onNavigate}
    onLogout={() => { signOut(); onNavigate?.('/auth/login') }}
  >
      <div className="admin-content">
        {selectedId ? <>
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
          <div className="page-heading"><div><p className="eyebrow">HỆ THỐNG QUẢN TRỊ</p><h1>Quản lý thành viên</h1><p>Tìm kiếm tài khoản, xem chi tiết và quản lý trạng thái truy cập.</p></div></div>
          <div className="stats-grid"><div className="stat-card"><span className="stat-icon green">♙</span><span>Tổng tài khoản</span><strong>{total}</strong></div><div className="stat-card"><span className="stat-icon blue">✓</span><span>Đang hoạt động</span><strong>{data?.activeCount ?? '—'}</strong></div><div className="stat-card"><span className="stat-icon red">⌁</span><span>Đã khóa</span><strong>{data?.lockedCount ?? '—'}</strong></div></div>
          <section className="list-panel"><div className="filters"><div className="search-box"><span>⌕</span><input aria-label="Tìm thành viên theo tên hoặc email" placeholder="Tìm theo tên hoặc email…" value={searchInput} onChange={event => setSearchInput(event.target.value)} /></div><div className="filter-tabs"><button className={status === 'all' ? 'chosen' : ''} onClick={() => { setStatus('all'); setPage(1) }}>Tất cả</button><button className={status === 'active' ? 'chosen' : ''} onClick={() => { setStatus('active'); setPage(1) }}>Hoạt động</button><button className={status === 'locked' ? 'chosen' : ''} onClick={() => { setStatus('locked'); setPage(1) }}>Bị khóa</button></div><span className="sort-label">Mới nhất ↓</span></div>
            <div className="section-heading list-heading"><div><h2>Danh sách thành viên <span className="count-tag">{data?.totalCount ?? 0}</span></h2><p>Kết quả được phân trang từ hệ thống.</p></div></div>
            <div className="table-scroll"><table><thead><tr><th>THÀNH VIÊN</th><th>EMAIL</th><th>NGÀY THAM GIA</th><th>VAI TRÒ</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>{data?.items.map(item => <tr key={item.id}><td><div className="member-name"><span className="mini-avatar">{item.fullName.slice(0, 1).toUpperCase()}</span><strong>{item.fullName}</strong></div></td><td>{item.email}</td><td>{date(item.joinedAtUtc)}</td><td>{item.role}</td><td><span className={`status-pill ${item.isLocked ? 'locked' : 'active'}`}>{item.isLocked ? 'Bị khóa' : 'Hoạt động'}</span></td><td><button className="text-button" onClick={() => { setSelectedId(item.id); setHistoryPage(1); setMember(null); setHistory(null); setError('') }}>Xem chi tiết →</button></td></tr>)}</tbody></table></div>
            {!data?.items.length && <p className="empty-state">Không tìm thấy thành viên phù hợp.</p>}
            <div className="table-footer"><span>{data?.totalCount ? `Hiển thị ${(page - 1) * 10 + 1}–${Math.min(page * 10, data.totalCount)} trong ${data.totalCount} tài khoản` : '0 tài khoản'}</span><div className="pagination"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Trước</button><span>{page} / {maxPage}</span><button disabled={page >= maxPage} onClick={() => setPage(value => value + 1)}>Sau</button></div></div>
          </section>
        </>}
        {error && <p className="form-error page-error" role="alert">{error}</p>}
      </div>
    {action !== null && member && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setAction(null) }}><form className="status-modal" onSubmit={submitAction} role="dialog" aria-modal="true" aria-labelledby="status-title"><span className={`stat-icon ${action ? 'red' : 'green'}`}>{action ? '⌁' : '✓'}</span><h2 id="status-title">{action ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}</h2><p>{action ? 'Thành viên sẽ không thể đăng nhập hoặc dùng JWT hiện có.' : 'Thành viên sẽ có thể đăng nhập và truy cập lại.'}</p><strong>{member.fullName}</strong><label>Lý do {action ? 'khóa' : 'mở khóa'} <span>*</span><textarea value={reason} maxLength={1000} onChange={event => setReason(event.target.value)} placeholder="Nhập lý do cụ thể…" required /></label><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setAction(null)}>Hủy</button><button className={action ? 'danger-button' : 'primary-button'} disabled={busy || !reason.trim()}>{busy ? 'Đang lưu…' : action ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}</button></div></form></div>}
  </AdminLayout>
}
