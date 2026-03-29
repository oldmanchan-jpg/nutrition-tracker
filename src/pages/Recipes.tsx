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

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    getRecipes().then(setRecipes)
  }, [])

  const filtered = recipes.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'all' || r.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="content-area flex flex-col">
      <div className="flex-1 overflow-y-auto px-4">
        {/* Category filter */}
        <div className="flex gap-2 mt-4 mb-4 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize border-none cursor-pointer whitespace-nowrap shrink-0"
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

        {/* Recipe list */}
        <div className="flex flex-col gap-2 pb-4">
          {filtered.map((recipe) => (
            <div
              key={recipe.id}
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: 'var(--card)' }}
            >
              <button
                onClick={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                className="w-full p-3 bg-transparent border-none cursor-pointer text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {recipe.name}
                  </span>
                </div>
                {recipe.serving_size && (
                  <span className="text-[10px] mt-0.5 block" style={{ color: 'var(--muted-foreground)' }}>
                    {recipe.serving_size}
                  </span>
                )}
                <div className="flex gap-3 mt-1.5">
                  <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>
                    {recipe.calories} cal
                  </span>
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
              </button>

              {expandedId === recipe.id && recipe.instructions && (
                <div className="px-3 pb-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                    {recipe.instructions}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
