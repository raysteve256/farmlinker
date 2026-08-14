import { useState } from 'react'
import { setUserBanned, setUserRole } from '../lib/admin'

function initials(name) { return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }
const ROLES = ['Farmer', 'Buyer', 'Supplier', 'Vet', 'Admin']

export default function AdminUsers({ users, onRefresh, onToast, meId }) {
  const [busyId, setBusyId] = useState(null)

  async function toggleBan(u) {
    try {
      setBusyId(u.id)
      await setUserBanned(u.id, !u.is_banned)
      onToast(u.is_banned ? `${u.full_name} unbanned` : `${u.full_name} banned`)
      onRefresh()
    } catch (e) { onToast('Failed: ' + e.message) } finally { setBusyId(null) }
  }

  async function changeRole(u, role) {
    try {
      setBusyId(u.id)
      await setUserRole(u.id, role)
      onToast(`${u.full_name} role changed to ${role}`)
      onRefresh()
    } catch (e) { onToast('Failed: ' + e.message) } finally { setBusyId(null) }
  }

  return (
    <div>
      <div className="section-head"><h2>All users</h2><span className="count">{users.length} total</span></div>
      <div className="card">
        {users.map(u => (
          <div className="admin-row" key={u.id}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0, flex: 1 }}>
              <div className="account-avatar" style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>{initials(u.full_name)}</div>
              <div className="admin-row-main">
                <div className="admin-row-title">{u.full_name} {u.id === meId && '(you)'}</div>
                <div className="admin-row-sub">{u.subcounty || '—'} · {u.phone || 'no phone'} {u.is_banned && <span style={{ color: 'var(--clay)' }}>· BANNED</span>}</div>
              </div>
            </div>
            <select className="role-select-inline" value={u.role} disabled={busyId === u.id} onChange={e => changeRole(u, e.target.value)}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
            {u.id !== meId && (
              <button className={u.is_banned ? 'ghost-btn' : 'danger-btn'} disabled={busyId === u.id} onClick={() => toggleBan(u)}>
                {u.is_banned ? 'Unban' : 'Ban'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
