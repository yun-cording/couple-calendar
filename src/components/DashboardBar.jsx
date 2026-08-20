// 화면 상단에 보이는 요약 정보 바입니다.
// "사귄 지 며칠째"(D+n), "다음 기념일까지 며칠"(D-n), "다가오는 일정" 세 가지를 보여줍니다.

import { diffInDays, formatFullDate, nextYearlyOccurrence, parseDateKey } from '../lib/dateUtils'

// startDate: 커플이 설정한 "사귀기 시작한 날" ('YYYY-MM-DD' 문자열, 없으면 null)
// events: 전체 일정 목록
// members: { uid: {displayName, ...} } 형태의 멤버 정보
// myUid: 현재 로그인한 사용자의 uid
// onSelectUpcoming: "다가오는 일정" 카드를 클릭했을 때 호출되는 함수 (해당 일정 객체를 넘겨줍니다)
export default function DashboardBar({ startDate, events, members, myUid, onSelectUpcoming }) {
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
          onClick={() => onSelectUpcoming?.(oneOffFuture)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectUpcoming?.(oneOffFuture)
          }}
        >
          <span className="stat-label">다가오는 일정 · {oneOffFuture.title}</span>
          <span className="stat-value">{formatFullDate(parseDateKey(oneOffFuture.date))}</span>
        </div>
      )}

      {/* 오른쪽에 나와 상대방의 이름을 배지로 보여줍니다 */}
      <div className="member-avatars">
        {memberList.map((m) => (
          <span key={m.id} className={`avatar-chip ${m.id === myUid ? 'me' : ''}`} title={m.displayName}>
            {m.displayName || '♡'}
          </span>
        ))}
      </div>
    </div>
  )
}
