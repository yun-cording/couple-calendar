// 설정 화면입니다. 닉네임 변경, 사귄 날짜 변경, 초대코드 확인, 다크모드, 로그아웃을 처리합니다.

import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { signOut, updateProfile } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { generateInviteCode } from '../lib/dateUtils'

export default function SettingsPanel({ couple, profile, user, darkMode, onToggleDark }) {
  const [startDate, setStartDate] = useState(couple?.startDate || '')
  const [displayName, setDisplayName] = useState(profile?.displayName || '')
  const [saved, setSaved] = useState('') // 방금 어떤 항목을 저장했는지 표시용 ('name' | 'anniversary' | '')

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
        <h3>화면</h3>
        <label className="checkbox-row">
          <input type="checkbox" checked={darkMode} onChange={onToggleDark} />
          다크 모드
        </label>
      </div>

      <div className="settings-block">
        <button className="danger-btn" onClick={() => signOut(auth)}>
          로그아웃
        </button>
      </div>
    </div>
  )
}
