import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../features/auth'
import { RouterRenderer } from './router/Router'

/**
 * Allowed public route prefixes for deep-link pathname → hash auto-sync.
 * Includes canonical EN paths + Vietnamese aliases so direct URLs / share links
 * continue to work without requiring the user to navigate from the home page.
 */
const PUBLIC_ROUTE_PREFIXES: readonly string[] = [
  '/home',
  '/recipes',
  '/cong-thuc',
  '/pantry',
  '/tu-bep-ai',
  '/tu-bep',
  '/restaurants',
  '/nha-hang-chay',
  '/ai-chat',
  '/aichat',
  '/tro-ly-ai',
  '/food-scan',
  '/foodscan',
  '/quet-thuc-pham',
  '/videos',
  '/video',
  '/my-videos',
  '/video-huong-dan',
  '/articles',
  '/bai-viet',
  '/meal-plans',
  '/thuc-don',
  '/ke-hoach-thuc-don',
  '/profile',
  '/my-articles',
  '/my-comments',
  '/auth',
  '/admin',
] as const

const pathIsKnown = (path: string): boolean => {
  const normalized =
    path === '/' || path === '' ? '/home' : path.replace(/\/+$/, '')
  if (!normalized.startsWith('/')) return false
  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(prefix + '/'),
  )
}

/**
 * On first paint (no hash present) convert a deep-linked pathname URL into
 * the equivalent hash so the hash-router has something to bind to.
 */
const syncPathnameToHash = (): void => {
  if (typeof window === 'undefined') return
  const existingHash = window.location.hash.replace(/^#/, '')
  if (existingHash) return
  const pn = window.location.pathname
  if (pn === '/' || pn === '/index.html' || pn === '') {
    window.location.hash = '/home'
    return
  }
  if (pathIsKnown(pn)) {
    window.location.hash = pn + (window.location.search || '')
  }
}

/**
 * Initialise the hash-router state from (1) explicit #hash, (2) pathname deep-link,
 * or (3) the home page. Mirrors RouterRenderer expectations — always leading `/`.
 */
const getInitialPath = (): string => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace(/^#/, '')
    if (hash) {
      return hash.startsWith('/') ? hash : `/${hash}`
    }
    const pn = window.location.pathname
    if (pn === '/' || pn === '/index.html' || pn === '') {
      return '/home'
    }
    if (pathIsKnown(pn)) {
      try {
        syncPathnameToHash()
      } catch {
        /* ignore history errors in embedded previews */
      }
      return pn.startsWith('/') ? pn : `/${pn}`
    }
  }
  return '/home'
}

const AppContent: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(getInitialPath)
  const { user, logout } = useAuth()

  // Browser back / forward or user-edited #hash → update internal state.
  useEffect(() => {
    const handleHashChange = () => {
      const raw = window.location.hash.replace(/^#/, '')
      if (!raw) return
      const next = raw.startsWith('/') ? raw : `/${raw}`
      if (next !== currentPath) {
        setCurrentPath(next)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    syncPathnameToHash()
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [currentPath])

  /**
   * Canonical navigate used by every menu button + card CTA.
   * Deliberately only writes `window.location.hash`. Pathname is cosmetic;
   * replacing it via history.replaceState inside a hash-router triggers
   * spurious HMR reloads / double-renders in Vite SPA builds.
   */
  const handleNavigate = (path: string) => {
    if (path === undefined || path === null) return
    const trimmed = String(path).trim()
    if (!trimmed) return
    const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    // Avoid duplicate state updates when the user clicks the already-active link.
    if (normalized === currentPath && window.location.hash === `#${normalized}`) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setCurrentPath(normalized)
    if (typeof window !== 'undefined') {
      window.location.hash = normalized
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
  }

  return (
    <div className="min-h-screen">
      <RouterRenderer
        currentPath={currentPath}
        onNavigate={handleNavigate}
        user={user}
        logout={logout}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
