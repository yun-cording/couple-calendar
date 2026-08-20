// 월간 달력을 그려주는 컴포넌트입니다. (7칸 x 6줄 = 42칸 그리드)
// 각 날짜 칸에는 그날의 일정 색상 점(dot)과 다이어리 무드 이모지가 함께 표시됩니다.

import { buildMonthGrid, formatYearMonth, isSameDay, toDateKey } from '../lib/dateUtils'
import { categoryById } from '../lib/categories'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 이 일정(event)이 주어진 date(달력 칸의 날짜)에 표시되어야 하는지 판단합니다.
// event.date(시작일)와 event.dateTo(종료일, 없으면 시작일과 같은 하루짜리 일정)는 'YYYY-MM-DD' 형태의 문자열입니다.
// yearly(매년 반복)가 true면 "연도는 무시하고 월/일만" 같으면 매칭시킵니다.
// yearly가 false면 date~dateTo 기간 안에 드는 모든 날짜에 매칭시킵니다.
function eventMatchesDate(event, date) {
  if (!event.date) return false
  if (event.yearly) {
    const [, em, ed] = event.date.split('-').map(Number)
    return em === date.getMonth() + 1 && ed === date.getDate()
  }
  const dateKey = toDateKey(date)
  return dateKey >= event.date && dateKey <= (event.dateTo || event.date)
}

export default function CalendarView({
  monthDate, // 현재 화면에 표시 중인 "월" (Date 객체)
  onPrevMonth,
  onNextMonth,
  onToday,
  events, // 전체 일정 목록
  diaryByDate, // { 'YYYY-MM-DD': 다이어리객체 } 형태의 맵
  onSelectDay, // 날짜 칸을 클릭했을 때 호출되는 함수
  selectedDateKey, // 현재 선택되어 하이라이트된 날짜
}) {
  const grid = buildMonthGrid(monthDate) // 42칸짜리 날짜 배열
  const today = new Date()

  return (
    <div className="card calendar-card">
      {/* 상단: < 이전달 | 2026년 8월 | 다음달 > */}
      <div className="calendar-header">
        <button className="icon-btn" onClick={onPrevMonth} aria-label="이전 달">
          ‹
        </button>
        <div className="calendar-title" onClick={onToday} role="button" tabIndex={0}>
          {formatYearMonth(monthDate)}
        </div>
        <button className="icon-btn" onClick={onNextMonth} aria-label="다음 달">
          ›
        </button>
      </div>

      {/* 요일 헤더 (일 월 화 수 목 금 토) */}
      <div className="calendar-weekdays">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`weekday ${i === 0 ? 'sun' : ''} ${i === 6 ? 'sat' : ''}`}>
            {w}
          </div>
        ))}
      </div>

      {/* 실제 날짜 칸들 */}
      <div className="calendar-grid">
        {grid.map((date) => {
          const inMonth = date.getMonth() === monthDate.getMonth() // 현재 달에 속한 날짜인지
          const dateKey = toDateKey(date)
          const dayEvents = events.filter((ev) => eventMatchesDate(ev, date)) // 이 날의 일정들
          const diary = diaryByDate[dateKey] // 이 날의 다이어리 (있으면)
          const isToday = isSameDay(date, today)
          const isSelected = dateKey === selectedDateKey
          const weekday = date.getDay()

          return (
            <button
              key={dateKey}
              className={[
                'day-cell',
                inMonth ? '' : 'muted-day', // 이전/다음 달 날짜는 흐리게 표시
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
              ].join(' ')}
              onClick={() => onSelectDay(dateKey)}
            >
              <span
                className={`day-number ${weekday === 0 ? 'sun' : ''} ${weekday === 6 ? 'sat' : ''}`}
              >
                {date.getDate()}
              </span>

              {/* 일정 제목을 작은 글자로 최대 2개까지 보여주고, 그 이상은 "+N"으로 표시 */}
              <span className="day-events">
                {dayEvents.slice(0, 2).map((ev) => (
                  <span
                    key={ev.id}
                    className="day-event-label"
                    style={{ color: ev.color || categoryById(ev.category).color }}
                    title={ev.title}
                  >
                    {ev.title}
                  </span>
                ))}
                {dayEvents.length > 2 && <span className="event-more">+{dayEvents.length - 2}</span>}
              </span>

              {/* 다이어리에 기분(mood)을 남긴 날에는 이모지를 작게 표시 */}
              {diary?.mood && <span className="day-mood">{diary.mood}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// DayPanel에서도 "이 날짜에 어떤 일정이 있는지" 같은 로직이 필요해서 함께 내보냅니다.
export { eventMatchesDate }
