import React, { useState } from 'react'
import { useAuth } from '../auth'

export interface ProfilePageProps {
  onNavigate?: (path: string) => void
}

const GOALS = [
  { key: 'lose_weight', label: '⚖️ Giảm cân an toàn', desc: 'Chế độ ít calo, nhiều rau củ & protein chay' },
  { key: 'maintain', label: '🌿 Duy trì cân nặng', desc: 'Cân bằng 3 nhóm dưỡng chất theo khẩu phần' },
  { key: 'gain_muscle', label: '💪 Tăng cơ thực vật', desc: 'Nạp đủ đạm đậu nành, hạt, đạm thực vật' },
  { key: 'vegan_lifestyle', label: '🎋 Lối sống thuần chay', desc: 'Tập trung loại bỏ sản phẩm nguồn gốc động vật' },
]

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth()
  const [goal, setGoal] = useState<string>('vegan_lifestyle')
  const [notify, setNotify] = useState({ email: true, push: false, weekly: true })

  const fullName = user?.fullName ?? 'Khách'
  const initials = fullName
    .split(' ')
    .map((w) => w.slice(0, 1))
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Hồ sơ của tôi</h1>
            <p className="text-sm text-slate-600">
              Tùy chỉnh thông tin, mục tiêu dinh dưỡng & thông báo Vegetarian Support.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onNavigate?.('/recipes')}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm font-medium hover:bg-slate-50"
            >
              ← Trở về Khám phá
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="px-4 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-sm font-medium hover:bg-rose-100"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <aside className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4 h-fit">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-700 text-white font-extrabold text-2xl flex items-center justify-center">
                {initials || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 truncate">{fullName}</div>
                <div className="text-sm text-slate-500 truncate">{user?.email ?? 'Chưa đăng nhập'}</div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                    {user?.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-sm p-4 text-emerald-800">
              <div className="font-semibold mb-1">🌱 Chỉ số nhanh (mẫu)</div>
              <ul className="space-y-1">
                <li>BMI tham khảo: 21.8 (Phạm vi khỏe mạnh)</li>
                <li>Tuần thực đơn: 2 / 7 ngày đã gợi ý</li>
                <li>Số công thức đã yêu thích: 12</li>
              </ul>
            </div>
          </aside>

          <section className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Mục tiêu dinh dưỡng</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOALS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setGoal(g.key)}
                    className={`text-left rounded-xl border p-4 transition ${
                      goal === g.key
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold text-slate-900">{g.label}</div>
                    <div className="text-sm text-slate-600 mt-1">{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Thông báo</h2>
              <div className="space-y-3 text-sm">
                <label className="inline-flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 w-full">
                  <input
                    type="checkbox"
                    className="accent-emerald-600 w-4 h-4"
                    checked={notify.email}
                    onChange={(e) => setNotify((n) => ({ ...n, email: e.target.checked }))}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">Email thông báo hàng tuần</div>
                    <div className="text-slate-500 text-xs">Tóm tắt kế hoạch thực đơn + nhận xét dinh dưỡng tuần.</div>
                  </div>
                </label>
                <label className="inline-flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 w-full">
                  <input
                    type="checkbox"
                    className="accent-emerald-600 w-4 h-4"
                    checked={notify.weekly}
                    onChange={(e) => setNotify((n) => ({ ...n, weekly: e.target.checked }))}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">Gợi ý thực đơn sáng mỗi ngày</div>
                    <div className="text-slate-500 text-xs">Dựa trên thói quen & kho nguyên liệu của bạn.</div>
                  </div>
                </label>
                <label className="inline-flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 w-full">
                  <input
                    type="checkbox"
                    className="accent-emerald-600 w-4 h-4"
                    checked={notify.push}
                    onChange={(e) => setNotify((n) => ({ ...n, push: e.target.checked }))}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">Thông báo đẩy (Push)</div>
                    <div className="text-slate-500 text-xs">Nhắc nhở giờ ăn, nhắc log bữa ăn nhanh.</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50">
                Hủy
              </button>
              <button type="button" className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 shadow-sm">
                💾 Lưu thay đổi
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
