import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import TrainerApp from './pages/TrainerApp'
import ClientApp from './pages/ClientApp'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadOrCreateProfile(session.user)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadOrCreateProfile(session.user)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadOrCreateProfile(user) {
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          role: 'client'
        })
        .select()
        .single()
      profile = newProfile
    }

    if (user.email === 'moyercait22@gmail.com' && profile?.role !== 'trainer') {
      await supabase.from('profiles').update({ role: 'trainer' }).eq('id', user.id)
      profile = { ...profile, role: 'trainer' }
    }

    setProfile(profile)
    setLoading(false)
  }

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontFamily: "'Jost', sans-serif",
      fontWeight: 300, fontSize: 14, color: '#D4B896',
      background: '#F5EDE3'
    }}>
      Loading...
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/*" element={
          !session ? <Navigate to="/login" /> :
          profile?.role === 'trainer' ? <TrainerApp session={session} profile={profile} /> :
          <ClientApp session={session} profile={profile} />
        } />
      </Routes>
    </BrowserRouter>
  )
}
