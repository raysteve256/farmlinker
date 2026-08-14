import { useState } from 'react'
import Modal from './Modal'
import { calcCommission, requestPayment } from '../lib/payments'

function fmtUGX(n) { return 'UGX ' + Number(n).toLocaleString() }

export default function PaymentModal({ item, itemType, me, onClose, onToast, onRequested }) {
  const [method, setMethod] = useState('MTN Mobile Money')
  const [phone, setPhone] = useState(me?.phone || '')
  const [busy, setBusy] = useState(false)

  if (!item) return null
  const sellerId = itemType === 'listing' ? item.farmer_id : item.supplier_id
  const sellerName = itemType === 'listing' ? item.farmer_name : item.supplier_name
  const { commission } = calcCommission(item.price)

  async function submit() {
    if (!phone.trim()) { onToast('Enter the phone number to pay from'); return }
    try {
      setBusy(true)
      await requestPayment({
        itemType, itemId: item.id, buyerId: me.id, sellerId,
        amount: item.price, paymentMethod: method, phoneNumber: phone.trim()
      })
      onToast('Payment request logged — Mobile Money integration coming soon')
      onRequested && onRequested()
      onClose()
    } catch (e) {
      onToast('Could not log payment request: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={!!item} onClose={onClose} title="Pay via Mobile Money">
      <div className="card" style={{ background: '#FBF3D9', border: '1px solid #EAD98A', marginBottom: 4 }}>
        <p style={{ fontSize: 12, lineHeight: 1.5 }}>
          🚧 <strong>Provision only.</strong> Real Mobile Money charging isn't connected yet — this logs your payment request so the farmer/supplier sees it, and arranges direct payment with you for now.
        </p>
      </div>

      <div className="card">
        <div className="account-info-row"><span>Item</span><span>{item.title || item.name}</span></div>
        <div className="account-info-row"><span>Seller</span><span>{sellerName}</span></div>
        <div className="account-info-row"><span>Amount</span><span>{fmtUGX(item.price)}</span></div>
        <div className="account-info-row"><span>Platform fee (5%)</span><span>{fmtUGX(commission)}</span></div>
      </div>

      <label>Pay with</label>
      <select value={method} onChange={e => setMethod(e.target.value)}>
        <option>MTN Mobile Money</option>
        <option>Airtel Money</option>
      </select>
      <label>Phone number</label>
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +256 7XX 000 000" />

      <div className="modal-actions">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={busy} onClick={submit}>{busy ? 'Logging…' : 'Send payment request'}</button>
      </div>
    </Modal>
  )
}
