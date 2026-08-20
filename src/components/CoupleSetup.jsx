// 로그인은 했지만 아직 연인과 연결되지 않은 사용자에게 보여주는 화면입니다.
// "새 커플 캘린더 만들기"를 누르면 초대코드가 생성되고,
// "초대코드로 참여하기"를 누르면 상대방이 만든 코드로 같은 캘린더에 합류합니다.

import { useState } from 'react'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { generateInviteCode } from '../lib/dateUtils'

export default function CoupleSetup() {
  const { user, profile } = useAuth()
  const [mode, setMode] = useState('choose') // choose(선택) | create(만들기) | join(참여하기)
  const [code, setCode] = useState('')
  const [startDate, setStartDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // "새 커플 캘린더 만들기" 처리
  const handleCreate = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const inviteCode = generateInviteCode()
      // collection(db, 'couples')만 넘기고 doc()을 호출하면, 랜덤한 새 문서 ID가 자동으로 생성됩니다.
      const coupleRef = doc(collection(db, 'couples'))
      // 1) 새 커플 문서를 만듭니다. members 배열에는 일단 나 혼자만 들어갑니다.
      await setDoc(coupleRef, {
        members: [user.uid],
        inviteCode,
        startDate: startDate || null,
        createdAt: serverTimestamp(),
      })
      // 2) 내 users 문서에 방금 만든 커플의 id를 저장합니다.
      //    이 값이 채워지면 App.jsx에서 자동으로 캘린더 화면으로 넘어갑니다.
      await updateDoc(doc(db, 'users', user.uid), { coupleId: coupleRef.id })
    } catch (err) {
      setError('생성에 실패했어요: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  // "초대코드로 참여하기" 처리
  const handleJoin = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const trimmed = code.trim().toUpperCase()
      // inviteCode 필드가 입력한 코드와 일치하는 커플 문서를 검색합니다.
      const q = query(collection(db, 'couples'), where('inviteCode', '==', trimmed))
      const snap = await getDocs(q)
      if (snap.empty) {
        setError('일치하는 초대코드를 찾을 수 없어요.')
        return
      }
      const coupleDoc = snap.docs[0]
      const members = coupleDoc.data().members || []

      if (members.includes(user.uid)) {
        // 이미 이 커플의 멤버라면(예: 새로고침으로 다시 들어온 경우) 그냥 연결만 해줍니다.
        await updateDoc(doc(db, 'users', user.uid), { coupleId: coupleDoc.id })
        return
      }
      if (members.length >= 2) {
        setError('이미 두 명이 연결된 캘린더예요.')
        return
      }

      // arrayUnion: 기존 members 배열에 내 uid를 "중복 없이" 추가해줍니다.
      await updateDoc(doc(db, 'couples', coupleDoc.id), { members: arrayUnion(user.uid) })
      await updateDoc(doc(db, 'users', user.uid), { coupleId: coupleDoc.id })
    } catch (err) {
      setError('참여에 실패했어요: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <div className="brand">
          <span className="brand-heart">💌</span>
          <h1>반가워요, {profile?.displayName || '님'}!</h1>
          <p className="muted">연인과 캘린더를 연결해주세요</p>
        </div>

        {/* 1단계: 만들지 참여할지 선택 */}
        {mode === 'choose' && (
          <div className="form-stack">
            <button className="primary-btn" onClick={() => setMode('create')}>
              새 커플 캘린더 만들기
            </button>
            <button className="secondary-btn" onClick={() => setMode('join')}>
              초대코드로 참여하기
            </button>
          </div>
        )}

        {/* 2-A단계: 새로 만들기 폼 */}
        {mode === 'create' && (
          <form className="form-stack" onSubmit={handleCreate}>
            <label className="field-label">
              사귀기 시작한 날 (선택, 나중에 설정에서 바꿀 수 있어요)
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button className="primary-btn" disabled={busy}>
              {busy ? '만드는 중…' : '캘린더 만들기'}
            </button>
            <button type="button" className="link-btn" onClick={() => setMode('choose')}>
              ← 뒤로
            </button>
          </form>
        )}

        {/* 2-B단계: 초대코드로 참여하는 폼 */}
        {mode === 'join' && (
          <form className="form-stack" onSubmit={handleJoin}>
            <input
              placeholder="6자리 초대코드 (예: AB12CD)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              style={{ textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center' }}
              required
            />
            {error && <p className="error-text">{error}</p>}
            <button className="primary-btn" disabled={busy}>
              {busy ? '연결하는 중…' : '참여하기'}
            </button>
            <button type="button" className="link-btn" onClick={() => setMode('choose')}>
              ← 뒤로
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
