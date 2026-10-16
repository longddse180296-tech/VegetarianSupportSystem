import { apiClient, getStoredToken } from '../../../shared/api/apiClient';
import type {
  UserVideoItem,
  VideoFilterParams,
  PaginatedResult,
  VideoFormData,
} from '../types';

export interface HomeVideoSummary {
  id: string;
  title: string;
  duration: string;
  thumbnailUrl: string;
  channelName: string;
}

interface BackendVideoDetails {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  uploadStatus: string;
  aiFlagStatus: string | null;
  adminReviewStatus: string | null;
  version: number | null;
  aiSummary: string | null;
  aiUncheckedScope: string | null;
  adminReason: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  viewCount: number;
  favoriteCount: number;
  createdAtUtc: string;
}

interface BackendVideoPage {
  items: BackendVideoDetails[];
  totalCount: number;
  page: number;
  pageSize: number;
}

function mapBackendToUserVideo(d: BackendVideoDetails): UserVideoItem {
  const isPublished = d.adminReviewStatus === 'Published';
  const isDraft = !d.adminReviewStatus || d.adminReviewStatus === 'Draft';
  const isRejected = d.adminReviewStatus === 'Rejected';

  let status: 'published' | 'pending' | 'draft' = 'pending';
  let statusLabel = 'Đang kiểm duyệt';
  if (isPublished) {
    status = 'published';
    statusLabel = 'Đã xuất bản';
  } else if (isDraft) {
    status = 'draft';
    statusLabel = 'Bản nháp';
  } else if (isRejected) {
    status = 'draft';
    statusLabel = 'Bị từ chối';
  }

  const createdDate = d.createdAtUtc ? d.createdAtUtc.slice(0, 10) : 'Gần đây';

  return {
    id: d.id,
    title: d.title,
    description: d.description,
    category: d.categoryId ?? '',
    categoryLabel: '',
    duration: '',
    thumbnailUrl:
      d.thumbnailUrl ?? '',
    status,
    statusLabel,
    publishedAt: isPublished ? createdDate : undefined,
    updatedAt: createdDate,
    submittedAt: isDraft ? undefined : createdDate,
    viewsCount: d.viewCount,
    likesCount: d.favoriteCount,
    commentsCount: 0,
    aiFlagStatus: (d.aiFlagStatus as any) || 'NotSubmitted',
    adminNote: d.adminReason || undefined,
  };
}

export async function fetchVideos(): Promise<HomeVideoSummary[]> {
  try {
    const res = await apiClient.get<BackendVideoPage>('/api/videos?page=1&pageSize=10', {
      requiresAuth: false,
    });
    if (res?.items && Array.isArray(res.items)) {
      return res.items.map((v) => ({
        id: v.id,
        title: v.title,
        duration: '',
        thumbnailUrl:
          v.thumbnailUrl ?? '',
        channelName: '',
      }));
    }
  } catch {
    // API error
  }

  return [];
}

export const VIDEO_CATEGORIES = [
  { id: 'all', label: 'Tất cả danh mục' },
  { id: 'main', label: 'Món chính' },
  { id: 'salad', label: 'Khai vị & Salad' },
  { id: 'drink', label: 'Đồ uống & Detox' },
  { id: 'soup', label: 'Món nước & Súp' },
  { id: 'dessert', label: 'Tráng miệng & Ăn vặt' },
  { id: 'tips', label: 'Mẹo nhà bếp' },
  { id: 'meal-plans', label: 'Kế hoạch dinh dưỡng' },
];

