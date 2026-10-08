import type { UserProfile, ProfileStats, RecentPost } from '../types'

const PROFILE_STORAGE_KEY = 'vegetarian_mock_user_profile'

const calculateBMI = (heightCm: number, weightKg: number) => {
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

const getDefaultProfile = (): UserProfile => {
  const { bmi, category } = calculateBMI(170, 65)

  return {
    id: 'usr_minhanh',
    fullName: 'Nguyễn Minh Anh',
    email: 'minhanh@example.com',
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
    metrics: {
      heightCm: 170,
      weightKg: 65,
      bmi,
      bmiCategory: category,
      tdeeKcal: 1500,
      goal: 'maintain',
      dailyProteinGrams: 65,
      dailyCarbsGrams: 210,
      dailyFatGrams: 42,
    },
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
  const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as UserProfile
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
   * Fetch current user profile with simulated 1.2s delay
   */
  async getProfile(): Promise<UserProfile> {
    await delay(1200)
    return getStoredProfile()
  },

  /**
   * Update profile data with simulated 1.5s delay
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    await delay(1500)
    const current = getStoredProfile()

    // Recalculate BMI if height or weight changed
    let metrics = { ...current.metrics }
    if (updates.metrics) {
      const height = updates.metrics.heightCm ?? current.metrics.heightCm
      const weight = updates.metrics.weightKg ?? current.metrics.weightKg
      const { bmi, category } = calculateBMI(height, weight)

      metrics = {
        ...current.metrics,
        ...updates.metrics,
        bmi,
        bmiCategory: category,
      }
    }

    const updated: UserProfile = {
      ...current,
      ...updates,
      metrics,
      updatedAt: new Date().toISOString(),
    }

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated))
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
