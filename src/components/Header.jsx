// 화면 맨 위에 항상 보이는 헤더입니다. 로고 + 4개의 탭 버튼(캘린더/다이어리/위시리스트/설정)으로 구성됩니다.

import HeartIcon from './HeartIcon'

const TABS = [
  { id: 'calendar', label: '캘린더', icon: '📅' },
  { id: 'diary', label: '다이어리', icon: '📔' },
  { id: 'bucket', label: '위시리스트', icon: '💕' },
  { id: 'settings', label: '설정', icon: '⚙️' },
]

// tab: 현재 선택된 탭 id
// onTabChange: 탭 버튼을 눌렀을 때 App.jsx로 알려주는 함수
// members: { uid: {displayName, ...} } 형태의 멤버 정보
// myUid: 로그인한 나의 uid
// showAnniversaryBadge: 7일 이내로 다가온 기념일이 있으면 "캘린더" 탭에 빨간 알림 배지를 띄웁니다
export default function Header({ tab, onTabChange, members, myUid, showAnniversaryBadge }) {
  // "나♥상대방" 형태의 브랜드 라벨을 만듭니다. 아직 이름을 못 불러왔거나 상대방이 없으면 기본 로고를 보여줍니다.
  const me = members?.[myUid]
  const partner = Object.values(members || {}).find((m) => m.id !== myUid)
  const brandLabel =
    me?.displayName && partner?.displayName ? `${me.displayName}♥${partner.displayName}` : 'Us.'

  return (
    <header className="app-header">
      <div className="app-header-brand">
        <HeartIcon size={24} />
        <span className="app-header-brand-text">{brandLabel}</span>
      </div>
      <nav className="app-nav">
        {/* TABS 배열을 돌면서 버튼을 자동으로 만들어줍니다 (하드코딩 없이) */}
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            <span className="nav-icon">
              {t.icon}
              {/* 다가오는 기념일이 7일 이내면 캘린더 탭에 알림 배지를 띄웁니다 */}
              {t.id === 'calendar' && showAnniversaryBadge && (
                <span className="nav-badge" aria-label="다가오는 기념일 알림" />
              )}
            </span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </header>
  )
}
