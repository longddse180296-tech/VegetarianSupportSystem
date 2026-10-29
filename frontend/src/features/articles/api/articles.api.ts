// Chức năng: bài viết và phiên bản gửi duyệt. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
import { apiClient } from '../../../shared/api/apiClient'
import type { BackendDietaryType } from '../../../shared/constants'
import type {
  AdminStatus,
  AiStatus,
  Submission,
} from '../../admin/moderation/api/adminModerationApi'
// Cấu trúc ContentPage quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
export interface ContentPage<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
}
// Cấu trúc PublicArticleSummary quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
export interface PublicArticleSummary {
  id: string
  title: string
  category: string
  categories: string[]
  dietaryTypes: BackendDietaryType[]
  dietaryType: BackendDietaryType | null
  coverImageUrl: string | null
  authorId: string
  authorName: string | null
  version: number
  publishedAt: string
}
// Cấu trúc PublicArticleDetail quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
export interface PublicArticleDetail extends PublicArticleSummary {
  content: string
  relatedArticles: PublicArticleSummary[]
}
// Cấu trúc MyArticleRecord quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
export interface MyArticleRecord {
  id: string
  title: string
  content: string
  category: string
  categories: string[]
  dietaryTypes: BackendDietaryType[]
  dietaryType: BackendDietaryType | null
  coverImageUrl: string | null
  createdAt: string
  updatedAt: string
  status: AdminStatus
  publishedVersion: PublicArticleSummary | null
  versions: Array<{
    version: number
    submissionId: string
    aiStatus: AiStatus
    adminStatus: AdminStatus
    aiSummary: string | null
    systemRejectionReason?: string | null
    adminFeedback: string | null
    submittedAt: string
  }>
}
// Cấu trúc ArticleInput quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
export interface ArticleInput {
  title: string
  content: string
  categories: string[]
  coverImageUrl: string | null
  dietaryType: BackendDietaryType | null
}
// Cấu trúc CommentRecord quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
export interface CommentRecord {
  id: string
  targetType: 'Article' | 'Video'
  targetId: string
  parentId: string | null
  authorId: string
  authorName: string | null
  body: string | null
  status: 'Visible' | 'Hidden' | 'Removed'
  createdAt: string
  updatedAt: string
  likeCount: number
  moderationReason: string | null
  moderatedBy: string | null
  moderatedAt: string | null
}
// Cấu trúc Reaction quy định dữ liệu trao đổi trong bài viết và phiên bản gửi duyệt.
export interface Reaction {
  count: number
  reactedByMe: boolean
}
export const articleCategories = [
  'Dinh dưỡng',
  'Sức khỏe',
  'Ẩm thực',
  'Lối sống',
  'Mẹo vặt',
  'Thể thao',
  'Kiến thức',
  'Kinh nghiệm',
]
export const articleApi = {
  get: (id: string) =>
    apiClient.get<PublicArticleDetail>(
      `/api/articles/${encodeURIComponent(id)}`,
    ),
  mine: (id: string) =>
    apiClient.get<MyArticleRecord>(
      `/api/me/articles/${encodeURIComponent(id)}`,
    ),
  create: (input: ArticleInput) =>
    apiClient.post<MyArticleRecord>('/api/me/articles', input),
  update: (id: string, input: ArticleInput) =>
    apiClient.put<MyArticleRecord>(`/api/me/articles/${id}`, input),
  submit: (id: string) =>
    apiClient.post<MyArticleRecord>(`/api/me/articles/${id}/submit`),
  remove: (id: string) => apiClient.delete<void>(`/api/me/articles/${id}`),
  review: (id: string) =>
    apiClient.get<Submission>(`/api/moderation/submissions/${id}`),
}
export const commentApi = {
  create: (targetId: string, body: string, parentId: string | null = null) =>
    apiClient.post<CommentRecord>('/api/comments', {
      targetType: 'Article',
      targetId,
      parentId,
      body,
    }),
  update: (id: string, body: string) =>
    apiClient.put<CommentRecord>(`/api/comments/${id}`, { body }),
  remove: (id: string) => apiClient.delete<void>(`/api/comments/${id}`),
  reaction: (id: string) => apiClient.get<Reaction>(`/api/comments/${id}/like`),
  react: (id: string, reacted: boolean) =>
    reacted
      ? apiClient.delete<Reaction>(`/api/comments/${id}/like`)
      : apiClient.put<Reaction>(`/api/comments/${id}/like`),
}
