import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import TrustScoreCard from '../components/TrustScoreCard'

function fmtUGX(n) { return 'UGX ' + Number(n).toLocaleString() }
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function VerifyListing() {
  const { stamp } = useParams()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('listings')
        .select('*, profiles!listings_farmer_id_fkey(id, full_name, district, subcounty, phone, created_at)')
        .eq('trace_stamp', stamp)
        .maybeSingle()
      if (cancelled) return
      if (error || !data) setNotFound(true)
      else setListing(data)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [stamp])

  return (
    <div className="app" style={{ background: 'var(--parchment)' }}>
      <div className="topbar" style={{ justifyContent: 'center' }}>
        <div className="brand"><div className="dot" /><span className="brand-name">Farm Linker</span></div>
      </div>

      <div className="screen" style={{ paddingTop: 32 }}>
        {loading && <div className="loading">Verifying stamp…</div>}

        {!loading && notFound && (
          <div className="empty">
            <span className="glyph">⚠</span>
            <p><strong>Stamp not recognized</strong><br />
              <span className="mono" style={{ fontSize: 12 }}>{stamp}</span> doesn't match any listing on Farm Linker. It may have been mistyped, or the listing may have been removed.
            </p>
          </div>
        )}

        {!loading && listing && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div className="stamp-mark" style={{ margin: '0 auto 14px', borderColor: 'var(--leaf-deep)' }}>
                <span style={{ color: 'var(--leaf-deep)' }}>VERIFIED<br />ORIGIN</span>
              </div>
              <h1 style={{ fontSize: 22 }}>Traceability confirmed</h1>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>This listing was posted on Farm Linker and traces back to a real farm profile.</p>
            </div>

            <div className="card">
              <p className="eyebrow" style={{ marginBottom: 8 }}>LISTING</p>
              <div className="listing-title" style={{ fontSize: 19, marginBottom: 4 }}>{listing.title}</div>
              <div className="listing-meta">{listing.quantity} · {listing.type}</div>
              <div className="listing-row">
                <span className="price-tag">{fmtUGX(listing.price)}</span>
                <span className="badge trace">◎ {listing.trace_stamp}</span>
              </div>
            </div>

            <div className="card">
              <p className="eyebrow" style={{ marginBottom: 8 }}>ORIGIN FARM</p>
              <div className="account-info-row"><span>Farmer</span><span>{listing.profiles?.full_name || 'Unknown'}</span></div>
              <div className="account-info-row"><span>District</span><span>{listing.profiles?.district || '—'}</span></div>
              <div className="account-info-row"><span>Sub-county</span><span>{listing.profiles?.subcounty || '—'}</span></div>
              <div className="account-info-row"><span>Location listed</span><span>{listing.location}</span></div>
            </div>

            <div className="card">
              <p className="eyebrow" style={{ marginBottom: 8 }}>RECORD</p>
              <div className="account-info-row"><span>Posted on</span><span>{fmtDate(listing.created_at)}</span></div>
              <div className="account-info-row"><span>Status</span><span style={{ textTransform: 'capitalize' }}>{listing.status}</span></div>
            </div>

            {listing.profiles?.id && (
              <TrustScoreCard profileId={listing.profiles.id} createdAt={listing.profiles.created_at} compact />
            )}

            <p style={{ fontSize: 11.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6, marginTop: 10 }}>
              This page confirms the listing exists on Farm Linker's records as shown. It does not independently verify the physical condition or health of the birds/eggs.
            </p>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Link to="/" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 24px' }}>Open Farm Linker</Link>
        </div>
      </div>
    </div>
  )
}
