// 로그인 / 회원가입 화면입니다.
// mode 상태값에 따라 같은 화면에서 로그인 폼과 회원가입 폼을 전환해서 보여줍니다.

import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export default function AuthScreen() {
  const [mode, setMode] = useState('login') // 'login' 또는 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false) // 요청 처리 중일 때 버튼을 잠깐 비활성화하기 위한 상태
  const [resetSent, setResetSent] = useState(false)

  // Firebase가 내려주는 에러 코드(영어)를 한글 안내 메시지로 바꿔주는 함수
  const friendlyError = (code) => {
    const map = {
      'auth/invalid-email': '이메일 형식이 올바르지 않아요.',
      'auth/user-not-found': '가입되지 않은 이메일이에요.',
      'auth/wrong-password': '비밀번호가 일치하지 않아요.',
      'auth/invalid-credential': '이메일 또는 비밀번호가 일치하지 않아요.',
      'auth/email-already-in-use': '이미 가입된 이메일이에요.',
      'auth/weak-password': '비밀번호는 6자 이상이어야 해요.',
    }
    return map[code] || '문제가 발생했어요. 잠시 후 다시 시도해주세요.'
  }

  const handleSubmit = async (e) => {
    e.preventDefault() // 폼 제출 시 페이지가 새로고침되는 기본 동작을 막습니다.
    setError('')
    setBusy(true)
    try {
      if (mode === 'signup') {
        // 1) Firebase Authentication에 계정을 만듭니다.
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        // 2) Auth 계정에 표시 이름(닉네임)을 저장합니다.
        await updateProfile(cred.user, { displayName: name || '나' })
        // 3) Firestore에도 users/{uid} 문서를 따로 만들어둡니다.
        //    (Auth 계정 정보와는 별개로, coupleId 같은 우리 앱만의 정보를 저장하기 위함입니다)
        await setDoc(doc(db, 'users', cred.user.uid), {
          displayName: name || '나',
          email,
          coupleId: null, // 아직 커플과 연결 안 됨
          createdAt: serverTimestamp(),
        })
      } else {
        // 로그인은 이메일/비밀번호로 인증만 하면 끝. 로그인 성공 시
        // AuthContext의 onAuthStateChanged가 자동으로 감지해서 화면이 전환됩니다.
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setBusy(false)
    }
  }

  // 비밀번호를 잊어버렸을 때, 입력한 이메일로 재설정 링크를 보내줍니다.
  const handleReset = async () => {
    if (!email) {
      setError('비밀번호를 재설정할 이메일을 먼저 입력해주세요.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
    } catch (err) {
      setError(friendlyError(err.code))
    }
  }

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <div className="brand">
          <span className="brand-heart">💗</span>
          <h1>Us.</h1>
          <p className="muted">우리 둘만의 캘린더</p>
        </div>

        {/* 로그인/회원가입 탭 전환 버튼 */}
        <div className="tab-switch">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            로그인
          </button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          {/* 회원가입 모드일 때만 닉네임 입력칸을 보여줍니다 */}
          {mode === 'signup' && (
            <input
              placeholder="닉네임 (예: 지민)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          {error && <p className="error-text">{error}</p>}
          {resetSent && <p className="success-text">재설정 메일을 보냈어요. 메일함을 확인해주세요.</p>}
          <button type="submit" className="primary-btn" disabled={busy}>
            {busy ? '처리 중…' : mode === 'signup' ? '회원가입' : '로그인'}
          </button>
        </form>

        {mode === 'login' && (
          <button className="link-btn" onClick={handleReset} type="button">
            비밀번호를 잊으셨나요?
          </button>
        )}
      </div>
    </div>
  )
}
