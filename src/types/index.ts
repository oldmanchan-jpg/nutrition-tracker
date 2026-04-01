export interface Recipe {
  id: string
  name: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink'
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  serving_size: string | null
  instructions: string | null
  image_url: string | null
  created_at: string
}

export interface CustomFood {
  id: string
  user_id: string
  name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  created_at: string
}

export interface NutritionGoal {
  id: string
  client_id: string
  daily_calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  set_by: string
  active: boolean
  created_at: string
}

export interface NutritionLog {
  id: string
  user_id: string
  recipe_id: string | null
  custom_food_id: string | null
  servings: number
  logged_at: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  notes: string | null
  created_at: string
  // Joined
  recipes?: Recipe
  custom_foods?: CustomFood
}

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: 'admin' | 'client' | 'inactive'
  training_level: string | null
  onboarding_complete: boolean
  // Nutrition onboarding fields
  age?: number | null
  height_cm?: number | null
  weight_kg?: number | null
  gender?: 'male' | 'female' | null
  goal_weight_kg?: number | null
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'active' | 'very_active' | null
  goal_type?: 'lose' | 'maintain' | 'gain' | null
  dietary_restrictions?: string[]
  meals_per_day?: number | null
  nutrition_onboarding_complete?: boolean
}
