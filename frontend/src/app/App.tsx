import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../features/auth'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { ProfilePage } from '../features/profile'
import { MembersPage } from '../features/admin/members'
import { PublicLayout } from './layouts/PublicLayout'
import RecipeList from '../features/recipes/pages/RecipeList'
import RecipeDetail from '../features/recipes/pages/RecipeDetail'
import AiChatShell from '../features/ai-chat/AiChatShell'
import {
  ArticleList,
  ArticleDetail,
  MyArticlesPage,
  MyCommentsPage,
  ArticleEditorPage,
} from '../features/articles'
import {
  GeneralMealPlanPage,
  RecommendedMealPlanPage,
  PersonalizationSetupPage,
  MyMealPlanPage,
  MealPlanDetailPage,
} from '../features/meal-plans'

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
  const { user, logout } = useAuth()

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
    const isRecipeList = currentPath === '/recipes' || currentPath === 'recipes'
    const recipeMatch = currentPath.match(/^\/recipes\/([^/]+)\/?$/)
    let recipeId: string | null = null
    if (recipeMatch) {
      try {
        recipeId = decodeURIComponent(recipeMatch[1])
      } catch {
        recipeId = ''
      }
    }
    const isRecipeDetail = recipeId !== null
    const isAiChat = currentPath === '/ai-chat' || currentPath === 'aichat'
    const isFoodScan =
      currentPath === '/food-scan' ||
      currentPath === 'foodscan' ||
      currentPath === 'food-scan'
    const isRestaurants =
      currentPath === '/restaurants' ||
      currentPath === 'restaurants' ||
      currentPath === 'nha-hang-chay'

    if (isRecipeList || isRecipeDetail || isAiChat || isFoodScan || isRestaurants) {
      let activeNav = 'recipes'
      if (isAiChat) activeNav = 'ai-chat'
      else if (isFoodScan) activeNav = 'food-scan'
      else if (isRestaurants) activeNav = 'restaurants'
      return (
        <PublicLayout
          activeNav={activeNav}
          onNavigate={handleNavigate}
          isLoggedIn={Boolean(user)}
          userName={user?.fullName}
          onLogout={() => { void logout() }}
        >
          {isAiChat ? (
            <AiChatShell />
          ) : isFoodScan ? (
            <FoodScanPage onNavigate={handleNavigate} />
          ) : isRestaurants ? (
            <RestaurantListPage onNavigate={handleNavigate} />
          ) : recipeId !== null ? (
            <RecipeDetail key={recipeId} recipeId={recipeId} onNavigate={handleNavigate} />
          ) : <RecipeList onNavigate={handleNavigate} />}
        </PublicLayout>
      )
    }

    // Meal plans route
    if (
      currentPath === '/meal-plans/setup' ||
      currentPath === 'meal-plans/setup'
    ) {
      return (
        <PublicLayout
          activeNav="meal-plans"
          onNavigate={handleNavigate}
          isLoggedIn={Boolean(user)}
          userName={user?.fullName}
          onLogout={() => { void logout() }}
        >
          <PersonalizationSetupPage onNavigate={handleNavigate} />
        </PublicLayout>
      )
    }

    if (
      currentPath === '/meal-plans/recommended' ||
      currentPath === 'meal-plans/recommended'
    ) {
      return (
        <PublicLayout
          activeNav="meal-plans"
          onNavigate={handleNavigate}
          isLoggedIn={Boolean(user)}
          userName={user?.fullName}
          onLogout={() => { void logout() }}
        >
          <RecommendedMealPlanPage onNavigate={handleNavigate} />
        </PublicLayout>
      )
    }

    if (
      currentPath === '/meal-plans/my-plan' ||
      currentPath === 'meal-plans/my-plan' ||
      currentPath === '/meal-plans/weekly' ||
      currentPath === 'meal-plans/weekly' ||
      currentPath === '/meal-plans/calendar' ||
      currentPath === 'meal-plans/calendar'
    ) {
      return (
        <PublicLayout
          activeNav="meal-plans"
          onNavigate={handleNavigate}
          isLoggedIn={Boolean(user)}
          userName={user?.fullName}
          onLogout={() => { void logout() }}
        >
          <MyMealPlanPage onNavigate={handleNavigate} />
        </PublicLayout>
      )
    }

    if (
      currentPath === '/meal-plans/detail' ||
      currentPath === 'meal-plans/detail' ||
      currentPath.startsWith('/meal-plans/detail/')
    ) {
      const detailId = currentPath.replace(/^\/?meal-plans\/detail\/?/, '')
      return (
        <PublicLayout
          activeNav="meal-plans"
          onNavigate={handleNavigate}
          isLoggedIn={Boolean(user)}
          userName={user?.fullName}
          onLogout={() => { void logout() }}
        >
          <MealPlanDetailPage onNavigate={handleNavigate} planId={detailId || undefined} />
        </PublicLayout>
      )
    }

    if (
      currentPath === '/meal-plans' ||
      currentPath === 'meal-plans' ||
      currentPath.startsWith('/meal-plans')
    ) {
      return (
        <PublicLayout
          activeNav="meal-plans"
          onNavigate={handleNavigate}
          isLoggedIn={Boolean(user)}
          userName={user?.fullName}
          onLogout={() => { void logout() }}
        >
          <GeneralMealPlanPage onNavigate={handleNavigate} />
        </PublicLayout>
      )
    }

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
