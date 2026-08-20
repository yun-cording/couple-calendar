// "사귄 날짜"(couple.startDate) 하나만으로 계산되는 스마트 기념일 목록입니다.
// D+100 같은 하루 단위 마일스톤과, N주년(해마다 돌아오는) 두 종류를 계산해서 돌려줍니다.
// Firestore에 따로 저장하지 않고 화면을 그릴 때마다 새로 계산하기 때문에,
// 나중에 사귄 날짜를 수정해도 항상 최신 값으로 맞춰집니다.

import { addDays, diffInDays, nextYearlyOccurrence, parseDateKey, toDateKey } from './dateUtils'

// 며칠째 되는 날을 기념하고 싶은지 (예: 100일, 200일, 1000일 기념일)
const DAY_MILESTONES = [50, 100, 200, 300, 500, 777, 1000, 2000, 3000]
// N주년을 몇 년 뒤까지 미리 계산해둘지
const MAX_ANNIVERSARY_YEARS = 15

// startDate: 'YYYY-MM-DD' 문자열 (없으면 빈 배열)
// 반환값: [{ id, title, date('YYYY-MM-DD'), kind: 'dday' | 'anniversary' }, ...]
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
      kind: 'dday',
    })
  })

  for (let year = 1; year <= MAX_ANNIVERSARY_YEARS; year++) {
    const date = new Date(start.getFullYear() + year, start.getMonth(), start.getDate())
    items.push({
      id: `anniv-${year}`,
      title: `${year}주년`,
      date: toDateKey(date),
      kind: 'anniversary',
    })
  }

  return items
}

// 직접 등록한 yearly 일정(생일 등)과 스마트 기념일을 합쳐서, 가장 가까운 미래의 기념일 하나를 찾습니다.
// DashboardBar의 "다음 기념일" 카드와 Header의 알림 배지가 같은 기준을 쓰도록 여기 한 곳에 모아둡니다.
export function findUpcomingAnniversary(yearlyEvents, smartAnniversaries, today) {
  const candidates = [
    ...yearlyEvents.map((e) => ({ id: e.id, title: e.title, occursOn: nextYearlyOccurrence(e.date, today) })),
    ...smartAnniversaries
      .map((a) => ({ id: a.id, title: a.title, occursOn: parseDateKey(a.date) }))
      .filter((a) => diffInDays(today, a.occursOn) >= 0),
  ]
  return candidates.sort((a, b) => a.occursOn - b.occursOn)[0]
}
