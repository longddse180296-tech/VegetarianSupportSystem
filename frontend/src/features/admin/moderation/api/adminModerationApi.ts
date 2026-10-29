// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
import { apiClient } from '../../../../shared/api/apiClient'
// Cấu trúc AiStatus quy định dữ liệu trao đổi trong kiểm duyệt nội dung và kết quả kiểm tra AI.
export type AiStatus =
  | 'NotSubmitted'
  | 'Checking'
  | 'Passed'
  | 'Flagged'
  | 'Partial'
  | 'Failed'
// Cấu trúc AdminStatus quy định dữ liệu trao đổi trong kiểm duyệt nội dung và kết quả kiểm tra AI.
export type AdminStatus =
  | 'Draft'
  | 'Submitted'
  | 'PendingAdminReview'
  | 'Published'
  | 'RevisionRequested'
  | 'Rejected'
  | 'Removed'
// Cấu trúc Decision quy định dữ liệu trao đổi trong kiểm duyệt nội dung và kết quả kiểm tra AI.
export type Decision = 'Approve' | 'RequestRevision' | 'Reject' | 'Remove'
export const adminStatusLabels: Record<AdminStatus, string> = {
  Draft: 'Bản nháp',
  Submitted: 'Đã gửi',
  PendingAdminReview: 'Chờ Quản trị viên duyệt',
  Published: 'Đã xuất bản',
  RevisionRequested: 'Yêu cầu sửa',
  Rejected: 'Từ chối',
  Removed: 'Đã gỡ',
}
export const aiStatusLabels: Record<AiStatus, string> = {
  NotSubmitted: 'Chưa kiểm tra tự động',
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
// Cấu trúc Submission quy định dữ liệu trao đổi trong kiểm duyệt nội dung và kết quả kiểm tra AI.
export interface Submission {
  id: string
  contentId: string
  version: number
  contentType: 'Article' | 'Video'
  ownerUserId: string
  ownerName: string | null
  title: string
  textContent: string
  mediaReference: string | null
  aiFlagStatus: AiStatus
  adminReviewStatus: AdminStatus
  aiSummary: string | null
  systemRejectionReason?: string | null
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
  pendingReporterCount: number
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
