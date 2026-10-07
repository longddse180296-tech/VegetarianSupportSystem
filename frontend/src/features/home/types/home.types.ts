// Public Home page data shapes. These mirror the response contracts the home
// feed relies on. Keep the field names stable so swapping mock with a real API
// stays a drop-in change.

export interface HeroHighlight {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  matchScore: number;
  badges: string[];
}

export interface MealShortcut {
  id: string;
  label: string;
  description: string;
  icon: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface HomeRecipeSummary {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  cookTimeMinutes: number;
  caloriesPerServing: number;
  suitabilityScore: number;
}

export interface HomeArticleSummary {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  readMinutes: number;
  topicTag: string;
}

export interface HomeVideoSummary {
  id: string;
  title: string;
  duration: string;
  thumbnailUrl: string;
  channelName: string;
}

export interface HomeRestaurantSummary {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  imageUrl: string;
  rating: number;
  cuisineTags: string[];
}

export interface HomeChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface HomeFeed {
  hero: HeroHighlight;
  shortcuts: MealShortcut[];
  recipes: HomeRecipeSummary[];
  articles: HomeArticleSummary[];
  videos: HomeVideoSummary[];
  restaurants: HomeRestaurantSummary[];
  initialChatMessages: HomeChatMessage[];
}

export type HomeFeedStatus = 'loading' | 'success' | 'error';