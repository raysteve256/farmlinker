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

export function logout() {
  localStorage.removeItem(PROFILE_KEY)
}
