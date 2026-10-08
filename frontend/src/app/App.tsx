import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../features/auth'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { ProfilePage } from '../features/profile'
import { MembersPage } from '../features/admin/members'
import { AdminDashboardPage } from '../features/admin/dashboard'
import { AdminArticlesPage } from '../features/admin/articles'
import { AdminCategoriesPage } from '../features/admin/categories'
import { AdminCommentsPage } from '../features/admin/comments'
import { AdminVideosPage } from '../features/admin/videos'
import { PublicLayout } from './layouts/PublicLayout'
import HomePage from '../features/home/pages/HomePage'
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
import { VideoListPage, VideoDetailPage } from '../features/videos'
import { RestaurantListPage, RestaurantDetailPage } from '../features/restaurants'
import FoodScanPage from '../features/food-scan/pages/FoodScanPage'
import PantryPage from '../features/pantry/pages/PantryPage'

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
    const path = currentPath

    // ============================================
    // PUBLIC PAGES (no auth required)
    // ============================================

    // Home page
    if (path === '/' || path === '' || path === '/home') {
      return (
        <PublicLayout activeNav="home" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <HomePage onNavigate={handleNavigate} isLoggedIn={Boolean(user)} />
        </PublicLayout>
      )
    }

    // Recipes
    const recipeMatch = path.match(/^\/recipes\/([^/]+)\/?$/)
    if (path === '/recipes' || path === 'recipes') {
      return (
        <PublicLayout activeNav="recipes" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <RecipeList onNavigate={handleNavigate} />
        </PublicLayout>
      )
    }
    if (recipeMatch) {
      const recipeId = decodeURIComponent(recipeMatch[1])
      return (
        <PublicLayout activeNav="recipes" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <RecipeDetail key={recipeId} recipeId={recipeId} onNavigate={handleNavigate} />
        </PublicLayout>
      )
    }

    // AI Chat
    if (path === '/ai-chat' || path === 'aichat') {
      return (
        <PublicLayout activeNav="ai-chat" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <AiChatShell />
        </PublicLayout>
      )
    }

    // Articles (list and detail)
    const articleMatch = path.match(/^\/articles\/([^/]+)\/?$/)
    if (path === '/articles' || path === 'articles') {
      return (
        <PublicLayout activeNav="articles" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <ArticleList onSelectArticle={(id) => handleNavigate(`/articles/${id}`)} onNavigateHome={() => handleNavigate('/recipes')} onOpenAiChat={() => handleNavigate('/ai-chat')} />
        </PublicLayout>
      )
    }
    if (articleMatch) {
      const articleId = decodeURIComponent(articleMatch[1])
      return (
        <PublicLayout activeNav="articles" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <ArticleDetail key={articleId} articleId={articleId} onBackToList={() => handleNavigate('/articles')} onSelectRelatedArticle={(id) => handleNavigate(`/articles/${id}`)} />
        </PublicLayout>
      )
    }

    // Videos
    const videoMatch = path.match(/^\/videos\/([^/]+)\/?$/)
    if (path === '/videos' || path === 'videos' || path === '/my-videos') {
      return (
        <PublicLayout activeNav="videos" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <VideoListPage onNavigate={handleNavigate} />
        </PublicLayout>
      )
    }
    if (videoMatch) {
      const videoId = decodeURIComponent(videoMatch[1])
      return (
        <PublicLayout activeNav="videos" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <VideoDetailPage videoId={videoId} onNavigate={handleNavigate} />
        </PublicLayout>
      )
    }

    // Restaurants
    const restaurantMatch = path.match(/^\/restaurants\/([^/]+)\/?$/)
    if (path === '/restaurants' || path === 'restaurants') {
      return (
        <PublicLayout activeNav="restaurants" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <RestaurantListPage onNavigate={handleNavigate} />
        </PublicLayout>
      )
    }
    if (restaurantMatch) {
      const restaurantId = decodeURIComponent(restaurantMatch[1])
      return (
        <PublicLayout activeNav="restaurants" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <RestaurantDetailPage restaurantId={restaurantId} onNavigate={handleNavigate} />
        </PublicLayout>
      )
    }

    // Food Scan
    if (path === '/food-scan' || path === 'foodscan') {
      return (
        <PublicLayout activeNav="foodscan" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <FoodScanPage onNavigate={handleNavigate} isLoggedIn={Boolean(user)} />
        </PublicLayout>
      )
    }

    // Pantry
    if (path === '/pantry' || path === 'pantry') {
      return (
        <PublicLayout activeNav="pantry" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <PantryPage onNavigate={handleNavigate} />
        </PublicLayout>
      )
    }

    // Meal Plans
    if (path === '/meal-plans/setup') {
      return (
        <PublicLayout activeNav="meal-plans" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <PersonalizationSetupPage onNavigate={handleNavigate} />
        </PublicLayout>
      )
    }
    if (path === '/meal-plans/recommended') {
      return (
        <PublicLayout activeNav="meal-plans" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <RecommendedMealPlanPage onNavigate={handleNavigate} />
        </PublicLayout>
      )
    }
    if (path === '/meal-plans/my-plan' || path === '/meal-plans/weekly' || path === '/meal-plans/calendar') {
      return (
        <PublicLayout activeNav="meal-plans" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <MyMealPlanPage onNavigate={handleNavigate} />
        </PublicLayout>
      )
    }
    const mealPlanDetailMatch = path.match(/^\/meal-plans\/detail\/?(.+)?$/)
    if (mealPlanDetailMatch) {
      return (
        <PublicLayout activeNav="meal-plans" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <MealPlanDetailPage onNavigate={handleNavigate} planId={mealPlanDetailMatch[1] || undefined} />
        </PublicLayout>
      )
    }
    if (path === '/meal-plans' || path === 'meal-plans' || path.startsWith('/meal-plans')) {
      return (
        <PublicLayout activeNav="meal-plans" onNavigate={handleNavigate} isLoggedIn={Boolean(user)} userName={user?.fullName} onLogout={() => { void logout() }}>
          <GeneralMealPlanPage onNavigate={handleNavigate} />
        </PublicLayout>
      )
    }

    // Article Editor
    const articleEditorMatch = path.match(/^\/articles\/editor\/([^/]+)\/?$/)
    if (path === '/articles/editor') {
      return <ArticleEditorPage onNavigate={handleNavigate} />
    }
    if (articleEditorMatch) {
      const editId = decodeURIComponent(articleEditorMatch[1])
      return <ArticleEditorPage articleId={editId} onNavigate={handleNavigate} />
    }

    // User profile sub-routes
    if (path === '/profile/my-articles' || path === '/my-articles') {
      return <MyArticlesPage onNavigate={handleNavigate} />
    }
    if (path === '/profile/my-comments' || path === '/my-comments') {
      return <MyCommentsPage onNavigate={handleNavigate} />
    }

    // ============================================
    // AUTH PAGES (only shown when NOT logged in)
    // ============================================
    if (!user) {
      if (path === '/auth/login') {
        return <LoginPage onNavigate={handleNavigate} />
      }
      if (path === '/auth/register') {
        return <RegisterPage onNavigate={handleNavigate} />
      }
      if (path === '/auth/forgot-password') {
        return <ForgotPasswordPage onNavigate={handleNavigate} />
      }
      // Default to login for unknown paths when not logged in
      return <LoginPage onNavigate={handleNavigate} />
    }

    // ============================================
    // ADMIN PAGES (require auth)
    // ============================================
    if (path === '/admin' || path === 'admin' || path === '/admin/dashboard' || path === 'admin/dashboard') {
      return <AdminDashboardPage onNavigate={handleNavigate} />
    }
    if (path.startsWith('/admin/articles') || path === 'admin/articles') {
      return <AdminArticlesPage onNavigate={handleNavigate} />
    }
    if (path.startsWith('/admin/categories') || path === 'admin/categories') {
      return <AdminCategoriesPage onNavigate={handleNavigate} />
    }
    if (path.startsWith('/admin/videos') || path === 'admin/videos') {
      return <AdminVideosPage onNavigate={handleNavigate} />
    }
    if (path.startsWith('/admin/comments') || path === 'admin/comments') {
      return <AdminCommentsPage onNavigate={handleNavigate} />
    }
    if (path.startsWith('/admin/members')) {
      return <MembersPage onNavigate={handleNavigate} initialView="members" />
    }
    if (path.startsWith('/admin')) {
      return <AdminDashboardPage onNavigate={handleNavigate} />
    }

    // ============================================
    // USER SECTION (default for logged-in users)
    // ============================================
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