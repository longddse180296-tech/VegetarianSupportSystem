import React from 'react'
import { useAuth } from '../../features/auth'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { RegisterPage } from '../../features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '../../features/auth/pages/ForgotPasswordPage'
import { ProfilePage } from '../../features/profile'
import MembersPage from '../../features/admin/members/pages/MembersPage'
import { AdminDashboardPage } from '../../features/admin/dashboard'
import { AdminArticlesPage } from '../../features/admin/articles'
import { AdminCategoriesPage } from '../../features/admin/categories'
import { AdminCommentsPage } from '../../features/admin/comments'
import { AdminVideosPage } from '../../features/admin/videos'
import { AdminIngredientsPage } from '../../features/admin/ingredients'
import { AdminRecipesPage } from '../../features/admin/recipes'
import { AdminRestaurantsPage } from '../../features/admin/restaurants'
import { AdminModerationPage } from '../../features/admin/moderation'
import { PublicLayout } from '../layouts/PublicLayout'
import HomePage from '../../features/home/pages/HomePage'
import RecipeList from '../../features/recipes/pages/RecipeList'
import RecipeDetail from '../../features/recipes/pages/RecipeDetail'
import AiChatPage from '../../features/ai-chat/pages/AiChatPage'
import {
  ArticleList,
  ArticleDetail,
  MyArticlesPage,
  MyCommentsPage,
  ArticleEditorPage,
} from '../../features/articles'
import {
  GeneralMealPlanPage,
  RecommendedMealPlanPage,
  PersonalizationSetupPage,
  MyMealPlanPage,
  MealPlanDetailPage,
} from '../../features/meal-plans'
import { VideoListPage, VideoDetailPage, MyVideosPage } from '../../features/videos'
import { RestaurantListPage, RestaurantDetailPage } from '../../features/restaurants'
import FoodScanPage from '../../features/food-scan/pages/FoodScanPage'
import PantryPage from '../../features/pantry/pages/PantryPage'

export interface RouterContext {
  currentPath: string
  onNavigate: (path: string) => void
}

interface RouterRendererProps extends RouterContext {
  user: ReturnType<typeof useAuth>['user']
  logout: () => void
}

const withPublic = (
  node: React.ReactNode,
  activeNav: string,
  ctx: RouterRendererProps,
) => {
  const isLoggedIn = Boolean(ctx.user)

  let displayUserName = ctx.user?.fullName
  let displayAvatarUrl = ctx.user?.avatarUrl

  try {
    const rawProfile = localStorage.getItem('vegetarian_mock_user_profile')
    if (rawProfile) {
      const parsed = JSON.parse(rawProfile)
      if (parsed.fullName) {
        displayUserName = parsed.fullName
      }
      if (parsed.avatarUrl) {
        displayAvatarUrl = parsed.avatarUrl
      }
    }
  } catch {
    // fallback
  }

  if (!displayUserName && isLoggedIn) {
    displayUserName = 'Quang Duy'
  }

  return (
    <PublicLayout
      activeNav={activeNav}
      onNavigate={ctx.onNavigate}
      isLoggedIn={isLoggedIn}
      userName={displayUserName}
      avatarUrl={displayAvatarUrl}
      onLogout={async () => {
        await ctx.logout()
        ctx.onNavigate('/')
      }}
    >
      {node}
    </PublicLayout>
  )
}

