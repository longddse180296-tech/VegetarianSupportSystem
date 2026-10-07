import React, { createContext, useContext, useMemo, useState } from 'react'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  role?: 'member' | 'admin' | 'nutritionist'
}

interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<AuthUser>
  register: (data: {
    fullName: string
    email: string
    password: string
    goal?: 'lose_weight' | 'maintain' | 'gain_muscle' | 'vegan_lifestyle'
  }) => Promise<AuthUser>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<{ ok: true; tempToken: string }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const STORAGE_KEY = 'vss-auth:user'

function loadFromStorage(): AuthUser | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function saveToStorage(user: AuthUser | null) {
  if (typeof window === 'undefined') return
  if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  else window.localStorage.removeItem(STORAGE_KEY)
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => loadFromStorage())

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      async login(email, password) {
        if (!email || !password) {
          throw new Error('Vui lòng nhập email và mật khẩu.')
        }
        await delay(600)
        const next: AuthUser = {
          id: 'u-' + Math.random().toString(36).slice(2, 9),
          email,
          fullName: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          role: email.includes('admin') ? 'admin' : 'member',
        }
        setUser(next)
        saveToStorage(next)
        return next
      },
      async register({ fullName, email, password }) {
        if (!fullName || !email || !password) {
          throw new Error('Vui lòng điền đầy đủ thông tin đăng ký.')
        }
        await delay(700)
        const next: AuthUser = {
          id: 'u-' + Math.random().toString(36).slice(2, 9),
          email,
          fullName,
          role: 'member',
        }
        setUser(next)
        saveToStorage(next)
        return next
      },
      async logout() {
        await delay(200)
        setUser(null)
        saveToStorage(null)
      },
      async resetPassword(email) {
        if (!email) throw new Error('Vui lòng nhập email để khôi phục mật khẩu.')
        await delay(650)
        return { ok: true as const, tempToken: 'reset-' + Math.random().toString(36).slice(2, 10) }
      },
    }
  }, [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export function AuthDebug() {
  const { user, login, logout } = useAuth()
  return (
    <div className="p-4 bg-slate-50 border rounded-lg">
      <h4 className="font-semibold mb-2">Auth Debug</h4>
      <p className="text-sm">User: {user ? `${user.fullName} (${user.email})` : 'Chưa đăng nhập'}</p>
      <div className="flex gap-2 mt-2">
        {!user && (
          <button
            type="button"
            className="px-3 py-1 text-sm rounded bg-emerald-700 text-white"
            onClick={() => void login('demo@vegetarian.vn', 'demo123')}
          >
            Đăng nhập nhanh demo
          </button>
        )}
        {user && (
          <button
            type="button"
            className="px-3 py-1 text-sm rounded border"
            onClick={() => void logout()}
          >
            Đăng xuất
          </button>
        )}
      </div>
    </div>
  )
}

export default AuthContext
