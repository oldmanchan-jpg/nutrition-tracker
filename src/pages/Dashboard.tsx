import { useState, useEffect } from 'react'
import { getTodaysLogs, getMyGoal, deleteLog } from '@/services/nutritionService'
import type { NutritionLog, NutritionGoal } from '@/types'
import { Trash } from '@phosphor-icons/react'

export default function Dashboard() {
  const [logs, setLogs] = useState<NutritionLog[]>([])
  const [goal, setGoal] = useState<NutritionGoal | null>(null)
  const [loading, setLoading] = useState(true)

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

  const grouped = logs.reduce<Record<string, NutritionLog[]>>((acc, log) => {
    const key = log.meal_type || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(log)
    return acc
  }, {})

  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack']

  const mealTypeLabels: Record<string, string> = {
    breakfast: 'Colazione',
    lunch: 'Pranzo',
    dinner: 'Cena',
    snack: 'Spuntino',
  }

  const today = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  if (loading) {
    return (
      <div className="content-area flex flex-col px-4">
        {/* Skeleton */}
        <div className="mt-4 mb-6 skeleton h-4 w-40" />
        <div className="flex justify-center mb-8">
          <div className="skeleton rounded-full" style={{ width: 180, height: 180 }} />
        </div>
        <div className="flex flex-col gap-4 mb-6">
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      </div>
    )
  }

  // Calorie ring calculations
  const calTarget = goal?.daily_calories ?? 0
  const calCurrent = Math.round(totals.calories)
  const calProgress = calTarget > 0 ? Math.min(calCurrent / calTarget, 1) : 0
  const remaining = Math.max(0, calTarget - calCurrent)
  const ringSize = 180
  const ringStroke = 12
  const ringRadius = (ringSize - ringStroke) / 2
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - calProgress * ringCircumference

  // Macro bar data
  const macros = [
    {
      label: 'Proteine',
      current: Math.round(totals.protein),
      target: goal ? Number(goal.protein_g) : 0,
      color: 'var(--macro-protein)',
    },
    {
      label: 'Carboidrati',
      current: Math.round(totals.carbs),
      target: goal ? Number(goal.carbs_g) : 0,
      color: 'var(--macro-carbs)',
    },
    {
      label: 'Grassi',
      current: Math.round(totals.fat),
      target: goal ? Number(goal.fat_g) : 0,
      color: 'var(--macro-fat)',
    },
  ]

  return (
    <div className="content-area flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Date */}
        <p className="text-sm mt-4 mb-6" style={{ color: 'var(--muted-foreground)' }}>
          {today}
        </p>

        {/* Calorie donut ring */}
        {goal ? (
          <div className="flex flex-col items-center mb-8">
            <div className="relative" style={{ width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                {/* Track */}
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth={ringStroke}
                />
                {/* Progress */}
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={ringStroke}
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {calCurrent.toLocaleString()}
                </span>
                <span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  / {calTarget.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
              {calCurrent >= calTarget
                ? 'Obiettivo raggiunto!'
                : `${remaining.toLocaleString()} kcal rimanenti`}
            </p>
          </div>
        ) : (
          <div className="text-center py-8 mb-4">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Obiettivi non impostati — contatta il tuo coach
            </p>
          </div>
        )}

        {/* Macro progress bars */}
        {goal && (
          <div className="flex flex-col gap-4 mb-8">
            {macros.map((macro) => {
              const progress = macro.target > 0 ? Math.min(macro.current / macro.target, 1) : 0
              return (
                <div key={macro.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold" style={{ color: macro.color }}>
                      {macro.label}
                    </span>
                    <span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {macro.current}g / {macro.target}g
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full w-full"
                    style={{ backgroundColor: 'var(--border)' }}
                  >
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${progress * 100}%`,
                        backgroundColor: macro.color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Today's meals */}
        <div>
          <h2 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Pasti di Oggi
          </h2>

          {logs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🍽️</div>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Nessun pasto registrato oggi
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>
                Tocca (+) per iniziare
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {mealOrder.map((type) => {
                const items = grouped[type]
                if (!items) return null
                return (
                  <div key={type}>
                    <h3 className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--muted-foreground)' }}>
                      {mealTypeLabels[type] || type}
                    </h3>
                    <div className="flex flex-col gap-1">
                      {items.map((log) => {
                        const name = log.recipes?.name ?? log.custom_foods?.name ?? 'Sconosciuto'
                        const imageUrl = log.recipes?.image_url
                        const initial = name.charAt(0).toUpperCase()
                        return (
                          <div
                            key={log.id}
                            className="flex items-center gap-3 py-2 px-3 rounded-lg"
                            style={{ backgroundColor: 'var(--card)' }}
                          >
                            {/* Thumbnail or letter avatar */}
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                                style={{
                                  backgroundColor: log.custom_foods ? 'var(--accent)' : 'var(--muted)',
                                  color: log.custom_foods ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                                }}
                              >
                                {initial}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm block truncate" style={{ color: 'var(--foreground)' }}>
                                {name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
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
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
