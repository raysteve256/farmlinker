function initials(name) { return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }

export default function Chats({ dms, groups, onOpen }) {
  return (
    <div className="screen">
      <div className="section-head"><h2>Chats</h2></div>
      <div className="section-head"><h2 style={{ fontSize: 15 }}>Direct</h2></div>
      {dms.length === 0 && <div className="empty"><span className="glyph">💬</span><p>No direct chats yet<br />Contact a farmer, supplier or vet to start one.</p></div>}
      {dms.map(c => (
        <div className="chat-row" key={c.id} onClick={() => onOpen(c)}>
          <div className="chat-avatar">{initials(c.otherName)}</div>
          <div className="chat-info">
            <div className="chat-toprow"><span className="chat-name">{c.otherName}</span></div>
            <div className="chat-preview">{c.preview || 'No messages yet'}</div>
          </div>
          {c.unread > 0 && <div className="chat-unread">{c.unread}</div>}
        </div>
      ))}
      <div className="section-head" style={{ marginTop: 18 }}><h2 style={{ fontSize: 15 }}>Groups</h2></div>
      {groups.map(g => (
        <div className="chat-row" key={g.id} onClick={() => onOpen(g)}>
          <div className="chat-avatar group">{initials(g.title)}</div>
          <div className="chat-info">
            <div className="chat-toprow"><span className="chat-name">{g.title}</span></div>
            <div className="chat-preview">{g.category} group</div>
          </div>
          {g.unread > 0 && <div className="chat-unread">{g.unread}</div>}
        </div>
      ))}
    </div>
  )
}
