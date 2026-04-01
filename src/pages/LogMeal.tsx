import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass, Minus, Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { getRecipes, logMeal, getCustomFoods, logCustomFood } from '@/services/nutritionService'
import type { Recipe, CustomFood } from '@/types'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Colazione',
  lunch: 'Pranzo',
  dinner: 'Cena',
  snack: 'Spuntino',
}

const categoryLabels: Record<string, string> = {
  breakfast: 'Colazione',
  lunch: 'Pranzo',
  dinner: 'Cena',
  snack: 'Spuntino',
  drink: 'Bevanda',
}

export default function LogMeal() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([])
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<MealType>('breakfast')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [servings, setServings] = useState(1)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getRecipes(), getCustomFoods()]).then(([r, cf]) => {
      setRecipes(r)
      setCustomFoods(cf)
      setLoading(false)
    })
  }, [])

  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredCustomFoods = customFoods.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  // Group recipes by category
  const groupedRecipes = (['breakfast', 'lunch', 'dinner', 'snack', 'drink'] as const)
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat],
      items: filteredRecipes.filter((r) => r.category === cat),
    }))
    .filter((g) => g.items.length > 0)

  function handleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
      setServings(1)
    } else {
      setExpandedId(id)
      setServings(1)
    }
  }

  async function handleAdd(recipe: Recipe) {
    const result = await logMeal(recipe.id, servings, selectedType, recipe)
    if (result) {
      setToast(`${recipe.name} aggiunto`)
      setExpandedId(null)
      setServings(1)
      setTimeout(() => setToast(''), 2000)
    }
  }

  async function handleAddCustom(food: CustomFood) {
    const result = await logCustomFood(food, 1, selectedType)
    if (result) {
      setToast(`${food.name} aggiunto`)
      setTimeout(() => setToast(''), 2000)
    }
  }

  return (
    <div className="content-area flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {/* Meal type selector */}
        <div className="flex gap-2 mt-4 mb-4">
          {mealTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border-none cursor-pointer"
              style={{
                backgroundColor: selectedType === type ? 'var(--accent)' : 'var(--card)',
                color: selectedType === type ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              }}
            >
              {mealTypeLabels[type]}
            </button>
          ))}
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 h-10 rounded-lg mb-4"
          style={{ backgroundColor: 'var(--card)' }}
        >
          <MagnifyingGlass size={18} color="var(--muted-foreground)" />
          <input
            type="text"
            placeholder="Cerca ricette..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: 'var(--foreground)' }}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="skeleton" style={{ height: 120 }} />
                <div className="p-2.5" style={{ backgroundColor: 'var(--card)' }}>
                  <div className="skeleton h-3 w-3/4 mb-1" />
                  <div className="skeleton h-2.5 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Custom foods section */}
            {filteredCustomFoods.length > 0 && (
              <>
                <h3 className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--muted-foreground)' }}>
                  I tuoi alimenti
                </h3>
                <div className="flex flex-col gap-2 mb-6">
                  {filteredCustomFoods.map((food) => {
                    const initial = food.name.charAt(0).toUpperCase()
                    return (
                      <div
                        key={food.id}
                        className="flex items-center gap-3 p-3 rounded-lg"
                        style={{ backgroundColor: 'var(--card)' }}
                      >
                        {/* Letter avatar */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                          style={{ backgroundColor: 'var(--accent)', color: 'var(--primary-foreground)' }}
                        >
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium block truncate" style={{ color: 'var(--foreground)' }}>
                            {food.name}
                          </span>
                          <div className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                            {food.calories} kcal · P {food.protein_g}g · C {food.carbs_g}g · F {food.fat_g}g
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddCustom(food)}
                          className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer shrink-0"
                          style={{ backgroundColor: 'var(--accent)', color: 'var(--primary-foreground)' }}
                        >
                          <Plus size={16} weight="bold" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* Recipe cards by category */}
            {groupedRecipes.map((group) => (
              <div key={group.category} className="mb-6">
                <h3 className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  {group.label}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {group.items.map((recipe) => {
                    const expanded = expandedId === recipe.id
                    const initial = recipe.name.charAt(0).toUpperCase()
                    return (
                      <div
                        key={recipe.id}
                        className="rounded-xl overflow-hidden"
                        style={{ backgroundColor: 'var(--card)' }}
                      >
                        <button
                          onClick={() => handleExpand(recipe.id)}
                          className="w-full bg-transparent border-none cursor-pointer text-left p-0"
                        >
                          {recipe.image_url ? (
                            <img
                              src={recipe.image_url}
                              alt={recipe.name}
                              className="w-full object-cover"
                              style={{ height: 100 }}
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="w-full flex items-center justify-center text-2xl font-bold"
                              style={{ height: 100, backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                            >
                              {initial}
                            </div>
                          )}
                          <div className="p-2.5">
                            <div className="text-xs font-semibold leading-tight mb-0.5 line-clamp-2" style={{ color: 'var(--foreground)' }}>
                              {recipe.name}
                            </div>
                            <div className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                              {recipe.calories} kcal · P {recipe.protein_g}g
                            </div>
                          </div>
                        </button>

                        {expanded && (
                          <div className="px-2.5 pb-2.5 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
                            {/* Servings */}
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Porzioni</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setServings(Math.max(0.5, servings - 0.5)) }}
                                  className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer"
                                  style={{ backgroundColor: 'var(--background)' }}
                                >
                                  <Minus size={12} color="var(--foreground)" />
                                </button>
                                <span className="font-mono text-sm w-6 text-center" style={{ color: 'var(--foreground)' }}>
                                  {servings}
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setServings(servings + 0.5) }}
                                  className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer"
                                  style={{ backgroundColor: 'var(--background)' }}
                                >
                                  <Plus size={12} color="var(--foreground)" />
                                </button>
                              </div>
                            </div>

                            <div className="font-mono text-[10px]" style={{ color: 'var(--accent)' }}>
                              {Math.round(recipe.calories * servings)} kcal · P {Math.round(recipe.protein_g * servings)}g · C {Math.round(recipe.carbs_g * servings)}g · F {Math.round(recipe.fat_g * servings)}g
                            </div>

                            <Button
                              onClick={(e) => { e.stopPropagation(); handleAdd(recipe) }}
                              className="h-8 rounded-lg text-xs font-semibold border-none cursor-pointer"
                              style={{
                                backgroundColor: 'var(--accent)',
                                color: 'var(--primary-foreground)',
                              }}
                            >
                              Aggiungi
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {filteredRecipes.length === 0 && filteredCustomFoods.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                Nessuna ricetta trovata
              </p>
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium z-50"
          style={{ backgroundColor: 'var(--card)', color: 'var(--accent)' }}
        >
          {toast}
        </div>
      )}

      {/* Done button */}
      <div className="absolute bottom-0 left-0 right-0 p-4" style={{ backgroundColor: 'var(--background)' }}>
        <Button
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          className="w-full h-[52px] rounded-[14px] text-base font-semibold cursor-pointer"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        >
          Fatto
        </Button>
      </div>
    </div>
  )
}
