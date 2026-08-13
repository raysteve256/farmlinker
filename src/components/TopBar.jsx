export default function TopBar({ initials, notifCount, chatCount, onNotif, onChats, onSettings, onAvatar }) {
  return (
    <div className="topbar">
      <div className="brand"><div className="dot" /><span className="brand-name">Farm Linker</span></div>
      <div className="top-actions">
        <button className="icon-btn" onClick={onNotif}>🔔{notifCount > 0 && <span className="dotbadge">{notifCount > 9 ? '9+' : notifCount}</span>}</button>
        <button className="icon-btn" onClick={onChats}>💬{chatCount > 0 && <span className="dotbadge">{chatCount > 9 ? '9+' : chatCount}</span>}</button>
        <button className="icon-btn" onClick={onSettings}>⚙️</button>
        <button className="avatar-btn" onClick={onAvatar}>{initials}</button>
      </div>
    </div>
  )
}
