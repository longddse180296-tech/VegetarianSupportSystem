import React, { useState, useEffect } from 'react'
import type { User, LoginCredentials, RegisterPayload, ResetPasswordResult } from '../types'
import { authApi, getStoredUser, getStoredToken } from '../api/authApi'
import { AuthContext, type AuthContextType } from './AuthContextInstance'

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser<User>())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refreshUser = async (): Promise<User | null> => {
    try {
      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
      return currentUser
    } catch {
      setUser(null)
      return null
    }
  }

  useEffect(() => {
    let isMounted = true

    const checkUser = async () => {
      try {
        const token = getStoredToken()
        if (!token) {
          if (isMounted) {
            setUser(null)
          }
          return
        }

        const currentUser = await authApi.getCurrentUser()
        if (isMounted) {
          setUser(currentUser)
        }
      } catch {
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void checkUser()

    return () => {
      isMounted = false
    }
  }, [])

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true)
    try {
      const response = await authApi.login(credentials)
      setUser(response.user)
      return response.user
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (payload: RegisterPayload): Promise<User> => {
    setIsLoading(true)
    try {
      const response = await authApi.register(payload)
      setUser(response.user)
      return response.user
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await authApi.logout()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string): Promise<ResetPasswordResult> => {
    if (!email) throw new Error('Vui lòng nhập email để khôi phục mật khẩu.')
    setIsLoading(true)
    try {
      await delay(450)
      const suggested =
        'Ch@y' + Math.floor(100000 + Math.random() * 900000).toString(36)
      return {
        ok: true as const,
        tempToken: 'reset-' + Math.random().toString(36).slice(2, 12),
        suggestedPassword: suggested,
      }
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    login,
    register,
    logout,
    refreshUser,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
