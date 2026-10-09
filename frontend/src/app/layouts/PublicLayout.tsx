import React from 'react'
import { Globe, Video, Camera, Phone, Mail, Sparkles } from 'lucide-react'
import AppHeader from './AppHeader'
import Logo from './Logo'

interface PublicLayoutProps {
  children: React.ReactNode
  activeNav?: string
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
  userName?: string
  avatarUrl?: string
  onLogout?: () => void
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  activeNav = 'home',
  onNavigate,
  isLoggedIn = false,
  userName = 'Người dùng',
  avatarUrl,
  onLogout,
}) => {
  const handleNavClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Single canonical header — avoids duplicate nav bars between md breakpoints */}
      <AppHeader
        activeNav={activeNav}
        isLoggedIn={isLoggedIn}
        userName={userName}
        avatarUrl={avatarUrl}
        onLogout={onLogout}
        onNavigate={onNavigate}
      />

      {/* Main Content Body */}
      <main className="flex-1 w-full">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto pt-12 pb-6">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Col 1: Brand & Mission */}
            <div className="flex flex-col gap-4">
              <Logo iconSize="sm" />
              <p className="text-sm text-slate-600 leading-relaxed">
                Nền tảng hỗ trợ dinh dưỡng thực vật khoa học hàng đầu, đồng hành cùng bạn trên lộ
                trình xây dựng lối sống thuần thực vật lành mạnh, tối ưu chỉ số BMI và cân bằng thể
                chất.
              </p>
              <div className="flex items-center gap-3 text-slate-400">
                <button
                  type="button"
                  aria-label="Website"
                  className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Video"
                  className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Instagram"
                  className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Col 2: Khám phá — every button maps to a real route */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                KHÁM PHÁ
              </h3>
              <ul className="flex flex-col gap-2.5 text-sm text-slate-600">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/recipes')}
                    className="hover:text-emerald-600 transition-colors text-left"
                  >
                    Công thức nấu chay
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/meal-plans')}
                    className="hover:text-emerald-600 transition-colors text-left"
                  >
                    Kế hoạch thực đơn tuần
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/articles')}
                    className="hover:text-emerald-600 transition-colors text-left"
                  >
                    Kiến thức & Bài viết
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/videos')}
                    className="hover:text-emerald-600 transition-colors text-left"
                  >
                    Video hướng dẫn chế biến
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/restaurants')}
                    className="hover:text-emerald-600 transition-colors text-left"
                  >
                    Địa điểm nhà hàng chay
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/pantry')}
                    className="hover:text-emerald-600 transition-colors text-left"
                  >
                    Gợi ý món từ Tủ bếp AI
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Về chúng tôi — buttons all route to real pages */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                VỀ CHÚNG TÔI
              </h3>
              <ul className="flex flex-col gap-2.5 text-sm text-slate-600">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/home')}
                    className="hover:text-emerald-600 transition-colors text-left"
                  >
                    Giới thiệu dự án
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/ai-chat')}
                    className="hover:text-emerald-600 transition-colors text-left"
                  >
                    Trợ lý dinh dưỡng AI
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/food-scan')}
                    className="hover:text-emerald-600 transition-colors text-left"
                  >
                    Quét & Phân tích món ăn
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/pantry')}
                    className="hover:text-emerald-600 transition-colors text-left"
                  >
                    Gợi ý món từ Tủ Bếp AI
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/articles')}
                    className="hover:text-emerald-600 transition-colors text-left"
                  >
                    Chính sách bảo mật
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/profile')}
                    className="hover:text-emerald-600 transition-colors text-left"
                  >
                    Điều khoản dịch vụ
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Tư vấn dinh dưỡng */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                TƯ VẤN DINH DƯỠNG
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Nhận tư vấn thực đơn thuần chay theo chỉ số BMI cá nhân hóa từ chuyên gia & Trợ lý
                AI.
              </p>
              <div className="flex flex-col gap-2 text-sm text-slate-700 mt-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Hotline: 1900 888 666 (Hỗ trợ 24/7)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>lienhe@vegetariansupport.vn</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-bar Copyright */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2025 Vegetarian Support. Nền tảng dinh dưỡng chay thông minh.</p>
            <p className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Khỏe mạnh tự nhiên • Thấu hiểu dinh dưỡng</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
