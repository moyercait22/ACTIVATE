import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const QUICK_REPLIES = [
  { label: 'Great work', text: 'Great work this week, keep it up!' },
  { label: 'Energy check', text: 'How is your energy feeling today?' },
  { label: 'Reminder', text: "Don't forget to log your workout today!" },
  { label: 'Recovery tip', text: "Make sure you're staying hydrated and sleeping well — key for your results." },
  { label: 'Session reminder', text: 'Your next session is tomorrow — any questions about the program?' },
]

export default function Messaging({ client, userId, isTrainer }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [showCI, setShowCI] = useState(false)
  const [att, setAtt] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadMessages()
    const channel = supabase
      .channel('messages-' + client.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'client_id=eq.' + client.id },
        payload => setMessages(prev => [...prev, payload.new]))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [client.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at')
    setMessages(data || [])
  }

  async function send() {
    if (!text.trim() && !att) return
    const payload = {
      client_id: client.id,
      sender_id: userId,
      content: text.trim() || (att === 'w' ? '[Workout attached]' : '[Photo/video attached]'),
      attachment_type: att || null,
      is_checkin: false
    }
    await supabase.from('messages').insert(payload)
    setText('')
    setAtt(null)
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  function formatDate(ts) {
    const d = new Date(ts)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  function groupByDate(msgs) {
    const groups = []
    let lastDate = null
    msgs.forEach(m => {
      const d = formatDate(m.created_at)
      if (d !== lastDate) { groups.push({ type: 'divider', label: d }); lastDate = d }
      groups.push({ type: 'msg', ...m })
    })
    return groups
  }

  function parseCheckin(content) {
    try { return JSON.parse(content) } catch { return null }
  }

  const s = {
    wrap: { display: 'flex', flexDirection: 'column', height: '100%' },
    topbar: { display: 'flex', alignItems: 'center', padding: '8px 14px', borderBottom: '0.5px solid var(--border)', background: 'var(--bg2)', flexShrink: 0 },
    ciBtn: (open) => ({
      marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '5px 10px', fontSize: 11, borderRadius: 'var(--radius)',
      border: '0.5px solid var(--border)',
      background: open ? '#E6F1FB' : 'var(--bg)', color: open ? 'var(--blue-text)' : 'var(--text2)'
    }),
    area: { flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
    divider: { textAlign: 'center', fontSize: 10, color: 'var(--text3)', padding: '2px 0' },
    mrow: (mine) => ({ display: 'flex', gap: 7, alignItems: 'flex-end', flexDirection: mine ? 'row-reverse' : 'row' }),
    mav: (mine) => ({ width: 24, height: 24, borderRadius: '50%', background: mine ? 'var(--green)' : 'var(--green-light)', color: mine ? '#E1F5EE' : 'var(--green-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, flexShrink: 0 }),
    bub: (mine) => ({ maxWidth: '68%', padding: '7px 11px', borderRadius: 13, fontSize: 12, lineHeight: 1.5, background: mine ? 'var(--green)' : 'var(--bg2)', color: mine ? '#E1F5EE' : 'var(--text)', borderBottomRightRadius: mine ? 3 : 13, borderBottomLeftRadius: mine ? 13 : 3 }),
    ciCard: { maxWidth: '70%', background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 12, borderBottomLeftRadius: 3, overflow: 'hidden' },
    ciHead: { padding: '7px 10px', background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', fontSize: 11, fontWeight: 500, color: 'var(--blue-text)', display: 'flex', alignItems: 'center', gap: 5 },
    ciBody: { padding: '8px 10px' },
    ciRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 },
    mtime: { fontSize: 10, color: 'var(--text3)', padding: '0 3px', marginTop: 1 },
    quickRow: { display: 'flex', gap: 5, padding: '7px 12px', borderTop: '0.5px solid var(--border)', overflowX: 'auto', background: 'var(--bg2)', flexShrink: 0 },
    qr: { display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 9px', fontSize: 10, borderRadius: 999, border: '0.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text2)', whiteSpace: 'nowrap', flexShrink: 0 },
    compose: { border: 'none', borderTop: '0.5px solid var(--border)', flexShrink: 0 },
    attRow: { display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderBottom: '0.5px solid var(--border)' },
    attLbl: { fontSize: 10, color: 'var(--text3)', marginRight: 2 },
    attBtn: (on) => ({ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', fontSize: 10, borderRadius: 'var(--radius)', border: '0.5px solid var(--border)', background: on ? 'var(--green-light)' : 'none', color: on ? 'var(--green-text)' : 'var(--text3)' }),
    inputRow: { display: 'flex', alignItems: 'flex-end', gap: 7, padding: '7px 12px' },
    ta: { flex: 1, border: 'none', outline: 'none', fontSize: 12, background: 'transparent', color: 'var(--text)', resize: 'none', lineHeight: 1.5, maxHeight: 60 },
    sendBtn: { width: 30, height: 30, borderRadius: '50%', background: 'var(--green)', color: '#E1F5EE', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    ciPanel: { borderTop: '0.5px solid var(--border)', padding: '12px 14px', background: 'var(--bg2)', flexShrink: 0 },
    ciPTitle: { fontSize: 12, fontWeight: 500, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    ciGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 },
    ciField: { display: 'flex', flexDirection: 'column', gap: 3 },
    ciLbl: { fontSize: 10, color: 'var(--text2)' },
    ciSel: { fontSize: 11, border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 7px', background: 'var(--bg)', color: 'var(--text)', outline: 'none' },
    ciNote: { fontSize: 10, color: 'var(--text3)', marginLeft: 8 },
  }

  const clientInitials = client.name.split(' ').map(p => p[0]).join('').slice(0,2)
  const grouped = groupByDate(messages)

  return (
    <div style={s.wrap}>
      {isTrainer && (
        <div style={s.topbar}>
          <button style={s.ciBtn(showCI)} onClick={() => setShowCI(!showCI)}>
            <i className="ti ti-clipboard-list" /> Send check-in form
          </button>
        </div>
      )}

      <div style={s.area}>
        {grouped.map((item, i) => {
          if (item.type === 'divider') return <div key={i} style={s.divider}>{item.label}</div>
          const mine = item.sender_id === userId
          const ci = item.is_checkin ? parseCheckin(item.content) : null
          return (
            <div key={item.id} style={s.mrow(mine)}>
              <div style={s.mav(mine)}>{mine ? 'Me' : clientInitials}</div>
              <div>
                {ci ? (
                  <div style={s.ciCard}>
                    <div style={s.ciHead}><i className="ti ti-clipboard-check" /> Weekly check-in</div>
                    <div style={s.ciBody}>
                      <div style={s.ciRow}><span style={{ color: 'var(--text2)' }}>Energy</span><strong>{ci.energy}/10</strong></div>
                      <div style={s.ciRow}><span style={{ color: 'var(--text2)' }}>Sessions</span><strong>{ci.sessions}</strong></div>
                      <div style={s.ciRow}><span style={{ color: 'var(--text2)' }}>Soreness</span><strong>{ci.soreness}</strong></div>
                      <div style={s.ciRow}><span style={{ color: 'var(--text2)' }}>Sleep</span><strong>{ci.sleep}</strong></div>
                      {ci.notes && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, paddingTop: 4, borderTop: '0.5px solid var(--border)' }}>"{ci.notes}"</div>}
                    </div>
                  </div>
                ) : item.attachment_type === 'w' ? (
                  <div style={{ ...s.bub(mine), display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-barbell" /> Workout attached
                  </div>
                ) : item.attachment_type === 'p' ? (
                  <div style={{ ...s.bub(mine), display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-photo" /> Photo / video attached
                  </div>
                ) : (
                  <div style={s.bub(mine)}>{item.content}</div>
                )}
                <div style={{ ...s.mtime, textAlign: mine ? 'right' : 'left' }}>{formatTime(item.created_at)}</div>
              </div>
            </div>
          )
        })}
        {messages.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', paddingTop: 40 }}>
            No messages yet — say hi!
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {isTrainer && (
        <div style={{ ...s.quickRow, overflowX: 'auto' }}>
          <span style={{ fontSize: 10, color: 'var(--text3)', lineHeight: '22px', flexShrink: 0 }}>Quick:</span>
          {QUICK_REPLIES.map(q => (
            <button key={q.label} style={s.qr} onClick={() => setText(q.text)}>{q.label}</button>
          ))}
        </div>
      )}

      <div style={s.compose}>
        {isTrainer && (
          <div style={s.attRow}>
            <span style={s.attLbl}>Attach:</span>
            <button style={s.attBtn(att==='w')} onClick={() => setAtt(att==='w'?null:'w')}><i className="ti ti-barbell" /> Workout</button>
            <button style={s.attBtn(att==='p')} onClick={() => setAtt(att==='p'?null:'p')}><i className="ti ti-photo" /> Photo / video</button>
          </div>
        )}
        <div style={s.inputRow}>
          <textarea style={s.ta} rows={2} value={text}
            placeholder={`Message ${client.name.split(' ')[0]}...`}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
          <button style={s.sendBtn} onClick={send}><i className="ti ti-send" style={{ fontSize: 13 }} /></button>
        </div>
      </div>

      {isTrainer && showCI && (
        <CIPanel clientId={client.id} userId={userId} onClose={() => setShowCI(false)} />
      )}
    </div>
  )
}

function CIPanel({ clientId, userId, onClose }) {
  const [ci, setCI] = useState({ energy: 7, sessions: '3 of 3', soreness: 'Moderate', sleep: 'Good', notes: '' })
  async function send() {
    await supabase.from('messages').insert({ client_id: clientId, sender_id: userId, content: JSON.stringify(ci), is_checkin: true })
    onClose()
  }
  const s = {
    panel: { borderTop: '0.5px solid var(--border)', padding: '12px 14px', background: 'var(--bg2)', flexShrink: 0 },
    head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 12, fontWeight: 500 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 },
    field: { display: 'flex', flexDirection: 'column', gap: 3 },
    lbl: { fontSize: 10, color: 'var(--text2)' },
    sel: { fontSize: 11, border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 7px', background: 'var(--bg)', color: 'var(--text)', outline: 'none' },
    ta: { width: '100%', fontSize: 11, border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 8px', background: 'var(--bg)', color: 'var(--text)', outline: 'none', resize: 'none', marginBottom: 8 },
    btn: { padding: '5px 12px', fontSize: 11, fontWeight: 500, borderRadius: 'var(--radius)', background: 'var(--green)', color: '#E1F5EE', border: 'none' },
    note: { fontSize: 10, color: 'var(--text3)', marginLeft: 8 }
  }
  return (
    <div style={s.panel}>
      <div style={s.head}>Weekly check-in form <i className="ti ti-x" style={{ cursor: 'pointer', color: 'var(--text3)' }} onClick={onClose} /></div>
      <div style={s.grid}>
        {[['Energy (1–10)','energy',[1,2,3,4,5,6,7,8,9,10]],['Sessions','sessions',['0 of 3','1 of 3','2 of 3','3 of 3']],['Soreness','soreness',['None','Mild','Moderate','High']],['Sleep','sleep',['Poor','Fair','Good','Great']]].map(([label,key,opts])=>(
          <div key={key} style={s.field}>
            <label style={s.lbl}>{label}</label>
            <select style={s.sel} value={ci[key]} onChange={e => setCI({...ci,[key]:e.target.value})}>
              {opts.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
      <textarea style={s.ta} rows={2} placeholder="Notes, wins, pain points..." value={ci.notes} onChange={e => setCI({...ci,notes:e.target.value})} />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button style={s.btn} onClick={send}>Send to client</button>
        <span style={s.note}>Client fills this out — response appears as a message</span>
      </div>
    </div>
  )
}
