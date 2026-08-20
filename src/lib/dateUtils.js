// 날짜 계산에 쓰는 함수들을 모아둔 파일입니다.
// JavaScript의 기본 Date 객체만 사용해서 만들었고, 외부 라이브러리는 쓰지 않습니다.

// 숫자가 한 자리면 앞에 0을 붙여줍니다. 예: pad(9) -> "09", pad(12) -> "12"
export const pad = (n) => String(n).padStart(2, '0')

// Date 객체를 "2026-08-19" 같은 문자열로 바꿔줍니다.
// Firestore에는 이 문자열 형태로 날짜를 저장합니다. (Date 객체를 그대로 저장하지 않는 이유는
// "몇 월 며칠"만 비교하면 되고, 시간대(timezone) 문제를 피하기 위해서입니다)
export const toDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

// toDateKey와 반대로, "2026-08-19" 같은 문자열을 다시 Date 객체로 만들어줍니다.
export const parseDateKey = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d) // JS Date는 월(month)이 0부터 시작하므로 -1 해줍니다.
}

// 두 날짜가 "같은 날"인지 비교합니다 (시/분/초는 무시하고 연/월/일만 비교).
export const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

// 주어진 날짜가 속한 달의 1일을 반환합니다.
export const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)

// 달을 delta만큼 이동합니다. delta가 1이면 다음 달, -1이면 이전 달.
export const addMonths = (date, delta) => new Date(date.getFullYear(), date.getMonth() + delta, 1)

// 날짜에 며칠을 더하거나(양수) 뺍니다(음수).
export const addDays = (date, delta) => {
  const d = new Date(date)
  d.setDate(d.getDate() + delta)
  return d
}

// 두 날짜 사이의 일수 차이를 계산합니다. (b가 a보다 미래면 양수)
// 시간대에 따라 오차가 생기지 않도록 UTC 기준 자정 시각끼리 빼서 계산합니다.
export const diffInDays = (a, b) => {
  const msPerDay = 24 * 60 * 60 * 1000
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcB - utcA) / msPerDay)
}

// 달력 화면에 뿌릴 6주(7일 x 6줄 = 42칸) 분량의 날짜 배열을 만듭니다.
// 예를 들어 이번 달 1일이 수요일이면, 그 앞의 일/월/화도 채워서 한 주가 완성되도록 합니다.
export const buildMonthGrid = (monthDate) => {
  const first = startOfMonth(monthDate)
  const firstWeekday = first.getDay() // 0=일요일, 1=월요일 ... 6=토요일
  const gridStart = addDays(first, -firstWeekday) // 그 주의 일요일까지 거슬러 올라감
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

// 캘린더 상단에 "2026년 8월" 형식으로 보여줄 때 사용합니다.
export const formatYearMonth = (date) => `${date.getFullYear()}년 ${date.getMonth() + 1}월`

// 날짜 상세 화면에 "2026년 8월 19일 (수)" 형식으로 보여줄 때 사용합니다.
export const formatFullDate = (date) => {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`
}

// "매년 반복" 일정(생일, 기념일 등)이 다음번에는 언제 돌아오는지 계산합니다.
// monthDay: 원래 등록된 날짜 문자열('YYYY-MM-DD'). 연도는 무시하고 월/일만 사용합니다.
// from: 기준이 되는 오늘 날짜.
// 올해의 월/일이 이미 지났다면 내년 같은 날짜를 돌려줍니다.
export const nextYearlyOccurrence = (monthDay, from = new Date()) => {
  const [, m, d] = monthDay.split('-').map(Number) // 앞의 연도는 필요 없어서 버립니다.
  let candidate = new Date(from.getFullYear(), m - 1, d)
  candidate.setHours(0, 0, 0, 0)
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  if (candidate < today) {
    // 올해 날짜가 이미 지났으면 내년으로 넘김
    candidate = new Date(from.getFullYear() + 1, m - 1, d)
  }
  return candidate
}

// 커플 연결용 6자리 초대코드를 무작위로 만듭니다.
// 헷갈리기 쉬운 글자(0/O, 1/I 등)는 일부러 뺐습니다.
export const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
