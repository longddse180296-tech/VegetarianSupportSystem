import React, { useMemo, useState } from 'react'
import { useAuth } from '../../auth'

type ViewMode = 'dashboard' | 'members'

interface Props {
  onNavigate?: (path: string) => void
  initialView?: ViewMode
}

interface DemoMember {
  id: string
  fullName: string
  email: string
  role: 'admin' | 'nutritionist' | 'member' | 'banned'
  joinedAt: string
  recipesCreated: number
  mealplans: number
  status: 'Active' | 'Suspended' | 'Pending'
}

const DEMO: DemoMember[] = [
  { id: 'm1', fullName: 'Nguyễn Thị Mai', email: 'mai.nt@vegetarian.vn', role: 'member', joinedAt: '2025-01-12', recipesCreated: 23, mealplans: 8, status: 'Active' },
  { id: 'm2', fullName: 'Lê Văn An', email: 'an.lv@vegetarian.vn', role: 'member', joinedAt: '2025-02-08', recipesCreated: 11, mealplans: 3, status: 'Active' },
  { id: 'm3', fullName: 'Phạm Hồng Linh', email: 'linh.ph@vegetarian.vn', role: 'nutritionist', joinedAt: '2024-11-01', recipesCreated: 56, mealplans: 34, status: 'Active' },
  { id: 'm4', fullName: 'Trần Minh Quân', email: 'quan.tm@vegetarian.vn', role: 'admin', joinedAt: '2024-06-22', recipesCreated: 112, mealplans: 90, status: 'Active' },
  { id: 'm5', fullName: 'Đặng Phước Toàn', email: 'toan.dp@vegetarian.vn', role: 'member', joinedAt: '2025-09-05', recipesCreated: 4, mealplans: 1, status: 'Pending' },
  { id: 'm6', fullName: 'Hoàng Việt Dũng', email: 'dung.hv@spam.vn', role: 'banned', joinedAt: '2025-04-14', recipesCreated: 0, mealplans: 0, status: 'Suspended' },
]

