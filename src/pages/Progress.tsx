import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  Cell,
} from 'recharts'
import { getLogsByDateRange, getMyGoal } from '@/services/nutritionService'
import type { NutritionGoal } from '@/types'

type Period = 'week' | 'month'

const dayLabelsIt = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

function barColor(calories: number, target: number): string {
  if (calories === 0) return 'var(--border)'
  if (target <= 0) return 'var(--accent)'
  const ratio = calories / target
  if (ratio > 1) return 'var(--destructive)'       // Over target
  if (ratio < 0.8) return 'var(--muted-foreground)' // Under by >20%
  return 'var(--accent)'                            // Within 10–20%
}

export default function Progress() {
  const [period, setPeriod] = useState<Period>('week')
  const [chartData, setChartData] = useState<{ date: string; label: string; calories: number; protein: number; carbs: number; fat: number }[]>([])
  const [goal, setGoal] = useState<NutritionGoal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [period])

  async function loadData() {
    setLoading(true)
    const days = period === 'week' ? 7 : 30
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days + 1)

    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    const [logs, goalData] = await Promise.all([
      getLogsByDateRange(startStr, endStr),
      getMyGoal(),
    ])

    setGoal(goalData)

    const dailyMap: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {}

    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().split('T')[0]
      dailyMap[key] = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    }

    for (const log of logs) {
      const key = log.logged_at
      if (dailyMap[key]) {
        dailyMap[key].calories += log.calories
        dailyMap[key].protein += Number(log.protein_g)
        dailyMap[key].carbs += Number(log.carbs_g)
        dailyMap[key].fat += Number(log.fat_g)
      }
    }

    const data = Object.entries(dailyMap).map(([dateStr, vals]) => {
      const d = new Date(dateStr + 'T12:00:00')
      const label = period === 'week'
        ? dayLabelsIt[d.getDay()]
        : d.toLocaleDateString('it-IT', { day: 'numeric' })
      return { date: dateStr, label, ...vals }
    })

    setChartData(data)
    setLoading(false)
  }

  const daysLogged = chartData.filter((d) => d.calories > 0).length
  const totalDays = chartData.length

  // Streak
  let streak = 0
  for (let i = chartData.length - 1; i >= 0; i--) {
    if (chartData[i].calories > 0) streak++
    else break
  }

  // Daily averages (logged days only)
  const loggedDays = chartData.filter((d) => d.calories > 0)
  const avg = loggedDays.length > 0
    ? {
        calories: Math.round(loggedDays.reduce((s, d) => s + d.calories, 0) / loggedDays.length),
        protein: Math.round(loggedDays.reduce((s, d) => s + d.protein, 0) / loggedDays.length),
        carbs: Math.round(loggedDays.reduce((s, d) => s + d.carbs, 0) / loggedDays.length),
        fat: Math.round(loggedDays.reduce((s, d) => s + d.fat, 0) / loggedDays.length),
      }
    : { calories: 0, protein: 0, carbs: 0, fat: 0 }

  // Compliance: days within ±10% of calorie target
  const calTarget = goal?.daily_calories ?? 0
  const compliantDays = calTarget > 0
    ? loggedDays.filter((d) => {
        const ratio = d.calories / calTarget
        return ratio >= 0.9 && ratio <= 1.1
      }).length
    : 0
  const compliancePct = loggedDays.length > 0 ? Math.round((compliantDays / loggedDays.length) * 100) : 0

  const macroTotal = avg.protein + avg.carbs + avg.fat

  // Macro vs target
  const macroComparison = goal ? [
    { label: 'Proteine', avg: avg.protein, target: Number(goal.protein_g), color: 'var(--macro-protein)' },
    { label: 'Carboidrati', avg: avg.carbs, target: Number(goal.carbs_g), color: 'var(--macro-carbs)' },
    { label: 'Grassi', avg: avg.fat, target: Number(goal.fat_g), color: 'var(--macro-fat)' },
  ] : []

  return (
    <div className="content-area flex flex-col">
      <div className="flex-1 overflow-y-auto px-4">
        {/* Period selector */}
        <div className="flex gap-2 mt-4 mb-6">
          {(['week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold border-none cursor-pointer"
              style={{
                backgroundColor: period === p ? 'var(--accent)' : 'var(--card)',
                color: period === p ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              }}
            >
              {p === 'week' ? 'Settimana' : 'Mese'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="skeleton h-48 w-full" />
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-24 w-full" />
          </div>
        ) : chartData.every((d) => d.calories === 0) ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Registra i tuoi pasti per vedere i progressi
            </p>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="text-center py-3 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
                <div className="font-mono text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                  {daysLogged}/{totalDays}
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  Giorni
                </div>
              </div>
              <div className="text-center py-3 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
                <div
                  className="font-mono text-lg font-bold"
                  style={{ color: compliancePct >= 70 ? 'var(--accent)' : compliancePct < 40 ? 'var(--destructive)' : 'var(--foreground)' }}
                >
                  {compliancePct}%
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  In target
                </div>
              </div>
              <div className="text-center py-3 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
                <div className="font-mono text-lg font-bold" style={{ color: streak >= 3 ? 'var(--accent)' : 'var(--foreground)' }}>
                  {streak}
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  Striscia
                </div>
              </div>
            </div>

            {/* Calorie chart with color-coded bars */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Calorie Giornaliere
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barCategoryGap="20%">
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    interval={period === 'month' ? 4 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                  />
                  {goal && (
                    <ReferenceLine
                      y={goal.daily_calories}
                      stroke="var(--muted-foreground)"
                      strokeDasharray="4 4"
                      strokeOpacity={0.5}
                    />
                  )}
                  <Tooltip
                    cursor={{ fill: 'rgba(245,240,235,0.05)' }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--foreground)',
                    }}
                    labelFormatter={(label) => label}
                    formatter={(value) => [`${Number(value).toLocaleString()} kcal`, 'Calorie']}
                  />
                  <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={barColor(entry.calories, calTarget)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                  <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>In target</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--destructive)' }} />
                  <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Sopra</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--muted-foreground)' }} />
                  <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Sotto 20%+</span>
                </div>
              </div>
            </div>

            {/* Trend summary */}
            <div
              className="rounded-xl p-4 mb-6"
              style={{ backgroundColor: 'var(--card)' }}
            >
              <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
                {period === 'week' ? 'Questa Settimana' : 'Questo Mese'}
              </h2>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-mono text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {avg.calories.toLocaleString()}
                </span>
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  kcal/giorno (media)
                </span>
              </div>
              {calTarget > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Obiettivo: {calTarget.toLocaleString()} kcal/giorno
                  </span>
                  <span
                    className="font-mono text-xs font-semibold"
                    style={{
                      color: Math.abs(avg.calories - calTarget) / calTarget <= 0.1
                        ? 'var(--accent)'
                        : avg.calories > calTarget ? 'var(--destructive)' : 'var(--muted-foreground)',
                    }}
                  >
                    {avg.calories >= calTarget ? '+' : ''}{avg.calories - calTarget} kcal
                  </span>
                </div>
              )}
            </div>

            {/* Macro vs target */}
            {macroComparison.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  Macro — Media vs Obiettivo
                </h2>
                <div className="flex flex-col gap-3">
                  {macroComparison.map((m) => {
                    const pct = m.target > 0 ? Math.round((m.avg / m.target) * 100) : 0
                    const progress = m.target > 0 ? Math.min(m.avg / m.target, 1) : 0
                    return (
                      <div key={m.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold" style={{ color: m.color }}>{m.label}</span>
                          <span className="font-mono text-xs" style={{ color: 'var(--foreground)' }}>
                            {m.avg}g <span style={{ color: 'var(--muted-foreground)' }}>/ {m.target}g</span>
                            <span className="ml-2" style={{ color: pct >= 90 && pct <= 110 ? 'var(--accent)' : 'var(--muted-foreground)' }}>
                              {pct}%
                            </span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full w-full" style={{ backgroundColor: 'var(--border)' }}>
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress * 100}%`, backgroundColor: m.color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Stacked macro bar */}
            {macroTotal > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  Distribuzione Macro
                </h2>
                <div className="flex h-3 rounded-full overflow-hidden mb-3" style={{ backgroundColor: 'var(--border)' }}>
                  <div className="h-full" style={{ width: `${(avg.protein / macroTotal) * 100}%`, backgroundColor: 'var(--macro-protein)' }} />
                  <div className="h-full" style={{ width: `${(avg.carbs / macroTotal) * 100}%`, backgroundColor: 'var(--macro-carbs)' }} />
                  <div className="h-full" style={{ width: `${(avg.fat / macroTotal) * 100}%`, backgroundColor: 'var(--macro-fat)' }} />
                </div>
                <div className="flex gap-4">
                  {[
                    { label: 'Proteine', value: avg.protein, color: 'var(--macro-protein)' },
                    { label: 'Carbo', value: avg.carbs, color: 'var(--macro-carbs)' },
                    { label: 'Grassi', value: avg.fat, color: 'var(--macro-fat)' },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                      <span className="font-mono text-xs" style={{ color: 'var(--foreground)' }}>
                        {m.label} {m.value}g
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
