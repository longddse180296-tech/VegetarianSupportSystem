import { useEffect, useState } from 'react'
import Logo from './Logo'
import { LogOut, UserCircle } from 'lucide-react'
import './AppHeader.css'

const NAV_ITEMS = [
  { key: 'home', label: 'Trang chủ', badge: null as string | null },
  { key: 'recipes', label: 'Công thức', badge: null as string | null },
  { key: 'articles', label: 'Bài viết', badge: null as string | null },
  { key: 'videos', label: 'Video', badge: null as string | null },
  { key: 'restaurants', label: 'Nhà hàng chay', badge: null as string | null },
  { key: 'meal-plans', label: 'Thực đơn', badge: null as string | null },
  { key: 'ai-chat', label: 'Trợ lý AI', badge: 'Mới' as string | null },
  { key: 'foodscan', label: 'Quét thực phẩm', badge: 'HOT' as string | null },
]

export interface AppHeaderProps {
  activeNav?: string
  isLoggedIn?: boolean
  userName?: string
  avatarUrl?: string
  onLogout?: () => void
  onNavigate?: (path: string) => void
}

export default function AppHeader({
  activeNav = 'home',
  isLoggedIn = false,
  userName,
  avatarUrl,
  onLogout,
  onNavigate,
}: AppHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 2)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (onNavigate) {
      e.preventDefault()
      onNavigate(path)
    }
  }

  return (
    <header className={`app-header${isScrolled ? ' app-header-scrolled' : ''}`}>
      <div className="app-header-inner">
        <a
          href="#/"
          className="app-logo"
          aria-label="Vegetarian Support trang chủ"
          onClick={(e) => handleNavClick(e, '/')}
        >
          <Logo iconSize="md" showText />
        </a>

        <nav className="app-nav" aria-label="Điều hướng chính">
          <ul className="app-nav-list">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.key
              const path =
                item.key === 'home' ? '/' : `/${item.key}`
              return (
                <li key={item.key} className="app-nav-item">
                  <a
                    href={`#${path.startsWith('/') ? '' : '/'}${path === '/' ? '' : path}`}
                    className={
                      isActive ? 'app-nav-link app-nav-link-active' : 'app-nav-link'
                    }
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(e) => handleNavClick(e, path)}
                  >
                    <span className="app-nav-label">{item.label}</span>
                    {item.badge && (
                      <span
                        className={
                          item.badge === 'HOT'
                            ? 'app-nav-badge app-nav-badge-hot'
                            : 'app-nav-badge'
                        }
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && <span className="app-nav-underline" aria-hidden="true" />}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="app-header-actions">
          {!isLoggedIn ? (
            <>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => onNavigate?.('/auth/login')}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onNavigate?.('/auth/register')}
              >
                Đăng ký
              </button>
            </>
          ) : (
            <div className="app-header-user">
              <button
                type="button"
                className={`app-header-user-btn${activeNav === 'profile' ? ' app-header-user-btn-active' : ''}`}
                title={userName}
                onClick={() => onNavigate?.('/profile')}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userName || 'Avatar'}
                    className="w-5 h-5 rounded-full object-cover shrink-0 border border-emerald-400"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <UserCircle size={18} className="app-header-user-icon" />
                )}
                <span className="app-header-user-name">{userName || 'Tài khoản'}</span>
              </button>
              <button
                type="button"
                className="app-header-logout"
                onClick={() => onLogout?.()}
                aria-label="Đăng xuất"
                title="Đăng xuất"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
