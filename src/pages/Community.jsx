import { useState } from 'react'
import Modal from '../components/Modal'
import { uploadImage } from '../lib/data'

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return mins + 'm ago'
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs + 'h ago'
  return Math.floor(hrs / 24) + 'd ago'
}
function initials(name) { return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }

export default function Community({ me, posts, groups, onAddPost, onOpenGroup, modalOpen, onCloseModal, onToast }) {
  const [tab, setTab] = useState('feed')
  const [form, setForm] = useState({ type: 'Question', body: '' })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)

  function pickFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function submit() {
    if (!form.body && !file) { onToast('Write something or add a photo'); return }
    try {
      setBusy(true)
      let imageUrl = null
      if (file) imageUrl = await uploadImage(file, 'posts')
      await onAddPost({ type: form.type, body: form.body, imageUrl })
      setForm({ type: 'Question', body: '' }); setFile(null); setPreview(null)
      onCloseModal()
    } catch (e) { onToast('Could not post: ' + e.message) } finally { setBusy(false) }
  }

  return (
    <div className="screen">
      <div className="section-head"><h2>Community</h2><span className="count">{posts.length} posts</span></div>
      <div className="chip-row">
        <button className={'chip' + (tab === 'feed' ? ' active' : '')} onClick={() => setTab('feed')}>Feed</button>
        <button className={'chip' + (tab === 'groups' ? ' active' : '')} onClick={() => setTab('groups')}>Groups</button>
      </div>

      {tab === 'feed' && posts.slice().reverse().map(p => {
        const alert = p.type === 'Disease alert'
        return (
          <div className="card post-card" key={p.id}>
            <div className="head"><span className="author">{p.author_name}</span><span className="time">{timeAgo(p.created_at)}</span></div>
            <span className={'badge ' + (alert ? 'urgent' : 'open')} style={{ marginBottom: 8, display: 'inline-flex' }}>{p.type}</span>
            <p className="body">{p.body}</p>
            {p.image_url && <img className="post-img" src={p.image_url} />}
          </div>
        )
      })}

      {tab === 'groups' && groups.map(g => (
        <div className="chat-row" key={g.id} onClick={() => onOpenGroup(g)}>
          <div className="chat-avatar group">{initials(g.title)}</div>
          <div className="chat-info">
            <div className="chat-toprow"><span className="chat-name">{g.title}{g.category === me.role && <span className="badge mine" style={{ marginLeft: 4 }}>YOUR GROUP</span>}</span></div>
            <div className="chat-preview">{g.category} group</div>
          </div>
          {g.unread > 0 && <div className="chat-unread">{g.unread}</div>}
        </div>
      ))}

      <Modal open={modalOpen} onClose={onCloseModal} title="Post to community">
        <label>Type</label>
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>Question</option><option>Disease alert</option><option>Price update</option></select>
        <label>Message</label>
        <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Share what's happening on your farm..." />
        <div className="attach-row">
          <label className="attach-btn" style={{ margin: 0 }}>📷 Add photo<input type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile} /></label>
          {preview && <div className="thumb-preview"><img src={preview} /><button className="rm" onClick={() => { setFile(null); setPreview(null) }}>×</button></div>}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCloseModal}>Cancel</button>
          <button className="btn-primary" disabled={busy} onClick={submit}>{busy ? 'Posting…' : 'Post'}</button>
        </div>
      </Modal>
    </div>
  )
}
