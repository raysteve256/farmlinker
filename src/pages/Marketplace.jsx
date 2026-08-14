import { useState } from 'react'
import Modal from '../components/Modal'
import TraceabilityModal from '../components/TraceabilityModal'

function fmtUGX(n) { return 'UGX ' + Number(n).toLocaleString() }

export default function Marketplace({ me, listings, onAdd, onContact, modalOpen, onCloseModal, onToast }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({ type: 'Live birds', title: '', quantity: '', price: '', location: '' })
  const [busy, setBusy] = useState(false)
  const [traceListing, setTraceListing] = useState(null)

  const q = query.trim().toLowerCase()
  const items = listings.filter(l => {
    if (filter !== 'all' && l.type !== filter) return false
    if (!q) return true
    return l.title.toLowerCase().includes(q)
      || l.location.toLowerCase().includes(q)
      || (l.farmer_name || '').toLowerCase().includes(q)
      || l.trace_stamp.toLowerCase().includes(q)
  })

  async function submit() {
    if (!form.title || !form.price || !form.location) { onToast('Fill in title, price and location'); return }
    try {
      setBusy(true)
      await onAdd({ type: form.type, title: form.title, quantity: form.quantity || '—', price: Number(form.price), location: form.location })
      setForm({ type: 'Live birds', title: '', quantity: '', price: '', location: '' })
      onCloseModal()
    } catch (e) { onToast('Could not post: ' + e.message) } finally { setBusy(false) }
  }

  return (
    <div className="screen">
      <div className="section-head"><h2>Marketplace</h2><span className="count">{items.length} listed</span></div>
      <div className="search-box">
        <span className="ic">🔍</span>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search listings, location, farmer..." />
        {query && <button className="clear" onClick={() => setQuery('')}>×</button>}
      </div>
      <div className="chip-row">
        {['all', 'Live birds', 'Eggs'].map(f => (
          <button key={f} className={'chip' + (filter === f ? ' active' : '')} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f}</button>
        ))}
      </div>
      {items.length === 0 && listings.length === 0 && <div className="empty"><span className="glyph">🐔</span><p><strong>No listings yet</strong><br />Be the first to post birds or eggs in your area.</p></div>}
      {items.length === 0 && listings.length > 0 && <div className="empty"><span className="glyph">🔍</span><p><strong>No matches</strong><br />Try a different search term or filter.</p></div>}
      {items.map(l => {
        const mine = l.farmer_id === me.id
        return (
          <div className="card" key={l.id}>
            <div className="listing-top">
              <div><div className="listing-title">{l.title}</div><div className="listing-meta">{l.quantity} · {l.farmer_name}</div></div>
              <div className="price-tag">{fmtUGX(l.price)}</div>
            </div>
            <div className="listing-row">
              <span className="district-chip">📍 {l.location}</span>
              <span className="badge trace" style={{ cursor: 'pointer' }} onClick={() => setTraceListing(l)}>◎ {l.trace_stamp} 🔍</span>
            </div>
            <div className="listing-row">
              <span></span>
              {mine ? <span className="badge mine">YOURS</span> : <button className="contact-btn" onClick={() => onContact(l.farmer_id, l.farmer_name)}>Contact farmer</button>}
            </div>
          </div>
        )
      })}

      <Modal open={modalOpen} onClose={onCloseModal} title="Post a listing">
        <label>Type</label>
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>Live birds</option><option>Eggs</option></select>
        <label>Title</label>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. 40 broilers, 6 weeks" />
        <label>Quantity</label>
        <input value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 40 birds" />
        <label>Price (UGX)</label>
        <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g. 18000" />
        <label>Sub-county</label>
        <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Goma, Mukono" />
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCloseModal}>Cancel</button>
          <button className="btn-primary" disabled={busy} onClick={submit}>{busy ? 'Posting…' : 'Post listing'}</button>
        </div>
      </Modal>

      <TraceabilityModal listing={traceListing} onClose={() => setTraceListing(null)} onToast={onToast} />
    </div>
  )
}
