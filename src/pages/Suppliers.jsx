import { useState } from 'react'
import Modal from '../components/Modal'

function fmtUGX(n) { return 'UGX ' + Number(n).toLocaleString() }
const CATS = ['Feed', 'Day-old chicks', 'Equipment', 'Drugs & vaccines']

export default function Suppliers({ me, suppliers, onAdd, onContact, modalOpen, onCloseModal, onToast }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({ category: 'Feed', name: '', price: '', location: '' })
  const [busy, setBusy] = useState(false)

  const q = query.trim().toLowerCase()
  const items = suppliers.filter(s => {
    if (filter !== 'all' && s.category !== filter) return false
    if (!q) return true
    return s.name.toLowerCase().includes(q)
      || s.location.toLowerCase().includes(q)
      || (s.supplier_name || '').toLowerCase().includes(q)
  })

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
      </div>
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
              <span className="district-chip">📍 {s.location}</span>
              {mine ? <span className="badge mine">YOURS</span> : <button className="contact-btn" onClick={() => onContact(s.supplier_id, s.supplier_name)}>Contact supplier</button>}
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
    </div>
  )
}
