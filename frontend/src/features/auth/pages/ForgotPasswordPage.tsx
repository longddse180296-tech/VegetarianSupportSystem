import React, { useState } from 'react'
import { PublicLayout } from '../../../app/layouts/PublicLayout'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { authApi } from '../api/authApi'
import { useAuth } from '../hooks/useAuth'

interface ForgotPasswordPageProps {
  onNavigate?: (path: string) => void
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (email: string) => {
    setIsLoading(true)
    try {
      return await authApi.forgotPassword(email)
    } finally {
      setIsLoading(false)
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
        <ForgotPasswordForm
          onSubmit={handleForgotPassword}
          onNavigateToLogin={() => onNavigate?.('/auth/login')}
          isLoading={isLoading}
        />
      </div>
    </PublicLayout>
  )
}
export default ForgotPasswordPage
