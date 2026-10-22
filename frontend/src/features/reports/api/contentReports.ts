import { apiClient } from '../../../shared/api/apiClient'

export const REPORT_REASONS = {
  Spam: 'Spam hoặc quảng cáo không phù hợp',
  Inappropriate: 'Nội dung xúc phạm hoặc không phù hợp',
  Misleading: 'Thông tin sai lệch hoặc gây hiểu nhầm',
  Copyright: 'Vi phạm quyền tác giả',
  Other: 'Lý do khác',
} as const
export type ReportReason = keyof typeof REPORT_REASONS
export type ReportTarget = 'Article' | 'Video'
export type ReportStatus = 'Pending' | 'Resolved' | 'Dismissed'
export const REPORT_STATUSES: Record<ReportStatus, string> = {
  Pending: 'Chờ xử lý', Resolved: 'Đã xử lý', Dismissed: 'Không chấp nhận',
}
export interface ContentReport {
  id: string
  targetType: ReportTarget
  targetId: string
  submissionId: string
  contentTitle: string
  contentVersion: number
  reporterId: string
  reason: ReportReason
  details: string | null
  status: ReportStatus
  createdAt: string
  resolvedAt: string | null
  resolvedBy: string | null
  resolutionNote: string | null
  pendingReporterCount: number
}
export interface ContentReportPage { items: ContentReport[]; total: number; page: number; pageSize: number }
export const submitContentReport = (targetType: ReportTarget, targetId: string, reason: ReportReason, details: string) =>
  apiClient.post<{ id: string; status: ReportStatus }>('/api/content-reports', { targetType, targetId, reason, details: details.trim() || null })
export const resolveContentReport = (id: string, status: Exclude<ReportStatus, 'Pending'>, note: string) =>
  apiClient.post<void>(`/api/admin/content-reports/${encodeURIComponent(id)}/resolve`, { status, note: note.trim() })
