// 앱의 최상위 컴포넌트입니다.
// "Firebase 설정 확인 -> 로그인 확인 -> 커플 연결 확인" 순서로 화면을 단계별로 분기하고,
// 모든 준비가 끝나면 실제 캘린더 화면(CoupledApp)을 보여줍니다.

import { useEffect, useMemo, useState } from 'react'
import { firebaseConfigured } from './lib/firebase'
import { useAuth } from './context/AuthContext'
import { useCouple } from './context/CoupleContext'
import { useMembers } from './lib/useMembers'
import { useEvents, useDiaryEntries, useTodos } from './lib/useCoupleData'
import { addMonths } from './lib/dateUtils'

import SetupNotice from './components/SetupNotice'
import AuthScreen from './components/AuthScreen'
import CoupleSetup from './components/CoupleSetup'
import Header from './components/Header'
import DashboardBar from './components/DashboardBar'
import CalendarView from './components/CalendarView'
import DayPanel from './components/DayPanel'
import BucketList from './components/BucketList'
import DiaryFeed from './components/DiaryFeed'
import SettingsPanel from './components/SettingsPanel'

export default function App() {
  // 화면 모드(라이트/다크/봄/여름/가을/겨울)는 새로고침해도 유지되도록 localStorage에 저장/조회합니다.
  const [theme, setTheme] = useState(() => localStorage.getItem('us-theme') || 'light')
  const [tab, setTab] = useState('calendar') // 현재 선택된 탭: calendar | diary | bucket | settings
  const [monthDate, setMonthDate] = useState(() => new Date()) // 달력에 표시 중인 "월"
  const [selectedDateKey, setSelectedDateKey] = useState(null) // 클릭해서 상세보기 연 날짜 (없으면 null)

  // theme 값이 바뀔 때마다 <html> 태그에 data-theme 속성을 붙여줍니다.
  // index.css에서 이 속성을 보고 각 모드의 색상을 적용합니다.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('us-theme', theme)
  }, [theme])

  // .env에 Firebase 키를 아직 안 넣었다면, 로그인 화면 대신 설정 안내 화면을 보여줍니다.
  if (!firebaseConfigured) return <SetupNotice />

  return (
    <>
      {/* 봄/여름/가을/겨울 모드일 때 배경에 깔리는 계절 풍경 일러스트 (index.css의 .app-scenery 참고) */}
      <div className="app-scenery" aria-hidden="true" />
      <AuthedApp
        theme={theme}
        setTheme={setTheme}
        tab={tab}
        setTab={setTab}
        monthDate={monthDate}
        setMonthDate={setMonthDate}
        selectedDateKey={selectedDateKey}
        setSelectedDateKey={setSelectedDateKey}
      />
    </>
  )
}

// 로그인 여부와 커플 연결 여부에 따라 어떤 화면을 보여줄지 결정하는 컴포넌트입니다.
function AuthedApp({ theme, setTheme, tab, setTab, monthDate, setMonthDate, selectedDateKey, setSelectedDateKey }) {
  const { user, profile, loading: authLoading } = useAuth()

  if (authLoading) return <LoadingScreen /> // 로그인 여부를 아직 확인 중
  if (!user) return <AuthScreen /> // 로그인 안 됨 -> 로그인/회원가입 화면
  if (!profile) return <LoadingScreen /> // 로그인은 됐는데 프로필 문서를 아직 못 읽어옴
  if (!profile.coupleId) return <CoupleSetup /> // 아직 연인과 연결 안 됨 -> 커플 생성/참여 화면

  // 여기까지 왔다면 로그인 + 커플 연결이 모두 완료된 상태입니다.
  return (
    <CoupledApp
      user={user}
      profile={profile}
      theme={theme}
      setTheme={setTheme}
      tab={tab}
      setTab={setTab}
      monthDate={monthDate}
      setMonthDate={setMonthDate}
      selectedDateKey={selectedDateKey}
      setSelectedDateKey={setSelectedDateKey}
    />
  )
}

