import { useEffect, useRef, useState } from 'react'
import Toast from '../components/Toast'
import AdminDashboard from './AdminDashboard'
import AdminUsers from './AdminUsers'
import AdminContent from './AdminContent'
import AdminTransactions from './AdminTransactions'
import {
  getPlatformStats, getAllUsers, getAllListingsAdmin, getAllPostsAdmin,
  getAllVetRequestsAdmin, getAllTransactionsAdmin
} from '../lib/admin'

const TABS = [
  { key: 'dashboard', label: '📊 Dashboard' },
  { key: 'users', label: '👥 Users' },
  { key: 'content', label: '🛡 Content' },
  { key: 'transactions', label: '💰 Payments' }
]

export default function AdminApp({ me, onLogout }) {
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [listings, setListings] = useState([])
  const [posts, setPosts] = useState([])
  const [vetRequests, setVetRequests] = useState([])
  const [transactions, setTransactions] = useState([])
  const toastRef = useRef(null)
  const toast = (msg) => toastRef.current?.fire(msg)

  async function loadAll() {
    setLoading(true)
    try {
      const [s, u, l, p, vr, tx] = await Promise.all([
        getPlatformStats(), getAllUsers(), getAllListingsAdmin(), getAllPostsAdmin(),
        getAllVetRequestsAdmin(), getAllTransactionsAdmin()
      ])
      setStats(s); setUsers(u); setListings(l); setPosts(p); setVetRequests(vr); setTransactions(tx)
    } catch (e) {
      toast('Could not load admin data: ' + e.message)
    }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  return (
    <div className="app" style={{ background: 'var(--parchment)' }}>
      <div className="admin-topbar">
        <div className="brand"><div className="dot" /><span className="brand-name" style={{ color: 'var(--parchment)' }}>Farm Linker</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="role-pill">ADMIN</span>
          <button className="icon-btn" onClick={onLogout} title="Log out">🚪</button>
        </div>
      </div>
      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t.key} className={'admin-tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div className="screen" style={{ paddingBottom: 40 }}>
        {loading ? <div className="loading">Loading admin console…</div> : (
          <>
            {tab === 'dashboard' && <AdminDashboard stats={stats} />}
            {tab === 'users' && <AdminUsers users={users} onRefresh={loadAll} onToast={toast} meId={me.id} />}
            {tab === 'content' && <AdminContent listings={listings} posts={posts} vetRequests={vetRequests} onRefresh={loadAll} onToast={toast} />}
            {tab === 'transactions' && <AdminTransactions transactions={transactions} />}
          </>
        )}
      </div>
      <Toast ref={toastRef} />
    </div>
  )
}
