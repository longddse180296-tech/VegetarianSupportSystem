import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../features/auth'
import { RouterRenderer, type RouterContext } from './router/Router'
import './App.css'
import '../styles/fe1.css'

const getInitialPath = (): string => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace(/^#/, '')
    if (hash) return hash
    if (window.location.pathname.startsWith('/admin')) {
      return window.location.pathname
    }
  }
  return '/'
}

const AppContent: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(getInitialPath)
  const { user, logout } = useAuth()

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '')
      const next = hash || '/'
      if (next !== currentPath) {
        setCurrentPath(next)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [currentPath])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [currentPath])

  const onNavigate = (path: string) => {
    setCurrentPath(path)
    if (typeof window !== 'undefined') {
      window.location.hash = path
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }

  const handleLogout = async () => {
    await logout()
    onNavigate('/')
  }

  const ctx: RouterContext = { currentPath, onNavigate }

  return (
    <div className="min-h-screen fe1-ui">
      <RouterRenderer {...ctx} user={user} logout={handleLogout} />
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
