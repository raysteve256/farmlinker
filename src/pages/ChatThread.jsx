import { useEffect, useRef, useState } from 'react'
import { getMessages, sendMessage, markConversationRead, uploadImage, joinGroupIfNeeded } from '../lib/data'

function initials(name) { return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }

export default function ChatThread({ me, conversation, onBack, onToast, onMessageSent }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bodyRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        if (conversation.type === 'group') await joinGroupIfNeeded(conversation.id, me.id)
        const msgs = await getMessages(conversation.id)
        if (!cancelled) setMessages(msgs)
        await markConversationRead(conversation.id, me.id)
      } catch (e) {
        onToast('Could not load chat: ' + e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [conversation.id])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages])

  function pickFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f); setPreview(URL.createObjectURL(f))
  }

  async function send() {
    if (!text.trim() && !file) return
    try {
      setSending(true)
      let imageUrl = null
      if (file) imageUrl = await uploadImage(file, 'chat')
      const msg = await sendMessage({ conversationId: conversation.id, senderId: me.id, text: text.trim(), imageUrl })
      setMessages(prev => [...prev, msg])
      setText(''); setFile(null); setPreview(null)
      onMessageSent && onMessageSent(conversation, msg)
    } catch (e) {
      onToast('Could not send: ' + e.message)
    } finally {
      setSending(false)
    }
  }

  const title = conversation.type === 'group' ? conversation.title : conversation.otherName
  const sub = conversation.type === 'group' ? `${conversation.category} group` : 'Direct message'

  return (
    <div className="screen thread-screen" style={{ padding: 0 }}>
      <div className="thread-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <div className="chat-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>{initials(title)}</div>
        <div><div className="thread-title">{title}</div><div className="thread-sub">{sub}</div></div>
      </div>
      <div className="thread-body" ref={bodyRef}>
        {loading && <div className="loading">Loading…</div>}
        {!loading && messages.length === 0 && <div className="empty"><span className="glyph">💬</span><p>Say hello<br />Start the conversation.</p></div>}
        {!loading && messages.map(m => {
          const out = m.sender_id === me.id
          return (
            <div className={'bubble-row ' + (out ? 'out' : 'in')} key={m.id}>
              <div className="bubble">
                {!out && conversation.type === 'group' && <span className="sender">{m.sender_name}</span>}
                {m.text && <div>{m.text}</div>}
                {m.image_url && <img src={m.image_url} />}
                <div className="btime">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          )
        })}
      </div>
      {preview && (
        <div className="composer-preview">
          <div className="thumb-preview"><img src={preview} /><button className="rm" onClick={() => { setFile(null); setPreview(null) }}>×</button></div>
        </div>
      )}
      <div className="composer">
        <label className="clip-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          📎<input type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile} />
        </label>
        <textarea rows="1" value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Message..." />
        <button className="send-btn" disabled={sending} onClick={send}>➤</button>
      </div>
    </div>
  )
}
