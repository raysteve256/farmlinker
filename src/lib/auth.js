import { supabase } from '../supabaseClient'

const PROFILE_KEY = 'farmlinker:profileId'

// Every visitor gets a real (anonymous) Supabase auth session so that
// RLS-protected writes work. This is not a login system — anyone can
// still tap any demo profile to "become" it, same as before — but every
// write is now attributable to a real, database-enforced session rather
// than trusted purely on the client. See README for the real-auth roadmap.
export async function ensureSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) return session
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return data.session
}

export function getStoredProfileId() {
  return localStorage.getItem(PROFILE_KEY)
}

export async function getMyProfile() {
  const id = getStoredProfileId()
  if (!id) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error) return null
  return data
}

export async function listProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) throw error
  return data
}

// "Log in" as an existing demo profile by attaching the current session
// to it (see the "claim profile" RLS policy).
export async function claimProfile(profileId) {
  const session = await ensureSession()
  const { data, error } = await supabase
    .from('profiles')
    .update({ auth_id: session.user.id })
    .eq('id', profileId)
    .select()
    .single()
  if (error) throw error
  localStorage.setItem(PROFILE_KEY, data.id)
  return data
}

export async function createProfile({ full_name, role, phone, subcounty, latitude, longitude }) {
  const session = await ensureSession()
  const { data, error } = await supabase
    .from('profiles')
    .insert({ full_name, role, phone, subcounty, auth_id: session.user.id, district: 'Mukono', latitude: latitude ?? null, longitude: longitude ?? null })
    .select()
    .single()
  if (error) throw error
  localStorage.setItem(PROFILE_KEY, data.id)
  return data
}

// Ends the anonymous session entirely, not just the local pointer to it.
// Without this, switching between demo accounts in the same browser would
// try to reattach the same lingering anonymous session (still linked to
// the previous account) to a different profile row — and since auth_id
// is unique, that fails with "duplicate key value violates unique
// constraint profiles_auth_id_key" on every account except the first one
// ever claimed in that browser.
export async function logout() {
  localStorage.removeItem(PROFILE_KEY)
  await supabase.auth.signOut()
}

// ---------- Real email/password auth, for the Admin account only ----------
// Everything above (ensureSession/claimProfile) is the anonymous demo-login
// flow, deliberately excluded from ever touching an is_admin row — see the
// "bootstrap admin claim" RLS policy. This is the real, credentialed path.

export async function adminSignUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  if (!data.session) {
    // Project requires email confirmation before a session is issued.
    return { needsEmailConfirmation: true }
  }
  return linkSessionToAdminProfile()
}

export async function adminSignIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  const { data: { session } } = await supabase.auth.getSession()
  const { data: existing } = await supabase.from('profiles').select('*').eq('auth_id', session.user.id).eq('is_admin', true).maybeSingle()
  if (existing) {
    localStorage.setItem(PROFILE_KEY, existing.id)
    return { profile: existing }
  }
  // First sign-in after confirming email — try the one-time bootstrap link.
  return linkSessionToAdminProfile()
}

async function linkSessionToAdminProfile() {
  const { data: { session } } = await supabase.auth.getSession()
  const { data, error } = await supabase
    .from('profiles')
    .update({ auth_id: session.user.id })
    .eq('is_admin', true)
    .is('auth_id', null)
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Admin access has already been set up by someone else, or no admin account is available to claim.')
  localStorage.setItem(PROFILE_KEY, data.id)
  return { profile: data }
}

export async function adminChangePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function adminLogout() {
  localStorage.removeItem(PROFILE_KEY)
  await supabase.auth.signOut()
}
