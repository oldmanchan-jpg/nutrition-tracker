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
  recipe_id: string
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
}

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: 'admin' | 'client' | 'inactive'
  training_level: string | null
  onboarding_complete: boolean
}
