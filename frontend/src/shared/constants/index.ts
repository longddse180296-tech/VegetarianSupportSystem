/**
 * Hệ thống hằng số chuẩn hóa theo docs/mvp.md và contracts/
 */

// 3 Vai trò duy nhất của hệ thống
export const ROLES = ['Guest', 'User', 'Admin'] as const
export type Role = (typeof ROLES)[number]

// 4 Chế độ ăn chuẩn hóa toàn hệ thống (không viết tắt)
export const STANDARD_DIETARY_NAMES = {
  VEGAN: 'Thuần chay (Vegan)',
  LACTO: 'Ăn chay có sữa (Lacto)',
  OVO: 'Chay có trứng (Ovo)',
  LACTO_OVO: 'Trứng & Sữa (Lacto-ovo)',
} as const

export type StandardDietaryName =
  (typeof STANDARD_DIETARY_NAMES)[keyof typeof STANDARD_DIETARY_NAMES]

export const ALL_STANDARD_DIETARY_NAMES: readonly StandardDietaryName[] = [
  STANDARD_DIETARY_NAMES.VEGAN,
  STANDARD_DIETARY_NAMES.LACTO,
  STANDARD_DIETARY_NAMES.OVO,
  STANDARD_DIETARY_NAMES.LACTO_OVO,
] as const

// 4 Chế độ ăn thuần chay chuẩn MVP
export const DIETARY_TYPES = [
  'Vegan',
  'Lacto-vegetarian',
  'Ovo-vegetarian',
  'Lacto-ovo vegetarian',
] as const
export type DietaryType = (typeof DIETARY_TYPES)[number]

export const DIETARY_TYPE_LABELS: Record<DietaryType, string> = {
  Vegan: STANDARD_DIETARY_NAMES.VEGAN,
  'Lacto-vegetarian': STANDARD_DIETARY_NAMES.LACTO,
  'Ovo-vegetarian': STANDARD_DIETARY_NAMES.OVO,
  'Lacto-ovo vegetarian': STANDARD_DIETARY_NAMES.LACTO_OVO,
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
