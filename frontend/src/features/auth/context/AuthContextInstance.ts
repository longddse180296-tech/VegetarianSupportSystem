import { createContext } from 'react'
import type { User, LoginCredentials, RegisterPayload, ResetPasswordResult } from '../types'

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (credentials: LoginCredentials) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<User | null>
  resetPassword: (email: string) => Promise<ResetPasswordResult>
  updateUser?: (updates: Partial<User>) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
