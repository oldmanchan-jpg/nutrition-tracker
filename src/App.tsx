import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { useProfile } from '@/hooks/useProfile'

import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import LogMeal from '@/pages/LogMeal'
import Recipes from '@/pages/Recipes'
import Progress from '@/pages/Progress'
import Admin from '@/pages/Admin'
import Settings from '@/pages/Settings'
import NutritionOnboarding from '@/pages/NutritionOnboarding'

function ProtectedRoute() {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setSessionLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (sessionLoading) {
    return (
      <div className="h-dvh flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <span style={{ color: 'var(--muted-foreground)' }}>Loading...</span>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}

function OnboardingGuard() {
  const { profile, loading } = useProfile()
  const location = useLocation()

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <span style={{ color: 'var(--muted-foreground)' }}>Loading...</span>
      </div>
    )
  }

  // Admin skips nutrition onboarding
  if (profile && profile.role !== 'admin' && !profile.nutrition_onboarding_complete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

function AdminRoute() {
  const { profile, loading } = useProfile()

  if (loading) {
    return (
      <div className="content-area flex items-center justify-center">
        <span style={{ color: 'var(--muted-foreground)' }}>Loading...</span>
      </div>
    )
  }

  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />

  return <Outlet />
}

function AppLayout({ title }: { title?: string }) {
  return (
    <>
      <TopBar title={title} />
      <Outlet />
      <BottomNav />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<OnboardingGuard />}>
            <Route path="/onboarding" element={<NutritionOnboarding />} />

            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            <Route element={<AppLayout title="Aggiungi Pasto" />}>
              <Route path="/log" element={<LogMeal />} />
            </Route>
            <Route element={<AppLayout title="Ricette" />}>
              <Route path="/recipes" element={<Recipes />} />
            </Route>
            <Route element={<AppLayout title="Progressi" />}>
              <Route path="/progress" element={<Progress />} />
            </Route>
            <Route element={<AppLayout title="Impostazioni" />}>
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route element={<AppLayout title="Admin" />}>
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
