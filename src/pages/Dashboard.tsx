import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTodaysLogs, getMyGoals, deleteLog } from '@/services/nutritionService'
import type { NutritionLog, NutritionGoal } from '@/types'
import { Trash, Plus } from '@phosphor-icons/react'

type DayType = 'training' | 'rest'

const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const mealLabels: Record<string, string> = {
  breakfast: 'Colazione',
  lunch: 'Pranzo',
  dinner: 'Cena',
  snack: 'Spuntini',
}

export default function Dashboard() {
  const [logs, setLogs] = useState<NutritionLog[]>([])
  const [goals, setGoals] = useState<NutritionGoal[]>([])
  const [dayType, setDayType] = useState<DayType>('training')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [logsData, goalsData] = await Promise.all([
      getTodaysLogs(),
      getMyGoals(),
    ])
    setLogs(logsData)
    setGoals(goalsData)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const ok = await deleteLog(id)
    if (ok) {
      setLogs(logs.filter((l) => l.id !== id))
    }
  }

  // Pick goal for current day type
  const goal = goals.find((g) => g.day_type === dayType)
    ?? goals.find((g) => g.day_type === 'average')
    ?? goals[0]
    ?? null

  const hasDayTypes = goals.some((g) => g.day_type === 'training') && goals.some((g) => g.day_type === 'rest')

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
    const key = log.meal_type || 'snack'
    if (!acc[key]) acc[key] = []
    acc[key].push(log)
    return acc
  }, {})

  const today = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  if (loading) {
    return (
      <div className="content-area flex flex-col px-4">
        <div className="mt-4 mb-6 skeleton h-4 w-40" />
        <div className="flex justify-center mb-8">
          <div className="skeleton rounded-full" style={{ width: 200, height: 200 }} />
        </div>
        <div className="flex gap-4 justify-center mb-6">
          <div className="skeleton h-16 w-20" />
          <div className="skeleton h-16 w-20" />
          <div className="skeleton h-16 w-20" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
        </div>
      </div>
    )
  }

  // Calorie ring
  const calTarget = goal?.daily_calories ?? 0
  const calCurrent = Math.round(totals.calories)
  const calProgress = calTarget > 0 ? Math.min(calCurrent / calTarget, 1) : 0
  const remaining = Math.max(0, calTarget - calCurrent)
  const ringSize = 200
  const ringStroke = 14
  const ringRadius = (ringSize - ringStroke) / 2
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - calProgress * ringCircumference

  // Macro data
  const macros = [
    {
      label: 'Proteine',
      short: 'P',
      current: Math.round(totals.protein),
      target: goal ? Number(goal.protein_g) : 0,
      color: 'var(--macro-protein)',
    },
    {
      label: 'Carboidrati',
      short: 'C',
      current: Math.round(totals.carbs),
      target: goal ? Number(goal.carbs_g) : 0,
      color: 'var(--macro-carbs)',
    },
    {
      label: 'Grassi',
      short: 'F',
      current: Math.round(totals.fat),
      target: goal ? Number(goal.fat_g) : 0,
      color: 'var(--macro-fat)',
    },
  ]

  return (
    <div className="content-area flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Date + day type toggle */}
        <div className="flex items-center justify-between mt-4 mb-5">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {today}
          </p>
          {hasDayTypes && (
            <div
              className="flex rounded-full p-0.5"
              style={{ backgroundColor: 'var(--card)' }}
            >
              {(['training', 'rest'] as DayType[]).map((dt) => (
                <button
                  key={dt}
                  onClick={() => setDayType(dt)}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold border-none cursor-pointer transition-colors"
                  style={{
                    backgroundColor: dayType === dt ? 'var(--accent)' : 'transparent',
                    color: dayType === dt ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  }}
                >
                  {dt === 'training' ? 'Allenamento' : 'Riposo'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Calorie ring */}
        {goal ? (
          <div className="flex flex-col items-center mb-6">
            <div className="relative" style={{ width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth={ringStroke}
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke={calCurrent > calTarget ? 'var(--destructive)' : 'var(--accent)'}
                  strokeWidth={ringStroke}
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-4xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {calCurrent.toLocaleString()}
                </span>
                <span className="font-mono text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  / {calTarget.toLocaleString()} kcal
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
          <div
            className="text-center py-8 mb-4 rounded-2xl"
            style={{ backgroundColor: 'var(--card)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Nessun obiettivo attivo
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
              Contatta il tuo coach per ricevere il piano.
            </p>
          </div>
        )}

        {/* Macros row */}
        {goal && (
          <div className="flex gap-3 mb-8">
            {macros.map((macro) => {
              const progress = macro.target > 0 ? Math.min(macro.current / macro.target, 1) : 0
              return (
                <div key={macro.label} className="flex-1">
                  <div className="flex items-baseline gap-1 mb-1.5">
                    <span className="font-mono text-lg font-bold" style={{ color: macro.color }}>
                      {macro.current}
                    </span>
                    <span className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                      / {macro.target}g
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
                  <span className="text-[10px] mt-1 block" style={{ color: macro.color }}>
                    {macro.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Today's log — meal slots */}
        <div>
          <h2 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Pasti di Oggi
          </h2>

          <div className="flex flex-col gap-3">
            {mealOrder.map((type) => {
              const items = grouped[type] ?? []
              const mealCal = items.reduce((s, l) => s + l.calories, 0)
              return (
                <div
                  key={type}
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: 'var(--card)' }}
                >
                  {/* Meal header */}
                  <div className="flex items-center justify-between px-3 pt-3 pb-1">
                    <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                      {mealLabels[type]}
                    </span>
                    {items.length > 0 && (
                      <span className="font-mono text-[11px]" style={{ color: 'var(--accent)' }}>
                        {mealCal} kcal
                      </span>
                    )}
                  </div>

                  {/* Food items */}
                  {items.length > 0 ? (
                    <div className="px-3 pb-2">
                      {items.map((log) => {
                        const name = log.recipes?.name ?? log.custom_foods?.name ?? 'Sconosciuto'
                        return (
                          <div
                            key={log.id}
                            className="flex items-center justify-between py-1.5"
                            style={{ borderTop: '1px solid var(--border)' }}
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-sm block truncate" style={{ color: 'var(--foreground)' }}>
                                {name}
                              </span>
                              <span className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                                {log.calories} kcal · P {Number(log.protein_g).toFixed(0)}g · C {Number(log.carbs_g).toFixed(0)}g · F {Number(log.fat_g).toFixed(0)}g
                              </span>
                            </div>
                            <button
                              onClick={() => handleDelete(log.id)}
                              className="bg-transparent border-none cursor-pointer p-1 shrink-0"
                            >
                              <Trash size={14} weight="bold" color="var(--destructive)" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate('/log')}
                      className="w-full flex items-center gap-2 px-3 pb-3 pt-1 bg-transparent border-none cursor-pointer"
                    >
                      <Plus size={14} weight="bold" color="var(--muted-foreground)" />
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        Aggiungi
                      </span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
