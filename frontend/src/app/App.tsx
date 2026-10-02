import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../features/auth'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { ProfilePage } from '../features/profile'
import { MembersPage } from '../features/admin/members'

const getInitialPath = (): string => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace(/^#/, '')
    if (hash) return hash
    if (window.location.pathname.startsWith('/admin')) {
      return window.location.pathname
    }
  }
  return '/auth/login'
}

const AppContent: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(getInitialPath)
  const { user } = useAuth()

  // Sync route with URL hash so user can navigate directly
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '')
      if (hash && hash !== currentPath) {
        setCurrentPath(hash)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [currentPath])

  const handleNavigate = (path: string) => {
    setCurrentPath(path)
    if (typeof window !== 'undefined') {
      window.location.hash = path
    }
  }

  const renderCurrentView = () => {
    // Auth pages
    if (currentPath === '/auth/login' || (!user && currentPath === '/')) {
      return <LoginPage onNavigate={handleNavigate} />
    }

    if (currentPath === '/auth/register') {
      return <RegisterPage onNavigate={handleNavigate} />
    }

    if (currentPath === '/auth/forgot-password') {
      return <ForgotPasswordPage onNavigate={handleNavigate} />
    }

    // Admin section
    if (currentPath.startsWith('/admin')) {
      const isDashboard = currentPath === '/admin/dashboard'
      return (
        <MembersPage
          onNavigate={handleNavigate}
          initialView={isDashboard ? 'dashboard' : 'members'}
        />
      )
    }

    // User Section (e.g., /profile)
    return <ProfilePage onNavigate={handleNavigate} />
  }

  return (
    <div className="min-h-screen">
      {renderCurrentView()}
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
