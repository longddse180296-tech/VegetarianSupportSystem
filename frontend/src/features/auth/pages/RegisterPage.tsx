import React from 'react'
import { PublicLayout } from '../../../app/layouts/PublicLayout'
import { AuthFeatureCards } from '../components/AuthFeatureCards'
import { RegisterForm } from '../components/RegisterForm'
import { useAuth } from '../hooks/useAuth'
import type { RegisterPayload } from '../types'

interface RegisterPageProps {
  onNavigate?: (path: string) => void
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register, isLoading, user } = useAuth()

  const handleRegister = async (payload: RegisterPayload) => {
    await register(payload)
    if (onNavigate) {
      onNavigate('/profile')
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
            <AuthFeatureCards mode="register" />
          </div>

          {/* Right Form Card Column */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <RegisterForm
              onSubmit={handleRegister}
              onNavigateToLogin={() => onNavigate?.('/auth/login')}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
export default RegisterPage
