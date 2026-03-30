import { supabase } from '@/lib/supabase'
import type { Recipe, NutritionGoal, NutritionLog, Profile, CustomFood } from '@/types'

// ─── Recipes ────────────────────────────────────────────

export async function getRecipes(): Promise<Recipe[]> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('category')
      .order('name')

    if (error) throw error
    return data ?? []
  } catch (err) {
    console.error('getRecipes failed:', err)
    return []
  }
}

export async function getRecipesByCategory(category: string): Promise<Recipe[]> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('category', category)
      .order('name')

    if (error) throw error
    return data ?? []
  } catch (err) {
    console.error('getRecipesByCategory failed:', err)
    return []
  }
}

export async function createRecipe(recipe: Omit<Recipe, 'id' | 'created_at'>): Promise<Recipe | null> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .insert(recipe)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('createRecipe failed:', err)
    return null
  }
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('updateRecipe failed:', err)
    return null
  }
}

export async function deleteRecipe(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (err) {
    console.error('deleteRecipe failed:', err)
    return false
  }
}

// ─── Nutrition Goals ────────────────────────────────────

export async function getMyGoal(): Promise<NutritionGoal | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('client_id', user.id)
      .eq('active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (err) {
    console.error('getMyGoal failed:', err)
    return null
  }
}

export async function getClientGoal(clientId: string): Promise<NutritionGoal | null> {
  try {
    const { data, error } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('client_id', clientId)
      .eq('active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (err) {
    console.error('getClientGoal failed:', err)
    return null
  }
}

export async function setClientGoal(
  clientId: string,
  goal: { daily_calories: number; protein_g: number; carbs_g: number; fat_g: number }
): Promise<NutritionGoal | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Deactivate old goal
    await supabase
      .from('nutrition_goals')
      .update({ active: false })
      .eq('client_id', clientId)
      .eq('active', true)

    // Insert new goal
    const { data, error } = await supabase
      .from('nutrition_goals')
      .insert({
        client_id: clientId,
        ...goal,
        set_by: user.id,
        active: true,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('setClientGoal failed:', err)
    return null
  }
}

// ─── Nutrition Logs ─────────────────────────────────────

export async function getTodaysLogs(): Promise<NutritionLog[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('*, recipes(*), custom_foods(*)')
      .eq('user_id', user.id)
      .eq('logged_at', today)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
  } catch (err) {
    console.error('getTodaysLogs failed:', err)
    return []
  }
}

export async function getLogsByDateRange(start: string, end: string): Promise<NutritionLog[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('*, recipes(*), custom_foods(*)')
      .eq('user_id', user.id)
      .gte('logged_at', start)
      .lte('logged_at', end)
      .order('logged_at', { ascending: true })

    if (error) throw error
    return data ?? []
  } catch (err) {
    console.error('getLogsByDateRange failed:', err)
    return []
  }
}

export async function logMeal(
  recipeId: string,
  servings: number,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  recipe: Recipe
): Promise<NutritionLog | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert({
        user_id: user.id,
        recipe_id: recipeId,
        servings,
        meal_type: mealType,
        calories: Math.round(recipe.calories * servings),
        protein_g: Math.round(recipe.protein_g * servings * 10) / 10,
        carbs_g: Math.round(recipe.carbs_g * servings * 10) / 10,
        fat_g: Math.round(recipe.fat_g * servings * 10) / 10,
      })
      .select('*, recipes(*), custom_foods(*)')
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('logMeal failed:', err)
    return null
  }
}

export async function deleteLog(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('nutrition_logs')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (err) {
    console.error('deleteLog failed:', err)
    return false
  }
}

// ─── Custom Foods ───────────────────────────────────────

export async function createCustomFood(food: {
  name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}): Promise<CustomFood | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('custom_foods')
      .insert({ ...food, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('createCustomFood failed:', err)
    return null
  }
}

export async function getCustomFoods(): Promise<CustomFood[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('custom_foods')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (error) throw error
    return data ?? []
  } catch (err) {
    console.error('getCustomFoods failed:', err)
    return []
  }
}

export async function logCustomFood(
  customFood: CustomFood,
  servings: number,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<NutritionLog | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert({
        user_id: user.id,
        custom_food_id: customFood.id,
        servings,
        meal_type: mealType,
        calories: Math.round(customFood.calories * servings),
        protein_g: Math.round(Number(customFood.protein_g) * servings * 10) / 10,
        carbs_g: Math.round(Number(customFood.carbs_g) * servings * 10) / 10,
        fat_g: Math.round(Number(customFood.fat_g) * servings * 10) / 10,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('logCustomFood failed:', err)
    return null
  }
}

// ─── Nutrition Onboarding ────────────────────────────────

export async function saveNutritionProfile(data: {
  gender: string
  age: number
  height_cm: number
  weight_kg: number
  goal_weight_kg: number
  activity_level: string
  goal_type: string
  dietary_restrictions: string[]
  meals_per_day: number
}): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('profiles')
      .update({
        ...data,
        nutrition_onboarding_complete: true,
      })
      .eq('id', user.id)

    if (error) throw error
    return true
  } catch (err) {
    console.error('saveNutritionProfile failed:', err)
    return false
  }
}

export async function setNutritionGoals(goals: {
  daily_calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}): Promise<NutritionGoal | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Deactivate old goals
    await supabase
      .from('nutrition_goals')
      .update({ active: false })
      .eq('client_id', user.id)
      .eq('active', true)

    // Insert new goal
    const { data, error } = await supabase
      .from('nutrition_goals')
      .insert({
        client_id: user.id,
        ...goals,
        set_by: user.id,
        active: true,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('setNutritionGoals failed:', err)
    return null
  }
}

// ─── Clients (Admin) ────────────────────────────────────

export async function getClients(): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .order('full_name')

    if (error) throw error
    return data ?? []
  } catch (err) {
    console.error('getClients failed:', err)
    return []
  }
}

export async function getClientLogs(clientId: string, days: number): Promise<NutritionLog[]> {
  try {
    const start = new Date()
    start.setDate(start.getDate() - days)
    const startStr = start.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('*, recipes(*), custom_foods(*)')
      .eq('user_id', clientId)
      .gte('logged_at', startStr)
      .order('logged_at', { ascending: false })

    if (error) throw error
    return data ?? []
  } catch (err) {
    console.error('getClientLogs failed:', err)
    return []
  }
}
