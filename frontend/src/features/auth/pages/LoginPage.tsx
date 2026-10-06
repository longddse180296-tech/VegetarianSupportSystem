import React from 'react'
import { PublicLayout } from '../../../app/layouts/PublicLayout'
import { AuthFeatureCards } from '../components/AuthFeatureCards'
import { LoginForm } from '../components/LoginForm'
import { useAuth } from '../hooks/useAuth'
import type { LoginCredentials } from '../types'

interface LoginPageProps {
  onNavigate?: (path: string) => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, isLoading, user } = useAuth()

  const handleLogin = async (credentials: LoginCredentials) => {
    const loggedInUser = await login(credentials)
    if (onNavigate) {
      if (loggedInUser?.role === 'Admin') {
        onNavigate('/admin/members')
      } else {
        onNavigate('/profile')
      }
    }
  }

  return (
    <PublicLayout
      activeNav="auth"
      onNavigate={onNavigate}
      isLoggedIn={!!user}
      userName={user?.fullName}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          {/* Left Feature Column */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
            <AuthFeatureCards mode="login" />
          </div>

          {/* Right Form Card Column */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <LoginForm
              onSubmit={handleLogin}
              onNavigateToRegister={() => onNavigate?.('/auth/register')}
              onNavigateToForgotPassword={() => onNavigate?.('/auth/forgot-password')}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
export default LoginPage
