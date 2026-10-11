import { apiClient } from '../../../../shared/api/apiClient'
export type AiStatus =
  | 'NotSubmitted'
  | 'Checking'
  | 'Passed'
  | 'Flagged'
  | 'Partial'
  | 'Failed'
export type AdminStatus =
  | 'Draft'
  | 'Submitted'
  | 'PendingAdminReview'
  | 'Published'
  | 'RevisionRequested'
  | 'Rejected'
  | 'Removed'
export type Decision = 'Approve' | 'RequestRevision' | 'Reject' | 'Remove'
export const adminStatusLabels: Record<AdminStatus, string> = {
  Draft: 'Bản nháp',
  Submitted: 'Đã gửi',
  PendingAdminReview: 'Chờ Admin duyệt',
  Published: 'Đã xuất bản',
  RevisionRequested: 'Yêu cầu sửa',
  Rejected: 'Từ chối',
  Removed: 'Đã gỡ',
}
export const aiStatusLabels: Record<AiStatus, string> = {
  NotSubmitted: 'Không kiểm tra AI',
  Checking: 'Đang kiểm tra',
  Passed: 'Đã kiểm tra',
  Flagged: 'Có cờ cảnh báo',
  Partial: 'Kiểm tra một phần',
  Failed: 'Kiểm tra thất bại',
}
export const decisionLabels: Record<Decision, string> = {
  Approve: 'Duyệt xuất bản',
  RequestRevision: 'Yêu cầu sửa',
  Reject: 'Từ chối',
  Remove: 'Gỡ nội dung',
}
export interface Submission {
  id: string
  contentId: string
  version: number
  contentType: 'Article' | 'Video'
  ownerUserId: string
  title: string
  textContent: string
  mediaReference: string | null
  aiFlagStatus: AiStatus
  adminReviewStatus: AdminStatus
  aiSummary: string | null
  aiFlagReason: string | null
  aiFlagType: string | null
  aiPriority: string | null
  aiEvidence: string | null
  aiCheckedScope: string | null
  aiUncheckedScope: string | null
  aiCheckedAt: string | null
  submittedAt: string
  createdAtUtc: string
  updatedAtUtc: string
  isCurrentPublished: boolean
  decisions: Array<{
    id: string
    version: number
    decision: Decision
    adminUserId: string
    reason: string
    decidedAt: string
  }>
}
export const adminModerationApi = {
  get: (id: string) =>
    apiClient.get<Submission>(`/api/admin/moderation/submissions/${id}`),
  decide: (id: string, decision: Decision, reason: string) =>
    apiClient.post<Submission>(
      `/api/admin/moderation/submissions/${id}/decisions`,
      { decision, reason },
    ),
}
