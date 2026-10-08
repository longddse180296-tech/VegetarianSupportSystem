export type ArticleCategory =
  | 'all'
  | 'nutrition'
  | 'lifestyle'
  | 'cooking-tips'
  | 'health'
  | 'ingredients'
  | 'experience'

export interface ArticleAuthor {
  id: string
  name: string
  avatar: string
  roleTitle: string
  bio?: string
  isExpert?: boolean
}

export interface ArticleComment {
  id: string
  articleId: string
  authorName: string
  authorAvatar: string
  badge?: string
  content: string
  createdAt: string
  likesCount: number
  isLiked?: boolean
}

export interface ArticleSummary {
  id: string
  title: string
  slug: string
  excerpt: string
  thumbnailUrl: string
  category: ArticleCategory
  categoryLabel: string
  publishedAt: string
  readTimeMinutes: number
  author: ArticleAuthor
  isFeatured?: boolean
  viewsCount?: number
  likesCount?: number
  tags: string[]
}

export interface ArticleSection {
  number?: number
  title?: string
  content: string
}

export interface ArticleDetailDto extends ArticleSummary {
  captionHeroImage?: string
  sections: ArticleSection[]
  quoteBox?: {
    quote: string
    author?: string
  }
  expertAdvice?: {
    title: string
    content: string
  }
  comments: ArticleComment[]
  relatedArticles: ArticleSummary[]
}

export interface ArticleFilterParams {
  category?: ArticleCategory
  keyword?: string
  tag?: string
  page?: number
  pageSize?: number
  sortBy?: 'newest' | 'popular' | 'views'
}

export interface PaginatedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// ========================
// Phase 2: User Content Management Types
// ========================

export type UserArticleStatus = 'published' | 'draft' | 'pending_review'

export interface UserArticleItem {
  id: string
  title: string
  excerpt: string
  category: ArticleCategory
  categoryLabel: string
  status: UserArticleStatus
  statusLabel: string
  publishedAt?: string
  updatedAt: string
  viewsCount: number
  likesCount: number
  commentsCount: number
  completionRate?: number // e.g. 65% for drafts
  thumbnailUrl?: string
}

export type UserCommentSourceType = 'all' | 'recipe' | 'article' | 'video'

export interface UserCommentItem {
  id: string
  sourceType: 'recipe' | 'article' | 'video'
  sourceLabel: string
  targetTitle: string
  targetTypePrefix: string
  targetThumbnail?: string
  createdAt: string
  status: 'active' | 'hidden'
  likesCount: number
  content: string
  authorReply?: {
    authorName: string
    roleBadge?: string
    createdAt: string
    content: string
  }
}

export interface ArticleFormData {
  id?: string
  title: string
  category: ArticleCategory
  content: string
  excerpt?: string
  thumbnailUrl?: string
  status: 'published' | 'draft'
}
