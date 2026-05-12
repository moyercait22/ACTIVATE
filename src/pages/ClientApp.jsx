import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Messaging from '../components/Messaging'

const LOGO = () => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, letterSpacing: '0.06em', color: '#2C2420' }}>ACTIVATE</div>
    <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 12, color: '#C4845A' }}>With Cait</div>
  </div>
)

export default function ClientApp({ session, profile }) {
  const [clientRecord, setClientRecord] = useState(null)
  const [circuits, setCircuits] = useState([])
  const [activeTab, setActiveTab] = useState('program')
  const [showCheckin, setShowCheckin] = useState(false)
  const [checkin, setCheckin] = useState({ energy: 7, sessions: '3 of 3', soreness: 'Moderate', sleep: 'Good', notes: '' })

  useEffect(() => { loadClientRecord() }, [])

  async function loadClientRecord() {
    const { data: client } = await supabase.from('clients').select('*').eq('user_id', session.user.id).single()
    if (client) { setClientRecord(client); loadProgram(client.id) }
  }

  async function loadProgram(clientId) {
    const { data } = await supabase.from('circuits').select('*, exercises(*)').eq('client_id', clientId).order('sort_order')
    setCircuits(data || [])
  }

  async function signOut() { await supabase.auth.signOut() }

  async function submitCheckin() {
    await supabase.from('messages').insert({ client_id: clientRecord.id, sender_id: session.user.id, is_checkin: true, content: JSON.stringify(checkin) })
    setShowCheckin(false)
  }

  const F = (style) => ({ fontFamily: "'Jost', sans-serif", ...style })

  const s = {
    app: { minHeight: '100vh', background: '#F5EDE3' },
    header: { background: '#F5EDE3', borderBottom: '0.5px solid #DDD5C8', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 },
    signout: { marginLeft: 'auto', padding: '5px 11px', ...F({ fontSize: 12, fontWeight: 300 }), border: '0.5px solid #DDD5C8', borderRadius: 8, background: '#FFFFFF', color: '#D4B896', cursor: 'pointer' },
    tabs: { display: 'flex', background: '#FFFFFF', borderBottom: '0.5px solid #DDD5C8', padding: '0 20px' },
    tab: (active) => ({ padding: '10px 14px', ...F({ fontSize: 13, fontWeight: active ? 500 : 300 }), color: active ? '#2C2420' : '#8B6B4A', borderBottom: active ? '2px solid #C4845A' : '2px solid transparent', cursor: 'pointer', marginBottom: -0.5 }),
    content: { padding: 20, maxWidth: 680, margin: '0 auto' },
    checkinBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#C4845A', color: '#FFFFFF', border: 'none', borderRadius: 8, ...F({ fontSize: 13, fontWeight: 500 }), marginBottom: 16, cursor: 'pointer' },
    weekLabel: { ...F({ fontSize: 13, fontWeight: 300 }), color: '#8B6B4A', marginBottom: 12 },
    circuitCard: { background: '#FFFFFF', border: '0.5px solid #DDD5C8', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
    cHead: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F5EDE3', borderBottom: '0.5px solid #DDD5C8' },
    cTitle: { ...F({ fontSize: 13, fontWeight: 500 }), flex: 1, color: '#2C2420' },
    typeBadge: (type) => ({ ...F({ fontSize: 10, fontWeight: 500 }), padding: '2px 8px', borderRadius: 999, background: type === 'amrap' ? '#E9C2A2' : type === 'emom' ? '#5C7A5C' : '#E9C2A2', color: type === 'emom' ? '#FFFFFF' : '#2C2420' }),
    exRow: { display: 'flex', alignItems: 'center', padding: '7px 14px', borderBottom: '0.5px solid #DDD5C8', ...F({ fontSize: 13, fontWeight: 300 }) },
    exName: { flex: 1, color: '#2C2420' },
    exSets: { ...F({ fontSize: 11 }), color: '#8B6B4A' },
    foot: { padding: '6px 14px', ...F({ fontSize: 11, fontWeight: 300 }), color: '#D4B896', background: '#F5EDE3' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(44,36,32,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modalBox: { background: '#FFFFFF', borderRadius: 12, padding: 28, width: 400, maxWidth: '90vw' },
    inp: { width: '100%', padding: '6px 9px', border: '0.5px solid #DDD5C8', borderRadius: 8, ...F({ fontSize: 12, fontWeight: 300 }), color: '#2C2420', background: '#FFFFFF', outline: 'none', marginBottom: 10 },
    selectEl: { width: '100%', padding: '6px 9px', border: '0.5px solid #DDD5C8', borderRadius: 8, ...F({ fontSize: 12 }), color: '#2C2420', background: '#FFFFFF', outline: 'none' },
    submitBtn: { padding: '7px 16px', background: '#C4845A', color: '#FFFFFF', border: 'none', borderRadius: 8, ...F({ fontSize: 13, fontWeight: 500 }), cursor: 'pointer' },
    cancelBtn: { padding: '7px 16px', background: 'none', border: '0.5px solid #DDD5C8', borderRadius: 8, ...F({ fontSize: 13, fontWeight: 300 }), color: '#8B6B4A', cursor: 'pointer', marginLeft: 8 },
    tagline: { ...F({ fontSize: 12, fontWeight: 300 }), fontStyle: 'italic', color: '#C4845A', textAlign: 'center', paddingTop: 20 }
  }

  if (!clientRecord) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', ...F({ fontSize: 13, fontWeight: 300 }), color: '#D4B896' }}>
      Getting things ready for you — hang tight!
    </div>
  )

  return (
    <div style={s.app}>
      <div style={s.header}>
        <LOGO />
        <span style={{ ...F({ fontSize: 13, fontWeight: 300 }), color: '#8B6B4A', marginLeft: 6 }}>Hi, {clientRecord.name.split(' ')[0]}!</span>
        <button style={s.signout} onClick={signOut}>Sign out</button>
      </div>
      <div style={s.tabs}>
        <div style={s.tab(activeTab === 'program')} onClick={() => setActiveTab('program')}>My Program</div>
        <div style={s.tab(activeTab === 'messages')} onClick={() => setActiveTab('messages')}>Messages</div>
      </div>
      <div style={s.content}>
        {activeTab === 'program' && <>
          <button style={s.checkinBtn} onClick={() => setShowCheckin(true)}>
            <i className="ti ti-clipboard-list" /> How are you feeling this week?
          </button>
          <div style={s.weekLabel}>Week {clientRecord.current_week || 1} — {clientRecord.goal} · Intentional movement.</div>
          {circuits.length === 0 && (
            <div style={{ ...F({ fontSize: 13, fontWeight: 300 }), color: '#D4B896', padding: '20px 0' }}>
              Your program is on its way — Cait is building something great for you. Check back soon!
            </div>
          )}
          {circuits.map(c => (
            <div key={c.id} style={s.circuitCard}>
              <div style={s.cHead}>
                <span style={s.cTitle}>{c.name}</span>
                <span style={s.typeBadge(c.type)}>{c.type.toUpperCase()}</span>
                <span style={{ ...F({ fontSize: 11, fontWeight: 300 }), color: '#8B6B4A' }}>
                  {c.type === 'circuit' ? `${c.sets} sets` : c.type === 'amrap' ? c.amrap_duration : c.emom_duration}
                </span>
              </div>
              {(c.exercises || []).sort((a, b) => a.sort_order - b.sort_order).map(ex => (
                <div key={ex.id} style={{ ...s.exRow, borderBottom: '0.5px solid #DDD5C8' }}>
                  <span style={s.exName}>{ex.name}</span>
                  <span style={s.exSets}>{ex.sets} × {ex.reps}</span>
                </div>
              ))}
              <div style={s.foot}>Rest after: {c.rest_after}</div>
            </div>
          ))}
          <div style={s.tagline}>Prime. Activate. Propel.</div>
        </>}
        {activeTab === 'messages' && clientRecord && (
          <Messaging client={clientRecord} userId={session.user.id} isTrainer={false} />
        )}
      </div>

      {showCheckin && (
        <div style={s.modal} onClick={e => e.target === e.currentTarget && setShowCheckin(false)}>
          <div style={s.modalBox}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, color: '#2C2420', marginBottom: 4 }}>Weekly check-in</div>
            <div style={{ ...F({ fontSize: 12, fontWeight: 300 }), color: '#8B6B4A', marginBottom: 18 }}>How are you feeling this week?</div>
            {[
              ['Energy level (1–10)', 'energy', [1,2,3,4,5,6,7,8,9,10]],
              ['Sessions completed', 'sessions', ['0 of 3','1 of 3','2 of 3','3 of 3']],
              ['Soreness', 'soreness', ['None','Mild','Moderate','High']],
              ['Sleep quality', 'sleep', ['Poor','Fair','Good','Great']],
            ].map(([label, key, opts]) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ ...F({ fontSize: 11, fontWeight: 300 }), color: '#8B6B4A', marginBottom: 4 }}>{label}</div>
                <select value={checkin[key]} onChange={e => setCheckin({ ...checkin, [key]: e.target.value })} style={s.selectEl}>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...F({ fontSize: 11, fontWeight: 300 }), color: '#8B6B4A', marginBottom: 4 }}>What's feeling good? What's hard? Any questions for Cait?</div>
              <textarea value={checkin.notes} onChange={e => setCheckin({ ...checkin, notes: e.target.value })}
                style={{ ...s.inp, resize: 'none', height: 72, marginBottom: 0 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={submitCheckin} style={s.submitBtn}>Submit</button>
              <button onClick={() => setShowCheckin(false)} style={s.cancelBtn}>Cancel</button>
            </div>
            <div style={{ ...F({ fontSize: 11, fontWeight: 300, fontStyle: 'italic' }), color: '#C4845A', marginTop: 16 }}>Stay Activated.</div>
          </div>
        </div>
      )}
    </div>
  )
}
