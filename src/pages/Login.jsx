import { useEffect, useState } from 'react'
import Modal from '../components/Modal'
import { listProfiles, claimProfile, createProfile, adminSignUp, adminSignIn } from '../lib/auth'
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

  const [adminModalOpen, setAdminModalOpen] = useState(false)
  const [adminMode, setAdminMode] = useState('signin') // 'signin' | 'signup'
  const [adminForm, setAdminForm] = useState({ email: '', password: '' })
  const [adminBusy, setAdminBusy] = useState(false)
  const [adminNotice, setAdminNotice] = useState(null)

  useEffect(() => {
    // Admin accounts never appear in the public tap-to-login list — see
    // the "bootstrap admin claim" RLS policy for why that's enforced at
    // the database level too, not just hidden here.
    listProfiles()
      .then(rows => setAccounts(rows.filter(a => !a.is_admin)))
      .catch(() => onToast('Could not load accounts — check your connection'))
      .finally(() => setLoading(false))
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

  async function submitAdmin() {
    if (!adminForm.email.trim() || adminForm.password.length < 6) {
      onToast('Enter a valid email and a password of at least 6 characters')
      return
    }
    try {
      setAdminBusy(true)
      setAdminNotice(null)
      if (adminMode === 'signup') {
        const result = await adminSignUp(adminForm.email.trim(), adminForm.password)
        if (result.needsEmailConfirmation) {
          setAdminNotice('Check your email to confirm your address, then come back and sign in.')
          setAdminMode('signin')
          return
        }
        onLoggedIn(result.profile)
      } else {
        const result = await adminSignIn(adminForm.email.trim(), adminForm.password)
        onLoggedIn(result.profile)
      }
    } catch (e) {
      onToast('Admin access failed: ' + e.message)
    } finally {
      setAdminBusy(false)
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
      <p className="login-foot">
        Real Supabase-backed accounts — tap any to log in, no password needed yet.<br />
        <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setAdminNotice(null); setAdminModalOpen(true) }}>Platform admin? Access here</span>
      </p>

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

      <Modal open={adminModalOpen} onClose={() => setAdminModalOpen(false)} title={adminMode === 'signup' ? 'Set up admin access' : 'Admin sign in'}>
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>
          {adminMode === 'signup'
            ? 'One-time setup — this links your email/password to the platform admin account. Only works once; whoever completes it first owns admin access.'
            : 'Real email/password sign-in — separate from the demo tap-to-login accounts above.'}
        </p>
        {adminNotice && <p style={{ fontSize: 12, color: 'var(--leaf-deep)', marginTop: 8 }}>{adminNotice}</p>}
        <label>Email</label>
        <input type="email" value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="you@example.com" />
        <label>Password</label>
        <input type="password" value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="At least 6 characters" />
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setAdminMode(adminMode === 'signup' ? 'signin' : 'signup')}>
            {adminMode === 'signup' ? 'I have access already' : 'First-time setup'}
          </button>
          <button className="btn-primary" disabled={adminBusy} onClick={submitAdmin}>
            {adminBusy ? 'Please wait…' : adminMode === 'signup' ? 'Set up access' : 'Sign in'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
