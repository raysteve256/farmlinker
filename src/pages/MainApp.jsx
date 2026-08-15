import { useEffect, useRef, useState } from 'react'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Toast from '../components/Toast'
import Login from './Login'
import Home from './Home'
import Marketplace from './Marketplace'
import Suppliers from './Suppliers'
import Vets from './Vets'
import Community from './Community'
import Chats from './Chats'
import ChatThread from './ChatThread'
import Profile from './Profile'
import Settings from './Settings'
import AdminApp from './AdminApp'
import { getMyProfile, logout as authLogout, adminLogout } from '../lib/auth'
import {
  getListings, addListing, getSuppliers, addSupplierProduct,
  getVets, getVetRequests, addVetRequest, acceptVetRequest, resolveVetRequest,
  getPosts, addPost, getMyConversations, getOrCreateDM, markConversationRead,
  getMyNotifications, markNotificationRead, pushNotification, notifyRoleGroup
} from '../lib/data'
import { supabase } from '../supabaseClient'

function initials(name) { return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }

export default function MainApp() {
  const [me, setMe] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [screen, setScreen] = useState('home')
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)

  const [listings, setListings] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [vets, setVets] = useState([])
  const [vetRequests, setVetRequests] = useState([])
  const [posts, setPosts] = useState([])
  const [dms, setDms] = useState([])
  const [groups, setGroups] = useState([])
  const [notifications, setNotifications] = useState([])
  const [activeThread, setActiveThread] = useState(null)

  const toastRef = useRef(null)
  const toast = (msg) => toastRef.current?.fire(msg)

  useEffect(() => {
    getMyProfile().then(p => { setMe(p); setCheckingSession(false) })
  }, [])

  useEffect(() => {
    if (me) loadAll()
  }, [me?.id])

  async function loadAll() {
    setLoading(true)
    try {
      const [l, s, v, vr, p] = await Promise.all([getListings(), getSuppliers(), getVets(), getVetRequests(), getPosts()])
      setListings(l); setSuppliers(s); setVets(v); setVetRequests(vr); setPosts(p)
      await refreshChatsAndNotifs()
    } catch (e) {
      toast('Could not load data: ' + e.message)
    }
    setLoading(false)
  }

  async function refreshChatsAndNotifs() {
    const { dms: dmRows, groups: groupRows } = await getMyConversations(me.id, me.role)
    const dmWithNames = await Promise.all(dmRows.map(async d => {
      const { data: parts } = await supabase.from('conversation_participants').select('profile_id, profiles(full_name)').eq('conversation_id', d.id)
      const other = (parts || []).find(p => p.profile_id !== me.id)
      return { ...d, otherName: other?.profiles?.full_name || 'Contact' }
    }))
    setDms(dmWithNames)
    setGroups(groupRows)
    const notifs = await getMyNotifications(me.id)
    setNotifications(notifs)
  }

  function onLoggedIn(profile) {
    setMe(profile)
  }

  async function handleLogout() {
    if (me?.role === 'Admin') await adminLogout()
    else authLogout()
    setMe(null)
    setScreen('home')
  }

  async function handleAddListing(payload) {
    const entry = await addListing({ ownerId: me.id, ...payload })
    setListings(prev => [entry, ...prev])
    toast('Listing posted — stamped ' + entry.trace_stamp)
  }
  async function handleAddSupplier(payload) {
    const entry = await addSupplierProduct({ ownerId: me.id, ...payload })
    setSuppliers(prev => [entry, ...prev])
    toast('Product listed')
  }
  async function handleAddVetRequest(payload) {
    const entry = await addVetRequest({ farmerId: me.id, ...payload })
    setVetRequests(prev => [entry, ...prev])
    toast('Vet request sent')
  }
  async function handleAccept(requestId, vetId) {
    await acceptVetRequest(requestId, vetId)
    const req = vetRequests.find(r => r.id === requestId)
    if (req) await pushNotification({ recipientId: req.farmer_id, kind: 'message', title: 'Vet update', body: 'Your vet request was accepted.', targetScreen: 'vets' })
    setVetRequests(await getVetRequests())
    toast('Request accepted')
  }
  async function handleResolve(requestId) {
    await resolveVetRequest(requestId)
    const req = vetRequests.find(r => r.id === requestId)
    if (req) await pushNotification({ recipientId: req.farmer_id, kind: 'message', title: 'Vet update', body: 'Your vet request was marked resolved.', targetScreen: 'vets' })
    setVetRequests(await getVetRequests())
    toast('Marked resolved')
  }
  async function handleAddPost({ type, body, imageUrl }) {
    const entry = await addPost({ authorId: me.id, type, body, imageUrl })
    setPosts(prev => [entry, ...prev])
    await notifyRoleGroup(null, me.id, { kind: 'post', title: 'New post from ' + me.full_name, body: body || 'Shared a photo', targetScreen: 'community' })
    toast('Posted to community')
  }

  async function handleContact(otherId, otherName) {
    if (!otherId) { toast('This contact is not on Farm Linker yet.'); return }
    if (otherId === me.id) return
    try {
      const convoId = await getOrCreateDM(me.id, otherId)
      await refreshChatsAndNotifs()
      setActiveThread({ id: convoId, type: 'dm', otherName })
      setScreen('thread')
    } catch (e) { toast('Could not open chat: ' + e.message) }
  }

  function openGroup(g) {
    setActiveThread({ ...g, type: 'group' })
    setScreen('thread')
  }
  function openDM(c) {
    setActiveThread({ ...c, type: 'dm' })
    setScreen('thread')
  }

  async function onNotifOpen(n) {
    await markNotificationRead(n.id)
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    setModal(null)
    if (n.target_screen === 'thread' && n.target_id) {
      // best effort: reload chats then open matching conversation
      await refreshChatsAndNotifs()
    } else {
      setScreen(n.target_screen || 'community')
    }
  }

  const unreadChats = dms.reduce((s, c) => s + (c.unread || 0), 0) + groups.reduce((s, g) => s + (g.unread || 0), 0)
  const unreadNotifs = notifications.filter(n => !n.read).length

  if (checkingSession) return <div className="app"><div className="loading">Loading Farm Linker…</div></div>
  if (!me) return <div className="app"><Login onLoggedIn={onLoggedIn} onToast={toast} /></div>
  if (me.role === 'Admin') return <AdminApp me={me} onLogout={handleLogout} />

  return (
    <div className="app app--shell">
      <TopBar
        initials={initials(me.full_name)}
        notifCount={unreadNotifs}
        chatCount={unreadChats}
        onNotif={() => setModal('notif')}
        onChats={() => setScreen('chats')}
        onSettings={() => setScreen('settings')}
        onAvatar={() => setScreen('profile')}
      />

      {loading ? <div className="loading">Loading Farm Linker…</div> : (
        <>
          {screen === 'home' && <Home me={me} listings={listings} vets={vets} onNavigate={setScreen} onOpenModal={setModal} />}
          {screen === 'market' && <Marketplace me={me} listings={listings} onAdd={handleAddListing} onContact={handleContact} modalOpen={modal === 'listing'} onCloseModal={() => setModal(null)} onToast={toast} />}
          {screen === 'suppliers' && <Suppliers me={me} suppliers={suppliers} onAdd={handleAddSupplier} onContact={handleContact} modalOpen={modal === 'supplier'} onCloseModal={() => setModal(null)} onToast={toast} />}
          {screen === 'vets' && <Vets me={me} vets={vets} vetRequests={vetRequests} onAdd={handleAddVetRequest} onContact={handleContact} onAccept={handleAccept} onResolve={handleResolve} modalOpen={modal === 'vetreq'} onCloseModal={() => setModal(null)} onToast={toast} />}
          {screen === 'community' && <Community me={me} posts={posts} groups={groups} onAddPost={handleAddPost} onOpenGroup={openGroup} modalOpen={modal === 'post'} onCloseModal={() => setModal(null)} onToast={toast} />}
          {screen === 'chats' && <Chats dms={dms} groups={groups} onOpen={(c) => c.type === 'group' || c.category ? openGroup(c) : openDM(c)} />}
          {screen === 'thread' && activeThread && (
            <ChatThread me={me} conversation={activeThread} onBack={() => { refreshChatsAndNotifs(); setScreen('chats') }} onToast={toast} onMessageSent={refreshChatsAndNotifs} />
          )}
          {screen === 'profile' && <Profile me={me} onLogout={handleLogout} />}
          {screen === 'settings' && <Settings me={me} onToast={toast} onLocationUpdated={setMe} />}
        </>
      )}

      {!['thread', 'chats', 'settings', 'profile'].includes(screen) && (
        <div className="fab">
          <button onClick={() => {
            if (screen === 'market') setModal('listing')
            else if (screen === 'suppliers') setModal('supplier')
            else if (screen === 'vets') setModal('vetreq')
            else if (screen === 'community') setModal('post')
            else setModal('listing')
          }}>+</button>
        </div>
      )}

      {screen !== 'thread' && <BottomNav screen={screen} onNavigate={setScreen} />}

      {modal === 'notif' && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal">
            <div className="modal-handle" />
            <h3>Notifications</h3>
            {notifications.length === 0 && <div className="empty"><span className="glyph">🔔</span><p>No notifications yet<br />New messages and posts will show up here.</p></div>}
            {notifications.map(n => (
              <div key={n.id} className={'notif-item' + (n.read ? '' : ' unread')} onClick={() => onNotifOpen(n)}>
                <div className="notif-ic">{n.kind === 'message' ? '💬' : '📢'}</div>
                <div className="notif-text"><b>{n.title}</b><br />{n.body}<div className="notif-time">{new Date(n.created_at).toLocaleString()}</div></div>
              </div>
            ))}
            <div className="modal-actions"><button className="btn-secondary" style={{ flex: 1 }} onClick={() => setModal(null)}>Close</button></div>
          </div>
        </div>
      )}

      <Toast ref={toastRef} />
    </div>
  )
}
