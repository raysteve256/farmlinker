import { useState } from 'react'
import Modal from '../components/Modal'
import PaymentModal from '../components/PaymentModal'
import { distanceKm, fmtDistance } from '../lib/geo'

function fmtUGX(n) { return 'UGX ' + Number(n).toLocaleString() }
const CATS = ['Feed', 'Day-old chicks', 'Equipment', 'Drugs & vaccines']

export default function Suppliers({ me, suppliers, onAdd, onContact, modalOpen, onCloseModal, onToast }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [sortNearest, setSortNearest] = useState(true)
  const [form, setForm] = useState({ category: 'Feed', name: '', price: '', location: '' })
  const [busy, setBusy] = useState(false)
  const [payItem, setPayItem] = useState(null)

  const iHaveLocation = me.latitude != null && me.longitude != null

  const q = query.trim().toLowerCase()
  let items = suppliers
    .filter(s => {
      if (filter !== 'all' && s.category !== filter) return false
      if (!q) return true
      return s.name.toLowerCase().includes(q)
        || s.location.toLowerCase().includes(q)
        || (s.supplier_name || '').toLowerCase().includes(q)
    })
    .map(s => ({ ...s, _km: iHaveLocation ? distanceKm(me.latitude, me.longitude, s.owner_lat, s.owner_lng) : null }))

  if (sortNearest && iHaveLocation) {
    items = items.slice().sort((a, b) => {
      if (a._km === null) return 1
      if (b._km === null) return -1
      return a._km - b._km
    })
  }

  async function submit() {
    if (!form.name || !form.price || !form.location) { onToast('Fill in product, price and location'); return }
    try {
      setBusy(true)
      await onAdd({ category: form.category, name: form.name, price: Number(form.price), location: form.location })
      setForm({ category: 'Feed', name: '', price: '', location: '' })
      onCloseModal()
    } catch (e) { onToast('Could not list: ' + e.message) } finally { setBusy(false) }
  }

  return (
    <div className="screen">
      <div className="section-head"><h2>Suppliers</h2><span className="count">{items.length} listed</span></div>
      <div className="search-box">
        <span className="ic">🔍</span>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products, location, supplier..." />
        {query && <button className="clear" onClick={() => setQuery('')}>×</button>}
      </div>
      <div className="chip-row">
        <button className={'chip' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>All</button>
        {CATS.map(c => <button key={c} className={'chip' + (filter === c ? ' active' : '')} onClick={() => setFilter(c)}>{c}</button>)}
        {iHaveLocation && (
          <button className={'chip' + (sortNearest ? ' active' : '')} onClick={() => setSortNearest(!sortNearest)}>📍 Nearest first</button>
        )}
      </div>
      {!iHaveLocation && (
        <div className="card" style={{ padding: 12, marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Share your location in Settings to see distances and sort suppliers by proximity.</p>
        </div>
      )}
      {items.length === 0 && suppliers.length === 0 && <div className="empty"><span className="glyph">🧰</span><p><strong>No suppliers yet</strong><br />Suppliers in your district will appear here.</p></div>}
      {items.length === 0 && suppliers.length > 0 && <div className="empty"><span className="glyph">🔍</span><p><strong>No matches</strong><br />Try a different search term or filter.</p></div>}
      {items.map(s => {
        const mine = s.supplier_id === me.id
        return (
          <div className="card" key={s.id}>
            <div className="listing-top">
              <div><div className="listing-title">{s.name}</div><div className="listing-meta">{s.category} · {s.supplier_name}</div></div>
              <div className="price-tag">{fmtUGX(s.price)}</div>
            </div>
            <div className="listing-row">
              <span className="district-chip">📍 {s.location}{s._km !== null && s._km !== undefined ? ` · ${fmtDistance(s._km)}` : ''}</span>
              {mine ? <span className="badge mine">YOURS</span> : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="ghost-btn" onClick={() => setPayItem(s)}>💰 Pay</button>
                  <button className="contact-btn" onClick={() => onContact(s.supplier_id, s.supplier_name)}>Contact supplier</button>
                </div>
              )}
            </div>
          </div>
        )
      })}

      <Modal open={modalOpen} onClose={onCloseModal} title="List your product">
        <label>Category</label>
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
        <label>Product name</label>
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Layers mash, 70kg bag" />
        <label>Price (UGX)</label>
        <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g. 95000" />
        <label>Sub-county</label>
        <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Mukono Town" />
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCloseModal}>Cancel</button>
          <button className="btn-primary" disabled={busy} onClick={submit}>{busy ? 'Listing…' : 'List product'}</button>
        </div>
      </Modal>

      <PaymentModal item={payItem} itemType="supplier_product" me={me} onClose={() => setPayItem(null)} onToast={onToast} />
    </div>
  )
}
