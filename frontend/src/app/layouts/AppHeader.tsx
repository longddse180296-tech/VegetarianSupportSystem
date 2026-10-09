import { useEffect, useState, type KeyboardEvent } from 'react'
import Logo from './Logo'
import { LogOut, UserCircle } from 'lucide-react'
import './AppHeader.css'

/**
 * Canonical header navigation for Vegetarian Support.
 * Order + labels + badges are frozen per design spec — do not reorder lightly.
 */
const NAV_ITEMS = [
  { key: 'home', label: 'Trang chủ', path: '/', badge: null as string | null },
  { key: 'recipes', label: 'Công thức', path: '/recipes', badge: null as string | null },
  { key: 'articles', label: 'Bài viết', path: '/articles', badge: null as string | null },
  { key: 'videos', label: 'Video', path: '/videos', badge: null as string | null },
  { key: 'restaurants', label: 'Nhà hàng chay', path: '/restaurants', badge: null as string | null },
  { key: 'meal-plans', label: 'Thực đơn', path: '/meal-plans', badge: null as string | null },
  { key: 'ai-chat', label: 'Trợ lý AI', path: '/ai-chat', badge: 'Mới' as string | null },
  { key: 'food-scan', label: 'Quét thực phẩm', path: '/food-scan', badge: 'HOT' as string | null },
] as const

export interface AppHeaderProps {
  activeNav?: string
  isLoggedIn?: boolean
  userName?: string
  avatarUrl?: string
  onLogout?: () => void
  onNavigate?: (path: string) => void
}

const KEY_TRIGGER = (e: KeyboardEvent<HTMLElement>): boolean =>
  e.key === 'Enter' || e.key === ' ' || e.code === 'Space'

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

  const goTo = (path: string) => {
    if (onNavigate) onNavigate(path)
  }

  const onLinkKey = (e: KeyboardEvent<HTMLAnchorElement>, path: string) => {
    if (!KEY_TRIGGER(e)) return
    if (onNavigate) {
      e.preventDefault()
      onNavigate(path)
    }
  }

  const onLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onNavigate) {
      e.preventDefault()
      onNavigate('/')
    }
  }

  const onLogoKey = (e: KeyboardEvent<HTMLAnchorElement>) => {
    if (!KEY_TRIGGER(e)) return
    if (onNavigate) {
      e.preventDefault()
      onNavigate('/')
    }
  }

  return (
    <header className={`app-header${isScrolled ? ' app-header-scrolled' : ''}`}>
      <div className="app-header-inner">
        <a
          href="#/"
          className="app-logo"
          aria-label="Vegetarian Support – Về trang chủ"
          onClick={onLogoClick}
          onKeyDown={onLogoKey}
          tabIndex={0}
        >
          <Logo iconSize="md" showText />
        </a>

        <nav className="app-nav" aria-label="Điều hướng chính">
          <ul className="app-nav-list" role="list">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.key
              const href = item.path === '/' ? '#/' : `#${item.path}`
              return (
                <li key={item.key} className="app-nav-item" role="none">
                  <a
                    role="menuitem"
                    href={href}
                    className={
                      isActive ? 'app-nav-link app-nav-link-active' : 'app-nav-link'
                    }
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(e) => {
                      if (onNavigate) {
                        e.preventDefault()
                        onNavigate(item.path)
                      }
                    }}
                    onKeyDown={(e) => onLinkKey(e, item.path)}
                    tabIndex={0}
                  >
                    <span className="app-nav-label">{item.label}</span>
                    {item.badge && (
                      <span
                        className={
                          item.badge === 'HOT'
                            ? 'app-nav-badge app-nav-badge-hot'
                            : 'app-nav-badge'
                        }
                        aria-hidden="true"
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
                onClick={() => goTo('/auth/login')}
                onKeyDown={(e) => KEY_TRIGGER(e) && goTo('/auth/login')}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => goTo('/auth/register')}
                onKeyDown={(e) => KEY_TRIGGER(e) && goTo('/auth/register')}
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
                onClick={() => goTo('/profile')}
                onKeyDown={(e) => KEY_TRIGGER(e) && goTo('/profile')}
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
                onKeyDown={(e) => KEY_TRIGGER(e) && onLogout?.()}
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
