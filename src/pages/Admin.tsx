import { useState, useEffect } from 'react'
import { Plus, Trash, PencilSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  getClients,
  getClientGoal,
  setClientGoal,
  getClientLogs,
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '@/services/nutritionService'
import type { Profile, NutritionGoal, NutritionLog, Recipe } from '@/types'

type Tab = 'clients' | 'recipes'

interface ClientWithGoal extends Profile {
  goal?: NutritionGoal | null
  recentLogs?: NutritionLog[]
}

const emptyRecipeForm = {
  name: '',
  category: 'breakfast' as Recipe['category'],
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  serving_size: '',
  instructions: '',
}

export default function Admin() {
  const [tab, setTab] = useState<Tab>('clients')
  const [clients, setClients] = useState<ClientWithGoal[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [goalForm, setGoalForm] = useState({ daily_calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 })
  const [showRecipeForm, setShowRecipeForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<string | null>(null)
  const [recipeForm, setRecipeForm] = useState(emptyRecipeForm)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [clientsData, recipesData] = await Promise.all([
      getClients(),
      getRecipes(),
    ])
    setClients(clientsData)
    setRecipes(recipesData)
    setLoading(false)
  }

  async function handleExpandClient(clientId: string) {
    if (expandedClient === clientId) {
      setExpandedClient(null)
      return
    }

    setExpandedClient(clientId)
    const [goal, logs] = await Promise.all([
      getClientGoal(clientId),
      getClientLogs(clientId, 7),
    ])

    if (goal) {
      setGoalForm({
        daily_calories: goal.daily_calories,
        protein_g: Number(goal.protein_g),
        carbs_g: Number(goal.carbs_g),
        fat_g: Number(goal.fat_g),
      })
    } else {
      setGoalForm({ daily_calories: 2000, protein_g: 140, carbs_g: 200, fat_g: 65 })
    }

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, goal, recentLogs: logs } : c
      )
    )
  }

  async function handleSaveGoal(clientId: string) {
    const result = await setClientGoal(clientId, goalForm)
    if (result) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId ? { ...c, goal: result } : c
        )
      )
    }
  }

  async function handleSaveRecipe() {
    if (editingRecipe) {
      const result = await updateRecipe(editingRecipe, recipeForm)
      if (result) {
        setRecipes((prev) => prev.map((r) => (r.id === editingRecipe ? result : r)))
      }
    } else {
      const result = await createRecipe({
        ...recipeForm,
        serving_size: recipeForm.serving_size || null,
        instructions: recipeForm.instructions || null,
      })
      if (result) {
        setRecipes((prev) => [...prev, result])
      }
    }
    setShowRecipeForm(false)
    setEditingRecipe(null)
    setRecipeForm(emptyRecipeForm)
  }

  async function handleDeleteRecipe(id: string) {
    const ok = await deleteRecipe(id)
    if (ok) {
      setRecipes((prev) => prev.filter((r) => r.id !== id))
    }
  }

  function startEditRecipe(recipe: Recipe) {
    setEditingRecipe(recipe.id)
    setRecipeForm({
      name: recipe.name,
      category: recipe.category,
      calories: recipe.calories,
      protein_g: recipe.protein_g,
      carbs_g: recipe.carbs_g,
      fat_g: recipe.fat_g,
      serving_size: recipe.serving_size || '',
      instructions: recipe.instructions || '',
    })
    setShowRecipeForm(true)
  }

  if (loading) {
    return (
      <div className="content-area flex items-center justify-center">
        <span style={{ color: 'var(--muted-foreground)' }}>Loading...</span>
      </div>
    )
  }

  return (
    <div className="content-area flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {(['clients', 'recipes'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-sm font-semibold capitalize bg-transparent border-none cursor-pointer"
            style={{
              color: tab === t ? 'var(--accent)' : 'var(--muted-foreground)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {tab === 'clients' && (
          <div className="flex flex-col gap-2 mt-4">
            {clients.map((client) => {
              const expanded = expandedClient === client.id
              return (
                <div key={client.id} className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
                  <button
                    onClick={() => handleExpandClient(client.id)}
                    className="w-full p-3 bg-transparent border-none cursor-pointer text-left"
                  >
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      {client.full_name || client.email || 'Unknown'}
                    </span>
                  </button>

                  {expanded && (
                    <div className="px-3 pb-3 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                      {/* Current target */}
                      {client.goal && (
                        <div className="pt-3">
                          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                            Current Target
                          </span>
                          <div className="flex gap-2 mt-1">
                            <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>
                              {client.goal.daily_calories} cal
                            </span>
                            <span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              P: {client.goal.protein_g}g
                            </span>
                            <span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              C: {client.goal.carbs_g}g
                            </span>
                            <span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              F: {client.goal.fat_g}g
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Goal form */}
                      <div className="pt-2">
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                          Set Targets
                        </span>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            { key: 'daily_calories', label: 'Calories' },
                            { key: 'protein_g', label: 'Protein (g)' },
                            { key: 'carbs_g', label: 'Carbs (g)' },
                            { key: 'fat_g', label: 'Fat (g)' },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex flex-col gap-1">
                              <label className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
                              <input
                                type="number"
                                value={goalForm[key as keyof typeof goalForm]}
                                onChange={(e) => setGoalForm({ ...goalForm, [key]: Number(e.target.value) })}
                                className="h-8 px-2 rounded-md text-sm font-mono border-none outline-none"
                                style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                              />
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleSaveGoal(client.id)}
                          className="mt-3 h-9 rounded-[14px] text-sm font-semibold border-none cursor-pointer w-full"
                          style={{ backgroundColor: 'var(--accent)', color: 'var(--primary-foreground)' }}
                        >
                          Save Targets
                        </Button>
                      </div>

                      {/* Recent logs */}
                      {client.recentLogs && client.recentLogs.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                            Last 7 Days
                          </span>
                          <div className="flex gap-2 mt-1">
                            <span className="font-mono text-xs" style={{ color: 'var(--foreground)' }}>
                              {new Set(client.recentLogs.map((l) => l.logged_at)).size} days logged
                            </span>
                            <span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              Avg {Math.round(client.recentLogs.reduce((s, l) => s + l.calories, 0) / 7)} cal/day
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'recipes' && (
          <div className="flex flex-col gap-2 mt-4">
            <Button
              onClick={() => {
                setEditingRecipe(null)
                setRecipeForm(emptyRecipeForm)
                setShowRecipeForm(true)
              }}
              className="h-10 rounded-[14px] text-sm font-semibold border-none cursor-pointer mb-2"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--primary-foreground)' }}
            >
              <Plus size={18} weight="bold" className="mr-1" /> Add Recipe
            </Button>

            {showRecipeForm && (
              <div className="rounded-lg p-3 mb-2" style={{ backgroundColor: 'var(--card)' }}>
                <div className="flex flex-col gap-2">
                  <input
                    placeholder="Recipe name"
                    value={recipeForm.name}
                    onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                    className="h-8 px-2 rounded-md text-sm border-none outline-none"
                    style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                  />
                  <select
                    value={recipeForm.category}
                    onChange={(e) => setRecipeForm({ ...recipeForm, category: e.target.value as Recipe['category'] })}
                    className="h-8 px-2 rounded-md text-sm border-none outline-none"
                    style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                  >
                    {['breakfast', 'lunch', 'dinner', 'snack', 'drink'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'calories', label: 'Calories' },
                      { key: 'protein_g', label: 'Protein (g)' },
                      { key: 'carbs_g', label: 'Carbs (g)' },
                      { key: 'fat_g', label: 'Fat (g)' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex flex-col gap-1">
                        <label className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
                        <input
                          type="number"
                          value={recipeForm[key as keyof typeof recipeForm]}
                          onChange={(e) => setRecipeForm({ ...recipeForm, [key]: Number(e.target.value) })}
                          className="h-8 px-2 rounded-md text-sm font-mono border-none outline-none"
                          style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                        />
                      </div>
                    ))}
                  </div>
                  <input
                    placeholder="Serving size (e.g. 1 bowl)"
                    value={recipeForm.serving_size}
                    onChange={(e) => setRecipeForm({ ...recipeForm, serving_size: e.target.value })}
                    className="h-8 px-2 rounded-md text-sm border-none outline-none"
                    style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                  />
                  <textarea
                    placeholder="Instructions (optional)"
                    value={recipeForm.instructions}
                    onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                    className="px-2 py-2 rounded-md text-sm border-none outline-none resize-none h-20"
                    style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveRecipe}
                      className="flex-1 h-9 rounded-[14px] text-sm font-semibold border-none cursor-pointer"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--primary-foreground)' }}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => { setShowRecipeForm(false); setEditingRecipe(null) }}
                      variant="ghost"
                      className="h-9 rounded-[14px] text-sm cursor-pointer"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {recipes.map((recipe) => (
              <div key={recipe.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                    {recipe.name}
                  </div>
                  <div className="flex gap-2 mt-0.5">
                    <span className="font-mono text-[11px]" style={{ color: 'var(--accent)' }}>
                      {recipe.calories} cal
                    </span>
                    <span className="text-[10px] capitalize" style={{ color: 'var(--muted-foreground)' }}>
                      {recipe.category}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => startEditRecipe(recipe)}
                    className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer rounded"
                  >
                    <PencilSimple size={16} color="var(--muted-foreground)" />
                  </button>
                  <button
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer rounded"
                  >
                    <Trash size={16} weight="bold" color="var(--destructive)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
