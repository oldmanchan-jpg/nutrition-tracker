import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import MacroRing from '@/components/MacroRing'
import { getTodaysLogs, getMyGoal, deleteLog } from '@/services/nutritionService'
import type { NutritionLog, NutritionGoal } from '@/types'
import { Trash } from '@phosphor-icons/react'

export default function Dashboard() {
  const [logs, setLogs] = useState<NutritionLog[]>([])
  const [goal, setGoal] = useState<NutritionGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [logsData, goalData] = await Promise.all([
      getTodaysLogs(),
      getMyGoal(),
    ])
    setLogs(logsData)
    setGoal(goalData)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const ok = await deleteLog(id)
    if (ok) {
      setLogs(logs.filter((l) => l.id !== id))
    }
  }

  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + Number(log.protein_g),
      carbs: acc.carbs + Number(log.carbs_g),
      fat: acc.fat + Number(log.fat_g),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Group logs by meal_type
  const grouped = logs.reduce<Record<string, NutritionLog[]>>((acc, log) => {
    const key = log.meal_type || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(log)
    return acc
  }, {})

  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack']

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  if (loading) {
    return (
      <div className="content-area flex items-center justify-center">
        <span style={{ color: 'var(--muted-foreground)' }}>Loading...</span>
      </div>
    )
  }

  return (
    <div className="content-area flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {/* Date */}
        <p className="text-sm mt-4 mb-6" style={{ color: 'var(--muted-foreground)' }}>
          {today}
        </p>

        {/* Macro rings */}
        {goal ? (
          <div className="flex justify-center gap-4 mb-8">
            <MacroRing
              label="Calories"
              current={Math.round(totals.calories)}
              target={goal.daily_calories}
              size={64}
              strokeWidth={5}
            />
            <MacroRing
              label="Protein"
              current={Math.round(totals.protein)}
              target={Number(goal.protein_g)}
              unit="g"
            />
            <MacroRing
              label="Carbs"
              current={Math.round(totals.carbs)}
              target={Number(goal.carbs_g)}
              unit="g"
            />
            <MacroRing
              label="Fat"
              current={Math.round(totals.fat)}
              target={Number(goal.fat_g)}
              unit="g"
            />
          </div>
        ) : (
          <div className="text-center py-8 mb-4">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No targets set — contact your coach
            </p>
          </div>
        )}

        {/* Today's meals */}
        <div>
          <h2 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Today's Meals
          </h2>

          {logs.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
              No meals logged today
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {mealOrder.map((type) => {
                const items = grouped[type]
                if (!items) return null
                return (
                  <div key={type}>
                    <h3 className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--muted-foreground)' }}>
                      {type}
                    </h3>
                    <div className="flex flex-col gap-1">
                      {items.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between py-2 px-3 rounded-lg"
                          style={{ backgroundColor: 'var(--card)' }}
                        >
                          <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {log.recipes?.name ?? 'Unknown'}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm" style={{ color: 'var(--accent)' }}>
                              {log.calories} cal
                            </span>
                            <button
                              onClick={() => handleDelete(log.id)}
                              className="bg-transparent border-none cursor-pointer p-1"
                            >
                              <Trash size={16} weight="bold" color="var(--destructive)" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-4" style={{ backgroundColor: 'var(--background)' }}>
        <Button
          onClick={() => navigate('/log')}
          className="w-full h-[52px] rounded-[14px] text-base font-semibold border-none cursor-pointer"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--primary-foreground)',
          }}
        >
          Log Meal
        </Button>
      </div>
    </div>
  )
}