function parseDurationToSeconds(dur: string): number {
  const parts = dur.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Fetch paginated user videos with tabs, search, category, and sorting
 */
export async function getUserVideos(
  params: VideoFilterParams = {}
): Promise<PaginatedResult<UserVideoItem>> {
  const token = getStoredToken();
  if (token) {
    try {
      const res = await apiClient.get<BackendVideoPage>('/api/me/videos?page=1&pageSize=50');
      if (res && Array.isArray(res.items)) {
        let list = res.items.map(mapBackendToUserVideo);

        // 1. Status Tab filter
        if (params.statusTab && params.statusTab !== 'all') {
          list = list.filter((v) => v.status === params.statusTab);
        }

        // 2. Category filter
        if (params.category && params.category !== 'all') {
          list = list.filter((v) => v.category === params.category);
        }

        // 3. Keyword filter
        if (params.keyword?.trim()) {
          const q = params.keyword.toLowerCase().trim();
          list = list.filter(
            (v) =>
              v.title.toLowerCase().includes(q) ||
              v.description.toLowerCase().includes(q)
          );
        }

        // 4. Sort
        if (params.sortBy === 'views') {
          list.sort((a, b) => b.viewsCount - a.viewsCount);
        } else if (params.sortBy === 'duration') {
          list.sort(
            (a, b) => parseDurationToSeconds(b.duration) - parseDurationToSeconds(a.duration)
          );
        }

        // 5. Pagination
        const page = params.page || 1;
        const pageSize = params.pageSize || 4;
        const totalCount = list.length;
        const totalPages = Math.ceil(totalCount / pageSize) || 1;
        const startIndex = (page - 1) * pageSize;
        const items = list.slice(startIndex, startIndex + pageSize);

        return {
          items,
          totalCount,
          page,
          pageSize,
          totalPages,
        };
      }
    } catch {
      // API error
    }
  }

  return {
    items: [],
    totalCount: 0,
    page: params.page || 1,
    pageSize: params.pageSize || 4,
    totalPages: 1,
  };
}

/**
 * Delete a user video
 */
export async function deleteUserVideo(_id: string): Promise<boolean> {
  return false;
}

/**
 * Update a user video
 */
export async function updateUserVideo(
  id: string,
  data: Partial<VideoFormData>
): Promise<UserVideoItem> {
  const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const token = getStoredToken();
  if (token && isGuid) {
    const res = await apiClient.put<BackendVideoDetails>(`/api/me/videos/${id}`, {
      title: data.title ?? '',
      description: data.description ?? '',
      categoryId: null,
    });
    if (res?.id) {
      return mapBackendToUserVideo(res);
    }
  }

  throw new Error('Không thể cập nhật video.');
}

/**
 * Create a new user video
 */
export async function createUserVideo(
  data: VideoFormData
): Promise<UserVideoItem> {
  const token = getStoredToken();
  if (token) {
    const res = await apiClient.post<BackendVideoDetails>('/api/me/videos', {
      title: data.title,
      description: data.description,
      categoryId: null,
    });
    if (res?.id) {
      if (data.status !== 'draft') {
        await apiClient.post(`/api/me/videos/${res.id}/submit`).catch(() => {});
      }
      return mapBackendToUserVideo(res);
    }
  }

  throw new Error('Vui lòng đăng nhập để đăng video.');
}

/**
 * Submit a draft video to moderation queue
 */
export async function submitUserVideo(id: string): Promise<UserVideoItem> {
  const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const token = getStoredToken();
  if (token && isGuid) {
    await apiClient.post(`/api/me/videos/${id}/submit`);
    const updated = await apiClient.get<BackendVideoDetails>(`/api/me/videos/${id}`);
    if (updated?.id) {
      return mapBackendToUserVideo(updated);
    }
  }

  throw new Error('Không thể gửi duyệt video.');
}

/**
 * Upload real media file for user video (MP4/WebM <= 200MB)
 */
export async function uploadVideoMedia(videoId: string, file: File): Promise<UserVideoItem | null> {
  const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId);
  const token = getStoredToken();
  if (token && isGuid) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.request<BackendVideoDetails>(`/api/me/videos/${videoId}/media`, {
        method: 'POST',
        body: formData,
        requiresAuth: true,
      });
      if (res?.id) return mapBackendToUserVideo(res);
    } catch {
      // Error handling
    }
  }
  return null;
}

/**
 * Upload real thumbnail file for user video (JPG/PNG/WebP <= 10MB)
 */
export async function uploadVideoThumbnail(videoId: string, file: File): Promise<UserVideoItem | null> {
  const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId);
  const token = getStoredToken();
  if (token && isGuid) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.request<BackendVideoDetails>(`/api/me/videos/${videoId}/thumbnail`, {
        method: 'POST',
        body: formData,
        requiresAuth: true,
      });
      if (res?.id) return mapBackendToUserVideo(res);
    } catch {
      // Error handling
    }
  }
  return null;
}