export const RouterRenderer: React.FC<RouterRendererProps> = (ctx) => {
  const path = ctx.currentPath
  const { onNavigate } = ctx
  const isLoggedIn = Boolean(ctx.user)

  if (path === '/' || path === '' || path === '/home' || path === 'home') {
    return withPublic(
      <HomePage onNavigate={onNavigate} isLoggedIn={isLoggedIn} />,
      'home',
      ctx,
    )
  }

  const recipeMatch = path.match(/^\/recipes\/([^/]+)\/?$/)
  if (path === '/recipes' || path === 'recipes') {
    return withPublic(<RecipeList onNavigate={onNavigate} />, 'recipes', ctx)
  }
  if (recipeMatch) {
    let recipeId = ''
    try {
      recipeId = decodeURIComponent(recipeMatch[1])
    } catch {
      // Let RecipeDetail handle malformed IDs without crashing the router.
    }
    return withPublic(
      <RecipeDetail key={recipeId} recipeId={recipeId} onNavigate={onNavigate} />,
      'recipes',
      ctx,
    )
  }

  if (path === '/ai-chat' || path === 'aichat' || path === '/aichat' || path === 'ai-chat') {
    return withPublic(<AiChatPage onNavigate={onNavigate} isLoggedIn={isLoggedIn} />, 'ai-chat', ctx)
  }

  const articleEditorMatch = path.match(/^\/articles\/(?:editor|edit)\/([^/]+)\/?$/)
  if (
    path === '/articles/editor' ||
    path === '/articles/create' ||
    path === '/articles/new'
  ) {
    if (!ctx.user) {
      return <LoginPage onNavigate={onNavigate} />
    }
    return <ArticleEditorPage onNavigate={onNavigate} />
  }
  if (articleEditorMatch) {
    if (!ctx.user) {
      return <LoginPage onNavigate={onNavigate} />
    }
    const editId = decodeURIComponent(articleEditorMatch[1])
    return <ArticleEditorPage articleId={editId} onNavigate={onNavigate} />
  }

  const articleMatch = path.match(/^\/articles\/([^/]+)\/?$/)
  if (path === '/articles' || path === 'articles') {
    return withPublic(
      <ArticleList
        onSelectArticle={(id) => onNavigate(`/articles/${id}`)}
        onCreateArticle={() => onNavigate(ctx.user ? '/articles/create' : '/auth/login')}
        onNavigateHome={() => onNavigate('/')}
        onOpenAiChat={() => onNavigate('/ai-chat')}
      />,
      'articles',
      ctx,
    )
  }
  if (articleMatch && !['editor', 'create', 'new', 'edit'].includes(articleMatch[1])) {
    const articleId = decodeURIComponent(articleMatch[1])
    return withPublic(
      <ArticleDetail
        key={articleId}
        articleId={articleId}
        onBackToList={() => onNavigate('/articles')}
        onCreateArticle={() => onNavigate(ctx.user ? '/articles/create' : '/auth/login')}
        onEditArticle={(id) => onNavigate(ctx.user ? `/articles/editor/${id}` : '/auth/login')}
        onSelectRelatedArticle={(id) => onNavigate(`/articles/${id}`)}
      />,
      'articles',
      ctx,
    )
  }

  const videoMatch = path.match(/^\/videos\/([^/]+)\/?$/)
  if (path === '/videos' || path === 'videos') {
    return withPublic(<VideoListPage onNavigate={onNavigate} />, 'videos', ctx)
  }
  if (videoMatch) {
    const videoId = decodeURIComponent(videoMatch[1])
    return withPublic(
      <VideoDetailPage videoId={videoId} onNavigate={onNavigate} />,
      'videos',
      ctx,
    )
  }

  const restaurantMatch = path.match(/^\/restaurants\/([^/]+)\/?$/)
  if (path === '/restaurants' || path === 'restaurants') {
    return withPublic(
      <RestaurantListPage onNavigate={onNavigate} />,
      'restaurants',
      ctx,
    )
  }
  if (restaurantMatch) {
    const restaurantId = decodeURIComponent(restaurantMatch[1])
    return withPublic(
      <RestaurantDetailPage restaurantId={restaurantId} onNavigate={onNavigate} />,
      'restaurants',
      ctx,
    )
  }

  if (path === '/food-scan' || path === 'foodscan' || path === '/foodscan' || path === 'food-scan') {
    return withPublic(
      <FoodScanPage onNavigate={onNavigate} isLoggedIn={isLoggedIn} />,
      'foodscan',
      ctx,
    )
  }

  if (path === '/pantry' || path === 'pantry') {
    return withPublic(<PantryPage onNavigate={onNavigate} />, 'pantry', ctx)
  }

  if (path === '/meal-plans/setup') {
    return withPublic(
      <PersonalizationSetupPage onNavigate={onNavigate} />,
      'meal-plans',
      ctx,
    )
  }
  if (path === '/meal-plans/recommended') {
    return withPublic(
      <RecommendedMealPlanPage onNavigate={onNavigate} />,
      'meal-plans',
      ctx,
    )
  }
  if (path === '/meal-plans/discover' || path === '/meal-plans/sample') {
    return withPublic(
      <GeneralMealPlanPage onNavigate={onNavigate} />,
      'meal-plans',
      ctx,
    )
  }
  const mealPlanDetailMatch = path.match(/^\/meal-plans\/detail\/?(.+)?$/)
  if (mealPlanDetailMatch) {
    return withPublic(
      <MealPlanDetailPage
        onNavigate={onNavigate}
        planId={mealPlanDetailMatch[1] || undefined}
      />,
      'meal-plans',
      ctx,
    )
  }
  if (
    path === '/meal-plans' ||
    path === 'meal-plans' ||
    path === '/meal-plans/my-plan' ||
    path === '/meal-plans/weekly' ||
    path === '/meal-plans/calendar' ||
    path.startsWith('/meal-plans')
  ) {
    return withPublic(<MyMealPlanPage onNavigate={onNavigate} />, 'meal-plans', ctx)
  }


  if (path === '/profile/my-articles' || path === '/my-articles') {
    if (!ctx.user) return <LoginPage onNavigate={onNavigate} />
    return <MyArticlesPage onNavigate={onNavigate} />
  }
  if (path === '/profile/my-comments' || path === '/my-comments') {
    if (!ctx.user) return <LoginPage onNavigate={onNavigate} />
    return <MyCommentsPage onNavigate={onNavigate} />
  }
  if (path === '/profile/my-videos' || path === '/my-videos') {
    if (!ctx.user) return <LoginPage onNavigate={onNavigate} />
    return <MyVideosPage onNavigate={onNavigate} />
  }

  if (path === '/profile/settings' || path === '/account/settings') {
    if (!ctx.user) {
      return <LoginPage onNavigate={onNavigate} />
    }
    return <ProfilePage onNavigate={onNavigate} initialViewMode="settings" />
  }

  if (path === '/profile' || path === 'profile' || path === '/profile/overview' || path === '/account') {
    if (!ctx.user) {
      return <LoginPage onNavigate={onNavigate} />
    }
    return <ProfilePage onNavigate={onNavigate} initialViewMode="overview" />
  }

  if (!ctx.user) {
    if (path === '/auth/login' || path === '/login') return <LoginPage onNavigate={onNavigate} />
    if (path === '/auth/register' || path === '/register') return <RegisterPage onNavigate={onNavigate} />
    if (path === '/auth/forgot-password' || path === '/forgot-password') return <ForgotPasswordPage onNavigate={onNavigate} />
    return <LoginPage onNavigate={onNavigate} />
  }

  if (
    path === '/admin' ||
    path === 'admin' ||
    path === '/admin/dashboard' ||
    path === 'admin/dashboard'
  ) {
    return <AdminDashboardPage onNavigate={onNavigate} />
  }
  if (path.startsWith('/admin/articles') || path === 'admin/articles') {
    return <AdminArticlesPage onNavigate={onNavigate} />
  }
  if (path.startsWith('/admin/categories') || path === 'admin/categories') {
    return <AdminCategoriesPage onNavigate={onNavigate} />
  }
  if (path.startsWith('/admin/videos') || path === 'admin/videos') {
    return <AdminVideosPage onNavigate={onNavigate} />
  }
  if (path.startsWith('/admin/comments') || path === 'admin/comments') {
    return <AdminCommentsPage onNavigate={onNavigate} />
  }
  if (path.startsWith('/admin/members')) {
    return <MembersPage onNavigate={onNavigate} />
  }
  if (path.startsWith('/admin/ingredients')) {
    return <AdminIngredientsPage onNavigate={onNavigate} />
  }
  if (path.startsWith('/admin/recipes')) {
    return <AdminRecipesPage onNavigate={onNavigate} />
  }
  if (path.startsWith('/admin/restaurants')) {
    return <AdminRestaurantsPage onNavigate={onNavigate} />
  }
  if (path.startsWith('/admin/moderation')) {
    return <AdminModerationPage onNavigate={onNavigate} />
  }
  if (path.startsWith('/admin')) {
    return <AdminDashboardPage onNavigate={onNavigate} />
  }

  return <ProfilePage onNavigate={onNavigate} />
}
