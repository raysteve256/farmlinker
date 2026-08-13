function initials(name) { return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }

export default function Profile({ me, onLogout }) {
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
