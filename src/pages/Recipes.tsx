import { useState, useEffect } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { getRecipes } from '@/services/nutritionService'
import type { Recipe } from '@/types'

const categories = ['all', 'breakfast', 'lunch', 'dinner', 'snack', 'drink']

const categoryLabels: Record<string, string> = {
  all: 'Tutte',
  breakfast: 'Colazione',
  lunch: 'Pranzo',
  dinner: 'Cena',
  snack: 'Spuntino',
  drink: 'Bevanda',
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const initial = recipe.name.charAt(0).toUpperCase()

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
      {/* Image or placeholder */}
      {recipe.image_url ? (
        <img
          src={recipe.image_url}
          alt={recipe.name}
          className="w-full object-cover"
          style={{ height: 120 }}
          loading="lazy"
        />
      ) : (
        <div
          className="w-full flex items-center justify-center text-2xl font-bold"
          style={{ height: 120, backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
        >
          {initial}
        </div>
      )}
      <div className="p-2.5">
        <div className="text-xs font-semibold leading-tight mb-1 line-clamp-2" style={{ color: 'var(--foreground)' }}>
          {recipe.name}
        </div>
        <div className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
          {recipe.calories} kcal · P {recipe.protein_g}g · C {recipe.carbs_g}g · F {recipe.fat_g}g
        </div>
      </div>
    </div>
  )
}

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecipes().then((r) => {
      setRecipes(r)
      setLoading(false)
    })
  }, [])

  const filtered = recipes.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'all' || r.category === category
    return matchesSearch && matchesCategory
  })

  // Group by category for section headers (when showing all)
  const showGrouped = category === 'all' && !search
  const groupedByCategory = showGrouped
    ? (['breakfast', 'lunch', 'dinner', 'snack', 'drink'] as const).map((cat) => ({
        category: cat,
        label: categoryLabels[cat],
        items: filtered.filter((r) => r.category === cat),
      })).filter((g) => g.items.length > 0)
    : []

  return (
    <div className="content-area flex flex-col">
      <div className="flex-1 overflow-y-auto px-4">
        {/* Category filter */}
        <div className="flex gap-2 mt-4 mb-4 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border-none cursor-pointer whitespace-nowrap shrink-0"
              style={{
                backgroundColor: category === cat ? 'var(--accent)' : 'var(--card)',
                color: category === cat ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              }}
            >
              {categoryLabels[cat] || cat}
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
          <div className="grid grid-cols-2 gap-3 pb-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="skeleton" style={{ height: 120 }} />
                <div className="p-2.5" style={{ backgroundColor: 'var(--card)' }}>
                  <div className="skeleton h-3 w-3/4 mb-1" />
                  <div className="skeleton h-2.5 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Nessuna ricetta trovata
            </p>
          </div>
        ) : showGrouped ? (
          <div className="pb-4">
            {groupedByCategory.map((group) => (
              <div key={group.category} className="mb-6">
                <h3 className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  {group.label}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {group.items.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-4">
            {filtered.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