// 로그인 + 커플 연결이 끝난 뒤 보여주는 실제 앱 화면(헤더, 캘린더, 탭 등)입니다.
function CoupledApp({ user, profile, theme, setTheme, tab, setTab, monthDate, setMonthDate, selectedDateKey, setSelectedDateKey }) {
  const { couple, loading: coupleLoading } = useCouple() // 커플 스페이스 문서(couples/{id})
  const members = useMembers(couple?.members) // 나와 상대방의 닉네임 등 프로필 정보
  const { items: events } = useEvents(couple?.id) // 일정 목록
  const { items: diaryEntries } = useDiaryEntries(couple?.id) // 다이어리 목록
  const { items: todos } = useTodos(couple?.id) // 버킷리스트 목록
  // DashboardBar의 "다가오는 일정"을 클릭했을 때, DayPanel에서 바로 그 일정의 상세를 보여주기 위한 상태입니다.
  const [focusEvent, setFocusEvent] = useState(null)

  // diaryEntries 배열을 { '2026-08-19': {...}, ... } 형태의 객체로 바꿔둡니다.
  // 달력 칸마다 "이 날짜에 다이어리가 있나?"를 빠르게 찾아보기 위해서입니다.
  // useMemo를 쓰는 이유: diaryEntries가 바뀔 때만 다시 계산하고, 그 외 렌더링에서는 재사용합니다.
  const diaryByDate = useMemo(() => {
    const map = {}
    diaryEntries.forEach((d) => (map[d.date] = d))
    return map
  }, [diaryEntries])

  if (coupleLoading) return <LoadingScreen />
  if (!couple) return <CoupleSetup /> // 혹시 모를 예외 상황(커플 문서가 삭제된 경우 등) 대비

  // 탭을 바꿀 때, 달력 탭이 아닌 다른 탭으로 이동하면 열려있던 날짜 상세창(DayPanel)을 닫아줍니다.
  const handleTabChange = (nextTab) => {
    setTab(nextTab)
    if (nextTab !== 'calendar') setSelectedDateKey(null)
  }

  // 캘린더 탭으로 이동해서 특정 날짜의 DayPanel을 엽니다.
  // event가 넘어오면(예: "다가오는 일정" 클릭) 그 일정의 상세를 바로 보여줍니다.
  const openDay = (dateKey, event = null) => {
    setTab('calendar')
    setSelectedDateKey(dateKey)
    setFocusEvent(event)
  }

  return (
    <div className="app-shell">
      <Header tab={tab} onTabChange={handleTabChange} members={members} myUid={user.uid} />

      <main className="app-main">
        {/* 상단 D-day / 다가오는 일정 요약 바는 어떤 탭에서든 항상 보여줍니다 */}
        <DashboardBar
          startDate={couple.startDate}
          events={events}
          members={members}
          myUid={user.uid}
          onSelectEvent={(ev) => openDay(ev.date, ev)}
        />

        {tab === 'calendar' && (
          <CalendarView
            monthDate={monthDate}
            onPrevMonth={() => setMonthDate((d) => addMonths(d, -1))}
            onNextMonth={() => setMonthDate((d) => addMonths(d, 1))}
            onToday={() => setMonthDate(new Date())}
            events={events}
            diaryByDate={diaryByDate}
            selectedDateKey={selectedDateKey}
            onSelectDay={openDay}
          />
        )}

        {tab === 'diary' && (
          <DiaryFeed
            diaryEntries={diaryEntries}
            members={members}
            onSelectDay={openDay}
          />
        )}

        {tab === 'bucket' && (
          <BucketList coupleId={couple.id} todos={todos} members={members} myUid={user.uid} />
        )}

        {tab === 'settings' && (
          <SettingsPanel
            couple={couple}
            profile={profile}
            user={user}
            theme={theme}
            onThemeChange={setTheme}
          />
        )}
      </main>

      {/* selectedDateKey가 있을 때만(날짜를 클릭했을 때만) 상세 패널을 화면 위에 띄웁니다 */}
      {selectedDateKey && (
        <DayPanel
          coupleId={couple.id}
          dateKey={selectedDateKey}
          events={events}
          diaryEntry={diaryByDate[selectedDateKey]}
          members={members}
          myUid={user.uid}
          initialEditingEvent={focusEvent}
          onClose={() => {
            setSelectedDateKey(null)
            setFocusEvent(null)
          }}
        />
      )}
    </div>
  )
}

// 데이터를 불러오는 동안 잠깐 보여주는 로딩 스피너 화면
function LoadingScreen() {
  return (
    <div className="center-screen">
      <div className="loader" />
    </div>
  )
}
