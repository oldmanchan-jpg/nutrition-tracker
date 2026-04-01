import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from 'recharts'
import { getLogsByDateRange, getMyGoal } from '@/services/nutritionService'
import type { NutritionGoal } from '@/types'

type Period = 'week' | 'month'

const dayLabelsIt = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

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
  const adherencePct = totalDays > 0 ? Math.round((daysLogged / totalDays) * 100) : 0

  // Current streak
  let streak = 0
  for (let i = chartData.length - 1; i >= 0; i--) {
    if (chartData[i].calories > 0) streak++
    else break
  }

  // Daily averages (over logged days only)
  const loggedDays = chartData.filter((d) => d.calories > 0)
  const avg = loggedDays.length > 0
    ? {
        calories: Math.round(loggedDays.reduce((s, d) => s + d.calories, 0) / loggedDays.length),
        protein: Math.round(loggedDays.reduce((s, d) => s + d.protein, 0) / loggedDays.length),
        carbs: Math.round(loggedDays.reduce((s, d) => s + d.carbs, 0) / loggedDays.length),
        fat: Math.round(loggedDays.reduce((s, d) => s + d.fat, 0) / loggedDays.length),
      }
    : { calories: 0, protein: 0, carbs: 0, fat: 0 }

  const macroTotal = avg.protein + avg.carbs + avg.fat

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
            {/* Adherence stats */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="text-center py-3 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
                <div className="font-mono text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                  {daysLogged}/{totalDays}
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  Giorni registrati
                </div>
              </div>
              <div className="text-center py-3 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
                <div
                  className="font-mono text-lg font-bold"
                  style={{ color: adherencePct >= 80 ? 'var(--accent)' : adherencePct < 50 ? 'var(--destructive)' : 'var(--foreground)' }}
                >
                  {adherencePct}%
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  Aderenza
                </div>
              </div>
              <div className="text-center py-3 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
                <div className="font-mono text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                  {streak}
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  Striscia attuale
                </div>
              </div>
            </div>

            {/* Calorie trend bar chart */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Calorie
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
                  <Bar
                    dataKey="calories"
                    fill="var(--accent)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Macro breakdown */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Macro — Media Giornaliera
              </h2>

              {/* Stacked macro bar */}
              {macroTotal > 0 && (
                <div className="flex h-3 rounded-full overflow-hidden mb-3" style={{ backgroundColor: 'var(--border)' }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${(avg.protein / macroTotal) * 100}%`,
                      backgroundColor: 'var(--macro-protein)',
                    }}
                  />
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${(avg.carbs / macroTotal) * 100}%`,
                      backgroundColor: 'var(--macro-carbs)',
                    }}
                  />
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${(avg.fat / macroTotal) * 100}%`,
                      backgroundColor: 'var(--macro-fat)',
                    }}
                  />
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--macro-protein)' }} />
                  <span className="font-mono text-xs" style={{ color: 'var(--foreground)' }}>
                    P {avg.protein}g
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--macro-carbs)' }} />
                  <span className="font-mono text-xs" style={{ color: 'var(--foreground)' }}>
                    C {avg.carbs}g
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--macro-fat)' }} />
                  <span className="font-mono text-xs" style={{ color: 'var(--foreground)' }}>
                    F {avg.fat}g
                  </span>
                </div>
              </div>
            </div>

            {/* Daily averages */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Medie Giornaliere
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Cal', value: avg.calories, unit: '', color: 'var(--accent)' },
                  { label: 'Proteine', value: avg.protein, unit: 'g', color: 'var(--macro-protein)' },
                  { label: 'Carbo', value: avg.carbs, unit: 'g', color: 'var(--macro-carbs)' },
                  { label: 'Grassi', value: avg.fat, unit: 'g', color: 'var(--macro-fat)' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center py-3 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
                    <div className="font-mono text-lg font-bold" style={{ color: stat.color }}>
                      {stat.value}{stat.unit}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
