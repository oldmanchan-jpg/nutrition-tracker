import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendDown, Equals, TrendUp } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { saveNutritionProfile, setNutritionGoals } from '@/services/nutritionService'

type Gender = 'male' | 'female'
type GoalType = 'lose' | 'maintain' | 'gain'
type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'active' | 'very_active'

interface FormData {
  gender: Gender | null
  age: number | null
  height_cm: number | null
  weight_kg: number | null
  goal_type: GoalType | null
  goal_weight_kg: number | null
  activity_level: ActivityLevel | null
  dietary_restrictions: string[]
  meals_per_day: number
}

interface MacroResult {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

const activityOptions: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: 'Sedentario', desc: 'Lavoro d\'ufficio, poco movimento' },
  { value: 'lightly_active', label: 'Leggermente attivo', desc: 'Esercizio leggero 1-3 giorni/settimana' },
  { value: 'moderately_active', label: 'Moderatamente attivo', desc: 'Esercizio moderato 3-5 giorni/settimana' },
  { value: 'active', label: 'Attivo', desc: 'Esercizio intenso 6-7 giorni/settimana' },
  { value: 'very_active', label: 'Molto attivo', desc: 'Atleta o lavoro fisico pesante' },
]

const dietaryOptions = [
  'Nessuna',
  'Vegetariano',
  'Vegano',
  'Senza glutine',
  'Senza lattosio',
  'Senza maiale',
]

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  active: 1.725,
  very_active: 1.9,
}

function calculateMacros(form: FormData): MacroResult {
  const weight = form.weight_kg!
  const height = form.height_cm!
  const age = form.age!
  const gender = form.gender!
  const activity = form.activity_level!
  const goalType = form.goal_type!

  // Mifflin-St Jeor
  const bmr = gender === 'male'
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161

  const tdee = bmr * activityMultipliers[activity]

  // Goal adjustment
  let calories: number
  if (goalType === 'lose') calories = tdee - 400
  else if (goalType === 'gain') calories = tdee + 300
  else calories = tdee

  calories = Math.round(calories)

  // Macro split
  const protein_g = Math.round(2.0 * weight)
  const fat_g = Math.round((calories * 0.25) / 9)
  const carbs_g = Math.round((calories - (protein_g * 4) - (fat_g * 9)) / 4)

  return { calories, protein_g, carbs_g, fat_g }
}

