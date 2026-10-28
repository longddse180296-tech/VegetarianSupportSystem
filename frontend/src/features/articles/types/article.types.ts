// Chức năng: bài viết và phiên bản gửi duyệt. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// Cấu trúc ArticleCategory quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
export type ArticleCategory =
  | 'all'
  | 'nutrition'
  | 'lifestyle'
  | 'cooking-tips'
  | 'health'
  | 'ingredients'
  | 'experience'

// Cấu trúc ArticleAuthor quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
export interface ArticleAuthor {
  id: string
  name: string
  avatar: string
  roleTitle: string
  bio?: string
  isExpert?: boolean
}

// Cấu trúc ArticleComment quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
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

// Cấu trúc ArticleSummary quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
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

// Cấu trúc ArticleSection quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
export interface ArticleSection {
  number?: number
  title?: string
  content: string
}

// Cấu trúc ArticleDetailDto quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
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

// Cấu trúc ArticleFilterParams quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
export interface ArticleFilterParams {
  category?: ArticleCategory
  keyword?: string
  tag?: string
  page?: number
  pageSize?: number
  sortBy?: 'newest' | 'popular' | 'views'
}

// Cấu trúc PaginatedResult quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
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

// Cấu trúc UserArticleStatus quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
export type UserArticleStatus = 'published' | 'draft' | 'pending_review'

// Cấu trúc UserArticleItem quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
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

// Cấu trúc UserCommentSourceType quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
export type UserCommentSourceType = 'all' | 'recipe' | 'article' | 'video'

// Cấu trúc UserCommentItem quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
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

// Cấu trúc ArticleFormData quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
export interface ArticleFormData {
  id?: string
  title: string
  category: ArticleCategory
  content: string
  excerpt?: string
  thumbnailUrl?: string
  captionHeroImage?: string
  status: 'published' | 'draft'
}
