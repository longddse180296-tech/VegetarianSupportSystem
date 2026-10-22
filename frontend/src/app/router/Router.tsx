import React from 'react'
import { getStoredToken } from '../../shared/api/apiClient'
import { useAuth } from '../../features/auth'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { RegisterPage } from '../../features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '../../features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage'
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
import InformationPage, { type InformationPageKind } from '../../features/home/pages/InformationPage'
import AdminFeedbackPage from '../../features/admin/dashboard/pages/AdminFeedbackPage'
import AdminReportsPage from '../../features/admin/reports/pages/AdminReportsPage'
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
  PersonalizationSetupPage,
  MyMealPlanPage,
  MealPlansPublic,
  MealPlanCreate,
  MealPlanDetail,
} from '../../features/meal-plans'
import {
  VideoListPage,
  VideoDetailPage,
  VideoCreatePage,
  MyVideosPage,
} from '../../features/videos'
import {
  RestaurantListPage,
  RestaurantDetailPage,
} from '../../features/restaurants'
import FoodScanPage from '../../features/food-scan/pages/FoodScanPage'
import PantryPage from '../../features/pantry/pages/PantryPage'
import { FavoritesPage } from '../../features/favorites'

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

  const displayUserName = ctx.user?.fullName
  const displayAvatarUrl = ctx.user?.avatarUrl

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
  const { isLoading: authLoading } = useAuth()
  const rawPath = ctx.currentPath || '/'
  const [rawPathname, searchRaw = ''] = rawPath.split('?')
  const path = rawPathname ? (rawPathname.startsWith('/') ? rawPathname : `/${rawPathname}`) : '/'
  const searchParams = new URLSearchParams(searchRaw)
  const { onNavigate } = ctx
  const isLoggedIn = Boolean(ctx.user)

  if (authLoading && !ctx.user && getStoredToken())
    return (
      <div role="status" className="p-12 text-center text-sm text-slate-500">
        Đang kiểm tra phiên đăng nhập...
      </div>
    )

  if (path === '/' || path === '' || path === '/home' || path === 'home') {
    return withPublic(
      <HomePage onNavigate={onNavigate} isLoggedIn={isLoggedIn} />,
      'home',
      ctx,
    )
  }

  const informationKind = path.replace(/^\//, '').replace(/\/$/, '')
  if (['about', 'contact', 'privacy', 'terms'].includes(informationKind)) {
    return withPublic(<InformationPage kind={informationKind as InformationPageKind} />, '', ctx)
  }

  const recipeMatch = path.match(/^\/recipes\/([^/]+)\/?$/)
  if (path === '/recipes' || path === 'recipes') {
    const initialSearch =
      searchParams.get('q') || searchParams.get('search') || ''
    return withPublic(
      <RecipeList
        key={`recipes-${initialSearch}`}
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        initialSearch={initialSearch}
      />,
      'recipes',
      ctx,
    )
  }
  if (recipeMatch) {
    let recipeId = ''
    try {
      recipeId = decodeURIComponent(recipeMatch[1])
    } catch {
      // Let RecipeDetail handle malformed IDs without crashing the router.
    }
    const fromParam = searchParams.get('from') || undefined
    return withPublic(
      <RecipeDetail
        key={recipeId}
        recipeId={recipeId}
        onNavigate={onNavigate}
        fromSource={fromParam}
      />,
      'recipes',
      ctx,
    )
  }

  if (
    path === '/ai-chat' ||
    path === 'aichat' ||
    path === '/aichat' ||
    path === 'ai-chat'
  ) {
    const initialQuery =
      searchParams.get('q') || searchParams.get('query') || ''
    return withPublic(
      <AiChatPage
        key={`aichat-${initialQuery}`}
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        initialQuery={initialQuery}
      />,
      'ai-chat',
      ctx,
    )
  }

  const articleEditorMatch = path.match(
    /^\/articles\/(?:editor|edit)\/([^/]+)\/?$/,
  )
  if (
    path === '/articles/editor' ||
    path === '/articles/create' ||
    path === '/articles/new'
  ) {
    if (!ctx.user) {
      return <LoginPage onNavigate={onNavigate} />
    }
    const fromParam = (searchParams.get('from') as 'articles' | 'profile') || 'articles'
    return <ArticleEditorPage onNavigate={onNavigate} fromSource={fromParam} />
  }
  if (articleEditorMatch) {
    if (!ctx.user) {
      return <LoginPage onNavigate={onNavigate} />
    }
    const editId = decodeURIComponent(articleEditorMatch[1])
    const fromParam = (searchParams.get('from') as 'articles' | 'profile') || 'articles'
    return <ArticleEditorPage articleId={editId} onNavigate={onNavigate} fromSource={fromParam} />
  }

  const articleMatch = path.match(/^\/articles\/([^/]+)\/?$/)
  if (path === '/articles' || path === 'articles') {
    return withPublic(
      <ArticleList
        onSelectArticle={(id) => onNavigate(`/articles/${id}`)}
        onCreateArticle={() =>
          onNavigate(ctx.user ? '/articles/create?from=articles' : '/auth/login')
        }
        onNavigateHome={() => onNavigate('/')}
        onOpenAiChat={() => onNavigate('/ai-chat')}
      />,
      'articles',
      ctx,
    )
  }
  if (
    articleMatch &&
    !['editor', 'create', 'new', 'edit'].includes(articleMatch[1])
  ) {
    const articleId = decodeURIComponent(articleMatch[1])
    return withPublic(
      <ArticleDetail
        key={articleId}
        articleId={articleId}
        onBackToList={() => onNavigate('/articles')}
        onCreateArticle={() =>
          onNavigate(ctx.user ? '/articles/create?from=articles' : '/auth/login')
        }
        onEditArticle={(id) =>
          onNavigate(ctx.user ? `/articles/editor/${id}?from=articles` : '/auth/login')
        }
        onSelectRelatedArticle={(id) => onNavigate(`/articles/${id}`)}
      />,
      'articles',
      ctx,
    )
  }

  const isCreateVideoRoute =
    path === '/videos/create' ||
    path.startsWith('/videos/create?') ||
    path === '/videos/new' ||
    path.startsWith('/videos/new?')
  const fromVideoParam =
    new URLSearchParams(window.location.hash.split('?')[1] || '').get(
      'from',
    ) || undefined

  if (isCreateVideoRoute) {
    return (
      <VideoCreatePage
        onNavigate={onNavigate}
        fromSource={fromVideoParam}
      />
    )
  }

  const videoMatch = path.match(/^\/videos\/([^/]+)\/?$/)
  if (path === '/videos' || path === 'videos') {
    return withPublic(<VideoListPage onNavigate={onNavigate} />, 'videos', ctx)
  }
  if (
    videoMatch &&
    !['create', 'new', 'editor'].includes(videoMatch[1])
  ) {
    const videoId = decodeURIComponent(videoMatch[1])
    return withPublic(
      <VideoDetailPage key={videoId} videoId={videoId} onNavigate={onNavigate} />,
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
      <RestaurantDetailPage
        restaurantId={restaurantId}
        onNavigate={onNavigate}
      />,
      'restaurants',
      ctx,
    )
  }

  if (
    path === '/food-scan' ||
    path === 'foodscan' ||
    path === '/foodscan' ||
    path === 'food-scan'
  ) {
    return withPublic(
      <FoodScanPage onNavigate={onNavigate} isLoggedIn={isLoggedIn} />,
      'foodscan',
      ctx,
    )
  }

  if (path === '/pantry' || path === 'pantry') {
    if (!ctx.user) {
      try {
        sessionStorage.setItem('returnUrl', '/pantry')
      } catch {
        // ignore storage error
      }
      return <LoginPage onNavigate={onNavigate} />
    }
    return withPublic(
      <PantryPage onNavigate={onNavigate} isLoggedIn={isLoggedIn} />,
      'pantry',
      ctx,
    )
  }

  // ─── Meal Plans: Protected Route /meal-plans/create ─────────────────
  if (path === '/meal-plans/create') {
    if (!ctx.user) {
      try {
        sessionStorage.setItem('returnUrl', '/meal-plans/create')
      } catch {
        // ignore storage error
      }
      return <LoginPage onNavigate={onNavigate} />
    }
    return withPublic(
      <MealPlanCreate onNavigate={onNavigate} />,
      'meal-plans',
      ctx,
    )
  }

  // ─── Meal Plans: Protected Route /meal-plans/setup ──────────────────
  if (path === '/meal-plans/setup') {
    if (!ctx.user) {
      try {
        sessionStorage.setItem('returnUrl', '/meal-plans/setup')
      } catch {
        // ignore storage error
      }
      return <LoginPage onNavigate={onNavigate} />
    }
    return withPublic(
      <PersonalizationSetupPage onNavigate={onNavigate} />,
      'meal-plans',
      ctx,
    )
  }

  // ─── Meal Plans: Protected Route /meal-plans/recommended ────────────
  if (path === '/meal-plans/recommended') {
    if (!ctx.user) {
      try {
        sessionStorage.setItem('returnUrl', '/meal-plans/recommended')
      } catch {
        // ignore storage error
      }
      return <LoginPage onNavigate={onNavigate} />
    }
    return withPublic(
      <MyMealPlanPage onNavigate={onNavigate} />,
      'meal-plans',
      ctx,
    )
  }

  // ─── Meal Plans: Protected Routes /meal-plans/my-plan ───────────────
  if (
    path === '/meal-plans/my-plan' ||
    path === '/meal-plans/weekly' ||
    path === '/meal-plans/calendar'
  ) {
    if (!ctx.user) {
      try {
        sessionStorage.setItem('returnUrl', path)
      } catch {
        // ignore storage error
      }
      return <LoginPage onNavigate={onNavigate} />
    }
    return withPublic(
      <MyMealPlanPage onNavigate={onNavigate} />,
      'meal-plans',
      ctx,
    )
  }

  // ─── Meal Plans: Protected Route /meal-plans/:id & /meal-plans/detail/:id
  const mealPlanDetailMatch = path.match(
    /^\/meal-plans\/(?:detail\/)?([^/?#]+)$/,
  )
  if (mealPlanDetailMatch) {
    const rawId = decodeURIComponent(mealPlanDetailMatch[1])
    const reservedSlugs = [
      'create',
      'setup',
      'discover',
      'sample',
      'recommended',
      'my-plan',
      'weekly',
      'calendar',
    ]
    if (!reservedSlugs.includes(rawId)) {
      if (!ctx.user) {
        try {
          sessionStorage.setItem('returnUrl', path)
        } catch {
          // ignore storage error
        }
        return <LoginPage onNavigate={onNavigate} />
      }
      return withPublic(
        <MealPlanDetail onNavigate={onNavigate} planId={rawId} />,
        'meal-plans',
        ctx,
      )
    }
  }

  // ─── Meal Plans: Public Routes ────────────────────────────────────────
  if (path === '/meal-plans/discover' || path === '/meal-plans/sample') {
    return withPublic(
      <MealPlansPublic onNavigate={onNavigate} />,
      'meal-plans',
      ctx,
    )
  }

  // ─── Meal Plans: Default Public Discovery Page ───────────────────────
  if (
    path === '/meal-plans' ||
    path === 'meal-plans' ||
    path.startsWith('/meal-plans')
  ) {
    return withPublic(
      <MealPlansPublic onNavigate={onNavigate} />,
      'meal-plans',
      ctx,
    )
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
  if (path === '/favorites') {
    if (!ctx.user) return <LoginPage onNavigate={onNavigate} />
    return <FavoritesPage onNavigate={onNavigate} />
  }

  if (path === '/profile/settings' || path === '/account/settings') {
    if (!ctx.user) {
      return <LoginPage onNavigate={onNavigate} />
    }
    return <ProfilePage onNavigate={onNavigate} initialViewMode="settings" />
  }

  if (
    path === '/profile' ||
    path === 'profile' ||
    path === '/profile/overview' ||
    path === '/account'
  ) {
    if (!ctx.user) {
      return <LoginPage onNavigate={onNavigate} />
    }
    return <ProfilePage onNavigate={onNavigate} initialViewMode="overview" />
  }

  if (
    path.startsWith('/auth/reset-password') ||
    path.startsWith('/reset-password')
  ) {
    return <ResetPasswordPage onNavigate={onNavigate} />
  }

  if (!ctx.user) {
    if (path === '/auth/login' || path === '/login')
      return <LoginPage onNavigate={onNavigate} />
    if (path === '/auth/register' || path === '/register')
      return <RegisterPage onNavigate={onNavigate} />
    if (path === '/auth/forgot-password' || path === '/forgot-password')
      return <ForgotPasswordPage onNavigate={onNavigate} />
    return <LoginPage onNavigate={onNavigate} />
  }

  if (path.startsWith('/admin') && ctx.user.role !== 'Admin') {
    return (
      <main className="max-w-lg mx-auto rounded-2xl border bg-white p-8 my-12">
        <h1 className="font-bold text-xl">Không có quyền quản trị</h1>
        <p className="mt-3">Chức năng này yêu cầu tài khoản Admin.</p>
        <button
          className="mt-4 text-emerald-800"
          onClick={() => onNavigate('/profile')}
        >
          Về hồ sơ
        </button>
      </main>
    )
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
  if (path === '/admin/feedback') {
    return <AdminFeedbackPage onNavigate={onNavigate} />
  }
  if (path === '/admin/reports') {
    return <AdminReportsPage onNavigate={onNavigate} />
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
