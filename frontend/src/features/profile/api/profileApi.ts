import { apiClient } from '../../../shared/api/apiClient'
import type {
  ActivityLevel, BodyMetrics, DietaryType, GoalType,
  HiddenIngredientRules, ProfileStats, RecentPost, UserProfile,
} from '../types'

interface BackendItem { id: string; name: string }
interface BackendProfile {
  userId: string
  fullName: string
  email: string
  phoneNumber: string | null
  memberSinceUtc: string
  diet: 'Vegan' | 'Lacto' | 'Ovo' | 'LactoOvo' | null
  birthDate: string | null
  sexForEnergyEstimate: 'Female' | 'Male' | null
  heightCm: number | null
  weightKg: number | null
  bmi: number | null
  adultBmiCategory: 'Underweight' | 'HealthyWeight' | 'Overweight' | 'Obesity' | null
  estimatedTdeeKcal: number | null
  activityLevel: 'Sedentary' | 'LightlyActive' | 'ModeratelyActive' | 'VeryActive' | 'ExtraActive' | null
  weightGoal: 'Lose' | 'Maintain' | 'Gain' | null
  restaurantArea: string | null
  allergies: BackendItem[]
  avoidedFoods: BackendItem[]
  updatedAtUtc: string
}

interface BackendEstimate {
  bmi: number | null
  adultBmiCategory: BackendProfile['adultBmiCategory']
  estimatedTdeeKcal: number | null
}

