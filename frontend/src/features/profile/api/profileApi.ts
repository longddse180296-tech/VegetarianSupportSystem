import { apiClient } from '../../../shared/api/apiClient'
import type {
  ActivityLevel,
  BodyMetrics,
  DietaryType,
  GoalType,
  HiddenIngredientRules,
  ProfileStats,
  RecentPost,
  UserProfile,
} from '../types'

interface BackendItem {
  id: string
  name: string
}
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
  adultBmiCategory:
    | 'Underweight'
    | 'HealthyWeight'
    | 'Overweight'
    | 'Obesity'
    | null
  estimatedTdeeKcal: number | null
  activityLevel:
    | 'Sedentary'
    | 'LightlyActive'
    | 'ModeratelyActive'
    | 'VeryActive'
    | 'ExtraActive'
    | null
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

const dietToBackend: Record<
  Exclude<DietaryType, ''>,
  NonNullable<BackendProfile['diet']>
> = {
  Vegan: 'Vegan',
  'Lacto-vegetarian': 'Lacto',
  'Ovo-vegetarian': 'Ovo',
  'Lacto-ovo vegetarian': 'LactoOvo',
}
const dietFromBackend: Record<
  NonNullable<BackendProfile['diet']>,
  DietaryType
> = {
  Vegan: 'Vegan',
  Lacto: 'Lacto-vegetarian',
  Ovo: 'Ovo-vegetarian',
  LactoOvo: 'Lacto-ovo vegetarian',
}
const activityToBackend: Record<
  Exclude<ActivityLevel, ''>,
  NonNullable<BackendProfile['activityLevel']>
> = {
  sedentary: 'Sedentary',
  light: 'LightlyActive',
  moderate: 'ModeratelyActive',
  active: 'VeryActive',
  very_active: 'ExtraActive',
}
const activityFromBackend: Record<
  NonNullable<BackendProfile['activityLevel']>,
  ActivityLevel
> = {
  Sedentary: 'sedentary',
  LightlyActive: 'light',
  ModeratelyActive: 'moderate',
  VeryActive: 'active',
  ExtraActive: 'very_active',
}
const goalToBackend: Record<
  Exclude<GoalType, ''>,
  BackendProfile['weightGoal']
> = {
  maintain: 'Maintain',
  weight_loss: 'Lose',
  muscle_gain: 'Gain',
  general_health: null,
}
const goalFromBackend: Record<
  NonNullable<BackendProfile['weightGoal']>,
  GoalType
> = {
  Maintain: 'maintain',
  Lose: 'weight_loss',
  Gain: 'muscle_gain',
}
const categoryFromBackend: Record<
  NonNullable<BackendProfile['adultBmiCategory']>,
  BodyMetrics['bmiCategory']
> = {
  Underweight: 'underweight',
  HealthyWeight: 'normal',
  Overweight: 'overweight',
  Obesity: 'obese',
}

const DEFAULT_AVATAR = ''

function normalizedNames(names: string[]): string[] {
  const result = new Map<string, string>()
  for (const value of names) {
    const name = value.trim()
    if (!name) continue
    if (name.length > 150)
      throw new Error(
        'Tên dị ứng hoặc thực phẩm cần tránh không quá 150 ký tự.',
      )
    const key = name.toUpperCase()
    if (!result.has(key)) result.set(key, name)
  }
  return [...result.values()]
}
const EMPTY_RULES: HiddenIngredientRules = {
  boneBroth: false,
  fishSauce: false,
  oysterSauce: false,
  animalFat: false,
  gelatinHoney: false,
}

export function ageOn(birthDate: string | null): number {
  if (!birthDate) return 0
  const today = new Date()
  const [year, month, day] = birthDate.split('-').map(Number)
  let age = today.getUTCFullYear() - year
  if (
    today.getUTCMonth() + 1 < month ||
    (today.getUTCMonth() + 1 === month && today.getUTCDate() < day)
  )
    age--
  return Math.max(0, age)
}

function readUiExtras(): Pick<
  UserProfile,
  'avatarUrl' | 'hiddenIngredientRules' | 'preferredProteinSources'
> {
  return {
    avatarUrl: DEFAULT_AVATAR,
    hiddenIngredientRules: EMPTY_RULES,
    preferredProteinSources: [],
  }
}

function mapProfile(data: BackendProfile): UserProfile {
  const metrics: BodyMetrics = {
    age: ageOn(data.birthDate),
    birthDate: data.birthDate,
    gender:
      data.sexForEnergyEstimate === 'Male'
        ? 'male'
        : data.sexForEnergyEstimate === 'Female'
          ? 'female'
          : '',
    activityLevel: data.activityLevel
      ? activityFromBackend[data.activityLevel]
      : '',
    heightCm: data.heightCm ?? 0,
    weightKg: data.weightKg ?? 0,
    bmi: data.bmi ?? 0,
    bmiCategory: data.adultBmiCategory
      ? categoryFromBackend[data.adultBmiCategory]
      : 'unknown',
    bmrKcal: 0,
    tdeeKcal: data.estimatedTdeeKcal ?? 0,
    goal: data.weightGoal ? goalFromBackend[data.weightGoal] : '',
    dailyProteinGrams: 0,
    dailyCarbsGrams: 0,
    dailyFatGrams: 0,
  }
  return {
    id: data.userId,
    fullName: data.fullName,
    email: data.email,
    phoneNumber: data.phoneNumber ?? undefined,
    preferredRegion: data.restaurantArea ?? undefined,
    dietaryType: data.diet ? dietFromBackend[data.diet] ?? '' : '',
    allergies: data.allergies.map((item) => item.name),
    allergyItems: data.allergies,
    avoidedFoods: data.avoidedFoods,
    metrics,
    createdAt: data.memberSinceUtc,
    updatedAt: data.updatedAtUtc,
    ...readUiExtras(),
  }
}

