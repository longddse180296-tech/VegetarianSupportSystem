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
import { VideoListPage, VideoDetailPage } from '../../features/videos'
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
  return (
    <PublicLayout
      activeNav={activeNav}
      onNavigate={ctx.onNavigate}
      isLoggedIn={isLoggedIn}
      userName={ctx.user?.fullName}
      onLogout={() => {
        void ctx.logout()
      }}
    >
      {node}
    </PublicLayout>
  )
}

const PATH_EQ = (p: string, ...candidates: string[]): boolean => {
  if (!p) return false
  // Normalize candidate forms (leading slash + trailing slash strip) to a set.
  const normalizedInput = `/${p.replace(/^\/+|\/+$/g, '')}`
  return candidates.some((c) => {
    const nc = `/${c.replace(/^\/+|\/+$/g, '')}`
    return normalizedInput === nc
  })
}

/**
 * Strict prefix match — each `prefix` may be passed with or without a leading
 * slash but the final check always requires `input === /prefix` OR
 * `input.startsWith(/prefix/ )` so random prefix collisions (e.g. `/mealplanner`
 * matching `meal-plans` prefix form w/o slash) cannot happen.
 */
const PATH_STARTS = (p: string, ...prefixes: string[]): boolean => {
  if (!p) return false
  const normalizedInput = `/${p.replace(/^\/+|\/+$/g, '')}`
  return prefixes.some((prefixRaw) => {
    const np = `/${String(prefixRaw).replace(/^\/+|\/+$/g, '')}`
    if (np === '/') return normalizedInput === '/'
    return normalizedInput === np || normalizedInput.startsWith(np + '/')
  })
}

