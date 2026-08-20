// 화면 맨 위에 항상 보이는 헤더입니다. 로고 + 4개의 탭 버튼(캘린더/다이어리/버킷리스트/설정)으로 구성됩니다.

const TABS = [
  { id: 'calendar', label: '캘린더', icon: '📅' },
  { id: 'diary', label: '다이어리', icon: '📔' },
  { id: 'bucket', label: '버킷리스트', icon: '💕' },
  { id: 'settings', label: '설정', icon: '⚙️' },
]

// tab: 현재 선택된 탭 id
// onTabChange: 탭 버튼을 눌렀을 때 App.jsx로 알려주는 함수
export default function Header({ tab, onTabChange }) {
  return (
    <header className="app-header">
      <div className="app-header-brand">
        <span className="brand-heart">💗</span>
        <span>Us.</span>
      </div>
      <nav className="app-nav">
        {/* TABS 배열을 돌면서 버튼을 자동으로 만들어줍니다 (하드코딩 없이) */}
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </header>
  )
}
