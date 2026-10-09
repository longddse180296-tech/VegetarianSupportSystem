import type {
  UserProfile,
  ProfileStats,
  RecentPost,
  GenderType,
  ActivityLevel,
  GoalType,
  BodyMetrics,
} from '../types'

const PROFILE_STORAGE_KEY = 'vegetarian_mock_user_profile'

/**
 * Asian BMI Standard classification
 */
export const calculateBMI = (heightCm: number, weightKg: number) => {
  if (!heightCm || !weightKg || heightCm <= 0) return { bmi: 22.5, category: 'normal' as const }
  const heightM = heightCm / 100
  const bmiRaw = weightKg / (heightM * heightM)
  const bmi = Math.round(bmiRaw * 10) / 10

  let category: 'underweight' | 'normal' | 'overweight' | 'obese' = 'normal'
  if (bmi < 18.5) category = 'underweight'
  else if (bmi < 23) category = 'normal'
  else if (bmi < 25) category = 'overweight'
  else category = 'obese'

  return { bmi, category }
}

/**
 * BMR using Mifflin-St Jeor formula
 */
export const calculateBMR = (
  gender: GenderType,
  weightKg: number,
  heightCm: number,
  age: number,
): number => {
  if (!weightKg || !heightCm || !age) return 1450
  if (gender === 'male') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5)
  }
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161)
}

/**
 * Activity level multiplier map
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

/**
 * Full calculation of BMI, BMR, TDEE, and Macronutrients
 */
