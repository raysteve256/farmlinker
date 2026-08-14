import { supabase } from '../supabaseClient'

export const COMMISSION_RATE = 0.05 // matches Business Model Canvas unit economics

export function calcCommission(amount) {
  const commission = Math.round(amount * COMMISSION_RATE)
  return { commission, total: amount }
}

// Records a payment REQUEST — no real money moves yet. This is the
// provision for Mobile Money integration: the transaction, commission
// split, and phone number are all captured for real, so wiring in the
// actual MTN/Airtel merchant API later is a drop-in replacement for the
// "pending_integration" status, not a redesign.
export async function requestPayment({ itemType, itemId, buyerId, sellerId, amount, paymentMethod, phoneNumber }) {
  const { commission } = calcCommission(amount)
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      item_type: itemType,
      item_id: itemId,
      buyer_id: buyerId,
      seller_id: sellerId,
      amount,
      commission_rate: COMMISSION_RATE,
      commission_amount: commission,
      payment_method: paymentMethod,
      phone_number: phoneNumber,
      status: 'pending_integration'
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getMyTransactions(profileId) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, buyer:profiles!transactions_buyer_id_fkey(full_name), seller:profiles!transactions_seller_id_fkey(full_name)')
    .or(`buyer_id.eq.${profileId},seller_id.eq.${profileId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
