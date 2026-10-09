export type VideoStatus = 'published' | 'pending' | 'draft';
export type AiModerationStatus = 'Passed' | 'Checking' | 'Flagged' | 'NotSubmitted';

export interface UserVideoItem {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  duration: string;
  thumbnailUrl: string;
  videoUrl?: string;
  status: VideoStatus;
  statusLabel: string;
  publishedAt?: string;
  updatedAt?: string;
  submittedAt?: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  completionRate?: number;
  aiFlagStatus?: AiModerationStatus;
  adminNote?: string;
}

export interface VideoFilterParams {
  statusTab?: 'all' | 'published' | 'pending' | 'draft';
  category?: string;
  keyword?: string;
  sortBy?: 'newest' | 'views' | 'duration';
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface VideoFormData {
  title: string;
  category: string;
  duration: string;
  description: string;
  thumbnailUrl: string;
  videoUrl?: string;
  status?: VideoStatus;
}