export const calculateAllMetrics = (
  age: number,
  gender: GenderType,
  heightCm: number,
  weightKg: number,
  activityLevel: ActivityLevel,
  goal: GoalType,
): BodyMetrics => {
  const { bmi, category } = calculateBMI(heightCm, weightKg)
  const bmrKcal = calculateBMR(gender, weightKg, heightCm, age)
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55
  let baseTdee = Math.round(bmrKcal * multiplier)

  // Adjust for fitness/dietary goal
  if (goal === 'weight_loss') {
    baseTdee = Math.max(1200, baseTdee - 400) // Calorie deficit
  } else if (goal === 'muscle_gain') {
    baseTdee = baseTdee + 350 // Calorie surplus
  }

  // Calculate macronutrients tailored for vegetarian nutrition
  let proteinMultiplier = 1.3
  if (goal === 'muscle_gain') proteinMultiplier = 1.9
  else if (goal === 'weight_loss') proteinMultiplier = 1.6

  const dailyProteinGrams = Math.round(weightKg * proteinMultiplier)
  const dailyFatGrams = Math.round((baseTdee * 0.25) / 9) // 25% calories from healthy plant fats
  const remainingCalories = baseTdee - dailyProteinGrams * 4 - dailyFatGrams * 9
  const dailyCarbsGrams = Math.max(80, Math.round(remainingCalories / 4))

  return {
    age,
    gender,
    activityLevel,
    heightCm,
    weightKg,
    bmi,
    bmiCategory: category,
    bmrKcal,
    tdeeKcal: baseTdee,
    goal,
    dailyProteinGrams,
    dailyCarbsGrams,
    dailyFatGrams,
  }
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'

const getAuthUserInfo = () => {
  try {
    const rawUser = localStorage.getItem('vegetarian_auth_user') || localStorage.getItem('auth_user')
    if (rawUser) {
      const u = JSON.parse(rawUser)
      return {
        fullName: u.fullName || 'Quang Duy',
        email: u.email || 'duy@gmail.com',
        avatarUrl: u.avatarUrl || DEFAULT_AVATAR,
      }
    }
  } catch {
    // ignore
  }
  return {
    fullName: 'Quang Duy',
    email: 'duy@gmail.com',
    avatarUrl: DEFAULT_AVATAR,
  }
}

const getDefaultProfile = (): UserProfile => {
  const { fullName, email, avatarUrl } = getAuthUserInfo()
  const metrics = calculateAllMetrics(26, 'male', 170, 65, 'moderate', 'maintain')

  return {
    id: 'usr_duy',
    fullName,
    email,
    avatarUrl,
    phoneNumber: '0912 345 678',
    preferredRegion: 'Hà Nội (Khu vực trung tâm / Ba Đình)',
    dietaryType: 'Vegan',
    allergies: ['Đậu phộng (Peanuts)', 'Gluten (Lúa mì)', 'Hạt điều (Cashew)'],
    hiddenIngredientRules: {
      boneBroth: true,
      fishSauce: true,
      oysterSauce: true,
      animalFat: true,
      gelatinHoney: true,
    },
    metrics,
    preferredProteinSources: [
      'Đậu phụ',
      'Đậu nành non (Edamame)',
      'Đậu lăng đỏ & xanh',
      'Tempeh lên men',
      'Nấm đùi gà & Nấm khô',
      'Hạt diêm mạch (Quinoa)',
    ],
    createdAt: '2024-03-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
  }
}

const getStoredProfile = (): UserProfile => {
  const authUser = getAuthUserInfo()
  const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as UserProfile

      // Ensure fullName, email, and avatar match current authUser if authUser exists
      if (authUser.fullName && (!parsed.fullName || parsed.fullName.includes('Minh Anh'))) {
        parsed.fullName = authUser.fullName
      }
      if (authUser.email && (!parsed.email || parsed.email.includes('minhanh'))) {
        parsed.email = authUser.email
      }
      if (!parsed.avatarUrl) {
        parsed.avatarUrl = authUser.avatarUrl || DEFAULT_AVATAR
      }

      // Ensure fields exist for backward compatibility
      if (!parsed.metrics.age || !parsed.metrics.gender) {
        const fullMetrics = calculateAllMetrics(
          parsed.metrics.age || 26,
          parsed.metrics.gender || 'male',
          parsed.metrics.heightCm || 170,
          parsed.metrics.weightKg || 65,
          parsed.metrics.activityLevel || 'moderate',
          parsed.metrics.goal || 'maintain',
        )
        parsed.metrics = fullMetrics
      }
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(parsed))
      return parsed
    } catch {
      // fallback
    }
  }
  const defaultProfile = getDefaultProfile()
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(defaultProfile))
  return defaultProfile
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const profileApi = {
  /**
   * Fetch current user profile with simulated delay
   */
  async getProfile(): Promise<UserProfile> {
    await delay(600)
    return getStoredProfile()
  },

  /**
   * Update profile data with recalculations and auth_user sync
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    await delay(700)
    const current = getStoredProfile()

    let metrics = { ...current.metrics }
    if (updates.metrics) {
      metrics = calculateAllMetrics(
        updates.metrics.age ?? current.metrics.age,
        updates.metrics.gender ?? current.metrics.gender,
        updates.metrics.heightCm ?? current.metrics.heightCm,
        updates.metrics.weightKg ?? current.metrics.weightKg,
        updates.metrics.activityLevel ?? current.metrics.activityLevel,
        updates.metrics.goal ?? current.metrics.goal,
      )
    }

    const updated: UserProfile = {
      ...current,
      ...updates,
      metrics,
      updatedAt: new Date().toISOString(),
    }

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated))

    // Synchronize full name and avatar with both auth keys in localStorage and dispatch event
    try {
      const authUpdates: { fullName?: string; avatarUrl?: string } = {}
      if (updates.fullName) authUpdates.fullName = updates.fullName
      if (updates.avatarUrl !== undefined) authUpdates.avatarUrl = updates.avatarUrl

      const storedVegAuth = localStorage.getItem('vegetarian_auth_user')
      if (storedVegAuth) {
        const userObj = JSON.parse(storedVegAuth)
        if (updates.fullName) userObj.fullName = updates.fullName
        if (updates.avatarUrl !== undefined) userObj.avatarUrl = updates.avatarUrl
        localStorage.setItem('vegetarian_auth_user', JSON.stringify(userObj))
      }

      const storedUser = localStorage.getItem('auth_user')
      if (storedUser) {
        const userObj = JSON.parse(storedUser)
        if (updates.fullName) userObj.fullName = updates.fullName
        if (updates.avatarUrl !== undefined) userObj.avatarUrl = updates.avatarUrl
        localStorage.setItem('auth_user', JSON.stringify(userObj))
      }

      window.dispatchEvent(
        new CustomEvent('vegetarian_user_updated', {
          detail: authUpdates,
        })
      )
    } catch {
      // ignore
    }

    return updated
  },

  /**
   * Get user statistics (12 posts, 34 comments, 8 videos)
   */
  async getProfileStats(): Promise<ProfileStats> {
    await delay(800)
    return {
      postCount: 12,
      commentCount: 34,
      videoCount: 8,
    }
  },

  /**
   * Get user's recent posts matching Figma Image 1
   */
  async getRecentPosts(): Promise<RecentPost[]> {
    await delay(900)
    return [
      {
        id: 'post_01',
        category: 'Dinh dưỡng',
        title: 'Kinh nghiệm bổ sung Protein thực vật cho người mới bắt đầu',
        publishedDate: '14/10/2024',
        likeCount: 42,
        commentCount: 18,
      },
      {
        id: 'post_02',
        category: 'Lối sống',
        title: 'Cách chuẩn bị Meal Prep chay tiện lợi cho cả tuần bận rộn',
        publishedDate: '28/09/2024',
        likeCount: 35,
        commentCount: 12,
      },
    ]
  },
}
