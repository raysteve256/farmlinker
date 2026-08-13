const TABS = [
  { key: 'home', ic: '🏠', lb: 'Home' },
  { key: 'market', ic: '🐔', lb: 'Market' },
  { key: 'suppliers', ic: '🧰', lb: 'Supply' },
  { key: 'vets', ic: '💉', lb: 'Vets' },
  { key: 'community', ic: '📢', lb: 'Community' },
  { key: 'profile', ic: '👤', lb: 'Profile' }
]
export default function BottomNav({ screen, onNavigate }) {
  return (
    <div className="bottomnav">
      <div className="bottomnav-inner">
        {TABS.map(t => (
          <button key={t.key} className={'navbtn' + (screen === t.key ? ' active' : '')} onClick={() => onNavigate(t.key)}>
            <span className="ic">{t.ic}</span><span className="lb">{t.lb}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
