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

export default function LogMeal() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([])
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<MealType>('breakfast')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [servings, setServings] = useState(1)
  const [toast, setToast] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getRecipes().then(setRecipes)
    getCustomFoods().then(setCustomFoods)
  }, [])

  const filtered = recipes.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

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

  return (
    <div className="content-area flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {/* Meal type selector */}
        <div className="flex gap-2 mt-4 mb-4">
          {mealTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize border-none cursor-pointer"
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

        {/* Custom foods */}
        {customFoods.length > 0 && (
          <>
            <h3 className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--muted-foreground)' }}>
              I tuoi alimenti
            </h3>
            <div className="flex flex-col gap-2 mb-4">
              {customFoods
                .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
                .map((food) => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--card)' }}
                  >
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                        {food.name}
                      </span>
                      <div className="flex gap-3 mt-1">
                        <span className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                          P: {food.protein_g}g
                        </span>
                        <span className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                          C: {food.carbs_g}g
                        </span>
                        <span className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                          F: {food.fat_g}g
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm" style={{ color: 'var(--accent)' }}>
                        {food.calories} cal
                      </span>
                      <button
                        onClick={async () => {
                          const result = await logCustomFood(food, 1, selectedType)
                          if (result) {
                            setToast(`${food.name} aggiunto`)
                            setTimeout(() => setToast(''), 2000)
                          }
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold border-none cursor-pointer"
                        style={{ backgroundColor: 'var(--accent)', color: 'var(--primary-foreground)' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <h3 className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--muted-foreground)' }}>
              Ricette
            </h3>
          </>
        )}

        {/* Recipe list */}
        <div className="flex flex-col gap-2">
          {filtered.map((recipe) => {
            const expanded = expandedId === recipe.id
            return (
              <div
                key={recipe.id}
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--card)' }}
              >
                <button
                  onClick={() => handleExpand(recipe.id)}
                  className="w-full p-3 bg-transparent border-none cursor-pointer text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      {recipe.name}
                    </span>
                    <span className="font-mono text-sm" style={{ color: 'var(--accent)' }}>
                      {recipe.calories} cal
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                      P: {recipe.protein_g}g
                    </span>
                    <span className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                      C: {recipe.carbs_g}g
                    </span>
                    <span className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                      F: {recipe.fat_g}g
                    </span>
                  </div>
                  {recipe.serving_size && (
                    <span className="text-[10px] mt-0.5 block" style={{ color: 'var(--muted-foreground)' }}>
                      {recipe.serving_size}
                    </span>
                  )}
                </button>

                {expanded && (
                  <div className="px-3 pb-3 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                    {/* Servings */}
                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Porzioni</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setServings(Math.max(0.5, servings - 0.5))}
                          className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
                          style={{ backgroundColor: 'var(--background)' }}
                        >
                          <Minus size={14} color="var(--foreground)" />
                        </button>
                        <span className="font-mono text-base w-8 text-center" style={{ color: 'var(--foreground)' }}>
                          {servings}
                        </span>
                        <button
                          onClick={() => setServings(servings + 0.5)}
                          className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
                          style={{ backgroundColor: 'var(--background)' }}
                        >
                          <Plus size={14} color="var(--foreground)" />
                        </button>
                      </div>
                    </div>

                    {/* Adjusted macros */}
                    <div className="flex gap-3">
                      <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>
                        {Math.round(recipe.calories * servings)} cal
                      </span>
                      <span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        P: {Math.round(recipe.protein_g * servings)}g
                      </span>
                      <span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        C: {Math.round(recipe.carbs_g * servings)}g
                      </span>
                      <span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        F: {Math.round(recipe.fat_g * servings)}g
                      </span>
                    </div>

                    <Button
                      onClick={() => handleAdd(recipe)}
                      className="h-10 rounded-[14px] text-sm font-semibold border-none cursor-pointer"
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
