import { useState } from 'react'
import { requestBrowserLocation } from '../lib/geo'
import { updateProfileLocation } from '../lib/data'

export default function Settings({ me, onToast, onLocationUpdated }) {
  const [msgNotif, setMsgNotif] = useState(true)
  const [postNotif, setPostNotif] = useState(true)
  const [lang, setLang] = useState('en')
  const [locating, setLocating] = useState(false)

  const hasLocation = me?.latitude != null && me?.longitude != null

  async function shareLocation() {
    try {
      setLocating(true)
      const pos = await requestBrowserLocation()
      const updated = await updateProfileLocation(me.id, pos)
      onLocationUpdated && onLocationUpdated(updated)
      onToast('Location updated — others can now find you by proximity')
    } catch (e) {
      onToast(e.message)
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="screen">
      <div className="section-head"><h2>Settings</h2></div>
      <div className="card">
        <p className="eyebrow" style={{ marginBottom: 8 }}>LOCATION</p>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>
          {hasLocation
            ? 'Your location is set — nearby farmers, buyers, suppliers and vets can find you, and you can see distances to them.'
            : "You haven't shared your location yet, so distances won't show for you. Share it to enable proximity search."}
        </p>
        <button className="btn-secondary" style={{ width: '100%' }} disabled={locating} onClick={shareLocation}>
          {locating ? 'Locating…' : hasLocation ? '📍 Update my location' : '📍 Share my location'}
        </button>
      </div>
      <div className="card">
        <p className="eyebrow" style={{ marginBottom: 4 }}>NOTIFICATIONS</p>
        <div className="toggle-row">
          <div><div className="toggle-label">Message notifications</div><div className="toggle-sub">New chats and group messages</div></div>
          <div className={'switch' + (msgNotif ? ' on' : '')} onClick={() => setMsgNotif(!msgNotif)}><div className="knob" /></div>
        </div>
        <div className="toggle-row">
          <div><div className="toggle-label">Community alerts</div><div className="toggle-sub">Disease alerts & price updates</div></div>
          <div className={'switch' + (postNotif ? ' on' : '')} onClick={() => setPostNotif(!postNotif)}><div className="knob" /></div>
        </div>
      </div>
      <div className="card">
        <p className="eyebrow" style={{ marginBottom: 4 }}>LANGUAGE</p>
        <div className="chip-row" style={{ marginTop: 10, marginBottom: 0 }}>
          <button className={'chip' + (lang === 'en' ? ' active' : '')} onClick={() => { setLang('en'); onToast('English selected') }}>English</button>
          <button className={'chip' + (lang === 'lg' ? ' active' : '')} onClick={() => { setLang('lg'); onToast('Luganda selected (translations coming soon)') }}>Luganda</button>
        </div>
      </div>
    </div>
  )
}
