import { supabase } from '../supabaseClient'

// All of this relies on the "is_admin()" RLS policies added in Supabase —
// the anon key never gets elevated privileges; the acting session does,
// only if its linked profile has is_admin = true. See supabase/schema.sql.

export async function getPlatformStats() {
  const [users, listings, products, vetReqs, posts, messages, transactions] = await Promise.all([
    supabase.from('profiles').select('id, role, is_banned, created_at'),
    supabase.from('listings').select('id, status, created_at'),
    supabase.from('supplier_products').select('id, created_at'),
    supabase.from('vet_requests').select('id, status, urgency, created_at'),
    supabase.from('posts').select('id, type, created_at'),
    supabase.from('messages').select('id, created_at'),
    supabase.from('transactions').select('id, amount, commission_amount, status, created_at')
  ])
  const err = [users, listings, products, vetReqs, posts, messages, transactions].find(r => r.error)
  if (err) throw err.error

  const usersByRole = {}
  users.data.forEach(u => { usersByRole[u.role] = (usersByRole[u.role] || 0) + 1 })

  return {
    totalUsers: users.data.length,
    usersByRole,
    bannedUsers: users.data.filter(u => u.is_banned).length,
    totalListings: listings.data.length,
    activeListings: listings.data.filter(l => l.status === 'active').length,
    totalProducts: products.data.length,
    totalVetRequests: vetReqs.data.length,
    openVetRequests: vetReqs.data.filter(v => v.status === 'open').length,
    urgentVetRequests: vetReqs.data.filter(v => v.urgency === 'Urgent' && v.status !== 'resolved').length,
    totalPosts: posts.data.length,
    diseaseAlerts: posts.data.filter(p => p.type === 'Disease alert').length,
    totalMessages: messages.data.length,
    totalTransactions: transactions.data.length,
    pendingTransactions: transactions.data.filter(t => t.status === 'pending_integration').length,
    totalTransactionVolume: transactions.data.reduce((s, t) => s + Number(t.amount), 0),
    totalCommissionPotential: transactions.data.reduce((s, t) => s + Number(t.commission_amount), 0),
    raw: { users: users.data, listings: listings.data, vetReqs: vetReqs.data, posts: posts.data, transactions: transactions.data }
  }
}

export async function getAllUsers() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function setUserBanned(profileId, banned) {
  const { error } = await supabase.from('profiles').update({ is_banned: banned }).eq('id', profileId)
  if (error) throw error
}

export async function setUserRole(profileId, role) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', profileId)
  if (error) throw error
}

export async function getAllListingsAdmin() {
  const { data, error } = await supabase
    .from('listings')
    .select('*, profiles!listings_farmer_id_fkey(full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
export async function deleteListingAdmin(id) {
  const { error } = await supabase.from('listings').delete().eq('id', id)
  if (error) throw error
}

export async function getAllPostsAdmin() {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles!posts_author_id_fkey(full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
export async function deletePostAdmin(id) {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
}

export async function getAllVetRequestsAdmin() {
  const { data, error } = await supabase
    .from('vet_requests')
    .select('*, farmer:profiles!vet_requests_farmer_id_fkey(full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAllTransactionsAdmin() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, buyer:profiles!transactions_buyer_id_fkey(full_name), seller:profiles!transactions_seller_id_fkey(full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