function bodyRequest(metrics: BodyMetrics) {
  const sexForEnergyEstimate: BackendProfile['sexForEnergyEstimate'] =
    metrics.gender === 'male'
      ? 'Male'
      : metrics.gender === 'female'
        ? 'Female'
        : null
  return {
    birthDate: metrics.birthDate || null,
    sexForEnergyEstimate,
    heightCm: metrics.heightCm > 0 ? metrics.heightCm : null,
    weightKg: metrics.weightKg > 0 ? metrics.weightKg : null,
    activityLevel: metrics.activityLevel
      ? activityToBackend[metrics.activityLevel]
      : null,
    weightGoal: metrics.goal ? goalToBackend[metrics.goal] : null,
  }
}

export const profileApi = {
  async getProfile(signal?: AbortSignal): Promise<UserProfile> {
    const data = await apiClient.get<BackendProfile>('/api/profile/me', { signal })
    try {
      localStorage.removeItem('vegetarian_mock_user_profile')
    } catch {
      /* Legacy mock data is optional. */
    }
    return mapProfile(data)
  },

  async previewMetrics(
    metrics: BodyMetrics,
    signal?: AbortSignal,
  ): Promise<Pick<BodyMetrics, 'bmi' | 'bmiCategory' | 'tdeeKcal'>> {
    const data = await apiClient.post<BackendEstimate>(
      '/api/profile/me/body/estimate',
      bodyRequest(metrics),
      { signal },
    )
    return {
      bmi: data.bmi ?? 0,
      bmiCategory: data.adultBmiCategory
        ? categoryFromBackend[data.adultBmiCategory]
        : 'unknown',
      tdeeKcal: data.estimatedTdeeKcal ?? 0,
    }
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const allergies = updates.allergies
      ? normalizedNames(updates.allergies)
      : undefined
    const avoidedFoods = updates.avoidedFoods
      ? normalizedNames(updates.avoidedFoods.map((item) => item.name))
      : undefined
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

    let refreshed: UserProfile
    try {
      for (const [segment, wanted, existing] of [
        ['allergies', allergies, current.allergies],
        ['avoided-foods', avoidedFoods, current.avoidedFoods],
      ] as const) {
        if (!wanted) continue
        const existingNames = new Set(existing.map(item => item.name.toUpperCase()))
        // Add first: a failed addition must not erase the previously saved list.
        for (const name of wanted) {
          if (!existingNames.has(name.toUpperCase())) {
            await apiClient.post('/api/profile/me/' + segment, { name })
          }
        }
        const wantedNames = new Set(wanted.map(name => name.toUpperCase()))
        for (const item of existing) {
          if (!wantedNames.has(item.name.toUpperCase())) {
            await apiClient.delete('/api/profile/me/' + segment + '/' + item.id)
          }
        }
      }
      refreshed = await this.getProfile()
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : 'Không thể đồng bộ danh sách thực phẩm.'
      throw new Error(detail + ' Thông tin chính đã được lưu nhưng chưa hoàn tất toàn bộ hồ sơ. Kiểm tra và lưu lại; các mục đã lưu sẽ không bị tạo trùng.')
    }
    window.dispatchEvent(
      new CustomEvent('vegetarian_user_updated', {
        detail: {
          fullName: refreshed.fullName,
          avatarUrl: refreshed.avatarUrl,
        },
      }),
    )
    return refreshed
  },

  async getProfileStats(): Promise<ProfileStats> {
    const [articles, comments, videos] = await Promise.allSettled([
      apiClient.get<{ totalCount: number }>(
        '/api/me/articles?page=1&pageSize=1',
      ),
      apiClient.get<{ totalCount: number }>(
        '/api/me/comments?page=1&pageSize=1',
      ),
      apiClient.get<{ totalCount: number }>('/api/me/videos?page=1&pageSize=1'),
    ])
    return {
      postCount:
        articles.status === 'fulfilled' ? articles.value.totalCount : null,
      commentCount:
        comments.status === 'fulfilled' ? comments.value.totalCount : null,
      videoCount:
        videos.status === 'fulfilled' ? videos.value.totalCount : null,
    }
  },

  async getRecentPosts(): Promise<RecentPost[]> {
    const result = await apiClient.get<{
      items: Array<{
        id: string
        category: string
        title: string
        updatedAt: string
        status?: RecentPost['status']
      }>
    }>('/api/me/articles?page=1&pageSize=3')
    return result.items.map((item) => ({
      id: item.id,
      category: item.category,
      title: item.title,
      publishedDate: new Date(item.updatedAt).toLocaleDateString('vi-VN'),
      likeCount: null,
      commentCount: null,
      status: item.status,
    }))
  },
}
