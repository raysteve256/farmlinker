function fmtUGX(n) { return 'UGX ' + Number(n).toLocaleString() }

const QUICK_ACTIONS = {
  Farmer: [
    { icon: '📣', name: 'Post a listing', sub: 'Sell birds or eggs', goto: 'market', open: 'listing' },
    { icon: '🚑', name: 'Call a vet', sub: 'Report a sick flock', goto: 'vets', open: 'vetreq' },
    { icon: '🧰', name: 'Find supplies', sub: 'Feed, chicks, drugs', goto: 'suppliers' },
    { icon: '👥', name: 'Join a group', sub: 'Farmers, vets, buyers', goto: 'community' }
  ],
  Supplier: [
    { icon: '🧰', name: 'List a product', sub: 'Feed, chicks, equipment', goto: 'suppliers', open: 'supplier' },
    { icon: '🐔', name: 'Browse marketplace', sub: 'See farmer listings', goto: 'market' },
    { icon: '💬', name: 'Check messages', sub: 'Farmer inquiries', goto: 'chats' },
    { icon: '👥', name: 'Suppliers Network', sub: 'Chat with peers', goto: 'community' }
  ],
  Vet: [
    { icon: '🚑', name: 'View requests', sub: 'Open farmer call-outs', goto: 'vets' },
    { icon: '👥', name: 'Vets Circle', sub: 'Coordinate with peers', goto: 'community' },
    { icon: '💬', name: 'Check messages', sub: 'Direct inquiries', goto: 'chats' },
    { icon: '📢', name: 'Post a disease alert', sub: 'Warn nearby farms', goto: 'community', open: 'post' }
  ],
  Buyer: [
    { icon: '🐔', name: 'Browse marketplace', sub: 'Find birds & eggs', goto: 'market' },
    { icon: '🛒', name: 'Buyers Hub', sub: 'Chat with other buyers', goto: 'community' },
    { icon: '💬', name: 'Check messages', sub: 'Farmer replies', goto: 'chats' },
    { icon: '📢', name: 'Post a price update', sub: 'Share market info', goto: 'community', open: 'post' }
  ]
}

export default function Home({ me, listings, vets, onNavigate, onOpenModal }) {
  const actions = QUICK_ACTIONS[me.role] || QUICK_ACTIONS.Farmer
  const sub = me.role === 'Vet' ? 'Open call-outs and disease alerts from farmers around you.'
    : me.role === 'Supplier' ? 'Farmer inquiries and marketplace activity in your district.'
    : me.role === 'Buyer' ? 'Fresh listings from farmers near Mukono.'
    : 'Live listings, open vet requests, and supplier stock from farmers around you.'

  return (
    <div className="screen">
      <div className="hero-card">
        <span className="eyebrow">MUKONO · POULTRY NETWORK</span>
        <h2>Hello, {me.full_name.split(' ')[0]}.</h2>
        <p>{sub}</p>
        <div className="stat-row">
          <div className="stat"><div className="num">{listings.length}</div><div className="lb">Live listings</div></div>
          <div className="stat"><div className="num">{vets.filter(v => v.status === 'Available').length}</div><div className="lb">Vets on call</div></div>
          <div className="stat"><div className="num">9</div><div className="lb">Farmers reached</div></div>
        </div>
      </div>

      <div className="section-head"><h2>Quick actions</h2></div>
      <div className="quick-grid">
        {actions.map((a, i) => (
          <div key={i} className="quick-card" onClick={() => { onNavigate(a.goto); if (a.open) onOpenModal(a.open) }}>
            <span className="icon">{a.icon}</span><span className="name">{a.name}</span><span className="sub">{a.sub}</span>
          </div>
        ))}
      </div>

      <div className="section-head"><h2>Fresh in your district</h2></div>
      {listings.length === 0 && <div className="empty"><span className="glyph">🐔</span><p>No listings yet</p></div>}
      {listings.slice(0, 2).map(l => (
        <div className="card" key={l.id}>
          <div className="listing-top">
            <div><div className="listing-title">{l.title}</div><div className="listing-meta">{l.quantity} · {l.farmer_name}</div></div>
            <div className="price-tag">{fmtUGX(l.price)}</div>
          </div>
          <div className="listing-row"><span className="district-chip">📍 {l.location}</span><span className="badge trace">◎ {l.trace_stamp}</span></div>
        </div>
      ))}
    </div>
  )
}
