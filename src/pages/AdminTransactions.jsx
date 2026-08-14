function fmtUGX(n) { return 'UGX ' + Number(n).toLocaleString() }

export default function AdminTransactions({ transactions }) {
  return (
    <div>
      <div className="section-head"><h2>Payment requests</h2><span className="count">{transactions.length} total</span></div>
      <div className="card">
        {transactions.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>No payment requests logged yet.</p>}
        {transactions.map(t => (
          <div className="admin-row" key={t.id}>
            <div className="admin-row-main">
              <div className="admin-row-title">{fmtUGX(t.amount)} · {t.buyer?.full_name} → {t.seller?.full_name}</div>
              <div className="admin-row-sub">{t.payment_method} · {t.phone_number} · commission {fmtUGX(t.commission_amount)} · {new Date(t.created_at).toLocaleDateString()}</div>
            </div>
            <span className="badge" style={{ background: '#F2E4D8', color: 'var(--clay)' }}>{t.status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
