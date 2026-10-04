export interface CategoryFormData {
  name: string;
  key: string;
  description: string;
  isActive: boolean;
}

export interface IngredientFormData {
  name: string;
  unit: string;
  category: string;
  isVegan: boolean;
  notes: string;
}

export interface RecipeIngredientFormData {
  name: string;
  amount: string;
}

export interface RecipeStepFormData {
  order: number;
  title: string;
  description: string;
}

export interface RecipeFormData {
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  caloriesPerServing: number;
  suitableDiet: string;
  difficulty: string;
  ingredients: RecipeIngredientFormData[];
  steps: RecipeStepFormData[];
}
