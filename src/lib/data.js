import { supabase } from '../supabaseClient'

function traceStamp() {
  return 'MK-' + (1000 + Math.floor(Math.random() * 8999))
}

// ---------- Image upload ----------
export async function uploadImage(file, folder) {
  const ext = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('farmlinker-media').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('farmlinker-media').getPublicUrl(path)
  return data.publicUrl
}

// ---------- Listings ----------
export async function getListings() {
  const { data, error } = await supabase
    .from('listings')
    .select('*, profiles!listings_farmer_id_fkey(id, full_name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(l => ({ ...l, farmer_name: l.profiles?.full_name || 'Farmer' }))
}

export async function addListing({ ownerId, type, title, quantity, price, location }) {
  const { data, error } = await supabase
    .from('listings')
    .insert({ farmer_id: ownerId, type, title, quantity, price, location, trace_stamp: traceStamp() })
    .select('*, profiles!listings_farmer_id_fkey(id, full_name)')
    .single()
  if (error) throw error
  return { ...data, farmer_name: data.profiles?.full_name }
}

// ---------- Suppliers ----------
export async function getSuppliers() {
  const { data, error } = await supabase
    .from('supplier_products')
    .select('*, profiles!supplier_products_supplier_id_fkey(id, full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(s => ({ ...s, supplier_name: s.profiles?.full_name || 'Supplier' }))
}

export async function addSupplierProduct({ ownerId, category, name, price, location }) {
  const { data, error } = await supabase
    .from('supplier_products')
    .insert({ supplier_id: ownerId, category, name, price, location })
    .select('*, profiles!supplier_products_supplier_id_fkey(id, full_name)')
    .single()
  if (error) throw error
  return { ...data, supplier_name: data.profiles?.full_name }
}

// ---------- Vets ----------
export async function getVets() {
  const { data, error } = await supabase
    .from('vets')
    .select('*, profiles!vets_profile_id_fkey(id, full_name)')
  if (error) throw error
  return data.map(v => ({ ...v, name: v.profiles?.full_name || 'Vet', ownerId: v.profile_id }))
}

export async function getVetRequests() {
  const { data, error } = await supabase
    .from('vet_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addVetRequest({ farmerId, issue, urgency, location }) {
  const { data, error } = await supabase
    .from('vet_requests')
    .insert({ farmer_id: farmerId, issue, urgency, location, status: 'open' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function acceptVetRequest(requestId, vetId) {
  const { error } = await supabase
    .from('vet_requests')
    .update({ status: 'accepted', vet_id: vetId })
    .eq('id', requestId)
  if (error) throw error
}

export async function resolveVetRequest(requestId) {
  const { error } = await supabase
    .from('vet_requests')
    .update({ status: 'resolved' })
    .eq('id', requestId)
  if (error) throw error
}

// ---------- Community posts ----------
export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles!posts_author_id_fkey(id, full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(p => ({ ...p, author_name: p.profiles?.full_name || 'Farmer' }))
}

export async function addPost({ authorId, type, body, imageUrl }) {
  const { data, error } = await supabase
    .from('posts')
    .insert({ author_id: authorId, type, body, image_url: imageUrl || null })
    .select('*, profiles!posts_author_id_fkey(id, full_name)')
    .single()
  if (error) throw error
  return { ...data, author_name: data.profiles?.full_name }
}

// ---------- Conversations, messages, notifications ----------
export async function getMyConversations(profileId, role) {
  // DMs I'm part of
  const { data: parts, error: partsErr } = await supabase
    .from('conversation_participants')
    .select('conversation_id, unread_count, conversations(id, type, title, category)')
    .eq('profile_id', profileId)
  if (partsErr) throw partsErr

  // Group I'm a member of by role (auto-membership)
  const { data: groups, error: groupsErr } = await supabase
    .from('conversations')
    .select('id, type, title, category')
    .eq('type', 'group')
    .eq('category', role)
  if (groupsErr) throw groupsErr

  const dmRows = parts.filter(p => p.conversations?.type === 'dm').map(p => ({
    ...p.conversations, unread: p.unread_count || 0
  }))
  const groupUnread = {}
  parts.forEach(p => { if (p.conversations?.type === 'group') groupUnread[p.conversation_id] = p.unread_count || 0 })
  const groupRows = groups.map(g => ({ ...g, unread: groupUnread[g.id] || 0 }))

  return { dms: dmRows, groups: groupRows }
}

export async function getOrCreateDM(myProfileId, otherProfileId) {
  const { data: mine } = await supabase
    .from('conversation_participants')
    .select('conversation_id, conversations!inner(id, type)')
    .eq('profile_id', myProfileId)
    .eq('conversations.type', 'dm')
  const { data: theirs } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('profile_id', otherProfileId)

  const theirIds = new Set((theirs || []).map(t => t.conversation_id))
  const existing = (mine || []).find(m => theirIds.has(m.conversation_id))
  if (existing) return existing.conversation_id

  const { data: convo, error } = await supabase
    .from('conversations')
    .insert({ type: 'dm' })
    .select()
    .single()
  if (error) throw error

  await supabase.from('conversation_participants').insert([
    { conversation_id: convo.id, profile_id: myProfileId },
    { conversation_id: convo.id, profile_id: otherProfileId }
  ])
  return convo.id
}

export async function joinGroupIfNeeded(conversationId, profileId) {
  const { data } = await supabase
    .from('conversation_participants')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('profile_id', profileId)
    .maybeSingle()
  if (!data) {
    await supabase.from('conversation_participants').insert({ conversation_id: conversationId, profile_id: profileId })
  }
}

export async function getMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles(id, full_name)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map(m => ({ ...m, sender_name: m.profiles?.full_name || 'Member' }))
}

export async function sendMessage({ conversationId, senderId, text, imageUrl }) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, text, image_url: imageUrl || null })
    .select('*, profiles(id, full_name)')
    .single()
  if (error) throw error

  // bump unread for other participants
  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('profile_id, unread_count')
    .eq('conversation_id', conversationId)
    .neq('profile_id', senderId)
  if (participants) {
    await Promise.all(participants.map(p =>
      supabase.from('conversation_participants')
        .update({ unread_count: (p.unread_count || 0) + 1 })
        .eq('conversation_id', conversationId).eq('profile_id', p.profile_id)
    ))
  }
  return { ...data, sender_name: data.profiles?.full_name }
}

export async function markConversationRead(conversationId, profileId) {
  await supabase
    .from('conversation_participants')
    .update({ unread_count: 0 })
    .eq('conversation_id', conversationId)
    .eq('profile_id', profileId)
}

export async function getMyNotifications(profileId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', profileId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function pushNotification({ recipientId, kind, title, body, targetScreen, targetId }) {
  await supabase.from('notifications').insert({
    recipient_id: recipientId, kind, title, body, target_screen: targetScreen, target_id: targetId || null
  })
}

export async function markNotificationRead(id) {
  await supabase.from('notifications').update({ read: true }).eq('id', id)
}

export async function notifyRoleGroup(role, excludeProfileId, payload) {
  const { data: members } = await supabase.from('profiles').select('id').eq('role', role).neq('id', excludeProfileId)
  if (!members) return
  await Promise.all(members.map(m => pushNotification({ recipientId: m.id, ...payload })))
}
