import { useState } from 'react'

export default function Settings({ onToast }) {
  const [msgNotif, setMsgNotif] = useState(true)
  const [postNotif, setPostNotif] = useState(true)
  const [lang, setLang] = useState('en')

  return (
    <div className="screen">
      <div className="section-head"><h2>Settings</h2></div>
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
