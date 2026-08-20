// 설정 화면입니다. 닉네임 변경, 사귄 날짜 변경, 초대코드 확인, 다크모드, 로그아웃을 처리합니다.

import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { signOut, updateProfile } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { formatFullDate, generateInviteCode, parseDateKey } from '../lib/dateUtils'
import { listUpcomingAnniversaries } from '../lib/anniversaries'

// 화면 모드 선택지: 기본(라이트) + 다크 + 사계절(봄/여름/가을/겨울) 테마
const THEME_OPTIONS = [
  { id: 'light', label: '라이트', icon: '☀️' },
  { id: 'dark', label: '다크', icon: '🌙' },
  { id: 'spring', label: '봄', icon: '🌸' },
  { id: 'summer', label: '여름', icon: '🌊' },
  { id: 'fall', label: '가을', icon: '🍂' },
  { id: 'winter', label: '겨울', icon: '❄️' },
]

export default function SettingsPanel({
  couple,
  profile,
  user,
  theme,
  onThemeChange,
  events = [],
  smartAnniversaries = [],
}) {
  const [startDate, setStartDate] = useState(couple?.startDate || '')
  const [displayName, setDisplayName] = useState(profile?.displayName || '')
  const [birthDate, setBirthDate] = useState(profile?.birthDate || '')
  const [saved, setSaved] = useState('') // 방금 어떤 항목을 저장했는지 표시용 ('name' | 'anniversary' | 'birth' | '')
  // 직접 추가하는 기념일 입력값
  const [customTitle, setCustomTitle] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [customYearly, setCustomYearly] = useState(true)

  // 사귀기 시작한 날 저장 (couples 문서에 저장 -> 둘 다 같은 값을 보게 됨)
  const saveStartDate = async (e) => {
    e.preventDefault()
    await updateDoc(doc(db, 'couples', couple.id), { startDate: startDate || null })
    setSaved('anniversary')
    setTimeout(() => setSaved(''), 1500) // 1.5초 뒤 "저장됐어요" 메시지 자동으로 사라짐
  }

  // 닉네임 저장: Firestore(users 문서)와 Firebase Auth 계정 두 곳 모두 업데이트합니다.
  // (Auth 쪽 displayName은 로그인 관련 정보, Firestore 쪽은 우리 앱에서 실제로 화면에 쓰는 정보입니다)
  const saveName = async (e) => {
    e.preventDefault()
    await updateDoc(doc(db, 'users', user.uid), { displayName })
    await updateProfile(auth.currentUser, { displayName })
    setSaved('name')
    setTimeout(() => setSaved(''), 1500)
  }

  // 생년월일 저장: 저장해두면 해마다 돌아오는 "OO 생일" 기념일이 캘린더에 자동으로 표시됩니다.
  const saveBirthDate = async (e) => {
    e.preventDefault()
    await updateDoc(doc(db, 'users', user.uid), { birthDate: birthDate || null })
    setSaved('birth')
    setTimeout(() => setSaved(''), 1500)
  }

  // "기념일 추가" 목록: 생일 등 직접 등록한 yearly 일정 + 스마트 기념일(D+50/100/200/300, 생일)을 합쳐서,
  // 오늘 이후로 다가오는 것을 날짜순으로 보여줍니다.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yearlyEvents = events.filter((e) => e.yearly)
  const upcomingAnniversaries = listUpcomingAnniversaries(yearlyEvents, smartAnniversaries, today)

  // 내가 직접 추가한 기념일 전체 (지난 날짜도 포함) — 위 "챙길 기념일" 목록은 다가오는 것만 보여주기 때문에,
  // 지난 기념일도 삭제할 수 있도록 별도로 전부 보여줍니다.
  const myCustomAnniversaries = [...(profile?.customAnniversaries || [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  )

  // null이면(아직 한 번도 고른 적 없으면) 전체를 챙기는 것으로 간주합니다.
  const trackedIds = profile?.trackedAnniversaryIds || null
  const isTracked = (id) => !trackedIds || trackedIds.includes(id)

  // 체크를 하나 바꾸면, 지금 화면에 보이는 전체 목록을 기준으로 그 항목만 넣거나 뺀 새 배열을 저장합니다.
  const toggleTracked = async (id) => {
    const base = trackedIds || upcomingAnniversaries.map((a) => a.id)
    const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id]
    await updateDoc(doc(db, 'users', user.uid), { trackedAnniversaryIds: next })
  }

  // "전체 다시 챙기기": 개인 선택을 지우고 다시 전체 기념일을 대상으로 되돌립니다.
  const resetTracked = () => updateDoc(doc(db, 'users', user.uid), { trackedAnniversaryIds: null })

  // 기본으로는 서로의 생일 / 사귄지 50·100·200·300일이 자동으로 챙겨지고, 그 외에 직접 챙기고 싶은 기념일을 여기서 추가합니다.
  // "매년 반복" 체크 여부에 따라 해마다 돌아오는 기념일인지, 딱 한 번뿐인 날짜인지가 정해져서 저장됩니다.
  const addCustomAnniversary = async (e) => {
    e.preventDefault()
    if (!customTitle.trim() || !customDate) return
    const entry = {
      id: `custom-${crypto.randomUUID()}`,
      title: customTitle.trim(),
      date: customDate,
      yearly: customYearly,
      kind: 'custom',
    }
    await updateDoc(doc(db, 'users', user.uid), {
      customAnniversaries: [...(profile?.customAnniversaries || []), entry],
    })
    setCustomTitle('')
    setCustomDate('')
    setCustomYearly(true)
  }

  const removeCustomAnniversary = (id) =>
    updateDoc(doc(db, 'users', user.uid), {
      customAnniversaries: (profile?.customAnniversaries || []).filter((c) => c.id !== id),
    })

  // 내가 직접 추가한 기념일을 전부 지워서, 새로 깨끗하게 다시 추가할 수 있게 합니다.
  const clearCustomAnniversaries = () => {
    if ((profile?.customAnniversaries || []).length === 0) return
    if (!window.confirm('내가 추가한 기념일을 전부 삭제할까요?')) return
    return updateDoc(doc(db, 'users', user.uid), { customAnniversaries: [] })
  }

  // 초대코드를 새로 발급합니다. (아직 상대방이 참여하지 않았을 때만 의미가 있음)
  const regenerateCode = async () => {
    const code = generateInviteCode()
    await updateDoc(doc(db, 'couples', couple.id), { inviteCode: code })
  }

  return (
    <div className="card">
      <h2>⚙️ 설정</h2>

      <div className="settings-block">
        <h3>내 정보</h3>
        <form className="form-row" onSubmit={saveName}>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <button className="secondary-btn" type="submit">
            저장
          </button>
        </form>
        {saved === 'name' && <p className="success-text small">저장됐어요!</p>}

        {/* 생년월일을 저장해두면, 해마다 돌아오는 "OO 생일"이 캘린더/다음 기념일에 자동으로 표시됩니다 */}
        <label className="muted small settings-sublabel">생년월일</label>
        <form className="form-row" onSubmit={saveBirthDate}>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          <button className="secondary-btn" type="submit">
            저장
          </button>
        </form>
        {saved === 'birth' && <p className="success-text small">저장됐어요!</p>}
        {/* 방금 저장한 값을 다시 보여줘서, 제대로 입력됐는지 바로 확인할 수 있게 합니다 */}
        {birthDate && (
          <p className="muted small">🎂 내 생일: {formatFullDate(parseDateKey(birthDate))}</p>
        )}
      </div>

      <div className="settings-block">
        <h3>사귀기 시작한 날</h3>
        <form className="form-row" onSubmit={saveStartDate}>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <button className="secondary-btn" type="submit">
            저장
          </button>
        </form>
        {saved === 'anniversary' && <p className="success-text small">저장됐어요!</p>}
      </div>

      <div className="settings-block">
        <div className="section-title-row">
          <h3>기념일 추가</h3>
          {trackedIds && (
            <button className="link-btn" type="button" onClick={resetTracked}>
              전체 다시 챙기기
            </button>
          )}
        </div>
        <p className="muted small">
          체크한 기념일만 내 "다음 기념일" 카드와 알림 배지에 반영돼요. (아무것도 안 바꾸면 전체를 챙겨요)
          기본으로 서로의 생일과 사귄지 50·100·200·300일은 자동으로 챙겨지고, 그 외에 챙기고 싶은 날짜는 아래에서 직접 추가할 수 있어요.
        </p>
        {upcomingAnniversaries.length === 0 && (
          <p className="muted small">아직 표시할 기념일이 없어요. 사귄 날짜나 생일을 먼저 입력해보세요.</p>
        )}
        <ul className="anniversary-tracker-list">
          {upcomingAnniversaries.map((a) => (
            <li key={a.id} className="anniversary-tracker-item">
              <label>
                <input type="checkbox" checked={isTracked(a.id)} onChange={() => toggleTracked(a.id)} />
                <span>{a.title}</span>
              </label>
              <span className="muted small">{formatFullDate(a.occursOn)}</span>
            </li>
          ))}
        </ul>

        {/* 내가 직접 추가한 기념일은 지난 날짜라도(다가오는 목록에 안 보여도) 여기서 전부 삭제할 수 있습니다 */}
        {myCustomAnniversaries.length > 0 && (
          <>
            <div className="section-title-row settings-sublabel">
              <label className="muted small">내가 추가한 기념일</label>
              <button className="link-btn" type="button" onClick={clearCustomAnniversaries}>
                전체 삭제
              </button>
            </div>
            <ul className="anniversary-tracker-list">
              {myCustomAnniversaries.map((c) => (
                <li key={c.id} className="anniversary-tracker-item">
                  <span>
                    {c.title}
                    {c.yearly && <span className="badge">매년</span>}
                  </span>
                  <span className="anniversary-tracker-right">
                    <span className="muted small">{formatFullDate(parseDateKey(c.date))}</span>
                    <button
                      className="icon-btn small"
                      type="button"
                      onClick={() => removeCustomAnniversary(c.id)}
                      aria-label="기념일 삭제"
                    >
                      🗑
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* 기념일 직접 추가 폼 */}
        <form className="form-stack anniversary-add-form" onSubmit={addCustomAnniversary}>
          <input
            placeholder="기념일 이름 (예: 우리 첫 여행)"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
          />
          <div className="form-row">
            <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={customYearly}
                onChange={(e) => setCustomYearly(e.target.checked)}
              />
              매년 반복
            </label>
          </div>
          <button className="secondary-btn" type="submit">
            기념일 추가
          </button>
        </form>
      </div>

      <div className="settings-block">
        <h3>초대코드</h3>
        <p className="muted small">
          {couple?.members?.length === 2
            ? '이미 연인과 연결되어 있어요.'
            : '이 코드를 연인에게 공유해서 캘린더를 연결하세요.'}
        </p>
        <div className="invite-code-box">{couple?.inviteCode}</div>
        {/* 아직 2명이 다 안 모였을 때만 코드를 재발급할 수 있게 함 */}
        {couple?.members?.length < 2 && (
          <button className="link-btn" onClick={regenerateCode} type="button">
            코드 새로 만들기
          </button>
        )}
      </div>

      <div className="settings-block">
        <h3>화면 모드</h3>
        <div className="theme-picker">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`theme-btn ${theme === opt.id ? 'active' : ''}`}
              onClick={() => onThemeChange(opt.id)}
            >
              <span className="theme-btn-icon">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-block">
        <button className="danger-btn" onClick={() => signOut(auth)}>
          로그아웃
        </button>
      </div>
    </div>
  )
}
