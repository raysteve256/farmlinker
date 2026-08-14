import { useState } from 'react'
import { deleteListingAdmin, deletePostAdmin } from '../lib/admin'

function fmtUGX(n) { return 'UGX ' + Number(n).toLocaleString() }

export default function AdminContent({ listings, posts, vetRequests, onRefresh, onToast }) {
  const [tab, setTab] = useState('listings')
  const [busyId, setBusyId] = useState(null)

  async function removeListing(id) {
    if (!confirm('Delete this listing?')) return
    try { setBusyId(id); await deleteListingAdmin(id); onToast('Listing removed'); onRefresh() }
    catch (e) { onToast('Failed: ' + e.message) } finally { setBusyId(null) }
  }
  async function removePost(id) {
    if (!confirm('Delete this post?')) return
    try { setBusyId(id); await deletePostAdmin(id); onToast('Post removed'); onRefresh() }
    catch (e) { onToast('Failed: ' + e.message) } finally { setBusyId(null) }
  }

  return (
    <div>
      <div className="section-head"><h2>Content moderation</h2></div>
      <div className="chip-row">
        <button className={'chip' + (tab === 'listings' ? ' active' : '')} onClick={() => setTab('listings')}>Listings ({listings.length})</button>
        <button className={'chip' + (tab === 'posts' ? ' active' : '')} onClick={() => setTab('posts')}>Posts ({posts.length})</button>
        <button className={'chip' + (tab === 'vets' ? ' active' : '')} onClick={() => setTab('vets')}>Vet requests ({vetRequests.length})</button>
      </div>

      {tab === 'listings' && (
        <div className="card">
          {listings.map(l => (
            <div className="admin-row" key={l.id}>
              <div className="admin-row-main">
                <div className="admin-row-title">{l.title}</div>
                <div className="admin-row-sub">{l.profiles?.full_name} · {fmtUGX(l.price)} · {l.trace_stamp}</div>
              </div>
              <button className="danger-btn" disabled={busyId === l.id} onClick={() => removeListing(l.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'posts' && (
        <div className="card">
          {posts.map(p => (
            <div className="admin-row" key={p.id}>
              <div className="admin-row-main">
                <div className="admin-row-title">{p.type} — {p.profiles?.full_name}</div>
                <div className="admin-row-sub">{p.body.slice(0, 60)}{p.body.length > 60 ? '…' : ''}</div>
              </div>
              <button className="danger-btn" disabled={busyId === p.id} onClick={() => removePost(p.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'vets' && (
        <div className="card">
          {vetRequests.map(r => (
            <div className="admin-row" key={r.id}>
              <div className="admin-row-main">
                <div className="admin-row-title">{r.farmer?.full_name} · {r.urgency}</div>
                <div className="admin-row-sub">{r.issue.slice(0, 60)}{r.issue.length > 60 ? '…' : ''} · status: {r.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
