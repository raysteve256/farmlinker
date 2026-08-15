import { useState } from 'react'
import Modal from '../components/Modal'
import { distanceKm, fmtDistance } from '../lib/geo'

export default function Vets({ me, vets, vetRequests, onAdd, onContact, onAccept, onResolve, modalOpen, onCloseModal, onToast }) {
  const [form, setForm] = useState({ issue: '', urgency: 'Routine', location: '' })
  const [busy, setBusy] = useState(false)
  const [sortNearest, setSortNearest] = useState(true)

  const iHaveLocation = me.latitude != null && me.longitude != null
  let sortedVets = vets.map(v => ({ ...v, _km: iHaveLocation ? distanceKm(me.latitude, me.longitude, v.owner_lat, v.owner_lng) : null }))
  if (sortNearest && iHaveLocation) {
    sortedVets = sortedVets.slice().sort((a, b) => {
      if (a._km === null) return 1
      if (b._km === null) return -1
      return a._km - b._km
    })
  }

  async function submit() {
    if (!form.issue || !form.location) { onToast("Describe the issue and location"); return }
    try {
      setBusy(true)
      await onAdd({ issue: form.issue, urgency: form.urgency, location: form.location })
      setForm({ issue: '', urgency: 'Routine', location: '' })
      onCloseModal()
    } catch (e) { onToast('Could not send: ' + e.message) } finally { setBusy(false) }
  }

  const isVet = me.role === 'Vet'
  const myVetRow = vets.find(v => v.ownerId === me.id)

  return (
    <div className="screen">
      <div className="section-head"><h2>{isVet ? 'Fellow vets' : 'Vets on call'}</h2><span className="count">{vets.length} nearby</span></div>
      {iHaveLocation && (
        <div className="chip-row">
          <button className={'chip' + (sortNearest ? ' active' : '')} onClick={() => setSortNearest(!sortNearest)}>📍 Nearest first</button>
        </div>
      )}
      {!iHaveLocation && (
        <div className="card" style={{ padding: 12, marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Share your location in Settings to find the nearest vet.</p>
        </div>
      )}
      <div className="card-grid">
      {sortedVets.map(v => {
        const mine = v.ownerId === me.id
        const open = v.status === 'Available'
        return (
          <div className="card" key={v.id}>
            <div className="listing-row" style={{ marginTop: 0 }}>
              <div><div className="vet-name">{v.name}</div><div className="listing-meta">{v.specialty}</div></div>
              <span className={'badge ' + (open ? 'open' : '')} style={!open ? { background: '#F2E4D8', color: 'var(--clay)' } : {}}>{v.status}</span>
            </div>
            <div className="listing-row">
              <span className="district-chip">📍 {v.location}{v._km !== null && v._km !== undefined ? ` · ${fmtDistance(v._km)}` : ''}</span>
              {mine ? <span className="badge mine">YOURS</span> : <button className="contact-btn" onClick={() => onContact(v.ownerId, v.name)}>Book</button>}
            </div>
          </div>
        )
      })}
      </div>

      <div className="section-head" style={{ marginTop: 22 }}><h2>{isVet ? 'Requests for you' : 'Your requests'}</h2></div>
      {isVet ? (
        (() => {
          const openReqs = vetRequests.filter(r => r.status !== 'resolved')
          if (openReqs.length === 0) return <div className="empty"><span className="glyph">🚑</span><p><strong>No open requests</strong><br />Farmer call-outs will appear here.</p></div>
          return openReqs.map(r => {
            const urgent = r.urgency === 'Urgent'
            return (
              <div className="card" key={r.id}>
                <div className="listing-row" style={{ marginTop: 0 }}>
                  <span className={'badge ' + (urgent ? 'urgent' : (r.status === 'accepted' ? 'accepted' : 'open'))}>
                    {urgent ? '⚠ URGENT' : r.status === 'accepted' ? 'ACCEPTED' : 'OPEN'}
                  </span>
                  <span className="district-chip">📍 {r.location}</span>
                </div>
                <p style={{ fontSize: 13.5, margin: '10px 0 4px', lineHeight: 1.5 }}>{r.issue}</p>
                <div className="listing-row">
                  {r.status === 'open'
                    ? <button className="ghost-btn" onClick={() => myVetRow && onAccept(r.id, myVetRow.id)}>Accept</button>
                    : <button className="ghost-btn" onClick={() => onResolve(r.id)}>Mark resolved</button>}
                  <span></span>
                </div>
              </div>
            )
          })
        })()
      ) : (
        (() => {
          const mine = vetRequests.filter(r => r.farmer_id === me.id)
          if (mine.length === 0) return <div className="empty"><span className="glyph">🚑</span><p><strong>No requests yet</strong><br />Tap the + button to report a sick flock.</p></div>
          return mine.map(r => {
            const urgent = r.urgency === 'Urgent'
            const statusBadge = r.status === 'resolved' ? <span className="badge accepted">RESOLVED</span>
              : r.status === 'accepted' ? <span className="badge accepted">ACCEPTED</span>
              : <span className={'badge ' + (urgent ? 'urgent' : 'open')}>{urgent ? '⚠ URGENT' : 'OPEN'}</span>
            return (
              <div className="card" key={r.id}>
                <div className="listing-row" style={{ marginTop: 0 }}>{statusBadge}<span className="district-chip">📍 {r.location}</span></div>
                <p style={{ fontSize: 13.5, marginTop: 10, lineHeight: 1.5 }}>{r.issue}</p>
              </div>
            )
          })
        })()
      )}

      <Modal open={modalOpen} onClose={onCloseModal} title="Request a vet">
        <label>What's wrong?</label>
        <textarea value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })} placeholder="e.g. 5 birds showing swollen heads, low appetite since yesterday" />
        <label>Urgency</label>
        <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })}><option>Routine</option><option>Urgent</option></select>
        <label>Sub-county</label>
        <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Goma, Mukono" />
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCloseModal}>Cancel</button>
          <button className="btn-primary" disabled={busy} onClick={submit}>{busy ? 'Sending…' : 'Send request'}</button>
        </div>
      </Modal>
    </div>
  )
}
