// Chức năng: báo cáo nội dung cần xem xét. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
import { apiClient } from '../../../shared/api/apiClient'

export const REPORT_REASONS = {
  Spam: 'Spam hoặc quảng cáo không phù hợp',
  Inappropriate: 'Nội dung xúc phạm hoặc không phù hợp',
  Misleading: 'Thông tin sai lệch hoặc gây hiểu nhầm',
  Copyright: 'Vi phạm quyền tác giả',
  Other: 'Lý do khác',
} as const
// Cấu trúc ReportReason quy định dữ liệu trao đổi trong báo cáo nội dung cần xem xét.
export type ReportReason = keyof typeof REPORT_REASONS
// Cấu trúc ReportTarget quy định dữ liệu trao đổi trong báo cáo nội dung cần xem xét.
export type ReportTarget = 'Article' | 'Video'
// Cấu trúc ReportStatus quy định dữ liệu trao đổi trong báo cáo nội dung cần xem xét.
export type ReportStatus = 'Pending' | 'Resolved' | 'Dismissed'
export const REPORT_STATUSES: Record<ReportStatus, string> = {
  Pending: 'Chờ xử lý', Resolved: 'Đã xử lý', Dismissed: 'Không chấp nhận',
}
// Cấu trúc ContentReportEntry quy định chi tiết một lượt báo cáo của người dùng cho nội dung.
export interface ContentReportEntry {
  id: string
  submissionId: string
  contentVersion: number
  reporterId: string
  reporterName: string | null
  reason: ReportReason
  details: string | null
  status: ReportStatus
  createdAt: string
  resolvedAt: string | null
  resolvedBy: string | null
  resolutionNote: string | null
}
// Cấu trúc ContentReport quy định dữ liệu trao đổi trong báo cáo nội dung cần xem xét.
export interface ContentReport {
  id: string
  targetType: ReportTarget
  targetId: string
  submissionId: string
  contentTitle: string
  contentVersion: number
  reporterId: string
  reporterName: string | null
  reason: ReportReason
  details: string | null
  status: ReportStatus
  createdAt: string
  resolvedAt: string | null
  resolvedBy: string | null
  resolutionNote: string | null
  pendingReporterCount: number
  totalReportCount?: number
  reports?: ContentReportEntry[]
}
// Cấu trúc ContentReportPage quy định dữ liệu trao đổi trong báo cáo nội dung cần xem xét.
export interface ContentReportPage { items: ContentReport[]; total: number; page: number; pageSize: number }
// Kiểm tra dữ liệu trước khi gửi thao tác và xử lý kết quả trả về (submitContentReport); thuộc báo cáo nội dung cần xem xét.
export const submitContentReport = (targetType: ReportTarget, targetId: string, reason: ReportReason, details: string) =>
  apiClient.post<{ id: string; status: ReportStatus }>('/api/content-reports', { targetType, targetId, reason, details: details.trim() || null })
// Kiểm tra người dùng hiện tại đã báo cáo nội dung này chưa để khóa nút chống spam.
export const getContentReportStatus = (targetType: ReportTarget, targetId: string) =>
  apiClient.get<{ hasReported: boolean }>(`/api/content-reports/status?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`)
// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (resolveContentReport); thuộc báo cáo nội dung cần xem xét.
export const resolveContentReport = (id: string, status: Exclude<ReportStatus, 'Pending'>, note: string) =>
  apiClient.post<void>(`/api/admin/content-reports/${encodeURIComponent(id)}/resolve`, { status, note: note.trim() })
