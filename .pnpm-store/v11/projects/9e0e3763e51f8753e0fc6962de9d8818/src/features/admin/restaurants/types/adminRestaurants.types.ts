export type PriceTier = 'economy' | 'mid' | 'premium'

export interface AdminRestaurantItem {
  id: string
  name: string
  address: string
  district: string
  rating: number
  reviewsCount: number
  priceTier: PriceTier
  verified: boolean
  cuisineTags: string[]
  openStatus: 'open' | 'closed' | 'opening-soon'
  publishedAt: string
}

export interface AdminRestaurantStats {
  total: number
  verified: number
  pendingVerification: number
  reported: number
}
