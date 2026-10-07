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
    // Article Editor Routes
    if (currentPath === '/articles/editor' || currentPath === 'articles/editor') {
      return <ArticleEditorPage onNavigate={handleNavigate} />
    }
    const editorMatch = currentPath.match(/^\/articles\/editor\/([^/]+)\/?$/)
    if (editorMatch) {
      const editId = decodeURIComponent(editorMatch[1])
      return <ArticleEditorPage articleId={editId} onNavigate={handleNavigate} />
    }

    // User Profile sub-routes
    if (
      currentPath === '/profile/my-articles' ||
      currentPath === 'profile/my-articles' ||
      currentPath === '/my-articles'
    ) {
      return <MyArticlesPage onNavigate={handleNavigate} />
    }

    if (
      currentPath === '/profile/my-comments' ||
      currentPath === 'profile/my-comments' ||
      currentPath === '/my-comments'
    ) {
      return <MyCommentsPage onNavigate={handleNavigate} />
    }
    // Articles Section
    const isArticleList = currentPath === '/articles' || currentPath === 'articles'
    const articleMatch = currentPath.match(/^\/articles\/([^/]+)\/?$/)
    let articleId: string | null = null
    if (articleMatch) {
      try {
        articleId = decodeURIComponent(articleMatch[1])
      } catch {
        articleId = ''
      }
    }
    const isArticleDetail = articleId !== null

    if (isArticleList || isArticleDetail) {
      return (
        <PublicLayout
          activeNav="articles"
          onNavigate={handleNavigate}
          isLoggedIn={Boolean(user)}
          userName={user?.fullName}
          onLogout={() => { void logout() }}
        >
          {articleId !== null ? (
            <ArticleDetail
              key={articleId}
              articleId={articleId}
              onBackToList={() => handleNavigate('/articles')}
              onSelectRelatedArticle={(id) => handleNavigate(`/articles/${id}`)}
            />
          ) : (
            <ArticleList
              onSelectArticle={(id) => handleNavigate(`/articles/${id}`)}
              onNavigateHome={() => handleNavigate('/recipes')}
              onOpenAiChat={() => handleNavigate('/ai-chat')}
            />
          )}
        </PublicLayout>
      )
    }

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

    if (isRecipeList || isRecipeDetail || isAiChat) {
      return (
        <PublicLayout
          activeNav={isAiChat ? 'ai-chat' : 'recipes'}
          onNavigate={handleNavigate}
          isLoggedIn={Boolean(user)}
          userName={user?.fullName}
          onLogout={() => { void logout() }}
        >
          {isAiChat ? <AiChatShell /> : recipeId !== null ? (
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
    if (
      currentPath === '/admin' ||
      currentPath === 'admin' ||
      currentPath === '/admin/dashboard' ||
      currentPath === 'admin/dashboard'
    ) {
      return <AdminDashboardPage onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith('/admin/articles') || currentPath === 'admin/articles') {
      return <AdminArticlesPage onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith('/admin/categories') || currentPath === 'admin/categories') {
      return <AdminCategoriesPage onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith('/admin/videos') || currentPath === 'admin/videos') {
      return <AdminVideosPage onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith('/admin/comments') || currentPath === 'admin/comments') {
      return <AdminCommentsPage onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith('/admin/members')) {
      return (
        <MembersPage
          onNavigate={handleNavigate}
          initialView="members"
        />
      )
    }

    if (currentPath.startsWith('/admin')) {
      return <AdminDashboardPage onNavigate={handleNavigate} />
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
