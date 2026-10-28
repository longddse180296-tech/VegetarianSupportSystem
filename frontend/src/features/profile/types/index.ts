// Chức năng: hồ sơ và nhu cầu dinh dưỡng cá nhân. Khai báo cấu trúc dữ liệu để các màn hình và hàm xử lý dùng thống nhất.
// Cấu trúc DietaryType quy định dữ liệu trao đổi trong hồ sơ và nhu cầu dinh dưỡng cá nhân.
export type DietaryType = '' | import('../../../shared/constants').DietaryType

// Cấu trúc GoalType quy định dữ liệu trao đổi trong hồ sơ và nhu cầu dinh dưỡng cá nhân.
export type GoalType =
  | ''
  | 'maintain' // Duy trì cân nặng & Tăng cường sinh lực
  | 'weight_loss' // Giảm cân khoa học
  | 'muscle_gain' // Tăng cơ thuần chay
  | 'general_health' // Sức khỏe tổng quát

export type GenderType = 'male' | 'female' | ''

// Cấu trúc ActivityLevel quy định dữ liệu trao đổi trong hồ sơ và nhu cầu dinh dưỡng cá nhân.
export type ActivityLevel =
  | ''
  | 'sedentary' // Ít vận động (nhân viên văn phòng, ít tập thể dục)
  | 'light' // Vận động nhẹ (tập 1-3 ngày/tuần)
  | 'moderate' // Vận động vừa phải (tập 3-5 ngày/tuần)
  | 'active' // Năng động (tập 6-7 ngày/tuần)
  | 'very_active' // Rất năng động (vận động viên / lao động nặng)

export interface BodyMetrics {
  age: number
  gender: GenderType
  activityLevel: ActivityLevel
  heightCm: number
  weightKg: number
  bmi: number
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese' | 'unknown'
  bmrKcal: number
  tdeeKcal: number
  goal: GoalType
  dailyProteinGrams: number
  dailyCarbsGrams: number
  dailyFatGrams: number
  birthDate?: string | null
}

// Cấu trúc HiddenIngredientRules quy định dữ liệu trao đổi trong hồ sơ và nhu cầu dinh dưỡng cá nhân.
export interface HiddenIngredientRules {
  boneBroth: boolean // Nước hầm xương / thịt động vật trong phở, canh
  fishSauce: boolean // Nước mắm cá cơm, mắm tôm, mắm tép
  oysterSauce: boolean // Dầu hào chiết xuất từ động vật
  animalFat: boolean // Mỡ động vật, mỡ lợn phi hành
  gelatinHoney: boolean // Gelatin, sáp ong & mật ong
}

// Cấu trúc UserProfile quy định dữ liệu trao đổi trong hồ sơ và nhu cầu dinh dưỡng cá nhân.
export interface UserProfile {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  phoneNumber?: string
  dietaryType: DietaryType
  allergies: string[]
  allergyItems?: { id: string; name: string }[]
  avoidedFoods?: { id: string; name: string }[]
  hiddenIngredientRules: HiddenIngredientRules
  metrics: BodyMetrics
  preferredProteinSources: string[]
  createdAt: string
  updatedAt: string
}

// Cấu trúc ProfileStats quy định dữ liệu trao đổi trong hồ sơ và nhu cầu dinh dưỡng cá nhân.
export interface ProfileStats {
  postCount: number | null
  commentCount: number | null
  videoCount: number | null
}

// Cấu trúc RecentPost quy định dữ liệu trao đổi trong hồ sơ và nhu cầu dinh dưỡng cá nhân.
export interface RecentPost {
  id: string
  category: string
  title: string
  publishedDate: string
  likeCount: number | null
  commentCount: number | null
  status?: 'Draft' | 'Submitted' | 'PendingAdminReview' | 'Published' | 'RevisionRequested' | 'Rejected' | 'Removed'
}
