import React from 'react'
import { Globe, Video, Camera, Phone, Mail, Sparkles } from 'lucide-react'
import { Logo } from './Logo'

interface PublicLayoutProps {
  children: React.ReactNode
  activeNav?: string
  onNavigate?: (path: string) => void
  isLoggedIn?: boolean
  userName?: string
  onLogout?: () => void
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  activeNav = 'home',
  onNavigate,
  isLoggedIn = false,
  userName = 'Người dùng',
  onLogout,
}) => {
  const handleNavClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo / Brand */}
          <button
            type="button"
            onClick={() => handleNavClick('/')}
            className="flex items-center text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg"
          >
            <Logo iconSize="sm" />
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
            <button
              type="button"
              onClick={() => handleNavClick('/')}
              className={`transition-colors py-1 focus:outline-none ${
                activeNav === 'home'
                  ? 'text-emerald-600 font-semibold border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Trang chủ
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('/recipes')}
              className={`transition-colors py-1 focus:outline-none ${
                activeNav === 'recipes'
                  ? 'text-emerald-600 font-semibold border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Công thức
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('/articles')}
              className={`transition-colors py-1 focus:outline-none ${
                activeNav === 'articles'
                  ? 'text-emerald-600 font-semibold border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Bài viết
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('/videos')}
              className={`transition-colors py-1 focus:outline-none ${
                activeNav === 'videos'
                  ? 'text-emerald-600 font-semibold border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Video
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('/restaurants')}
              className={`transition-colors py-1 focus:outline-none ${
                activeNav === 'restaurants'
                  ? 'text-emerald-600 font-semibold border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Nhà hàng chay
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('/meal-plans')}
              className={`transition-colors py-1 focus:outline-none ${
                activeNav === 'meal-plans'
                  ? 'text-emerald-600 font-semibold border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Thực đơn
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('/ai-chat')}
              className={`flex items-center gap-1.5 transition-colors py-1 focus:outline-none ${
                activeNav === 'ai-chat'
                  ? 'text-emerald-600 font-semibold border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              <span>Trợ lý AI</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                Mới
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('/food-scan')}
              className={`flex items-center gap-1.5 transition-colors py-1 focus:outline-none ${
                activeNav === 'food-scan'
                  ? 'text-emerald-600 font-semibold border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              <span>Quét thực phẩm</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                HOT
              </span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleNavClick('/profile')}
                  className="text-sm font-medium text-slate-700 hover:text-emerald-600 transition-colors"
                >
                  Xin chào, <span className="font-semibold text-emerald-700">{userName}</span>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => handleNavClick('/auth/login')}
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('/auth/register')}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  Đăng ký
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

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

            {/* Col 2: Khám phá */}
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
              </ul>
            </div>

            {/* Col 3: Về chúng tôi */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                VỀ CHÚNG TÔI
              </h3>
              <ul className="flex flex-col gap-2.5 text-sm text-slate-600">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/about')}
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
                    onClick={() => handleNavClick('/privacy')}
                    className="hover:text-emerald-600 transition-colors text-left"
                  >
                    Chính sách bảo mật
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick('/terms')}
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
