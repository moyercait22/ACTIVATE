import { useState } from 'react'
import { supabase } from '../lib/supabase'

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

  const s = {
    sidebar: { width: 210, borderRight: '0.5px solid var(--border)', background: 'var(--bg2)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
    top: { padding: '13px 12px 10px', borderBottom: '0.5px solid var(--border)' },
    brand: { fontSize: 14, fontWeight: 600, color: 'var(--text)' },
    sub: { fontSize: 10, color: 'var(--text3)', marginTop: 1 },
    label: { padding: '10px 12px 3px', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.07em', textTransform: 'uppercase' },
    list: { flex: 1, overflowY: 'auto', padding: '4px 6px' },
    row: (active) => ({
      display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px',
      borderRadius: 'var(--radius)', cursor: 'pointer', marginBottom: 1,
      background: active ? 'var(--bg)' : 'transparent',
      border: active ? '0.5px solid var(--border)' : '0.5px solid transparent'
    }),
    av: (bg, fg) => ({ width: 28, height: 28, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, flexShrink: 0 }),
    name: { fontSize: 12, fontWeight: 500, color: 'var(--text)' },
    goal: { fontSize: 10, color: 'var(--text3)' },
    addBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: '100%', padding: 7, fontSize: 12, border: '0.5px dashed var(--border)', borderRadius: 'var(--radius)', background: 'none', color: 'var(--text3)' },
    addForm: { padding: '10px 8px', borderTop: '0.5px solid var(--border)' },
    inp: { width: '100%', padding: '5px 8px', marginBottom: 6, border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12 },
    saveBtn: { width: '100%', padding: '6px', background: 'var(--green)', color: '#E1F5EE', border: 'none', borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 500 }
  }

  return (
    <div style={s.sidebar}>
      <div style={s.top}>
        <div style={s.brand}>CoachDesk</div>
        <div style={s.sub}>Personal training platform</div>
      </div>
      <div style={s.label}>Clients</div>
      <div style={s.list}>
        {clients.map((cl, i) => {
          const [bg, fg] = clientColors(i)
          const initials = cl.name.split(' ').map(p => p[0]).join('').slice(0,2)
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
      <div style={{ padding: 8, borderTop: '0.5px solid var(--border)' }}>
        {!showAdd ? (
          <button style={s.addBtn} onClick={() => setShowAdd(true)}>
            <i className="ti ti-plus" /> Add client
          </button>
        ) : (
          <div style={s.addForm}>
            <input style={s.inp} placeholder="Full name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input style={s.inp} placeholder="Email *" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <input style={s.inp} placeholder="Goal (e.g. weight loss)" value={form.goal} onChange={e => setForm({...form, goal: e.target.value})} />
            <button style={s.saveBtn} onClick={addClient} disabled={saving}>{saving ? 'Adding...' : 'Add client'}</button>
            <button style={{ width: '100%', padding: 5, background: 'none', border: 'none', fontSize: 11, color: 'var(--text3)', marginTop: 4 }} onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}
