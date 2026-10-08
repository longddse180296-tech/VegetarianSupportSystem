import { apiClient } from '../../../../shared/api/apiClient'
import type { AdminModerationItem } from '../types/adminModeration.types'

export const adminModerationApi = {
  listPending: () =>
    apiClient.get<{ items: AdminModerationItem[]; totalCount: number }>(
      '/api/admin/moderation/pending',
    ),
  approve: (id: string) =>
    apiClient.post<void>(`/api/admin/moderation/${id}/approve`),
  requestRevision: (id: string, reason: string) =>
    apiClient.post<void>(`/api/admin/moderation/${id}/revision`, { reason }),
  reject: (id: string, reason: string) =>
    apiClient.post<void>(`/api/admin/moderation/${id}/reject`, { reason }),
}
