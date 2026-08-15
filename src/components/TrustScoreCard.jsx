import { useEffect, useState } from 'react'
import { computeTrustScore } from '../lib/trust'

export default function TrustScoreCard({ profileId, createdAt, compact }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    computeTrustScore(profileId, createdAt).then(d => { if (!cancelled) setData(d) }).catch(() => {})
    return () => { cancelled = true }
  }, [profileId])

  if (!data) return null

  return (
    <div className="card">
      <p className="eyebrow" style={{ marginBottom: 10 }}>FARM LINKER TRUST SCORE</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: compact ? 0 : 14 }}>
        <div className="trust-ring" style={{ '--pct': data.score }}>
          <div className="trust-ring-inner">
            <span className="num">{data.score}</span>
            <span className="of">/ 100</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 15, color: data.tier.color }}>{data.tier.label}</div>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3, lineHeight: 1.4 }}>
            Computed from real on-platform activity — an alternative to formal credit history for farmers who don't have one.
          </p>
        </div>
      </div>

      {!compact && data.breakdown.map(b => (
        <div className="trust-bar-row" key={b.label}>
          <div className="trust-bar-label"><span>{b.label}</span><span className="mono" style={{ color: 'var(--muted)' }}>{b.detail}</span></div>
          <div className="trust-bar-track"><div className="trust-bar-fill" style={{ width: `${(b.value / b.max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  )
}