const dietToBackend: Record<Exclude<DietaryType, ''>, NonNullable<BackendProfile['diet']>> = {
  Vegan: 'Vegan', 'Lacto-vegetarian': 'Lacto',
  'Ovo-vegetarian': 'Ovo', 'Lacto-ovo vegetarian': 'LactoOvo',
}
const dietFromBackend: Record<NonNullable<BackendProfile['diet']>, DietaryType> = {
  Vegan: 'Vegan', Lacto: 'Lacto-vegetarian', Ovo: 'Ovo-vegetarian',
  LactoOvo: 'Lacto-ovo vegetarian',
}
const activityToBackend: Record<Exclude<ActivityLevel, ''>, NonNullable<BackendProfile['activityLevel']>> = {
  sedentary: 'Sedentary', light: 'LightlyActive', moderate: 'ModeratelyActive',
  active: 'VeryActive', very_active: 'ExtraActive',
}
const activityFromBackend: Record<NonNullable<BackendProfile['activityLevel']>, ActivityLevel> = {
  Sedentary: 'sedentary', LightlyActive: 'light', ModeratelyActive: 'moderate',
  VeryActive: 'active', ExtraActive: 'very_active',
}
const goalToBackend: Record<Exclude<GoalType, ''>, BackendProfile['weightGoal']> = {
  maintain: 'Maintain', weight_loss: 'Lose', muscle_gain: 'Gain', general_health: null,
}
const goalFromBackend: Record<NonNullable<BackendProfile['weightGoal']>, GoalType> = {
  Maintain: 'maintain', Lose: 'weight_loss', Gain: 'muscle_gain',
}
const categoryFromBackend: Record<NonNullable<BackendProfile['adultBmiCategory']>, BodyMetrics['bmiCategory']> = {
  Underweight: 'underweight', HealthyWeight: 'normal', Overweight: 'overweight', Obesity: 'obese',
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
const EMPTY_RULES: HiddenIngredientRules = {
  boneBroth: false, fishSauce: false, oysterSauce: false,
  animalFat: false, gelatinHoney: false,
}

function ageOn(birthDate: string | null): number {
  if (!birthDate) return 0
  const today = new Date()
  const [year, month, day] = birthDate.split('-').map(Number)
  let age = today.getUTCFullYear() - year
  if (today.getUTCMonth() + 1 < month ||
      (today.getUTCMonth() + 1 === month && today.getUTCDate() < day)) age--
  return Math.max(0, age)
}

export function birthDateForAge(age: number): string | null {
  if (!Number.isInteger(age) || age <= 0) return null
  const today = new Date()
  const year = today.getUTCFullYear() - age
  const month = String(today.getUTCMonth() + 1).padStart(2, '0')
  const day = String(today.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readUiExtras(userId: string): Pick<UserProfile, 'avatarUrl' | 'hiddenIngredientRules' | 'preferredProteinSources'> {
  try {
    const value = localStorage.getItem(`vegetarian_profile_ui_${userId}`)
    if (value) {
      const parsed = JSON.parse(value) as Partial<UserProfile>
      return { avatarUrl: parsed.avatarUrl || DEFAULT_AVATAR,
        hiddenIngredientRules: parsed.hiddenIngredientRules || EMPTY_RULES,
        preferredProteinSources: parsed.preferredProteinSources || [] }
    }
  } catch { /* Optional UI preferences are unavailable. */ }
  return { avatarUrl: DEFAULT_AVATAR, hiddenIngredientRules: EMPTY_RULES, preferredProteinSources: [] }
}

function mapProfile(data: BackendProfile): UserProfile {
  const metrics: BodyMetrics = {
    age: ageOn(data.birthDate),
    birthDate: data.birthDate,
    gender: data.sexForEnergyEstimate === 'Male' ? 'male' : data.sexForEnergyEstimate === 'Female' ? 'female' : '',
    activityLevel: data.activityLevel ? activityFromBackend[data.activityLevel] : '',
    heightCm: data.heightCm ?? 0,
    weightKg: data.weightKg ?? 0,
    bmi: data.bmi ?? 0,
    bmiCategory: data.adultBmiCategory ? categoryFromBackend[data.adultBmiCategory] : 'unknown',
    bmrKcal: 0,
    tdeeKcal: data.estimatedTdeeKcal ?? 0,
    goal: data.weightGoal ? goalFromBackend[data.weightGoal] : '',
    dailyProteinGrams: 0,
    dailyCarbsGrams: 0,
    dailyFatGrams: 0,
  }
  return {
    id: data.userId, fullName: data.fullName, email: data.email,
    phoneNumber: data.phoneNumber ?? undefined,
    preferredRegion: data.restaurantArea ?? undefined,
    dietaryType: data.diet ? dietFromBackend[data.diet] : '',
    allergies: data.allergies.map(item => item.name), allergyItems: data.allergies,
    avoidedFoods: data.avoidedFoods, metrics,
    createdAt: data.memberSinceUtc, updatedAt: data.updatedAtUtc,
    ...readUiExtras(data.userId),
  }
}

function bodyRequest(metrics: BodyMetrics) {
  const sexForEnergyEstimate: BackendProfile['sexForEnergyEstimate'] =
    metrics.gender === 'male' ? 'Male' : metrics.gender === 'female' ? 'Female' : null
  return {
    birthDate: metrics.birthDate || null,
    sexForEnergyEstimate,
    heightCm: metrics.heightCm > 0 ? metrics.heightCm : null,
    weightKg: metrics.weightKg > 0 ? metrics.weightKg : null,
    activityLevel: metrics.activityLevel ? activityToBackend[metrics.activityLevel] : null,
    weightGoal: metrics.goal ? goalToBackend[metrics.goal] : null,
  }
}

export const profileApi = {
  async getProfile(): Promise<UserProfile> {
    const data = await apiClient.get<BackendProfile>('/api/profile/me')
    try { localStorage.removeItem('vegetarian_mock_user_profile') } catch { /* Legacy mock data is optional. */ }
    return mapProfile(data)
  },

  async previewMetrics(metrics: BodyMetrics, signal?: AbortSignal): Promise<Pick<BodyMetrics, 'bmi' | 'bmiCategory' | 'tdeeKcal'>> {
    const data = await apiClient.post<BackendEstimate>('/api/profile/me/body/estimate', bodyRequest(metrics), { signal })
    return {
      bmi: data.bmi ?? 0,
      bmiCategory: data.adultBmiCategory ? categoryFromBackend[data.adultBmiCategory] : 'unknown',
      tdeeKcal: data.estimatedTdeeKcal ?? 0,
    }
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = await apiClient.get<BackendProfile>('/api/profile/me')
    const currentUi = mapProfile(current)
    const metrics = updates.metrics ?? currentUi.metrics
    const diet = updates.dietaryType ?? currentUi.dietaryType
    const request = {
      fullName: updates.fullName ?? current.fullName,
      phoneNumber: updates.phoneNumber ?? current.phoneNumber,
      restaurantArea: updates.preferredRegion ?? current.restaurantArea,
      diet: diet ? dietToBackend[diet] : null,
      ...bodyRequest(metrics),
    }
    await apiClient.put<BackendProfile>('/api/profile/me', request)

    if (updates.allergies) {
      const wanted = updates.allergies.map(name => name.trim()).filter(Boolean)
      const wantedNames = new Set(wanted.map(name => name.toLocaleUpperCase()))
      for (const item of current.allergies) {
        if (!wantedNames.has(item.name.toLocaleUpperCase())) {
          await apiClient.delete(`/api/profile/me/allergies/${item.id}`)
        }
      }
      const existingNames = new Set(current.allergies.map(item => item.name.toLocaleUpperCase()))
      for (const name of wanted) {
        if (!existingNames.has(name.toLocaleUpperCase())) {
          await apiClient.post('/api/profile/me/allergies', { name })
        }
      }
    }

    try {
      localStorage.setItem(`vegetarian_profile_ui_${current.userId}`, JSON.stringify({
        avatarUrl: updates.avatarUrl ?? currentUi.avatarUrl,
        hiddenIngredientRules: updates.hiddenIngredientRules ?? currentUi.hiddenIngredientRules,
        preferredProteinSources: updates.preferredProteinSources ?? currentUi.preferredProteinSources,
      }))
      localStorage.removeItem('vegetarian_mock_user_profile')
    } catch { /* The backend profile was still saved. */ }

    const refreshed = await this.getProfile()
    window.dispatchEvent(new CustomEvent('vegetarian_user_updated', {
      detail: { fullName: refreshed.fullName, avatarUrl: refreshed.avatarUrl },
    }))
    return refreshed
  },

  async getProfileStats(): Promise<ProfileStats> {
    return { postCount: 12, commentCount: 34, videoCount: 8 }
  },

  async getRecentPosts(): Promise<RecentPost[]> {
    return [
      { id: 'post_01', category: 'Dinh dưỡng', title: 'Kinh nghiệm bổ sung Protein thực vật cho người mới bắt đầu', publishedDate: '14/10/2024', likeCount: 42, commentCount: 18 },
      { id: 'post_02', category: 'Lối sống', title: 'Cách chuẩn bị Meal Prep chay tiện lợi cho cả tuần bận rộn', publishedDate: '28/09/2024', likeCount: 35, commentCount: 12 },
    ]
  },
}
