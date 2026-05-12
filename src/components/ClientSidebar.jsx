import { useState } from 'react'
import { supabase } from '../lib/supabase'

const LOGO = () => (
  <div>
    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, letterSpacing: '0.06em', color: '#2C2420', lineHeight: 1 }}>ACTIVATE</div>
    <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 11, color: '#C4845A', marginTop: 1 }}>With Cait</div>
  </div>
)

export default function ClientSidebar({ clients, activeClient, onSelect, onRefresh, trainerId, clientColors }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', goal: '' })
  const [saving, setSaving] = useState(false)

  async function addClient() {
    if (!form.name || !form.email) return
    setSaving(true)
    await supabase.from('clients').insert({
      trainer_id: trainerId,
      name: form.name,
      email: form.email,
      goal: form.goal,
      current_week: 1
    })
    setForm({ name: '', email: '', goal: '' })
    setShowAdd(false)
    setSaving(false)
    onRefresh()
  }

  const avColors = [
    ['#E9C2A2','#2C2420'],
    ['#C4845A','#FFFFFF'],
    ['#5C7A5C','#FFFFFF'],
    ['#D4B896','#2C2420'],
    ['#8B6B4A','#FFFFFF'],
  ]

  const s = {
    sidebar: { width: 210, borderRight: '0.5px solid #DDD5C8', background: '#F5EDE3', display: 'flex', flexDirection: 'column', flexShrink: 0 },
    top: { padding: '14px 14px 12px', borderBottom: '0.5px solid #DDD5C8' },
    label: { padding: '10px 12px 3px', fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 500, color: '#D4B896', letterSpacing: '0.1em', textTransform: 'uppercase' },
    list: { flex: 1, overflowY: 'auto', padding: '4px 6px' },
    row: (active) => ({
      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
      borderRadius: 8, cursor: 'pointer', marginBottom: 2,
      background: active ? '#FFFFFF' : 'transparent',
      border: active ? '0.5px solid #DDD5C8' : '0.5px solid transparent'
    }),
    av: (bg, fg) => ({ width: 30, height: 30, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, flexShrink: 0, fontFamily: "'Jost', sans-serif" }),
    name: { fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 500, color: '#2C2420' },
    goal: { fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 300, color: '#D4B896' },
    addBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: '100%', padding: 8, fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 300, border: '0.5px dashed #DDD5C8', borderRadius: 8, background: 'none', color: '#D4B896' },
    inp: { width: '100%', padding: '6px 8px', marginBottom: 7, border: '0.5px solid #DDD5C8', borderRadius: 8, fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 300, background: '#FFFFFF', color: '#2C2420', outline: 'none' },
    saveBtn: { width: '100%', padding: '7px', background: '#C4845A', color: '#FFFFFF', border: 'none', borderRadius: 8, fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 500 }
  }

  return (
    <div style={s.sidebar}>
      <div style={s.top}><LOGO /></div>
      <div style={s.label}>Clients</div>
      <div style={s.list}>
        {clients.map((cl, i) => {
          const [bg, fg] = avColors[i % avColors.length]
          const initials = cl.name.split(' ').map(p => p[0]).join('').slice(0, 2)
          return (
            <div key={cl.id} style={s.row(activeClient?.id === cl.id)} onClick={() => onSelect(cl)}>
              <div style={s.av(bg, fg)}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.name}>{cl.name}</div>
                <div style={s.goal}>{cl.goal}</div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ padding: 8, borderTop: '0.5px solid #DDD5C8' }}>
        {!showAdd ? (
          <button style={s.addBtn} onClick={() => setShowAdd(true)}>
            <i className="ti ti-plus" /> Add client
          </button>
        ) : (
          <div style={{ padding: '2px 2px 0' }}>
            <input style={s.inp} placeholder="Full name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input style={s.inp} placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input style={s.inp} placeholder="Goal (e.g. weight loss)" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} />
            <button style={s.saveBtn} onClick={addClient} disabled={saving}>{saving ? 'Adding...' : 'Add client'}</button>
            <button style={{ width: '100%', padding: 5, background: 'none', border: 'none', fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 300, color: '#D4B896', marginTop: 4, cursor: 'pointer' }} onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}
