import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ClientSidebar from '../components/ClientSidebar'
import WorkoutBuilder from '../components/WorkoutBuilder'
import Messaging from '../components/Messaging'

export default function TrainerApp({ session, profile }) {
  const [clients, setClients] = useState([])
  const [activeClient, setActiveClient] = useState(null)
  const [activeTab, setActiveTab] = useState('program')

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('trainer_id', session.user.id)
      .order('name')
    setClients(data || [])
    if (data && data.length > 0) setActiveClient(data[0])
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const s = {
    app: { display: 'flex', height: '100vh', background: 'var(--bg)' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
    topbar: {
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
      borderBottom: '0.5px solid var(--border)', background: 'var(--bg2)', flexShrink: 0
    },
    av: (bg, fg) => ({
      width: 32, height: 32, borderRadius: '50%', background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 500, flexShrink: 0
    }),
    name: { fontSize: 14, fontWeight: 500, color: 'var(--text)' },
    meta: { fontSize: 11, color: 'var(--text2)' },
    signout: {
      marginLeft: 'auto', padding: '5px 11px', fontSize: 12, border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--text3)'
    },
    tabbar: { display: 'flex', borderBottom: '0.5px solid var(--border)', flexShrink: 0 },
    tab: (active) => ({
      padding: '9px 16px', fontSize: 13, color: active ? 'var(--text)' : 'var(--text2)',
      fontWeight: active ? 500 : 400, borderBottom: active ? '2px solid var(--text)' : '2px solid transparent',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, marginBottom: -0.5
    }),
    content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }
  }

  const avColors = [
    ['#E1F5EE','#085041'],['#B5D4F4','#0C447C'],['#FAC775','#633806'],
    ['#F4C0D1','#72243E'],['#EEEDFE','#3C3489']
  ]

  function clientColors(idx) {
    return avColors[idx % avColors.length]
  }

  const clientIdx = activeClient ? clients.findIndex(c => c.id === activeClient.id) : 0
  const [bg, fg] = clientColors(clientIdx)
  const initials = activeClient ? activeClient.name.split(' ').map(p => p[0]).join('').slice(0,2) : ''

  return (
    <div style={s.app}>
      <ClientSidebar
        clients={clients}
        activeClient={activeClient}
        onSelect={setActiveClient}
        onRefresh={loadClients}
        trainerId={session.user.id}
        clientColors={clientColors}
      />
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
          <div style={s.tab(activeTab==='program')} onClick={() => setActiveTab('program')}>
            <i className="ti ti-barbell" /> Program
          </div>
          <div style={s.tab(activeTab==='messages')} onClick={() => setActiveTab('messages')}>
            <i className="ti ti-message" /> Messages
          </div>
        </div>
        <div style={s.content}>
          {activeTab === 'program' && activeClient &&
            <WorkoutBuilder client={activeClient} trainerId={session.user.id} />}
          {activeTab === 'messages' && activeClient &&
            <Messaging client={activeClient} userId={session.user.id} isTrainer={true} clientColors={clientColors} clients={clients} />}
          {!activeClient && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, fontSize: 13, color: 'var(--text3)' }}>
              Add a client to get started
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
