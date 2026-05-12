import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SETS=[1,2,3,4,5,6]
const REPS=['5','6','8','10','12','15','20','30s','45s','60s','AMRAP']
const REST=['30s','45s','60s','90s','2 min','3 min']
const AMRAP_D=['5 min','8 min','10 min','12 min','15 min','20 min']
const EMOM_D=['8 min','10 min','12 min','15 min','20 min']
const CSETS=[1,2,3,4,5,6]

function selOpts(arr, cur) {
  return arr.map(v => <option key={v} value={v}>{v}</option>)
}

export default function WorkoutBuilder({ client, trainerId }) {
  const [circuits, setCircuits] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragSrc, setDragSrc] = useState(null)

  useEffect(() => { loadCircuits() }, [client.id])

  async function loadCircuits() {
    setLoading(true)
    const { data } = await supabase
      .from('circuits')
      .select('*, exercises(*)')
      .eq('client_id', client.id)
      .order('sort_order')
    setCircuits((data || []).map(c => ({ ...c, exercises: (c.exercises || []).sort((a,b) => a.sort_order - b.sort_order) })))
    setLoading(false)
  }

  async function addCircuit() {
    const labels = ['A','B','C','D','E','F']
    const pos = circuits.length
    const { data } = await supabase.from('circuits').insert({
      client_id: client.id,
      trainer_id: trainerId,
      name: 'Circuit ' + labels[Math.min(pos, 5)],
      type: 'circuit',
      sets: 3,
      amrap_duration: '10 min',
      emom_duration: '10 min',
      rest_after: '60s',
      sort_order: pos
    }).select().single()
    if (data) setCircuits([...circuits, { ...data, exercises: [] }])
  }

  async function updateCircuit(cid, updates) {
    await supabase.from('circuits').update(updates).eq('id', cid)
    setCircuits(circuits.map(c => c.id === cid ? { ...c, ...updates } : c))
  }

  async function deleteCircuit(cid) {
    await supabase.from('circuits').delete().eq('id', cid)
    setCircuits(circuits.filter(c => c.id !== cid))
  }

  async function addExercise(cid) {
    const inp = document.getElementById('inp-' + cid)
    const name = inp?.value.trim()
    if (!name) return
    const c = circuits.find(x => x.id === cid)
    const pos = c.exercises.length
    const { data } = await supabase.from('exercises').insert({
      circuit_id: cid, name, sets: 3, reps: '10', sort_order: pos
    }).select().single()
    if (data) {
      setCircuits(circuits.map(c => c.id === cid ? { ...c, exercises: [...c.exercises, data] } : c))
      inp.value = ''
      inp.focus()
    }
  }

  async function updateExercise(cid, eid, updates) {
    await supabase.from('exercises').update(updates).eq('id', eid)
    setCircuits(circuits.map(c => c.id === cid
      ? { ...c, exercises: c.exercises.map(e => e.id === eid ? { ...e, ...updates } : e) }
      : c))
  }

  async function deleteExercise(cid, eid) {
    await supabase.from('exercises').delete().eq('id', eid)
    setCircuits(circuits.map(c => c.id === cid
      ? { ...c, exercises: c.exercises.filter(e => e.id !== eid) }
      : c))
  }

  async function moveExercise(cid, fromId, toId) {
    const c = circuits.find(x => x.id === cid)
    const exs = [...c.exercises]
    const fi = exs.findIndex(x => x.id === fromId)
    const ti = exs.findIndex(x => x.id === toId)
    if (fi < 0 || ti < 0) return
    const [moved] = exs.splice(fi, 1)
    exs.splice(ti, 0, moved)
    const updated = exs.map((e, i) => ({ ...e, sort_order: i }))
    setCircuits(circuits.map(c => c.id === cid ? { ...c, exercises: updated } : c))
    await Promise.all(updated.map(e => supabase.from('exercises').update({ sort_order: e.sort_order }).eq('id', e.id)))
  }

  function cfgDesc(c) {
    if (c.type === 'amrap') return `As many rounds as possible in ${c.amrap_duration}`
    if (c.type === 'emom') return `Every minute on the minute for ${c.emom_duration}`
    return `Complete all exercises back-to-back for ${c.sets} set${c.sets !== 1 ? 's' : ''}`
  }

  const s = {
    wrap: { padding: 14, overflowY: 'auto', flex: 1 },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    title: { fontSize: 14, fontWeight: 500, color: 'var(--text)' },
    sub: { fontSize: 11, color: 'var(--text2)', marginTop: 1 },
    addCBtn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 11px', fontSize: 12, border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg2)', color: 'var(--text2)' },
    card: { border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: 10 },
    cHead: { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'var(--bg2)', borderRadius: '12px 12px 0 0' },
    cName: { flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)', border: '1px solid transparent', borderRadius: 4, padding: '1px 3px', background: 'none', outline: 'none' },
    typeSeg: { display: 'flex', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', flexShrink: 0 },
    tyBtn: (active, type) => ({
      fontSize: 11, padding: '3px 8px', border: 'none', fontFamily: 'inherit',
      background: active ? (type==='circuit'?'var(--green-light)':type==='amrap'?'var(--yellow-light)':'var(--blue-light)') : 'none',
      color: active ? (type==='circuit'?'var(--green-text)':type==='amrap'?'var(--yellow-text)':'var(--blue-text)') : 'var(--text2)',
      fontWeight: active ? 500 : 400, borderRight: '0.5px solid var(--border)', cursor: 'pointer'
    }),
    cfg: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderBottom: '0.5px solid var(--border)', background: 'var(--bg2)' },
    cfgLbl: { fontSize: 10, color: 'var(--text3)' },
    cfgSel: { fontSize: 12, fontWeight: 500, border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '3px 6px', background: 'var(--bg)', color: 'var(--text)', outline: 'none' },
    cfgDesc: { fontSize: 10, color: 'var(--text2)', flex: 1 },
    exRow: { display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderBottom: '0.5px solid var(--border)', cursor: 'grab' },
    grip: { fontSize: 14, color: 'var(--text3)', flexShrink: 0 },
    exName: { flex: 1, fontSize: 12, color: 'var(--text)', border: '1px solid transparent', borderRadius: 4, padding: '2px 4px', background: 'none', outline: 'none' },
    fWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flexShrink: 0 },
    fLbl: { fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    fSel: { fontSize: 11, fontWeight: 500, border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '2px 5px', background: 'var(--bg)', color: 'var(--text)', outline: 'none', minWidth: 44, textAlign: 'center' },
    addExRow: { display: 'flex', gap: 6, padding: '7px 12px', borderTop: '0.5px solid var(--border)' },
    addExInp: { flex: 1, fontSize: 12, padding: '4px 8px', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--text)', outline: 'none' },
    addExBtn: { padding: '4px 10px', fontSize: 12, fontWeight: 500, borderRadius: 'var(--radius)', background: 'var(--green)', color: '#E1F5EE', border: 'none' },
    foot: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg2)', borderRadius: '0 0 12px 12px' },
    footNote: { fontSize: 10, color: 'var(--text3)' },
    restWrap: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text3)' },
    restSel: { fontSize: 11, border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '2px 5px', background: 'var(--bg)', color: 'var(--text2)', outline: 'none' },
    delBtn: { fontSize: 14, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 },
  }

  if (loading) return <div style={{ padding: 20, fontSize: 13, color: 'var(--text3)' }}>Loading program...</div>

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div>
          <div style={s.title}>Program — {client.name}</div>
          <div style={s.sub}>Week {client.current_week || 1} · {client.goal}</div>
        </div>
        <button style={s.addCBtn} onClick={addCircuit}><i className="ti ti-plus" /> Add circuit</button>
      </div>

      {circuits.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--text3)', padding: '20px 0' }}>
          No circuits yet — click "Add circuit" to build the program.
        </div>
      )}

      {circuits.map(c => (
        <div key={c.id} style={s.card}>
          <div style={s.cHead}>
            <input style={s.cName} defaultValue={c.name} onBlur={e => updateCircuit(c.id, { name: e.target.value })} />
            <div style={s.typeSeg}>
              {['circuit','amrap','emom'].map(t => (
                <button key={t} style={{...s.tyBtn(c.type===t,t), borderRight: t!=='emom'?'0.5px solid var(--border)':'none'}}
                  onClick={() => updateCircuit(c.id, { type: t })}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            <button style={s.delBtn} onClick={() => deleteCircuit(c.id)}><i className="ti ti-trash" /></button>
          </div>

          <div style={s.cfg}>
            <span style={s.cfgLbl}>{c.type==='circuit'?'Sets':c.type==='amrap'?'Duration':'Duration'}</span>
            {c.type==='circuit' && (
              <select style={s.cfgSel} value={c.sets} onChange={e => updateCircuit(c.id, { sets: parseInt(e.target.value) })}>
                {CSETS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            )}
            {c.type==='amrap' && (
              <select style={s.cfgSel} value={c.amrap_duration} onChange={e => updateCircuit(c.id, { amrap_duration: e.target.value })}>
                {AMRAP_D.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            )}
            {c.type==='emom' && (
              <select style={s.cfgSel} value={c.emom_duration} onChange={e => updateCircuit(c.id, { emom_duration: e.target.value })}>
                {EMOM_D.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            )}
            <span style={s.cfgDesc}>{cfgDesc(c)}</span>
          </div>

          <div>
            {c.exercises.map(ex => (
              <div key={ex.id} style={s.exRow}
                draggable
                onDragStart={() => setDragSrc({ cid: c.id, eid: ex.id })}
                onDragOver={e => e.preventDefault()}
                onDrop={() => { if (dragSrc && dragSrc.cid === c.id) moveExercise(c.id, dragSrc.eid, ex.id) }}>
                <i className="ti ti-grip-vertical" style={s.grip} />
                <input style={s.exName} defaultValue={ex.name} onBlur={e => updateExercise(c.id, ex.id, { name: e.target.value })} />
                {c.type !== 'emom' && <>
                  <div style={s.fWrap}>
                    <div style={s.fLbl}>Sets</div>
                    <select style={s.fSel} value={ex.sets} onChange={e => updateExercise(c.id, ex.id, { sets: parseInt(e.target.value) })}>
                      {SETS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text3)', marginTop: 10 }}>×</span>
                </>}
                <div style={s.fWrap}>
                  <div style={s.fLbl}>Reps</div>
                  <select style={s.fSel} value={ex.reps} onChange={e => updateExercise(c.id, ex.id, { reps: e.target.value })}>
                    {REPS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <button style={s.delBtn} onClick={() => deleteExercise(c.id, ex.id)}><i className="ti ti-x" /></button>
              </div>
            ))}
          </div>

          <div style={s.addExRow}>
            <input id={'inp-'+c.id} style={s.addExInp} placeholder="Add exercise..."
              onKeyDown={e => e.key === 'Enter' && addExercise(c.id)} />
            <button style={s.addExBtn} onClick={() => addExercise(c.id)}>Add</button>
          </div>

          <div style={s.foot}>
            <span style={s.footNote}>{c.exercises.length} exercise{c.exercises.length!==1?'s':''} · {c.type==='circuit'?c.sets+' sets':c.type==='amrap'?c.amrap_duration:c.emom_duration}</span>
            <span style={s.restWrap}>Rest after:
              <select style={s.restSel} value={c.rest_after} onChange={e => updateCircuit(c.id, { rest_after: e.target.value })}>
                {REST.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
