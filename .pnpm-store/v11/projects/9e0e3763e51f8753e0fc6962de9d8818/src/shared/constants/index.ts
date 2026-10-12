/**
 * Hệ thống hằng số chuẩn hóa theo docs/mvp.md và contracts/
 */

// 3 Vai trò duy nhất của hệ thống
export const ROLES = ['Guest', 'User', 'Admin'] as const
export type Role = (typeof ROLES)[number]

// 4 Chế độ ăn thuần chay chuẩn MVP
export const DIETARY_TYPES = [
  'Vegan',
  'Lacto-vegetarian',
  'Ovo-vegetarian',
  'Lacto-ovo vegetarian',
] as const
export type DietaryType = (typeof DIETARY_TYPES)[number]

export const DIETARY_TYPE_LABELS: Record<DietaryType, string> = {
  Vegan: 'Thuần chay (Vegan)',
  'Lacto-vegetarian': 'Chay có sữa (Lacto-vegetarian)',
  'Ovo-vegetarian': 'Chay có trứng (Ovo-vegetarian)',
  'Lacto-ovo vegetarian': 'Chay trứng sữa (Lacto-ovo vegetarian)',
}

// Trạng thái AI Flag Check (tách bạch hoàn toàn với Admin)
export const AI_FLAG_STATUSES = [
  'NotSubmitted',
  'Checking',
  'Passed',
  'Flagged',
  'Partial',
  'Failed',
] as const
export type AiFlagStatus = (typeof AI_FLAG_STATUSES)[number]

// Trạng thái duyệt bài của Admin
export const ADMIN_REVIEW_STATUSES = [
  'Draft',
  'Submitted',
  'PendingAdminReview',
  'Published',
  'RevisionRequested',
  'Rejected',
  'Removed',
] as const
export type AdminReviewStatus = (typeof ADMIN_REVIEW_STATUSES)[number]

// Trạng thái đánh giá món ăn / nhãn thành phần (Scan)
export const FOOD_SCAN_SUITABILITY = [
  'suitable', // Phù hợp theo thông tin đã cung cấp
  'unsuitable', // Không phù hợp
  'insufficient', // Chưa đủ thông tin
] as const
export type FoodScanSuitability = (typeof FOOD_SCAN_SUITABILITY)[number]
