// 화면 상단에 보이는 요약 정보 바입니다.
// "사귄 지 며칠째"(D+n), "다음 기념일까지 며칠"(D-n), "다가오는 일정" 세 가지를 보여줍니다.

import { useState } from 'react'
import { diffInDays, formatFullDate, nextYearlyOccurrence, parseDateKey } from '../lib/dateUtils'
import { categoryById } from '../lib/categories'

// startDate: 커플이 설정한 "사귀기 시작한 날" ('YYYY-MM-DD' 문자열, 없으면 null)
// events: 전체 일정 목록
// members: { uid: {displayName, ...} } 형태의 멤버 정보
// myUid: 현재 로그인한 사용자의 uid
// onSelectEvent: 일정 하나를 선택했을 때(예: "다가오는 일정" 카드, 이름 배지 팝업의 일정 목록) 호출되는 함수 (해당 일정 객체를 넘겨줍니다)
export default function DashboardBar({ startDate, events, members, myUid, onSelectEvent }) {
  // 이름 배지를 클릭했을 때, 그 사람이 등록한 일정 목록 팝업을 띄우기 위한 상태입니다.
  const [selectedMemberId, setSelectedMemberId] = useState(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0) // 시/분/초를 0으로 맞춰서 "날짜"만 비교하기 쉽게 만듭니다.

  // D+n 계산: 사귄 첫날을 1일차로 세기 위해 +1을 해줍니다.
  const daysTogether = startDate ? diffInDays(parseDateKey(startDate), today) + 1 : null

  // yearly(매년 반복) 옵션이 켜진 일정들(생일, 기념일 등) 중에서
  // 가장 가까운 미래의 발생일을 찾아 "다음 기념일" 카드로 보여줍니다.
  const yearlyEvents = events.filter((e) => e.yearly)
  const upcomingYearly = yearlyEvents
    .map((e) => ({ ...e, occursOn: nextYearlyOccurrence(e.date, today) }))
    .sort((a, b) => a.occursOn - b.occursOn)[0] // 날짜가 가장 빠른 것 하나만 사용

  // 반복되지 않는 일반 일정 중에서, 오늘부터 3일 뒤까지(오늘 포함) 시작하는 것 중 가장 가까운 것을 찾습니다.
  const oneOffFuture = events
    .filter((e) => !e.yearly && diffInDays(today, parseDateKey(e.date)) >= 0 && diffInDays(today, parseDateKey(e.date)) <= 3)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  const memberList = Object.values(members)
  const selectedMember = selectedMemberId ? members[selectedMemberId] : null
  // 선택된 사람이 등록한(authorId가 일치하는) 일정만 걸러서, 날짜순으로 보여줍니다.
  const selectedMemberEvents = selectedMemberId
    ? events.filter((e) => e.authorId === selectedMemberId).sort((a, b) => a.date.localeCompare(b.date))
    : []

  return (
    <div className="dashboard-bar">
      <div className="stat-pill hero-pill">
        <span className="stat-label">우리, 함께한 지</span>
        <span className="stat-value">{daysTogether !== null ? `D+${daysTogether}` : '날짜 미설정'}</span>
      </div>

      {/* 다가오는 기념일이 있을 때만 카드를 보여줍니다 */}
      {upcomingYearly && (
        <div className="stat-pill">
          <span className="stat-label">다음 기념일 · {upcomingYearly.title}</span>
          <span className="stat-value">
            D-{diffInDays(today, upcomingYearly.occursOn) || '0'}
          </span>
        </div>
      )}

      {oneOffFuture && (
        <div
          className="stat-pill upcoming-pill"
          role="button"
          tabIndex={0}
          onClick={() => onSelectEvent?.(oneOffFuture)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectEvent?.(oneOffFuture)
          }}
        >
          <span className="stat-label">다가오는 일정 · {oneOffFuture.title}</span>
          <span className="stat-value">{formatFullDate(parseDateKey(oneOffFuture.date))}</span>
        </div>
      )}

      {/* 오른쪽에 나와 상대방의 이름을 배지로 보여줍니다. 클릭하면 그 사람이 등록한 일정 목록을 볼 수 있어요 */}
      <div className="member-avatars">
        {memberList.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`avatar-chip ${m.id === myUid ? 'me' : ''}`}
            title={`${m.displayName || '♡'}님이 등록한 일정 보기`}
            onClick={() => setSelectedMemberId(m.id)}
          >
            {m.displayName || '♡'}
          </button>
        ))}
      </div>

      {/* 이름 배지를 클릭하면 그 사람이 등록한 일정 목록을 팝업으로 보여줍니다 */}
      {selectedMember && (
        <div className="day-panel-backdrop" onClick={() => setSelectedMemberId(null)}>
          <div className="card day-panel" onClick={(e) => e.stopPropagation()}>
            <div className="day-panel-header">
              <h2>{selectedMember.displayName || '상대방'}님의 일정</h2>
              <button className="icon-btn" onClick={() => setSelectedMemberId(null)}>
                ✕
              </button>
            </div>

            {selectedMemberEvents.length === 0 && (
              <p className="muted small">등록한 일정이 없어요.</p>
            )}

            <ul className="event-list">
              {selectedMemberEvents.map((ev) => (
                // 일정을 클릭하면 이 팝업은 닫고, 그 일정의 상세를 보여줍니다.
                <li
                  key={ev.id}
                  className="event-item"
                  onClick={() => {
                    setSelectedMemberId(null)
                    onSelectEvent?.(ev)
                  }}
                >
                  <span
                    className="event-color-dot"
                    style={{ background: ev.color || categoryById(ev.category).color }}
                  />
                  <div className="event-item-body">
                    <div className="event-item-title" style={{ color: ev.color || categoryById(ev.category).color }}>
                      <span className="event-time">
                        {formatFullDate(parseDateKey(ev.date))}
                        {(ev.timeFrom || ev.time) && ` · ${ev.timeFrom || ev.time}`}
                      </span>
                      {ev.title}
                      {ev.yearly && <span className="badge">매년</span>}
                    </div>
                    {ev.dateTo && ev.dateTo !== ev.date && (
                      <div className="event-item-sub">🗓️ ~ {formatFullDate(parseDateKey(ev.dateTo))}</div>
                    )}
                    {ev.location && <div className="event-item-sub">📍 {ev.location}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
