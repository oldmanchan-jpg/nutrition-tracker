import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { getLogsByDateRange, getMyGoal } from '@/services/nutritionService'
import type { NutritionGoal } from '@/types'

type Period = 'week' | 'month'

export default function Progress() {
  const [period, setPeriod] = useState<Period>('week')
  const [chartData, setChartData] = useState<{ date: string; calories: number; protein: number; carbs: number; fat: number }[]>([])
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

    // Build daily totals
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

    const data = Object.entries(dailyMap).map(([date, vals]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...vals,
    }))

    setChartData(data)
    setLoading(false)
  }

  const daysLogged = chartData.filter((d) => d.calories > 0).length
  const totalDays = chartData.length

  const avg = chartData.length > 0
    ? {
        calories: Math.round(chartData.reduce((s, d) => s + d.calories, 0) / totalDays),
        protein: Math.round(chartData.reduce((s, d) => s + d.protein, 0) / totalDays),
        carbs: Math.round(chartData.reduce((s, d) => s + d.carbs, 0) / totalDays),
        fat: Math.round(chartData.reduce((s, d) => s + d.fat, 0) / totalDays),
      }
    : { calories: 0, protein: 0, carbs: 0, fat: 0 }

  return (
    <div className="content-area flex flex-col">
      <div className="flex-1 overflow-y-auto px-4">
        {/* Period selector */}
        <div className="flex gap-2 mt-4 mb-6">
          {(['week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold capitalize border-none cursor-pointer"
              style={{
                backgroundColor: period === p ? 'var(--accent)' : 'var(--card)',
                color: period === p ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span style={{ color: 'var(--muted-foreground)' }}>Loading...</span>
          </div>
        ) : (
          <>
            {/* Calorie chart */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Calories
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    interval={period === 'month' ? 6 : 0}
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
                  <Area
                    type="monotone"
                    dataKey="calories"
                    stroke="var(--accent)"
                    fill="url(#calGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Average stats */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Daily Averages
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Cal', value: avg.calories, unit: '' },
                  { label: 'Protein', value: avg.protein, unit: 'g' },
                  { label: 'Carbs', value: avg.carbs, unit: 'g' },
                  { label: 'Fat', value: avg.fat, unit: 'g' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center py-3 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
                    <div className="font-mono text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                      {stat.value}{stat.unit}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Adherence */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Adherence
              </h2>
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                <span className="font-mono text-lg font-bold" style={{ color: 'var(--accent)' }}>
                  {daysLogged}
                </span>
                {' '}out of {totalDays} days logged
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
