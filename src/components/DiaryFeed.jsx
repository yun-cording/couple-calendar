// 지금까지 남긴 다이어리 기록들을 최신순으로 모아 보여주는 화면입니다.
// 검색창에 키워드를 입력하면 내용(text)에 그 단어가 포함된 기록만 걸러서 보여줍니다.

import { useState } from 'react'
import { formatFullDate, pad, parseDateKey } from '../lib/dateUtils'

// 오늘이 속한 달을 'YYYY-MM' 형태로 돌려줍니다. (월 선택 필터의 기본값)
const currentYearMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export default function DiaryFeed({ diaryEntries, members, onSelectDay }) {
  const [query, setQuery] = useState('')
  const [month, setMonth] = useState(currentYearMonth) // 'YYYY-MM', 빈 문자열이면 전체 기간

  const sorted = [...diaryEntries]
    .filter((d) => d.text || d.mood) // 내용이 하나도 없는 빈 기록은 제외
    .sort((a, b) => b.date.localeCompare(a.date)) // 날짜 문자열('YYYY-MM-DD') 기준 내림차순 = 최신순
    .filter((d) => !month || d.date.startsWith(month)) // 선택한 월 필터링
    .filter((d) => !query || d.text?.toLowerCase().includes(query.toLowerCase())) // 검색어 필터링

  return (
    <div className="card">
      <div className="section-title-row">
        <h2>📔 우리의 추억 다이어리</h2>
      </div>

      <div className="form-row diary-filter-row">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        {month && (
          <button type="button" className="secondary-btn" onClick={() => setMonth('')}>
            전체보기
          </button>
        )}
      </div>
      <input
        placeholder="기록 검색…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: '0.75rem' }}
      />

      {sorted.length === 0 && <p className="muted small">아직 남긴 기록이 없어요.</p>}

      <ul className="diary-feed">
        {sorted.map((entry) => (
          // 항목을 클릭하면 App.jsx에서 캘린더 탭으로 이동 + 해당 날짜 상세창을 엽니다.
          <li key={entry.id} className="diary-feed-item" onClick={() => onSelectDay(entry.date)}>
            <div className="diary-feed-date">
              <span className="diary-mood-lg">{entry.mood || '📝'}</span>
              <span>{formatFullDate(parseDateKey(entry.date))}</span>
            </div>
            {entry.text && <p className="diary-feed-text">{entry.text}</p>}
            <p className="muted small">by {members[entry.authorId]?.displayName || '상대방'}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
