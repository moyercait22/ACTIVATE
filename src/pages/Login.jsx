import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        name: name || email,
        role: 'client'
      })
    }
    setMessage('Account created! You can now sign in.')
    setMode('login')
    setLoading(false)
  }

  const inp = {
    width: '100%', padding: '11px 14px',
    border: '0.5px solid #DDD5C8', borderRadius: 8,
    fontFamily: "'Jost', sans-serif", fontWeight: 300,
    fontSize: 14, color: '#2C2420', background: '#FFFFFF',
    outline: 'none', marginBottom: 10
  }
  const btn = {
    width: '100%', padding: '12px',
    background: '#C4845A', color: '#FFFFFF', border: 'none',
    borderRadius: 8, fontFamily: "'Jost', sans-serif",
    fontWeight: 500, fontSize: 14, cursor: 'pointer',
    marginTop: 4
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5EDE3' }}>
      <div style={{ background: '#FFFFFF', border: '0.5px solid #DDD5C8', borderRadius: 12, padding: '48px 40px', width: 380, textAlign: 'center', boxShadow: '0 2px 16px rgba(80,50,30,0.08)' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 400, letterSpacing: '0.06em', color: '#2C2420', lineHeight: 1 }}>ACTIVATE</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 18, color: '#2C2420', marginTop: 4, marginBottom: 14 }}>With Cait</div>
        <div style={{ width: 40, height: 1.5, background: '#C4845A', margin: '0 auto 28px' }} />

        {message && <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 300, color: '#5C7A5C', background: '#E8EDE0', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>{message}</div>}
        {error && <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 300, color: '#8B3A2A', background: '#F9EAE6', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>{error}</div>}

        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} style={{ textAlign: 'left' }}>
          {mode === 'signup' && (
            <div>
              <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 300, color: '#8B6B4A', marginBottom: 4 }}>Your name</div>
              <input style={inp} type="text" placeholder="Caitlyn Moyer" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 300, color: '#8B6B4A', marginBottom: 4 }}>Email</div>
            <input style={inp} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 300, color: '#8B6B4A', marginBottom: 4 }}>Password</div>
            <input style={inp} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" style={btn} disabled={loading}>
            {loading ? 'Just a moment...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={{ marginTop: 20, fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: '#8B6B4A' }}>
          {mode === 'login' ? (
            <>New here? <span style={{ color: '#C4845A', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setMode('signup'); setError(''); setMessage('') }}>Create an account</span></>
          ) : (
            <>Already have one? <span style={{ color: '#C4845A', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setMode('login'); setError(''); setMessage('') }}>Sign in</span></>
          )}
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 13, color: '#C4845A', marginTop: 20 }}>Prime. Activate. Propel.</div>
      </div>
    </div>
  )
}
