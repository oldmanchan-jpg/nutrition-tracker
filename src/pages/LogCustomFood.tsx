import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { createCustomFood, logCustomFood, getCustomFoods } from '@/services/nutritionService'
import type { CustomFood } from '@/types'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Colazione',
  lunch: 'Pranzo',
  dinner: 'Cena',
  snack: 'Spuntino',
}

export default function LogCustomFood() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [saving, setSaving] = useState(false)
  const [savedFoods, setSavedFoods] = useState<CustomFood[]>([])

  useEffect(() => {
    getCustomFoods().then(setSavedFoods)
  }, [])

  function fillFromSaved(food: CustomFood) {
    setName(food.name)
    setCalories(String(food.calories))
    setProtein(String(food.protein_g))
    setCarbs(String(food.carbs_g))
    setFat(String(food.fat_g))
  }

  const isValid = name.trim() && calories && Number(calories) > 0

  async function handleSaveAndLog() {
    if (!isValid) return
    setSaving(true)
    const food = await createCustomFood({
      name: name.trim(),
      calories: Number(calories),
      protein_g: Number(protein) || 0,
      carbs_g: Number(carbs) || 0,
      fat_g: Number(fat) || 0,
    })
    if (food) {
      await logCustomFood(food, 1, mealType)
    }
    setSaving(false)
    navigate('/dashboard')
  }

  async function handleSaveOnly() {
    if (!isValid) return
    setSaving(true)
    await createCustomFood({
      name: name.trim(),
      calories: Number(calories),
      protein_g: Number(protein) || 0,
      carbs_g: Number(carbs) || 0,
      fat_g: Number(fat) || 0,
    })
    setSaving(false)
    navigate('/dashboard')
  }

  return (
    <div className="content-area flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-40">
        {/* Saved foods quick pick */}
        {savedFoods.length > 0 && (
          <div className="mt-4 mb-6">
            <h3 className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--muted-foreground)' }}>
              I tuoi alimenti
            </h3>
            <div className="flex flex-wrap gap-2">
              {savedFoods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => fillFromSaved(food)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border-none cursor-pointer"
                  style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                >
                  {food.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Meal type selector */}
        <div className="flex gap-2 mt-4 mb-6">
          {mealTypes.map((type) => (
            <button
              key={type}
              onClick={() => setMealType(type)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border-none cursor-pointer"
              style={{
                backgroundColor: mealType === type ? 'var(--accent)' : 'var(--card)',
                color: mealType === type ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              }}
            >
              {mealTypeLabels[type]}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
              Nome alimento
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Yogurt greco"
              className="w-full h-10 px-3 rounded-lg border-none outline-none text-sm"
              style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
              Calorie (kcal) *
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
              className="w-full h-10 px-3 rounded-lg border-none outline-none text-sm font-mono"
              style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                Proteine (g)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
                className="w-full h-10 px-3 rounded-lg border-none outline-none text-sm font-mono"
                style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                Carboidrati (g)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
                className="w-full h-10 px-3 rounded-lg border-none outline-none text-sm font-mono"
                style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                Grassi (g)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="0"
                className="w-full h-10 px-3 rounded-lg border-none outline-none text-sm font-mono"
                style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-2" style={{ backgroundColor: 'var(--background)' }}>
        <Button
          onClick={handleSaveAndLog}
          disabled={!isValid || saving}
          className="w-full h-[52px] rounded-[14px] text-base font-semibold border-none cursor-pointer"
          style={{
            backgroundColor: isValid ? 'var(--accent)' : 'var(--muted)',
            color: 'var(--primary-foreground)',
          }}
        >
          {saving ? 'Salvataggio...' : 'Salva e registra'}
        </Button>
        <Button
          onClick={handleSaveOnly}
          disabled={!isValid || saving}
          variant="ghost"
          className="w-full h-[44px] rounded-[14px] text-sm font-semibold cursor-pointer"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        >
          Salva senza registrare
        </Button>
      </div>
    </div>
  )
}
