import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Messaging from '../components/Messaging'

export default function ClientApp({ session, profile }) {
  const [clientRecord, setClientRecord] = useState(null)
  const [circuits, setCircuits] = useState([])
  const [activeTab, setActiveTab] = useState('program')
  const [showCheckin, setShowCheckin] = useState(false)
  const [checkin, setCheckin] = useState({ energy: 7, sessions: '3 of 3', soreness: 'Moderate', sleep: 'Good', notes: '' })

  useEffect(() => {
    loadClientRecord()
  }, [])

  async function loadClientRecord() {
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    if (client) {
      setClientRecord(client)
      loadProgram(client.id)
    }
  }

  async function loadProgram(clientId) {
    const { data } = await supabase
      .from('circuits')
      .select('*, exercises(*)')
      .eq('client_id', clientId)
      .order('sort_order')
    setCircuits(data || [])
  }

  async function signOut() { await supabase.auth.signOut() }

  async function submitCheckin() {
    await supabase.from('messages').insert({
      client_id: clientRecord.id,
      sender_id: session.user.id,
      is_checkin: true,
      content: JSON.stringify(checkin)
    })
    setShowCheckin(false)
    alert('Check-in submitted!')
  }

  const s = {
    app: { minHeight: '100vh', background: 'var(--bg2)' },
    header: {
      background: 'var(--bg)', borderBottom: '0.5px solid var(--border)',
      padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10
    },
    brand: { fontSize: 16, fontWeight: 600, color: 'var(--text)' },
    signout: { marginLeft: 'auto', padding: '5px 11px', fontSize: 12, border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--text3)' },
    tabs: { display: 'flex', background: 'var(--bg)', borderBottom: '0.5px solid var(--border)', padding: '0 20px' },
    tab: (active) => ({
      padding: '10px 14px', fontSize: 13, color: active ? 'var(--text)' : 'var(--text2)',
      fontWeight: active ? 500 : 400, borderBottom: active ? '2px solid var(--text)' : '2px solid transparent',
      cursor: 'pointer', marginBottom: -0.5
    }),
    content: { padding: 20, maxWidth: 700, margin: '0 auto' },
    circuitCard: { background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: 12, overflow: 'hidden' },
    cHead: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)' },
    cTitle: { fontSize: 13, fontWeight: 500, flex: 1 },
    typeBadge: (type) => ({
      fontSize: 10, padding: '2px 8px', borderRadius: 999,
      background: type==='amrap' ? 'var(--yellow-light)' : type==='emom' ? 'var(--blue-light)' : 'var(--green-light)',
      color: type==='amrap' ? 'var(--yellow-text)' : type==='emom' ? 'var(--blue-text)' : 'var(--green-text)'
    }),
    exRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderBottom: '0.5px solid var(--border)', fontSize: 13 },
    exName: { flex: 1, color: 'var(--text)' },
    exSets: { fontSize: 11, color: 'var(--text2)' },
    checkinBtn: {
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
      background: 'var(--green)', color: '#E1F5EE', border: 'none',
      borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 500, marginBottom: 16
    },
    modal: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    },
    modalBox: {
      background: 'var(--bg)', borderRadius: 'var(--radius-lg)', padding: 24,
      width: 400, maxWidth: '90vw'
    }
  }

  if (!clientRecord) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 13, color: 'var(--text3)' }}>
      Setting up your account... If this persists, contact your trainer.
    </div>
  )

  return (
    <div style={s.app}>
      <div style={s.header}>
        <span style={{ fontSize: 20 }}>🏋️</span>
        <span style={s.brand}>CoachDesk</span>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Hi, {clientRecord.name.split(' ')[0]}!</span>
        <button style={s.signout} onClick={signOut}>Sign out</button>
      </div>
      <div style={s.tabs}>
        <div style={s.tab(activeTab==='program')} onClick={() => setActiveTab('program')}>My Program</div>
        <div style={s.tab(activeTab==='messages')} onClick={() => setActiveTab('messages')}>Messages</div>
      </div>
      <div style={s.content}>
        {activeTab === 'program' && <>
          <button style={s.checkinBtn} onClick={() => setShowCheckin(true)}>
            <i className="ti ti-clipboard-list" /> Submit weekly check-in
          </button>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 10 }}>
            Week {clientRecord.current_week || 1} — {clientRecord.goal}
          </div>
          {circuits.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text3)', padding: '20px 0' }}>
              Your trainer hasn't added your program yet — check back soon!
            </div>
          )}
          {circuits.map(c => (
            <div key={c.id} style={s.circuitCard}>
              <div style={s.cHead}>
                <span style={s.cTitle}>{c.name}</span>
                <span style={s.typeBadge(c.type)}>{c.type.toUpperCase()}</span>
                {c.type === 'circuit' && <span style={{ fontSize: 11, color: 'var(--text2)' }}>{c.sets} sets</span>}
                {c.type === 'amrap' && <span style={{ fontSize: 11, color: 'var(--text2)' }}>{c.amrap_duration}</span>}
                {c.type === 'emom' && <span style={{ fontSize: 11, color: 'var(--text2)' }}>{c.emom_duration}</span>}
              </div>
              {(c.exercises || []).sort((a,b) => a.sort_order - b.sort_order).map(ex => (
                <div key={ex.id} style={s.exRow}>
                  <span style={s.exName}>{ex.name}</span>
                  <span style={s.exSets}>{ex.sets} × {ex.reps}</span>
                </div>
              ))}
              <div style={{ padding: '6px 14px', fontSize: 11, color: 'var(--text3)', background: 'var(--bg2)' }}>
                Rest after: {c.rest_after}
              </div>
            </div>
          ))}
        </>}
        {activeTab === 'messages' && clientRecord && (
          <Messaging client={clientRecord} userId={session.user.id} isTrainer={false} />
        )}
      </div>

      {showCheckin && (
        <div style={s.modal} onClick={e => e.target === e.currentTarget && setShowCheckin(false)}>
          <div style={s.modalBox}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Weekly check-in</div>
            {[
              ['Energy level', 'energy', [1,2,3,4,5,6,7,8,9,10]],
              ['Sessions completed', 'sessions', ['0 of 3','1 of 3','2 of 3','3 of 3']],
              ['Soreness', 'soreness', ['None','Mild','Moderate','High']],
              ['Sleep quality', 'sleep', ['Poor','Fair','Good','Great']],
            ].map(([label, key, opts]) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>{label}</div>
                <select value={checkin[key]} onChange={e => setCheckin({...checkin, [key]: e.target.value})}
                  style={{ width: '100%', padding: '6px 8px', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12 }}>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>Notes</div>
              <textarea value={checkin.notes} onChange={e => setCheckin({...checkin, notes: e.target.value})}
                placeholder="Wins, pain points, questions..."
                style={{ width: '100%', padding: '6px 8px', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12, resize: 'none', height: 70 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={submitCheckin} style={{ padding: '7px 14px', background: 'var(--green)', color: '#E1F5EE', border: 'none', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 500 }}>Submit</button>
              <button onClick={() => setShowCheckin(false)} style={{ padding: '7px 14px', background: 'none', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
