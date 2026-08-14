import { useEffect, useState } from 'react'
import { getMyTransactions } from '../lib/payments'

function initials(name) { return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }
function fmtUGX(n) { return 'UGX ' + Number(n).toLocaleString() }

export default function Profile({ me, onLogout }) {
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    getMyTransactions(me.id).then(setTransactions).catch(() => {})
  }, [me.id])

  return (
    <div className="screen">
      <div className="section-head"><h2>Profile</h2></div>
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="account-avatar" style={{ margin: '0 auto 12px', width: 56, height: 56, fontSize: 20 }}>{initials(me.full_name)}</div>
        <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 18 }}>{me.full_name}</div>
        <div className="eyebrow" style={{ marginTop: 4 }}>{me.role.toUpperCase()} · {me.district}</div>
      </div>
      <div className="card">
        <div className="account-info-row"><span>Phone</span><span>{me.phone || '—'}</span></div>
        <div className="account-info-row"><span>District</span><span>{me.district}</span></div>
        <div className="account-info-row"><span>Location</span><span>{me.subcounty || '—'}</span></div>
      </div>

      {transactions.length > 0 && (
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: 8 }}>PAYMENT REQUESTS</p>
          {transactions.map(t => {
            const iAmBuyer = t.buyer_id === me.id
            return (
              <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div className="listing-row" style={{ marginTop: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtUGX(t.amount)}</span>
                  <span className="badge" style={{ background: '#F2E4D8', color: 'var(--clay)' }}>🚧 Pending integration</span>
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
                  {iAmBuyer ? `To ${t.seller?.full_name || 'seller'}` : `From ${t.buyer?.full_name || 'buyer'}`} · {t.payment_method} · {new Date(t.created_at).toLocaleDateString()}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <div className="card">
        <p className="eyebrow" style={{ marginBottom: 8 }}>ABOUT FARM LINKER</p>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--muted)' }}>
          One platform for Mukono's poultry farmers — marketplace, suppliers, vets and community, with direct messaging and group chats, backed by a real Supabase database.
        </p>
      </div>
      <button className="logout-btn" onClick={onLogout}>Log out</button>
    </div>
  )
}
