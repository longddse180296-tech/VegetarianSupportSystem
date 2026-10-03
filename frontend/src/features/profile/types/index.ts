export type DietaryType =
  | 'Vegan'
  | 'Lacto-vegetarian'
  | 'Ovo-vegetarian'
  | 'Lacto-ovo vegetarian'

export type GoalType =
  | 'maintain' // Duy trì cân nặng & Tăng cường sinh lực
  | 'weight_loss' // Giảm cân khoa học
  | 'muscle_gain' // Tăng cơ thuần chay
  | 'general_health' // Sức khỏe tổng quát

export interface BodyMetrics {
  heightCm: number
  weightKg: number
  bmi: number
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese'
  tdeeKcal: number
  goal: GoalType
  dailyProteinGrams: number
  dailyCarbsGrams: number
  dailyFatGrams: number
}

export interface HiddenIngredientRules {
  boneBroth: boolean // Nước hầm xương / thịt động vật trong phở, canh
  fishSauce: boolean // Nước mắm cá cơm, mắm tôm, mắm tép
  oysterSauce: boolean // Dầu hào chiết xuất từ động vật
  animalFat: boolean // Mỡ động vật, mỡ lợn phi hành
  gelatinHoney: boolean // Gelatin, sáp ong & mật ong
}

export interface UserProfile {
  id: string
  fullName: string
  email: string
  phoneNumber?: string
  preferredRegion?: string
  dietaryType: DietaryType
  allergies: string[]
  hiddenIngredientRules: HiddenIngredientRules
  metrics: BodyMetrics
  preferredProteinSources: string[]
  createdAt: string
  updatedAt: string
}

export interface ProfileStats {
  postCount: number
  commentCount: number
  videoCount: number
}

export interface RecentPost {
  id: string
  category: string
  title: string
  publishedDate: string
  likeCount: number
  commentCount: number
}
