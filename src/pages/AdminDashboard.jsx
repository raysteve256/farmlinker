function fmtUGX(n) { return 'UGX ' + Number(n).toLocaleString() }

export default function AdminDashboard({ stats }) {
  if (!stats) return <div className="loading">Loading platform stats…</div>
  return (
    <div>
      <div className="section-head"><h2>Platform overview</h2></div>
      <div className="stat-grid">
        <div className="stat-tile"><div className="num">{stats.totalUsers}</div><div className="lb">Total users</div></div>
        <div className="stat-tile"><div className="num">{stats.bannedUsers}</div><div className="lb">Banned users</div></div>
        <div className="stat-tile"><div className="num">{stats.activeListings}</div><div className="lb">Active listings</div></div>
        <div className="stat-tile"><div className="num">{stats.totalProducts}</div><div className="lb">Supplier products</div></div>
        <div className="stat-tile"><div className="num">{stats.openVetRequests}</div><div className="lb">Open vet requests</div></div>
        <div className="stat-tile"><div className="num" style={{ color: stats.urgentVetRequests > 0 ? 'var(--clay)' : 'var(--ink)' }}>{stats.urgentVetRequests}</div><div className="lb">Urgent (unresolved)</div></div>
        <div className="stat-tile"><div className="num">{stats.totalPosts}</div><div className="lb">Community posts</div></div>
        <div className="stat-tile"><div className="num">{stats.diseaseAlerts}</div><div className="lb">Disease alerts</div></div>
        <div className="stat-tile"><div className="num">{stats.totalMessages}</div><div className="lb">Messages sent</div></div>
        <div className="stat-tile"><div className="num">{stats.totalTransactions}</div><div className="lb">Payment requests</div></div>
      </div>

      <div className="section-head"><h2 style={{ fontSize: 17 }}>Users by role</h2></div>
      <div className="card">
        {Object.entries(stats.usersByRole).map(([role, count]) => (
          <div className="admin-row" key={role}>
            <span className="admin-row-title">{role}</span>
            <span className="mono" style={{ fontSize: 13 }}>{count}</span>
          </div>
        ))}
      </div>

      <div className="section-head" style={{ marginTop: 18 }}><h2 style={{ fontSize: 17 }}>Mobile Money provision</h2></div>
      <div className="card">
        <div className="admin-row"><span className="admin-row-title">Total requested volume</span><span className="mono">{fmtUGX(stats.totalTransactionVolume)}</span></div>
        <div className="admin-row"><span className="admin-row-title">Potential commission (5%)</span><span className="mono">{fmtUGX(stats.totalCommissionPotential)}</span></div>
        <div className="admin-row"><span className="admin-row-title">Pending integration</span><span className="mono">{stats.pendingTransactions}</span></div>
      </div>
    </div>
  )
}
