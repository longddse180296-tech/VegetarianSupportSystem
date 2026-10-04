export type DietType = 'Thuần chay(Vegan)' | 'Chay có sữa(Lacto)' | 'Chay có trứng(Ovo)' | 'Trứng & sữa(LactoOvo)';

export type CategoryKey =
  | 'all'
  | 'main_dish'
  | 'salad'
  | 'soup'
  | 'dessert'
  | 'drink'
  | 'side_dish';

export interface CategoryOption {
  key: CategoryKey;
  label: string;
}

export interface DietOption {
  key: DietType | 'all';
  label: string;
}

export interface TimeRangeOption {
  key: string;
  label: string;
  minMinutes?: number;
  maxMinutes?: number;
}

export interface CalorieRangeOption {
  key: string;
  label: string;
  minKcal?: number;
  maxKcal?: number;
}

export interface RecipeSummary {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  cookTimeMinutes: number;
  caloriesPerServing: number;
  suitableDiets: DietType[];
  suitabilityScore: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface RecipeListResponse {
  items: RecipeSummary[];
  pagination: PaginationMeta;
}

export interface FetchRecipesParams {
  search?: string;
  category?: CategoryKey;
  diet?: DietType;
  timeRangeKey?: string;
  calorieRangeKey?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface RecipeFilterValues {
  search: string;
  category: CategoryKey;
  diet: DietType | 'all';
  timeRangeKey: string;
  calorieRangeKey: string;
}

export const DEFAULT_FILTER_VALUES: RecipeFilterValues = {
  search: '',
  category: 'all',
  diet: 'all',
  timeRangeKey: 'all',
  calorieRangeKey: 'all',
};

export interface RecipeIngredient {
  name: string;
  amount: string;
}

export interface RecipeStep {
  order: number;
  title: string;
  description: string;
}

export interface NutritionFacts {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface RecipeTiming {
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
}

export interface RelatedArticle {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  readMinutes: number;
}

export interface RelatedVideo {
  id: string;
  title: string;
  duration: string;
  thumbnailUrl: string;
  channelName: string;
}

export interface RelatedRestaurant {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  imageUrl: string;
}

export interface RecipeDetail {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
  servings: string;
  caloriesPerServing: number;
  suitableDietLabel: string;
  difficultyLabel: string;
  timing: RecipeTiming;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutrition: NutritionFacts;
  relatedArticles: RelatedArticle[];
  relatedVideos: RelatedVideo[];
  relatedRestaurants: RelatedRestaurant[];
}
