import { useEffect, useState } from 'react'
import Modal from './Modal'
import { makeQrDataUrl, verifyUrl } from '../lib/qr'

export default function TraceabilityModal({ listing, onClose, onToast }) {
  const [qr, setQr] = useState(null)
  const url = listing ? verifyUrl(listing.trace_stamp) : ''

  useEffect(() => {
    if (!listing) return
    makeQrDataUrl(url).then(setQr).catch(() => onToast && onToast('Could not generate QR code'))
  }, [listing?.trace_stamp])

  function copyLink() {
    navigator.clipboard?.writeText(url)
    onToast && onToast('Verification link copied')
  }

  return (
    <Modal open={!!listing} onClose={onClose} title="Traceability stamp">
      {listing && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            Scan this code, or share the link, to verify <strong>{listing.title}</strong> traces back to a real Farm Linker listing.
          </p>
          {qr ? (
            <img src={qr} alt="Traceability QR code" style={{ width: 200, height: 200, borderRadius: 12, border: '1px solid var(--line)' }} />
          ) : (
            <div className="loading">Generating QR…</div>
          )}
          <div className="badge trace" style={{ margin: '16px auto 4px', display: 'inline-flex' }}>◎ {listing.trace_stamp}</div>
          <p className="mono" style={{ fontSize: 11, color: 'var(--muted)', wordBreak: 'break-all', marginTop: 10 }}>{url}</p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>Close</button>
            <button className="btn-primary" onClick={copyLink}>Copy link</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
