import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const J = (extra) => ({ fontFamily: "'Jost', sans-serif", ...extra })

const QUICK_REPLIES = [
  { label: 'You showed up!', text: "You showed up — that's everything. Really proud of you this week." },
  { label: 'Energy check', text: "Hey! How's your energy been? Body feeling good, or do we need to dial it back a bit?" },
  { label: 'Gentle nudge', text: "Just checking in — your body is craving that movement today. Even 20 minutes counts. You've got this." },
  { label: 'Recovery reminder', text: "Don't forget — rest is part of the work. Hydrate, sleep, let your body do its thing." },
  { label: 'Session reminder', text: "Your next session is coming up! Come as you are — we meet you exactly where you're at." },
]

export default function Messaging({ client, userId, isTrainer }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [showCI, setShowCI] = useState(false)
  const [att, setAtt] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadMessages()
    const channel = supabase.channel('messages-' + client.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'client_id=eq.' + client.id },
        payload => setMessages(prev => [...prev, payload.new]))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [client.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadMessages() {
    const { data } = await supabase.from('messages').select('*').eq('client_id', client.id).order('created_at')
    setMessages(data || [])
  }

  async function send() {
    if (!text.trim() && !att) return
    await supabase.from('messages').insert({
      client_id: client.id, sender_id: userId,
      content: text.trim() || (att === 'w' ? '[Workout attached]' : '[Photo/video attached]'),
      attachment_type: att || null, is_checkin: false
    })
    setText(''); setAtt(null)
  }

  function formatTime(ts) { return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }
  function formatDate(ts) {
    const d = new Date(ts), today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    const y = new Date(today); y.setDate(today.getDate() - 1)
    if (d.toDateString() === y.toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
  function groupByDate(msgs) {
    const groups = []; let lastDate = null
    msgs.forEach(m => {
      const d = formatDate(m.created_at)
      if (d !== lastDate) { groups.push({ type: 'divider', label: d }); lastDate = d }
      groups.push({ type: 'msg', ...m })
    })
    return groups
  }
  function parseCheckin(content) { try { return JSON.parse(content) } catch { return null } }

  const clientInitials = client.name.split(' ').map(p => p[0]).join('').slice(0, 2)

  const s = {
    wrap: { display: 'flex', flexDirection: 'column', height: '100%', background: '#FFFFFF' },
    topbar: { display: 'flex', alignItems: 'center', padding: '8px 14px', borderBottom: '0.5px solid #DDD5C8', background: '#F5EDE3', flexShrink: 0 },
    ciBtn: (open) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 11px', ...J({ fontSize: 11, fontWeight: 300 }), borderRadius: 8, border: '0.5px solid #DDD5C8', background: open ? '#E9C2A2' : '#FFFFFF', color: open ? '#2C2420' : '#8B6B4A', marginLeft: 'auto', cursor: 'pointer' }),
    area: { flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
    divider: { textAlign: 'center', ...J({ fontSize: 10, fontWeight: 300 }), color: '#D4B896', padding: '2px 0' },
    mrow: (mine) => ({ display: 'flex', gap: 7, alignItems: 'flex-end', flexDirection: mine ? 'row-reverse' : 'row' }),
    mav: (mine) => ({ width: 26, height: 26, borderRadius: '50%', background: mine ? '#C4845A' : '#E9C2A2', color: mine ? '#FFFFFF' : '#2C2420', display: 'flex', alignItems: 'center', justifyContent: 'center', ...J({ fontSize: 9, fontWeight: 500 }), flexShrink: 0 }),
    bub: (mine) => ({ maxWidth: '68%', padding: '8px 12px', borderRadius: 14, ...J({ fontSize: 13, fontWeight: 300 }), lineHeight: 1.55, background: mine ? '#C4845A' : '#F5EDE3', color: mine ? '#FFFFFF' : '#2C2420', borderBottomRightRadius: mine ? 3 : 14, borderBottomLeftRadius: mine ? 14 : 3 }),
    ciCard: { maxWidth: '72%', background: '#FFFFFF', border: '0.5px solid #DDD5C8', borderRadius: 12, borderBottomLeftRadius: 3, overflow: 'hidden' },
    ciHead: { padding: '7px 10px', background: '#F5EDE3', borderBottom: '0.5px solid #DDD5C8', ...J({ fontSize: 11, fontWeight: 500 }), color: '#C4845A', display: 'flex', alignItems: 'center', gap: 5 },
    ciBody: { padding: '8px 10px' },
    ciRow: { display: 'flex', justifyContent: 'space-between', ...J({ fontSize: 11, fontWeight: 300 }), marginBottom: 4 },
    mtime: { ...J({ fontSize: 10, fontWeight: 300 }), color: '#D4B896', padding: '0 3px', marginTop: 2 },
    quickRow: { display: 'flex', gap: 5, padding: '7px 12px', borderTop: '0.5px solid #DDD5C8', overflowX: 'auto', background: '#F5EDE3', flexShrink: 0 },
    qr: { display: 'inline-flex', alignItems: 'center', padding: '4px 10px', ...J({ fontSize: 10, fontWeight: 300 }), borderRadius: 999, border: '0.5px solid #DDD5C8', background: '#FFFFFF', color: '#8B6B4A', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer' },
    compose: { border: 'none', borderTop: '0.5px solid #DDD5C8', flexShrink: 0 },
    attRow: { display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderBottom: '0.5px solid #DDD5C8' },
    attLbl: { ...J({ fontSize: 10, fontWeight: 300 }), color: '#D4B896', marginRight: 2 },
    attBtn: (on) => ({ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 9px', ...J({ fontSize: 10, fontWeight: 300 }), borderRadius: 8, border: '0.5px solid #DDD5C8', background: on ? '#E9C2A2' : 'none', color: on ? '#2C2420' : '#D4B896', cursor: 'pointer' }),
    inputRow: { display: 'flex', alignItems: 'flex-end', gap: 7, padding: '8px 12px' },
    ta: { flex: 1, border: 'none', outline: 'none', ...J({ fontSize: 13, fontWeight: 300 }), background: 'transparent', color: '#2C2420', resize: 'none', lineHeight: 1.5, maxHeight: 60 },
    sendBtn: { width: 32, height: 32, borderRadius: '50%', background: '#C4845A', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' },
    ciPanel: { borderTop: '0.5px solid #DDD5C8', padding: '12px 14px', background: '#F5EDE3', flexShrink: 0 },
    ciPTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 400, color: '#2C2420', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    ciGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 },
    ciField: { display: 'flex', flexDirection: 'column', gap: 3 },
    ciLbl: { ...J({ fontSize: 10, fontWeight: 300 }), color: '#8B6B4A' },
    ciSel: { ...J({ fontSize: 11 }), border: '0.5px solid #DDD5C8', borderRadius: 8, padding: '5px 7px', background: '#FFFFFF', color: '#2C2420', outline: 'none' },
    ciTA: { width: '100%', ...J({ fontSize: 11, fontWeight: 300 }), border: '0.5px solid #DDD5C8', borderRadius: 8, padding: '6px 8px', background: '#FFFFFF', color: '#2C2420', outline: 'none', resize: 'none', marginBottom: 8 },
    ciSend: { padding: '6px 14px', ...J({ fontSize: 12, fontWeight: 500 }), borderRadius: 8, background: '#C4845A', color: '#FFFFFF', border: 'none', cursor: 'pointer' },
    ciNote: { ...J({ fontSize: 10, fontWeight: 300 }), color: '#D4B896', marginLeft: 8 },
  }

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
                    <div style={s.ciHead}><i className="ti ti-clipboard-check" style={{ fontSize: 13 }} /> Weekly check-in</div>
                    <div style={s.ciBody}>
                      {[['Energy', ci.energy+'/10'],['Sessions', ci.sessions],['Soreness', ci.soreness],['Sleep', ci.sleep]].map(([k,v]) => (
                        <div key={k} style={s.ciRow}><span style={{ color: '#8B6B4A' }}>{k}</span><strong style={{ color: '#2C2420' }}>{v}</strong></div>
                      ))}
                      {ci.notes && <div style={{ ...J({ fontSize: 11, fontWeight: 300, fontStyle: 'italic' }), color: '#8B6B4A', marginTop: 6, paddingTop: 6, borderTop: '0.5px solid #DDD5C8' }}>"{ci.notes}"</div>}
                    </div>
                  </div>
                ) : item.attachment_type === 'w' ? (
                  <div style={{ ...s.bub(mine), display: 'flex', alignItems: 'center', gap: 6 }}><i className="ti ti-barbell" /> Workout attached</div>
                ) : item.attachment_type === 'p' ? (
                  <div style={{ ...s.bub(mine), display: 'flex', alignItems: 'center', gap: 6 }}><i className="ti ti-photo" /> Photo / video attached</div>
                ) : (
                  <div style={s.bub(mine)}>{item.content}</div>
                )}
                <div style={{ ...s.mtime, textAlign: mine ? 'right' : 'left' }}>{formatTime(item.created_at)}</div>
              </div>
            </div>
          )
        })}
        {messages.length === 0 && (
          <div style={{ ...J({ fontSize: 13, fontWeight: 300 }), color: '#D4B896', textAlign: 'center', paddingTop: 40 }}>
            Start the conversation — welcome them in!
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {isTrainer && (
        <div style={{ ...s.quickRow, overflowX: 'auto' }}>
          <span style={{ ...J({ fontSize: 10, fontWeight: 300 }), color: '#D4B896', lineHeight: '22px', flexShrink: 0 }}>Quick:</span>
          {QUICK_REPLIES.map(q => <button key={q.label} style={s.qr} onClick={() => setText(q.text)}>{q.label}</button>)}
        </div>
      )}

      <div style={s.compose}>
        {isTrainer && (
          <div style={s.attRow}>
            <span style={s.attLbl}>Attach:</span>
            <button style={s.attBtn(att === 'w')} onClick={() => setAtt(att === 'w' ? null : 'w')}><i className="ti ti-barbell" /> Workout</button>
            <button style={s.attBtn(att === 'p')} onClick={() => setAtt(att === 'p' ? null : 'p')}><i className="ti ti-photo" /> Photo / video</button>
          </div>
        )}
        <div style={s.inputRow}>
          <textarea style={s.ta} rows={2} value={text}
            placeholder={`Message ${client.name.split(' ')[0]}...`}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
          <button style={s.sendBtn} onClick={send}><i className="ti ti-send" style={{ fontSize: 14 }} /></button>
        </div>
      </div>

      {isTrainer && showCI && <CIPanel clientId={client.id} userId={userId} onClose={() => setShowCI(false)} s={s} />}
    </div>
  )
}

function CIPanel({ clientId, userId, onClose, s }) {
  const [ci, setCI] = useState({ energy: 7, sessions: '3 of 3', soreness: 'Moderate', sleep: 'Good', notes: '' })
  async function send() {
    await supabase.from('messages').insert({ client_id: clientId, sender_id: userId, content: JSON.stringify(ci), is_checkin: true })
    onClose()
  }
  return (
    <div style={s.ciPanel}>
      <div style={s.ciPTitle}>
        Weekly check-in
        <i className="ti ti-x" style={{ fontSize: 15, color: '#D4B896', cursor: 'pointer' }} onClick={onClose} />
      </div>
      <div style={s.ciGrid}>
        {[['Energy (1–10)','energy',[1,2,3,4,5,6,7,8,9,10]],['Sessions','sessions',['0 of 3','1 of 3','2 of 3','3 of 3']],['Soreness','soreness',['None','Mild','Moderate','High']],['Sleep','sleep',['Poor','Fair','Good','Great']]].map(([label,key,opts]) => (
          <div key={key} style={s.ciField}>
            <label style={s.ciLbl}>{label}</label>
            <select style={s.ciSel} value={ci[key]} onChange={e => setCI({ ...ci, [key]: e.target.value })}>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
      <textarea style={s.ciTA} rows={2} placeholder="What's feeling good? What's hard? Any questions for Cait?" value={ci.notes} onChange={e => setCI({ ...ci, notes: e.target.value })} />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button style={s.ciSend} onClick={send}>Send to client</button>
        <span style={s.ciNote}>They fill it out — response appears as a message</span>
      </div>
    </div>
  )
}
