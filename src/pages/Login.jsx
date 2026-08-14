import { useEffect, useState } from 'react'
import Modal from '../components/Modal'
import { listProfiles, claimProfile, createProfile } from '../lib/auth'
import { requestBrowserLocation } from '../lib/geo'

function initials(name) { return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }
const ROLE_ICON = { Farmer: '🐔', Buyer: '🛒', Supplier: '🧰', Vet: '💉' }

export default function Login({ onLoggedIn, onToast }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ full_name: '', role: 'Farmer', phone: '', subcounty: '' })
  const [busy, setBusy] = useState(false)
  const [coords, setCoords] = useState(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    listProfiles().then(setAccounts).catch(() => onToast('Could not load accounts — check your connection')).finally(() => setLoading(false))
  }, [])

  async function shareLocation() {
    try {
      setLocating(true)
      const pos = await requestBrowserLocation()
      setCoords(pos)
      onToast('Location captured')
    } catch (e) {
      onToast(e.message)
    } finally {
      setLocating(false)
    }
  }

  async function login(id) {
    try {
      setBusy(true)
      const profile = await claimProfile(id)
      onLoggedIn(profile)
    } catch (e) {
      onToast('Login failed: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitNew() {
    if (!form.full_name.trim()) { onToast('Enter your name'); return }
    try {
      setBusy(true)
      const profile = await createProfile({
        full_name: form.full_name.trim(), role: form.role,
        phone: form.phone.trim() || null, subcounty: form.subcounty.trim() || 'Mukono',
        latitude: coords?.latitude, longitude: coords?.longitude
      })
      onLoggedIn(profile)
    } catch (e) {
      onToast('Could not create account: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dark-screen">
      <div className="stamp-mark"><span>MUKONO<br />UGANDA</span></div>
      <h1>Every bird,<br />every buyer,<br /><em>one line.</em></h1>
      <p className="tagline">Farm Linker connects poultry farmers in Mukono to buyers, suppliers and vets. Log in to continue.</p>

      {loading ? (
        <div className="loading" style={{ color: '#C9C3AE' }}>Loading accounts…</div>
      ) : (
        <div>
          {accounts.map(a => (
            <div key={a.id} className="account-row" onClick={() => !busy && login(a.id)}>
              <div className="account-avatar">{initials(a.full_name)}</div>
              <div>
                <div className="account-name">{a.full_name}</div>
                <div className="account-role">{ROLE_ICON[a.role] || '👤'} {a.role} · {a.subcounty}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="new-account-btn" onClick={() => setModalOpen(true)}>+ Create a new account</button>
      <p className="login-foot">Real Supabase-backed accounts — tap any to log in, no password needed yet.</p>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create account">
        <label>Full name</label>
        <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Auma R." />
        <label>Role</label>
        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
          <option>Farmer</option><option>Buyer</option><option>Supplier</option><option>Vet</option>
        </select>
        <label>Phone</label>
        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +256 7XX 000 000" />
        <label>Sub-county</label>
        <input value={form.subcounty} onChange={e => setForm({ ...form, subcounty: e.target.value })} placeholder="e.g. Goma, Mukono" />
        <div className="attach-row">
          <button className="attach-btn" type="button" disabled={locating} onClick={shareLocation}>
            {coords ? '📍 Location captured' : locating ? '📍 Locating…' : '📍 Share my location'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
          Sharing your location lets other farmers, buyers and vets find you by proximity. Optional — you can skip this and add it later in Settings.
        </p>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" disabled={busy} onClick={submitNew}>{busy ? 'Creating…' : 'Create & log in'}</button>
        </div>
      </Modal>
    </div>
  )
}