export default function NutritionOnboarding() {
  const [step, setStep] = useState(0) // 0-3 for steps, 4 for results
  const [form, setForm] = useState<FormData>({
    gender: null,
    age: null,
    height_cm: null,
    weight_kg: null,
    goal_type: null,
    goal_weight_kg: null,
    activity_level: null,
    dietary_restrictions: [],
    meals_per_day: 3,
  })
  const [result, setResult] = useState<MacroResult | null>(null)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  // Pre-fill from existing profile data
  useEffect(() => {
    async function prefill() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('age, height_cm, weight_kg, gender')
        .eq('id', user.id)
        .single()
      if (data) {
        setForm((prev) => ({
          ...prev,
          age: data.age ?? prev.age,
          height_cm: data.height_cm ? Number(data.height_cm) : prev.height_cm,
          weight_kg: data.weight_kg ? Number(data.weight_kg) : prev.weight_kg,
          gender: data.gender ?? prev.gender,
        }))
      }
    }
    prefill()
  }, [])

  async function handleComplete() {
    if (!form.gender || !form.age || !form.height_cm || !form.weight_kg || !form.goal_type || !form.activity_level) return

    setSaving(true)

    const goalWeight = form.goal_type === 'maintain' ? form.weight_kg : form.goal_weight_kg
    const macros = calculateMacros(form)
    setResult(macros)

    const restrictions = form.dietary_restrictions.filter((r) => r !== 'Nessuna')

    const profileOk = await saveNutritionProfile({
      gender: form.gender,
      age: form.age,
      height_cm: form.height_cm,
      weight_kg: form.weight_kg,
      goal_weight_kg: goalWeight!,
      activity_level: form.activity_level,
      goal_type: form.goal_type,
      dietary_restrictions: restrictions,
      meals_per_day: form.meals_per_day,
    })

    if (profileOk) {
      await setNutritionGoals({
        daily_calories: macros.calories,
        protein_g: macros.protein_g,
        carbs_g: macros.carbs_g,
        fat_g: macros.fat_g,
      })
    }

    setSaving(false)
    setStep(4) // Show results
  }

  function handleNext() {
    if (step === 3) {
      handleComplete()
    } else {
      setStep(step + 1)
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return !!(form.gender && form.age && form.height_cm && form.weight_kg)
      case 1: return !!(form.goal_type && (form.goal_type === 'maintain' || form.goal_weight_kg))
      case 2: return !!form.activity_level
      case 3: return true
      default: return false
    }
  }

  function toggleDietaryRestriction(r: string) {
    if (r === 'Nessuna') {
      setForm({ ...form, dietary_restrictions: form.dietary_restrictions.includes('Nessuna') ? [] : ['Nessuna'] })
    } else {
      const without = form.dietary_restrictions.filter((x) => x !== 'Nessuna')
      if (without.includes(r)) {
        setForm({ ...form, dietary_restrictions: without.filter((x) => x !== r) })
      } else {
        setForm({ ...form, dietary_restrictions: [...without, r] })
      }
    }
  }

  // Results screen
  if (step === 4 && result) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--background)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm flex flex-col items-center gap-6"
        >
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
            Il tuo piano
          </h1>

          <div className="text-center">
            <span className="font-mono text-5xl font-bold" style={{ color: 'var(--accent)' }}>
              {result.calories.toLocaleString()}
            </span>
            <span className="text-lg ml-1" style={{ color: 'var(--muted-foreground)' }}>kcal</span>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full">
            {[
              { label: 'Proteine', value: result.protein_g },
              { label: 'Carboidrati', value: result.carbs_g },
              { label: 'Grassi', value: result.fat_g },
            ].map((m) => (
              <div
                key={m.label}
                className="text-center py-3 rounded-lg"
                style={{ backgroundColor: 'var(--card)' }}
              >
                <div className="font-mono text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {m.value}g
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Calcolato con la formula Mifflin-St Jeor
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Il tuo coach può modificare questi obiettivi
            </p>
          </div>

          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full h-[52px] rounded-[14px] text-base font-semibold border-none cursor-pointer"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--primary-foreground)' }}
          >
            Iniziamo!
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-dvh flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      {/* Progress bar */}
      <div className="flex gap-1.5 px-6 pt-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full"
            style={{ backgroundColor: i <= step ? 'var(--accent)' : 'var(--card)' }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Chi sei</h1>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Iniziamo con le basi</p>
                </div>

                {/* Gender */}
                <div>
                  <label className="text-xs uppercase tracking-wider block mb-2" style={{ color: 'var(--muted-foreground)' }}>Sesso</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([['male', 'Uomo'], ['female', 'Donna']] as const).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setForm({ ...form, gender: val })}
                        className="py-4 rounded-lg text-sm font-semibold border-2 bg-transparent cursor-pointer"
                        style={{
                          backgroundColor: 'var(--card)',
                          color: form.gender === val ? 'var(--accent)' : 'var(--foreground)',
                          borderColor: form.gender === val ? 'var(--accent)' : 'transparent',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age */}
                <div>
                  <label className="text-xs uppercase tracking-wider block mb-2" style={{ color: 'var(--muted-foreground)' }}>Età</label>
                  <input
                    type="number"
                    value={form.age ?? ''}
                    onChange={(e) => setForm({ ...form, age: e.target.value ? Number(e.target.value) : null })}
                    placeholder="25"
                    className="w-full h-12 px-4 rounded-lg border-none outline-none text-base font-mono"
                    style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="text-xs uppercase tracking-wider block mb-2" style={{ color: 'var(--muted-foreground)' }}>Altezza (cm)</label>
                  <input
                    type="number"
                    value={form.height_cm ?? ''}
                    onChange={(e) => setForm({ ...form, height_cm: e.target.value ? Number(e.target.value) : null })}
                    placeholder="175"
                    className="w-full h-12 px-4 rounded-lg border-none outline-none text-base font-mono"
                    style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="text-xs uppercase tracking-wider block mb-2" style={{ color: 'var(--muted-foreground)' }}>Peso attuale (kg)</label>
                  <input
                    type="number"
                    value={form.weight_kg ?? ''}
                    onChange={(e) => setForm({ ...form, weight_kg: e.target.value ? Number(e.target.value) : null })}
                    placeholder="75"
                    className="w-full h-12 px-4 rounded-lg border-none outline-none text-base font-mono"
                    style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Il tuo obiettivo</h1>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Cosa vuoi raggiungere?</p>
                </div>

                <div className="flex flex-col gap-3">
                  {([
                    { value: 'lose' as GoalType, label: 'Perdere peso', Icon: TrendDown },
                    { value: 'maintain' as GoalType, label: 'Mantenere il peso', Icon: Equals },
                    { value: 'gain' as GoalType, label: 'Aumentare massa', Icon: TrendUp },
                  ]).map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      onClick={() => {
                        const gw = value === 'maintain' ? form.weight_kg : form.goal_weight_kg
                        setForm({ ...form, goal_type: value, goal_weight_kg: gw })
                      }}
                      className="flex items-center gap-3 p-4 rounded-lg border-2 bg-transparent cursor-pointer text-left"
                      style={{
                        backgroundColor: 'var(--card)',
                        color: form.goal_type === value ? 'var(--accent)' : 'var(--foreground)',
                        borderColor: form.goal_type === value ? 'var(--accent)' : 'transparent',
                      }}
                    >
                      <Icon size={24} weight="bold" />
                      <span className="text-sm font-semibold">{label}</span>
                    </button>
                  ))}
                </div>

                {form.goal_type && form.goal_type !== 'maintain' && (
                  <div>
                    <label className="text-xs uppercase tracking-wider block mb-2" style={{ color: 'var(--muted-foreground)' }}>
                      Peso obiettivo (kg)
                    </label>
                    <input
                      type="number"
                      value={form.goal_weight_kg ?? ''}
                      onChange={(e) => setForm({ ...form, goal_weight_kg: e.target.value ? Number(e.target.value) : null })}
                      placeholder="70"
                      className="w-full h-12 px-4 rounded-lg border-none outline-none text-base font-mono"
                      style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                    />
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Stile di vita</h1>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Quanto sei attivo?</p>
                </div>

                <div className="flex flex-col gap-2">
                  {activityOptions.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setForm({ ...form, activity_level: value })}
                      className="p-4 rounded-lg border-2 bg-transparent cursor-pointer text-left"
                      style={{
                        backgroundColor: 'var(--card)',
                        borderColor: form.activity_level === value ? 'var(--accent)' : 'transparent',
                      }}
                    >
                      <span className="text-sm font-semibold block" style={{ color: form.activity_level === value ? 'var(--accent)' : 'var(--foreground)' }}>
                        {label}
                      </span>
                      <span className="text-xs block mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        {desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Preferenze alimentari</h1>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Hai restrizioni o preferenze?</p>
                </div>

                {/* Dietary restrictions */}
                <div>
                  <label className="text-xs uppercase tracking-wider block mb-2" style={{ color: 'var(--muted-foreground)' }}>Restrizioni</label>
                  <div className="flex flex-wrap gap-2">
                    {dietaryOptions.map((r) => {
                      const selected = form.dietary_restrictions.includes(r)
                      return (
                        <button
                          key={r}
                          onClick={() => toggleDietaryRestriction(r)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 bg-transparent cursor-pointer"
                          style={{
                            backgroundColor: selected ? 'var(--accent)' : 'var(--card)',
                            color: selected ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                            borderColor: selected ? 'var(--accent)' : 'transparent',
                          }}
                        >
                          {r}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Meals per day */}
                <div>
                  <label className="text-xs uppercase tracking-wider block mb-2" style={{ color: 'var(--muted-foreground)' }}>Pasti al giorno</label>
                  <div className="flex gap-2">
                    {[3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        onClick={() => setForm({ ...form, meals_per_day: n })}
                        className="flex-1 py-3 rounded-lg text-base font-mono font-semibold border-2 bg-transparent cursor-pointer"
                        style={{
                          backgroundColor: form.meals_per_day === n ? 'var(--accent)' : 'var(--card)',
                          color: form.meals_per_day === n ? 'var(--primary-foreground)' : 'var(--foreground)',
                          borderColor: form.meals_per_day === n ? 'var(--accent)' : 'transparent',
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-6 flex flex-col gap-2" style={{ backgroundColor: 'var(--background)' }}>
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="bg-transparent border-none text-sm cursor-pointer py-2"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Indietro
          </button>
        )}
        <Button
          onClick={handleNext}
          disabled={!canProceed() || saving}
          className="w-full h-[52px] rounded-[14px] text-base font-semibold border-none cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--primary-foreground)' }}
        >
          {saving ? 'Calcolo...' : step === 3 ? 'Calcola i tuoi macro' : 'Avanti'}
        </Button>
      </div>
    </div>
  )
}
