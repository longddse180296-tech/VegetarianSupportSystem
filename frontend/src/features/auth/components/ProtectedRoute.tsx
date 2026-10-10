import React, { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

export interface ProtectedRouteProps {
  children: React.ReactNode
  onNavigate?: (path: string) => void
  returnUrl?: string
}

/**
 * Higher-order guard component that intercepts unauthenticated users
 * and redirects them to the /login page, preserving the returnUrl.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  onNavigate,
  returnUrl,
}) => {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentHash =
        typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : ''
      const target = returnUrl || currentHash || '/'
      const redirectPath = `/login?returnUrl=${encodeURIComponent(target)}`

      // Store in session storage for robust state recovery
      try {
        sessionStorage.setItem('returnUrl', target)
      } catch {
        // Ignore session storage errors
      }

      if (onNavigate) {
        onNavigate(redirectPath)
      } else if (typeof window !== 'undefined') {
        window.location.hash = redirectPath
      }
    }
  }, [isAuthenticated, isLoading, onNavigate, returnUrl])

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 py-16">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Đang xác thực thông tin đăng nhập...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

export const RequireAuth = ProtectedRoute
export default ProtectedRoute