export const RouterRenderer: React.FC<RouterRendererProps> = (ctx) => {
  const path = ctx.currentPath
  const { onNavigate } = ctx
  const isLoggedIn = Boolean(ctx.user)

  // --------------------------------------------------------------------------
  // 1. HOME
  // --------------------------------------------------------------------------
  if (PATH_EQ(path, '/', '', '/home', 'home', '/trang-chu', 'trang-chu')) {
    return withPublic(
      <HomePage onNavigate={onNavigate} isLoggedIn={isLoggedIn} />,
      'home',
      ctx,
    )
  }

  // --------------------------------------------------------------------------
  // 2. RECIPES + detail alias /cong-thuc/:slug
  // --------------------------------------------------------------------------
  const recipeMatch =
    path.match(/^\/recipes\/([^/]+)\/?$/) ||
    path.match(/^\/cong-thuc\/([^/]+)\/?$/)
  if (
    PATH_EQ(path, '/recipes', 'recipes', '/cong-thuc', 'cong-thuc')
  ) {
    return withPublic(<RecipeList onNavigate={onNavigate} />, 'recipes', ctx)
  }
  if (recipeMatch) {
    let recipeId = ''
    try {
      recipeId = decodeURIComponent(recipeMatch[1])
    } catch {
      recipeId = ''
    }
    return withPublic(
      <RecipeDetail key={recipeId} recipeId={recipeId} onNavigate={onNavigate} />,
      'recipes',
      ctx,
    )
  }

  // --------------------------------------------------------------------------
  // 3. PANTRY + alias /tu-bep-ai
  // --------------------------------------------------------------------------
  if (PATH_EQ(path, '/pantry', 'pantry', '/tu-bep-ai', 'tu-bep-ai', '/tu-bep', 'tu-bep')) {
    return withPublic(<PantryPage onNavigate={onNavigate} />, 'pantry', ctx)
  }

  // --------------------------------------------------------------------------
  // 4. AI CHAT + alias /tro-ly-ai
  // --------------------------------------------------------------------------
  if (
    PATH_EQ(path, '/ai-chat', 'ai-chat', '/aichat', 'aichat', '/tro-ly-ai', 'tro-ly-ai')
  ) {
    return withPublic(
      <AiChatPage onNavigate={onNavigate} isLoggedIn={isLoggedIn} />,
      'ai-chat',
      ctx,
    )
  }

  // --------------------------------------------------------------------------
  // 5. FOOD SCAN + alias /quet-thuc-pham
  // --------------------------------------------------------------------------
  if (
    PATH_EQ(
      path,
      '/food-scan',
      'food-scan',
      '/foodscan',
      'foodscan',
      '/quet-thuc-pham',
      'quet-thuc-pham',
    )
  ) {
    return withPublic(
      <FoodScanPage onNavigate={onNavigate} isLoggedIn={isLoggedIn} />,
      'food-scan',
      ctx,
    )
  }

  // --------------------------------------------------------------------------
  // 6. VIDEOS + detail /videos/:id alias /video/:id
  // --------------------------------------------------------------------------
  const videoMatch =
    path.match(/^\/videos\/([^/]+)\/?$/) || path.match(/^\/video\/([^/]+)\/?$/)
  if (
    PATH_EQ(
      path,
      '/videos',
      'videos',
      '/video',
      'video',
      '/my-videos',
      'my-videos',
      '/video-huong-dan',
      'video-huong-dan',
    )
  ) {
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

  // --------------------------------------------------------------------------
  // 7. RESTAURANTS + alias /nha-hang-chay + detail
  // --------------------------------------------------------------------------
  const restaurantMatch =
    path.match(/^\/restaurants\/([^/]+)\/?$/) ||
    path.match(/^\/nha-hang-chay\/([^/]+)\/?$/)
  if (
    PATH_EQ(
      path,
      '/restaurants',
      'restaurants',
      '/nha-hang-chay',
      'nha-hang-chay',
    )
  ) {
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

  // --------------------------------------------------------------------------
  // 8. ARTICLES + alias /bai-viet + detail
  // Editor paths are parsed FIRST, before the generic :id detail regex, to
  // prevent `/articles/editor/foo` being misinterpreted as article id="editor".
  // --------------------------------------------------------------------------
  const articleEditorNewMatch =
    path.match(/^\/articles\/editor\/?$/) ||
    path.match(/^\/bai-viet\/editor\/?$/)
  const articleEditorEditMatch =
    path.match(/^\/articles\/editor\/([^/]+)\/?$/) ||
    path.match(/^\/bai-viet\/editor\/([^/]+)\/?$/)
  const myArticlesMatch = PATH_EQ(
    path,
    '/profile/my-articles',
    'profile/my-articles',
    '/my-articles',
    'my-articles',
  )
  const myCommentsMatch = PATH_EQ(
    path,
    '/profile/my-comments',
    'profile/my-comments',
    '/my-comments',
    'my-comments',
  )

  const articleDetailMatch =
    !articleEditorNewMatch &&
    !articleEditorEditMatch &&
    (path.match(/^\/articles\/([^/]+)\/?$/) ||
      path.match(/^\/bai-viet\/([^/]+)\/?$/))

  if (
    PATH_EQ(
      path,
      '/articles',
      'articles',
      '/bai-viet',
      'bai-viet',
    )
  ) {
    return withPublic(
      <ArticleList
        onSelectArticle={(id) => onNavigate(`/articles/${id}`)}
        onNavigateHome={() => onNavigate('/recipes')}
        onOpenAiChat={() => onNavigate('/ai-chat')}
      />,
      'articles',
      ctx,
    )
  }
  if (articleDetailMatch) {
    const articleId = decodeURIComponent(articleDetailMatch[1])
    return withPublic(
      <ArticleDetail
        key={articleId}
        articleId={articleId}
        onBackToList={() => onNavigate('/articles')}
        onSelectRelatedArticle={(id) => onNavigate(`/articles/${id}`)}
      />,
      'articles',
      ctx,
    )
  }

  // --------------------------------------------------------------------------
  // 9. MEAL-PLANS + alias /thuc-don, /ke-hoach-thuc-don
  // --------------------------------------------------------------------------
  const mealPlanDetailMatch =
    path.match(/^\/meal-plans\/detail\/?(.+)?$/) ||
    path.match(/^\/thuc-don\/detail\/?(.+)?$/)

  if (PATH_EQ(path, '/meal-plans/setup', '/thuc-don/setup')) {
    return withPublic(
      <PersonalizationSetupPage onNavigate={onNavigate} />,
      'meal-plans',
      ctx,
    )
  }
  if (PATH_EQ(path, '/meal-plans/recommended', '/thuc-don/recommended')) {
    return withPublic(
      <RecommendedMealPlanPage onNavigate={onNavigate} />,
      'meal-plans',
      ctx,
    )
  }
  if (
    PATH_EQ(
      path,
      '/meal-plans/my-plan',
      'meal-plans/my-plan',
      '/meal-plans/weekly',
      'meal-plans/weekly',
      '/meal-plans/calendar',
      'meal-plans/calendar',
      '/thuc-don/my-plan',
      'thuc-don/my-plan',
      '/thuc-don/weekly',
      'thuc-don/weekly',
      '/thuc-don/calendar',
      'thuc-don/calendar',
    )
  ) {
    return withPublic(<MyMealPlanPage onNavigate={onNavigate} />, 'meal-plans', ctx)
  }
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
    PATH_STARTS(
      path,
      '/meal-plans',
      'meal-plans',
      '/thuc-don',
      'thuc-don',
      '/ke-hoach-thuc-don',
      'ke-hoach-thuc-don',
    )
  ) {
    return withPublic(
      <GeneralMealPlanPage onNavigate={onNavigate} />,
      'meal-plans',
      ctx,
    )
  }

  // --------------------------------------------------------------------------
  // 10. MY ARTICLES / MY COMMENTS / ARTICLE EDITOR (wrapped in PublicLayout so header exists)
  // --------------------------------------------------------------------------
  if (articleEditorNewMatch) {
    return withPublic(<ArticleEditorPage onNavigate={onNavigate} />, 'articles', ctx)
  }
  if (articleEditorEditMatch) {
    const editId = decodeURIComponent(articleEditorEditMatch[1])
    return withPublic(
      <ArticleEditorPage articleId={editId} onNavigate={onNavigate} />,
      'articles',
      ctx,
    )
  }
  if (myArticlesMatch) {
    return withPublic(<MyArticlesPage onNavigate={onNavigate} />, 'articles', ctx)
  }
  if (myCommentsMatch) {
    return withPublic(<MyCommentsPage onNavigate={onNavigate} />, 'articles', ctx)
  }

  // --------------------------------------------------------------------------
  // 11. AUTH (no PublicLayout so login/register/forgot are standalone centered)
  // --------------------------------------------------------------------------
  if (!ctx.user) {
    if (PATH_EQ(path, '/auth/login', 'auth/login')) {
      return <LoginPage onNavigate={onNavigate} />
    }
    if (PATH_EQ(path, '/auth/register', 'auth/register')) {
      return <RegisterPage onNavigate={onNavigate} />
    }
    if (PATH_EQ(path, '/auth/forgot-password', 'auth/forgot-password')) {
      return <ForgotPasswordPage onNavigate={onNavigate} />
    }
    return <LoginPage onNavigate={onNavigate} />
  }

  // --------------------------------------------------------------------------
  // 12. PROFILE (wrapped so user stays inside app shell with header)
  // --------------------------------------------------------------------------
  if (PATH_STARTS(path, '/profile', 'profile')) {
    return withPublic(<ProfilePage onNavigate={onNavigate} />, 'profile', ctx)
  }

  // --------------------------------------------------------------------------
  // 13. ADMIN (standalone admin layout, no public shell)
  // --------------------------------------------------------------------------
  if (
    PATH_EQ(
      path,
      '/admin',
      'admin',
      '/admin/dashboard',
      'admin/dashboard',
    )
  ) {
    return <AdminDashboardPage onNavigate={onNavigate} />
  }
  if (PATH_STARTS(path, '/admin/articles', 'admin/articles')) {
    return <AdminArticlesPage onNavigate={onNavigate} />
  }
  if (PATH_STARTS(path, '/admin/categories', 'admin/categories')) {
    return <AdminCategoriesPage onNavigate={onNavigate} />
  }
  if (PATH_STARTS(path, '/admin/videos', 'admin/videos')) {
    return <AdminVideosPage onNavigate={onNavigate} />
  }
  if (PATH_STARTS(path, '/admin/comments', 'admin/comments')) {
    return <AdminCommentsPage onNavigate={onNavigate} />
  }
  if (PATH_STARTS(path, '/admin/members', 'admin/members')) {
    return <MembersPage onNavigate={onNavigate} />
  }
  if (PATH_STARTS(path, '/admin/ingredients', 'admin/ingredients')) {
    return <AdminIngredientsPage onNavigate={onNavigate} />
  }
  if (PATH_STARTS(path, '/admin/recipes', 'admin/recipes')) {
    return <AdminRecipesPage onNavigate={onNavigate} />
  }
  if (PATH_STARTS(path, '/admin/restaurants', 'admin/restaurants')) {
    return <AdminRestaurantsPage onNavigate={onNavigate} />
  }
  if (PATH_STARTS(path, '/admin/moderation', 'admin/moderation')) {
    return <AdminModerationPage onNavigate={onNavigate} />
  }
  if (PATH_STARTS(path, '/admin', 'admin')) {
    return <AdminDashboardPage onNavigate={onNavigate} />
  }

  // Fallback: authenticated users without a matching route land on profile.
  return withPublic(<ProfilePage onNavigate={onNavigate} />, 'profile', ctx)
}
