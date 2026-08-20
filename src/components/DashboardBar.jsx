// 화면 상단에 보이는 요약 정보 바입니다.
// "사귄 지 며칠째"(D+n), "다음 기념일까지 며칠"(D-n), "다가오는 일정" 세 가지를 보여줍니다.

import { useState } from 'react'
import { diffInDays, formatFullDate, parseDateKey } from '../lib/dateUtils'
import { categoryById } from '../lib/categories'
import { findUpcomingAnniversary } from '../lib/anniversaries'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'

// startDate: 커플이 설정한 "사귀기 시작한 날" ('YYYY-MM-DD' 문자열, 없으면 null)
// events: 전체 일정 목록
// members: { uid: {displayName, ...} } 형태의 멤버 정보
// myUid: 현재 로그인한 사용자의 uid
// smartAnniversaries: 사귄 날짜/생일로 자동 계산되는 D+100/생일 목록 (lib/anniversaries.js)
// trackedAnniversaryIds: 로그인한 나의 "챙길 기념일" 선택 목록 (null이면 전체를 대상으로 함, 설정 화면에서 고름)
// onSelectEvent: 일정 하나를 선택했을 때(예: "다가오는 일정" 카드, 이름 배지 팝업의 일정 목록) 호출되는 함수 (해당 일정 객체를 넘겨줍니다)
// onSelectAnniversary: "다음 기념일" 카드를 클릭했을 때 호출되는 함수 (occursOn 날짜를 담은 기념일 객체를 넘겨줍니다)
export default function DashboardBar({
  startDate,
  events,
  smartAnniversaries = [],
  trackedAnniversaryIds = null,
  members,
  myUid,
  onSelectEvent,
  onSelectAnniversary,
}) {
  // 이름 배지를 클릭했을 때, 그 사람이 등록한 일정 목록 팝업을 띄우기 위한 상태입니다.
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  // "다가오는 일정" 더보기 팝업을 띄우기 위한 상태입니다.
  const [showUpcomingList, setShowUpcomingList] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0) // 시/분/초를 0으로 맞춰서 "날짜"만 비교하기 쉽게 만듭니다.

  // D+n 계산: 사귄 첫날을 1일차로 세기 위해 +1을 해줍니다.
  const daysTogether = startDate ? diffInDays(parseDateKey(startDate), today) + 1 : null

  // yearly(매년 반복) 옵션이 켜진 일정들(생일, 기념일 등)과
  // 사귄 날짜/생일로 자동 계산된 스마트 기념일(D+100, 생일 등)을 합쳐서,
  // 가장 가까운 미래의 것 하나를 찾아 "다음 기념일" 카드로 보여줍니다.
  const yearlyEvents = events.filter((e) => e.yearly)
  const upcomingAnniversary = findUpcomingAnniversary(yearlyEvents, smartAnniversaries, today, trackedAnniversaryIds)
  const daysUntilAnniversary = upcomingAnniversary ? diffInDays(today, upcomingAnniversary.occursOn) : null
  // 7일 이내로 다가오면 은은하게, 3일 이내면 눈에 띄게 알려서
  // 선물이나 예약을 미리 준비할 수 있도록 합니다.
  const anniversaryAlertClass =
    daysUntilAnniversary === null
      ? ''
      : daysUntilAnniversary <= 3
        ? 'anniversary-alert-urgent'
        : daysUntilAnniversary <= 7
          ? 'anniversary-alert-soon'
          : ''

  // 반복되지 않는 일반 일정 중에서, 오늘부터 3일 뒤까지(오늘 포함) 시작하는 것을 전부 날짜순으로 찾습니다.
  const upcomingEvents = events
    .filter((e) => !e.yearly && diffInDays(today, parseDateKey(e.date)) >= 0 && diffInDays(today, parseDateKey(e.date)) <= 3)
    .sort((a, b) => a.date.localeCompare(b.date))

  const memberList = Object.values(members)
  const selectedMember = selectedMemberId ? members[selectedMemberId] : null
  // 팝업(이름 배지 / 다가오는 일정 더보기) 중 하나라도 열려 있는 동안에는 배경 화면 스크롤을 잠급니다.
  useBodyScrollLock(!!selectedMember || showUpcomingList)
  // 선택된 사람이 등록한(authorId가 일치하는) 일정만 걸러서, 날짜순으로 보여줍니다.
  const selectedMemberEvents = selectedMemberId
    ? events.filter((e) => e.authorId === selectedMemberId).sort((a, b) => a.date.localeCompare(b.date))
    : []

  // 일정 목록 팝업(이름 배지 팝업 / 다가오는 일정 더보기 팝업)에서 공통으로 쓰는 목록 항목입니다.
  // 클릭하면 그 팝업은 닫고(onClose), 그 일정의 상세를 보여줍니다.
  const renderEventItem = (ev, onClose) => (
    <li
      key={ev.id}
      className="event-item"
      onClick={() => {
        onClose()
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
  )

  return (
    <div className="dashboard-bar">
      <div className="stat-pill hero-pill">
        <span className="stat-label">우리, 함께한 지</span>
        <span className="stat-value">{daysTogether !== null ? `D+${daysTogether}` : '날짜 미설정'}</span>
      </div>

      {/* 다가오는 기념일이 있을 때만 카드를 보여줍니다 (생일 등 직접 등록한 기념일 + 자동 계산된 D+100/생일 통틀어 가장 가까운 것).
          7일 이내면 은은하게, 3일 이내면 눈에 띄게 강조해서 선물/예약 준비를 미리 챙길 수 있게 합니다 */}
      {upcomingAnniversary && (
        <div
          className={`stat-pill upcoming-pill ${anniversaryAlertClass}`}
          role="button"
          tabIndex={0}
          onClick={() => onSelectAnniversary?.(upcomingAnniversary)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectAnniversary?.(upcomingAnniversary)
          }}
        >
          <span className="stat-label">
            {anniversaryAlertClass && '🔔 '}다음 기념일 · {upcomingAnniversary.title}
          </span>
          <span className="stat-value">D-{daysUntilAnniversary || '0'}</span>
        </div>
      )}

      {/* 오늘부터 3일 뒤까지 예정된 일정 중, 가장 가까운 것 하나만 카드로 보여줍니다.
          (전부 다 카드로 늘어놓으면 모바일에서 화면이 계속 아래로 밀리기 때문에, 나머지는 "더보기" 팝업에서 봅니다) */}
      {upcomingEvents.length > 0 && (
        <div
          className="stat-pill upcoming-pill"
          role="button"
          tabIndex={0}
          onClick={() => onSelectEvent?.(upcomingEvents[0])}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectEvent?.(upcomingEvents[0])
          }}
        >
          <span className="stat-label">
            다가오는 일정 · <span className="pill-title-ellipsis">{upcomingEvents[0].title}</span>
          </span>
          <span className="stat-value">{formatFullDate(parseDateKey(upcomingEvents[0].date))}</span>
        </div>
      )}

      {upcomingEvents.length > 1 && (
        <button
          type="button"
          className="stat-pill upcoming-pill upcoming-more-pill"
          onClick={() => setShowUpcomingList(true)}
        >
          <span className="stat-label">다가오는 일정 더보기</span>
          <span className="stat-value">+{upcomingEvents.length - 1} ···</span>
        </button>
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
              {selectedMemberEvents.map((ev) => renderEventItem(ev, () => setSelectedMemberId(null)))}
            </ul>
          </div>
        </div>
      )}

      {/* "다가오는 일정 더보기"를 클릭하면 3일 이내 일정 전체를 팝업으로 보여줍니다 */}
      {showUpcomingList && (
        <div className="day-panel-backdrop" onClick={() => setShowUpcomingList(false)}>
          <div className="card day-panel" onClick={(e) => e.stopPropagation()}>
            <div className="day-panel-header">
              <h2>다가오는 일정</h2>
              <button className="icon-btn" onClick={() => setShowUpcomingList(false)}>
                ✕
              </button>
            </div>
            <ul className="event-list">
              {upcomingEvents.map((ev) => renderEventItem(ev, () => setShowUpcomingList(false)))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
