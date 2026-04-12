import { useState, useEffect } from 'react'
import { getLogsByDateRange, getLogsByDate, deleteLog, updateLog } from '@/services/nutritionService'
import type { NutritionLog } from '@/types'
import { Trash, CaretLeft, CaretRight, PencilSimple, Check, X } from '@phosphor-icons/react'

const mealLabels: Record<string, string> = {
  breakfast: 'Colazione',
  lunch: 'Pranzo',
  dinner: 'Cena',
  snack: 'Spuntini',
}

const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack']

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
}

function getWeekDates(weekOffset: number): string[] {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7) // Monday
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

const dayLabels = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

export default function History() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekDates, setWeekDates] = useState<string[]>(getWeekDates(0))
  const [daySummaries, setDaySummaries] = useState<Record<string, { calories: number; count: number }>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayLogs, setDayLogs] = useState<NutritionLog[]>([])
  const [loadingWeek, setLoadingWeek] = useState(true)
  const [loadingDay, setLoadingDay] = useState(false)
  const [editingLog, setEditingLog] = useState<string | null>(null)
  const [editServings, setEditServings] = useState(1)

  const todayStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const dates = getWeekDates(weekOffset)
    setWeekDates(dates)
    setSelectedDate(null)
    setDayLogs([])
    loadWeek(dates)
  }, [weekOffset])

  async function loadWeek(dates: string[]) {
    setLoadingWeek(true)
    const start = dates[0]
    const end = dates[dates.length - 1]
    const logs = await getLogsByDateRange(start, end)

    const summaries: Record<string, { calories: number; count: number }> = {}
    for (const d of dates) {
      summaries[d] = { calories: 0, count: 0 }
    }
    for (const log of logs) {
      if (summaries[log.logged_at]) {
        summaries[log.logged_at].calories += log.calories
        summaries[log.logged_at].count += 1
      }
    }
    setDaySummaries(summaries)
    setLoadingWeek(false)
  }

  async function handleSelectDate(date: string) {
    if (date === selectedDate) {
      setSelectedDate(null)
      setDayLogs([])
      return
    }
    setSelectedDate(date)
    setLoadingDay(true)
    setEditingLog(null)
    const logs = await getLogsByDate(date)
    setDayLogs(logs)
    setLoadingDay(false)
  }

  async function handleDelete(id: string) {
    const ok = await deleteLog(id)
    if (ok) {
      setDayLogs(dayLogs.filter((l) => l.id !== id))
      // Update summary
      if (selectedDate) {
        const remaining = dayLogs.filter((l) => l.id !== id)
        setDaySummaries((prev) => ({
          ...prev,
          [selectedDate]: {
            calories: remaining.reduce((s, l) => s + l.calories, 0),
            count: remaining.length,
          },
        }))
      }
    }
  }

  function startEdit(log: NutritionLog) {
    setEditingLog(log.id)
    setEditServings(log.servings)
  }

  async function saveEdit(log: NutritionLog) {
    const recipe = log.recipes
    const customFood = log.custom_foods
    const base = recipe ?? customFood
    if (!base) return

    const updates = {
      servings: editServings,
      calories: Math.round(base.calories * editServings),
      protein_g: Math.round(Number(base.protein_g) * editServings * 10) / 10,
      carbs_g: Math.round(Number(base.carbs_g) * editServings * 10) / 10,
      fat_g: Math.round(Number(base.fat_g) * editServings * 10) / 10,
    }

    const updated = await updateLog(log.id, updates)
    if (updated) {
      setDayLogs(dayLogs.map((l) => l.id === log.id ? updated : l))
      // Update summary
      if (selectedDate) {
        const updatedLogs = dayLogs.map((l) => l.id === log.id ? updated : l)
        setDaySummaries((prev) => ({
          ...prev,
          [selectedDate]: {
            calories: updatedLogs.reduce((s, l) => s + l.calories, 0),
            count: updatedLogs.length,
          },
        }))
      }
    }
    setEditingLog(null)
  }

  // Group day logs by meal
  const grouped = dayLogs.reduce<Record<string, NutritionLog[]>>((acc, log) => {
    const key = log.meal_type || 'snack'
    if (!acc[key]) acc[key] = []
    acc[key].push(log)
    return acc
  }, {})

  const weekLabel = (() => {
    if (weekDates.length === 0) return ''
    const start = new Date(weekDates[0] + 'T12:00:00')
    const end = new Date(weekDates[6] + 'T12:00:00')
    return `${start.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`
  })()

  return (
    <div className="content-area flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Week navigator */}
        <div className="flex items-center justify-between mt-4 mb-4">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer rounded-full"
            style={{ backgroundColor: 'var(--card)' }}
          >
            <CaretLeft size={16} color="var(--foreground)" />
          </button>
          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {weekLabel}
          </span>
          <button
            onClick={() => weekOffset < 0 ? setWeekOffset(weekOffset + 1) : undefined}
            className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer rounded-full"
            style={{
              backgroundColor: 'var(--card)',
              opacity: weekOffset >= 0 ? 0.3 : 1,
            }}
            disabled={weekOffset >= 0}
          >
            <CaretRight size={16} color="var(--foreground)" />
          </button>
        </div>

        {/* Week calendar strip */}
        <div className="grid grid-cols-7 gap-1.5 mb-6">
          {weekDates.map((date, i) => {
            const summary = daySummaries[date]
            const isToday = date === todayStr
            const isSelected = date === selectedDate
            const hasLogs = summary && summary.count > 0
            const isFuture = date > todayStr

            return (
              <button
                key={date}
                onClick={() => !isFuture && handleSelectDate(date)}
                disabled={isFuture}
                className="flex flex-col items-center py-2 rounded-xl border-none cursor-pointer"
                style={{
                  backgroundColor: isSelected ? 'var(--accent)' : 'var(--card)',
                  opacity: isFuture ? 0.3 : 1,
                }}
              >
                <span
                  className="text-[10px] font-semibold mb-1"
                  style={{ color: isSelected ? 'var(--primary-foreground)' : 'var(--muted-foreground)' }}
                >
                  {dayLabels[i]}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{
                    color: isSelected
                      ? 'var(--primary-foreground)'
                      : isToday ? 'var(--accent)' : 'var(--foreground)',
                  }}
                >
                  {new Date(date + 'T12:00:00').getDate()}
                </span>
                {hasLogs && !isSelected && (
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
                {hasLogs && isSelected && (
                  <span
                    className="font-mono text-[9px] mt-0.5"
                    style={{ color: 'var(--primary-foreground)' }}
                  >
                    {summary.calories}
                  </span>
                )}
                {!hasLogs && <div className="h-1.5 mt-1" />}
              </button>
            )
          })}
        </div>

        {/* Selected day detail */}
        {selectedDate && (
          <div>
            <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
              {formatDate(selectedDate)}
            </h2>

            {loadingDay ? (
              <div className="flex flex-col gap-2">
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
              </div>
            ) : dayLogs.length === 0 ? (
              <div className="text-center py-8 rounded-xl" style={{ backgroundColor: 'var(--card)' }}>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Nessun pasto registrato
                </p>
              </div>
            ) : (
              <>
                {/* Day totals */}
                <div
                  className="rounded-xl p-3 mb-4 flex gap-3"
                  style={{ backgroundColor: 'var(--card)' }}
                >
                  {[
                    { label: 'Kcal', value: dayLogs.reduce((s, l) => s + l.calories, 0), color: 'var(--accent)' },
                    { label: 'P', value: Math.round(dayLogs.reduce((s, l) => s + Number(l.protein_g), 0)), color: 'var(--macro-protein)' },
                    { label: 'C', value: Math.round(dayLogs.reduce((s, l) => s + Number(l.carbs_g), 0)), color: 'var(--macro-carbs)' },
                    { label: 'F', value: Math.round(dayLogs.reduce((s, l) => s + Number(l.fat_g), 0)), color: 'var(--macro-fat)' },
                  ].map((s) => (
                    <div key={s.label} className="flex-1 text-center">
                      <div className="font-mono text-lg font-bold" style={{ color: s.color }}>
                        {s.value}{s.label !== 'Kcal' ? 'g' : ''}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Meals */}
                <div className="flex flex-col gap-3">
                  {mealOrder.map((type) => {
                    const items = grouped[type]
                    if (!items || items.length === 0) return null
                    return (
                      <div key={type}>
                        <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--muted-foreground)' }}>
                          {mealLabels[type]}
                        </span>
                        <div className="flex flex-col gap-1 mt-1">
                          {items.map((log) => {
                            const name = log.recipes?.name ?? log.custom_foods?.name ?? 'Sconosciuto'
                            const isEditing = editingLog === log.id

                            return (
                              <div
                                key={log.id}
                                className="flex items-center gap-2 p-2 rounded-lg"
                                style={{ backgroundColor: 'var(--card)' }}
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm block truncate" style={{ color: 'var(--foreground)' }}>
                                    {name}
                                  </span>
                                  {isEditing ? (
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Porzioni:</span>
                                      <input
                                        type="number"
                                        step="0.5"
                                        min="0.5"
                                        value={editServings}
                                        onChange={(e) => setEditServings(Number(e.target.value) || 0.5)}
                                        className="w-16 h-6 px-1 rounded text-xs font-mono border-none outline-none"
                                        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                      />
                                    </div>
                                  ) : (
                                    <span className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                                      {log.calories} kcal · ×{log.servings}
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={() => saveEdit(log)}
                                        className="w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer rounded"
                                      >
                                        <Check size={14} weight="bold" color="var(--accent)" />
                                      </button>
                                      <button
                                        onClick={() => setEditingLog(null)}
                                        className="w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer rounded"
                                      >
                                        <X size={14} weight="bold" color="var(--muted-foreground)" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => startEdit(log)}
                                        className="w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer rounded"
                                      >
                                        <PencilSimple size={14} color="var(--muted-foreground)" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(log.id)}
                                        className="w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer rounded"
                                      >
                                        <Trash size={14} weight="bold" color="var(--destructive)" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* No date selected hint */}
        {!selectedDate && !loadingWeek && (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Tocca un giorno per vedere il dettaglio
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
