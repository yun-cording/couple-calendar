// "사귄 날짜"(couple.startDate)와 멤버들의 생년월일만으로 계산되는 스마트 기념일 목록입니다.
// D+100 같은 하루 단위 마일스톤(한 번뿐), N주년과 생일(둘 다 해마다 돌아옴) 세 종류를 계산해서 돌려줍니다.
// Firestore에 따로 저장하지 않고 화면을 그릴 때마다 새로 계산하기 때문에,
// 나중에 사귄 날짜나 생일을 수정해도 항상 최신 값으로 맞춰집니다.

import { addDays, diffInDays, nextYearlyOccurrence, parseDateKey, toDateKey } from './dateUtils'

// 며칠째 되는 날을 기념하고 싶은지 (예: 100일, 200일, 1000일 기념일)
const DAY_MILESTONES = [50, 100, 200, 300, 500, 777, 1000, 2000, 3000]

// startDate: 'YYYY-MM-DD' 문자열 (없으면 빈 배열)
// 반환값: [{ id, title, date('YYYY-MM-DD'), yearly, kind }, ...]
// yearly가 false면 date에 적힌 그 날짜 딱 한 번만, true면 date의 월/일을 기준으로 해마다 돌아옵니다.
// N주년(kind: 'anniversary')은 title을 고정값으로 들고 있지 않고, anniversaryLabel()로 그때그때 계산합니다.
export function computeSmartAnniversaries(startDate) {
  if (!startDate) return []
  const start = parseDateKey(startDate)
  const items = []

  // 사귄 첫날을 1일차로 세기 때문에, "n일째"는 시작일 + (n-1)일입니다.
  DAY_MILESTONES.forEach((n) => {
    items.push({
      id: `dday-${n}`,
      title: `D+${n}`,
      date: toDateKey(addDays(start, n - 1)),
      yearly: false,
      kind: 'dday',
    })
  })

  // N주년: 15년까지만 미리 나열하는 대신, 해마다 돌아오는 항목 하나로 표현합니다.
  // (몇 주년인지는 실제로 표시되는 날짜의 연도에 따라 anniversaryLabel()이 계산합니다)
  items.push({
    id: 'anniversary-yearly',
    title: '주년',
    date: startDate,
    yearly: true,
    kind: 'anniversary',
  })

  return items
}

// members: useMembers()가 돌려주는 { uid: { id, displayName, birthDate, ... } } 형태의 객체.
// birthDate를 입력해둔 멤버마다 "OO 생일" 기념일을 하나씩 만듭니다. (해마다 돌아옴)
export function computeBirthdayAnniversaries(members) {
  return Object.values(members || {})
    .filter((m) => m.birthDate)
    .map((m) => ({
      id: `birthday-${m.id}`,
      title: `${m.displayName || '상대방'} 생일`,
      date: m.birthDate,
      yearly: true,
      kind: 'birthday',
    }))
}

// 스마트 기념일 하나를 특정 날짜(date, Date 객체)에 표시할 때 쓸 제목을 계산합니다.
// N주년만 연도에 따라 "1주년"/"2주년"처럼 제목이 바뀌고, 나머지는 고정된 title을 그대로 씁니다.
// N주년은 사귄 날짜 이후(1년째부터)만 의미가 있어서, 시작 연도 자체(0주년)는 null을 돌려줍니다.
export function anniversaryLabel(anniversary, date) {
  if (anniversary.kind !== 'anniversary') return anniversary.title
  const startYear = parseDateKey(anniversary.date).getFullYear()
  const n = date.getFullYear() - startYear
  return n >= 1 ? `${n}주년` : null
}

// 스마트 기념일 하나가 오늘(today) 기준으로 다음에 언제 돌아오는지 계산합니다.
export function anniversaryOccursOn(anniversary, today) {
  return anniversary.yearly ? nextYearlyOccurrence(anniversary.date, today) : parseDateKey(anniversary.date)
}

// 스마트 기념일 하나가 캘린더의 특정 날짜(date, Date 객체)에 표시되어야 하는지 판단합니다.
export function anniversaryMatchesDate(anniversary, date) {
  if (anniversary.yearly) {
    const [, m, d] = anniversary.date.split('-').map(Number)
    if (m !== date.getMonth() + 1 || d !== date.getDate()) return false
    // anniversaryLabel이 null을 돌려주는 경우(예: N주년의 시작 연도)는 표시하지 않습니다.
    return anniversaryLabel(anniversary, date) !== null
  }
  return anniversary.date === toDateKey(date)
}

// 직접 등록한 yearly 일정(생일 등)과 스마트 기념일을 합쳐서, 오늘 이후로 다가오는 것을 날짜순으로 전부 돌려줍니다.
// DashboardBar의 "다음 기념일" 카드, Header의 알림 배지, 설정의 "챙길 기념일" 목록이 같은 기준을 쓰도록 여기 한 곳에 모아둡니다.
export function listUpcomingAnniversaries(yearlyEvents, smartAnniversaries, today) {
  const candidates = [
    ...yearlyEvents.map((e) => ({ id: e.id, title: e.title, occursOn: nextYearlyOccurrence(e.date, today) })),
    ...smartAnniversaries.map((a) => {
      const occursOn = anniversaryOccursOn(a, today)
      return { id: a.id, title: anniversaryLabel(a, occursOn), occursOn }
    }),
  ]
  return candidates
    .filter((a) => a.title !== null && diffInDays(today, a.occursOn) >= 0)
    .sort((a, b) => a.occursOn - b.occursOn)
}

// 가장 가까운 기념일 하나만 필요할 때 씁니다. (선택적으로 trackedIds가 주어지면 그 안에 포함된 것만 대상으로 합니다)
export function findUpcomingAnniversary(yearlyEvents, smartAnniversaries, today, trackedIds = null) {
  const all = listUpcomingAnniversaries(yearlyEvents, smartAnniversaries, today)
  const filtered = trackedIds ? all.filter((a) => trackedIds.includes(a.id)) : all
  return filtered[0]
}
