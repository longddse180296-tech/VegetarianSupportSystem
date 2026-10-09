import React, { useState, useEffect } from 'react'
import type { User, LoginCredentials, RegisterPayload } from '../types'
import { authApi, getStoredUser, setStoredUser, getStoredToken } from '../api/authApi'
import { AuthContext, type AuthContextType } from './AuthContextInstance'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = getStoredUser<User>()
    if (stored) {
      try {
        const rawProfile = localStorage.getItem('vegetarian_mock_user_profile')
        if (rawProfile) {
          const parsed = JSON.parse(rawProfile)
          if (parsed.fullName) stored.fullName = parsed.fullName
          if (parsed.avatarUrl) stored.avatarUrl = parsed.avatarUrl
        }
      } catch {
        // ignore
      }
    }
    return stored
  })
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

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null
      const updated = { ...prev, ...updates }
      setStoredUser(updated)
      try {
        localStorage.setItem('auth_user', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }

  // Listen for user profile updates across components or storage changes
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<User>>
      if (customEvent.detail) {
        setUser((prev) => {
          if (!prev) return null
          const updated = { ...prev, ...customEvent.detail }
          setStoredUser(updated)
          try {
            localStorage.setItem('auth_user', JSON.stringify(updated))
          } catch {
            // ignore
          }
          return updated
        })
      } else {
        const stored = getStoredUser<User>()
        if (stored) {
          try {
            const rawProfile = localStorage.getItem('vegetarian_mock_user_profile')
            if (rawProfile) {
              const parsed = JSON.parse(rawProfile)
              if (parsed.fullName) stored.fullName = parsed.fullName
              if (parsed.avatarUrl) stored.avatarUrl = parsed.avatarUrl
            }
          } catch {
            // ignore
          }
          setUser(stored)
        }
      }
    }

    window.addEventListener('vegetarian_user_updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('vegetarian_user_updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

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

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