function Stat({
  label, value, delta, tone = 'emerald', icon,
}: { label: string; value: string; delta?: string; tone?: 'emerald' | 'amber' | 'sky' | 'rose'; icon: string }) {
  const toneMap = {
    emerald: 'from-emerald-50 to-emerald-100 text-emerald-800 border-emerald-200',
    amber: 'from-amber-50 to-amber-100 text-amber-800 border-amber-200',
    sky: 'from-sky-50 to-sky-100 text-sky-800 border-sky-200',
    rose: 'from-rose-50 to-rose-100 text-rose-800 border-rose-200',
  } as const
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${toneMap[tone]} p-4`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold opacity-90">{label}</div>
        <div className="text-xl">{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight">{value}</div>
      {delta && <div className="mt-1 text-xs font-semibold opacity-80">{delta}</div>}
    </div>
  )
}

export const MembersPage: React.FC<Props> = ({ onNavigate, initialView = 'members' }) => {
  const [view, setView] = useState<ViewMode>(initialView)
  const [q, setQ] = useState('')
  const [role, setRole] = useState<string>('all')
  const { user } = useAuth()

  const rows = useMemo(() => {
    return DEMO.filter((m) =>
      (role === 'all' || m.role === role) &&
      (!q.trim() || m.fullName.toLowerCase().includes(q.toLowerCase()) || m.email.toLowerCase().includes(q.toLowerCase()))
    )
  }, [q, role])

  const totalMembers = DEMO.filter((m) => m.role === 'member').length
  const totalAdmins = DEMO.filter((m) => m.role === 'admin' || m.role === 'nutritionist').length
  const activeThisMonth = 41

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin · Vegetarian Support</div>
            <h1 className="text-xl font-extrabold text-slate-900">
              {view === 'dashboard' ? 'Tổng quan quản trị' : 'Quản lý thành viên'}
            </h1>
            <div className="text-sm text-slate-600 mt-1">
              Xin chào <span className="font-semibold text-emerald-700">{user?.fullName ?? 'Quản trị viên'}</span>.
              Bạn đang có quyền {user?.role === 'admin' ? 'Toàn quyền (Admin)' : 'Xem & Góp ý'}.
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition ${view === 'dashboard' ? 'bg-emerald-700 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
              onClick={() => setView('dashboard')}
            >
              📊 Bảng điều khiển
            </button>
            <button
              type="button"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition ${view === 'members' ? 'bg-emerald-700 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
              onClick={() => setView('members')}
            >
              👥 Thành viên
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('/recipes')}
              className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm font-medium hover:bg-slate-50"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {view === 'dashboard' ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Tổng người dùng" value={`${DEMO.length}`} delta={`+${activeThisMonth} hoạt động 30 ngày qua`} tone="emerald" icon="👥" />
              <Stat label="Thành viên thường" value={`${totalMembers}`} delta="+ 4.3% so với tuần trước" tone="sky" icon="🌱" />
              <Stat label="Chuyên gia / Admin" value={`${totalAdmins}`} delta="2 chuyên gia dinh dưỡng" tone="amber" icon="🧑‍🍳" />
              <Stat label="Tài khoản bị đình chỉ" value={`${DEMO.filter((m) => m.status === 'Suspended').length}`} delta="Giảm 1 so với tuần trước" tone="rose" icon="🚫" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900">Hoạt động nội dung theo tuần (mẫu)</h3>
                  <span className="text-xs text-slate-500">Đơn vị: lượt tương tác</span>
                </div>
                <div className="space-y-2 text-sm">
                  {['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4 (Hiện tại)'].map((label, i) => {
                    const vals = [120, 210, 180, 260]
                    const v = vals[i]
                    const pct = Math.round((v / 300) * 100)
                    return (
                      <div key={label} className="grid grid-cols-[120px_1fr_48px] items-center gap-3">
                        <div className="font-medium text-slate-700">{label}</div>
                        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-700" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-right font-semibold text-slate-700">{v}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="font-bold text-slate-900 mb-3">Lối tắt quản trị</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Công thức', icon: '🍲', to: '/recipes' },
                    { label: 'Nguyên liệu', icon: '🥬', to: '/admin/ingredients' },
                    { label: 'Danh mục', icon: '📚', to: '/admin/categories' },
                    { label: 'Kế hoạch tuần', icon: '📅', to: '/meal-plans' },
                    { label: 'Bình luận', icon: '💬', to: '/admin/comments' },
                    { label: 'Nhà hàng', icon: '🍽', to: '/restaurants' },
                  ].map((l) => (
                    <button
                      key={l.label}
                      type="button"
                      onClick={() => onNavigate?.(l.to)}
                      className="rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 py-3 px-3 text-left transition"
                    >
                      <div className="text-xl mb-0.5">{l.icon}</div>
                      <div className="font-semibold text-slate-800">{l.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
              <div className="flex flex-wrap gap-2">
                <input
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 w-72"
                  placeholder="Tìm theo tên / email..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="member">Thành viên</option>
                  <option value="nutritionist">Chuyên gia dinh dưỡng</option>
                  <option value="admin">Admin</option>
                  <option value="banned">Bị đình chỉ</option>
                </select>
              </div>
              <button
                type="button"
                className="px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 shadow-sm"
              >
                ＋ Mời thành viên mới
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Họ tên</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Vai trò</th>
                    <th className="px-4 py-3 font-semibold text-center">Công thức</th>
                    <th className="px-4 py-3 font-semibold text-center">Thực đơn</th>
                    <th className="px-4 py-3 font-semibold">Ngày gia nhập</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{r.fullName}</div>
                        <div className="text-xs text-slate-500">ID: {r.id}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{r.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            r.role === 'admin'
                              ? 'bg-rose-100 text-rose-700'
                              : r.role === 'nutritionist'
                              ? 'bg-violet-100 text-violet-700'
                              : r.role === 'banned'
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {r.role === 'admin'
                            ? 'Admin'
                            : r.role === 'nutritionist'
                            ? 'Chuyên gia'
                            : r.role === 'banned'
                            ? 'Bị khóa'
                            : 'Thành viên'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-slate-700">{r.recipesCreated}</td>
                      <td className="px-4 py-3 text-center font-medium text-slate-700">{r.mealplans}</td>
                      <td className="px-4 py-3 text-slate-600">{r.joinedAt}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            r.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : r.status === 'Pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {r.status === 'Active' ? 'Hoạt động' : r.status === 'Pending' ? 'Chờ duyệt' : 'Bị đình chỉ'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1.5">
                          <button className="px-2 py-1 rounded-md text-xs border border-slate-300 text-slate-700 hover:bg-slate-50">Sửa</button>
                          <button className={`px-2 py-1 rounded-md text-xs border ${r.role === 'banned' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-rose-300 text-rose-700 bg-rose-50'}`}>
                            {r.role === 'banned' ? 'Mở khóa' : 'Khóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                        Không tìm thấy thành viên nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default MembersPage
