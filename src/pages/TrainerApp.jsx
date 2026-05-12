import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ClientSidebar from '../components/ClientSidebar'
import WorkoutBuilder from '../components/WorkoutBuilder'
import Messaging from '../components/Messaging'

const avColors = [
  ['#E9C2A2','#2C2420'],['#C4845A','#FFFFFF'],
  ['#5C7A5C','#FFFFFF'],['#D4B896','#2C2420'],['#8B6B4A','#FFFFFF'],
]
function clientColors(idx) { return avColors[idx % avColors.length] }

export default function TrainerApp({ session, profile }) {
  const [clients, setClients] = useState([])
  const [activeClient, setActiveClient] = useState(null)
  const [activeTab, setActiveTab] = useState('program')

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    const { data } = await supabase.from('clients').select('*').eq('trainer_id', session.user.id).order('name')
    setClients(data || [])
    if (data && data.length > 0) setActiveClient(data[0])
  }

  async function signOut() { await supabase.auth.signOut() }

  const clientIdx = activeClient ? clients.findIndex(c => c.id === activeClient.id) : 0
  const [bg, fg] = clientColors(clientIdx)
  const initials = activeClient ? activeClient.name.split(' ').map(p => p[0]).join('').slice(0, 2) : ''

  const s = {
    app: { display: 'flex', height: '100vh', background: '#FFFFFF' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
    topbar: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '0.5px solid #DDD5C8', background: '#F5EDE3', flexShrink: 0 },
    av: (bg, fg) => ({ width: 32, height: 32, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, flexShrink: 0, fontFamily: "'Jost', sans-serif" }),
    name: { fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 500, color: '#2C2420' },
    meta: { fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 300, color: '#8B6B4A' },
    signout: { marginLeft: 'auto', padding: '5px 12px', fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 300, border: '0.5px solid #DDD5C8', borderRadius: 8, background: '#FFFFFF', color: '#D4B896', cursor: 'pointer' },
    tabbar: { display: 'flex', borderBottom: '0.5px solid #DDD5C8', background: '#FFFFFF', flexShrink: 0 },
    tab: (active) => ({
      padding: '10px 18px', fontFamily: "'Jost', sans-serif", fontSize: 13,
      fontWeight: active ? 500 : 300, color: active ? '#2C2420' : '#8B6B4A',
      borderBottom: active ? '2px solid #C4845A' : '2px solid transparent',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: -0.5
    }),
    content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }
  }

  return (
    <div style={s.app}>
      <ClientSidebar clients={clients} activeClient={activeClient} onSelect={setActiveClient} onRefresh={loadClients} trainerId={session.user.id} clientColors={clientColors} />
      <div style={s.main}>
        <div style={s.topbar}>
          {activeClient && <>
            <div style={s.av(bg, fg)}>{initials}</div>
            <div>
              <div style={s.name}>{activeClient.name}</div>
              <div style={s.meta}>Goal: {activeClient.goal} · Week {activeClient.current_week || 1}</div>
            </div>
          </>}
          <button style={s.signout} onClick={signOut}>Sign out</button>
        </div>
        <div style={s.tabbar}>
          <div style={s.tab(activeTab === 'program')} onClick={() => setActiveTab('program')}>
            <i className="ti ti-barbell" style={{ fontSize: 15 }} /> Program
          </div>
          <div style={s.tab(activeTab === 'messages')} onClick={() => setActiveTab('messages')}>
            <i className="ti ti-message" style={{ fontSize: 15 }} /> Messages
          </div>
        </div>
        <div style={s.content}>
          {activeTab === 'program' && activeClient && <WorkoutBuilder client={activeClient} trainerId={session.user.id} />}
          {activeTab === 'messages' && activeClient && <Messaging client={activeClient} userId={session.user.id} isTrainer={true} clientColors={clientColors} clients={clients} />}
          {!activeClient && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: '#D4B896' }}>
              Welcome! Add your first client to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
