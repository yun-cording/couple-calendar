// 로그인한 사용자 정보를 앱 전체에서 쉽게 꺼내 쓸 수 있게 해주는 Context입니다.
// React Context를 쓰면 props를 일일이 전달하지 않아도, 하위 컴포넌트 어디서든
// useAuth() 한 줄로 현재 로그인한 사용자 정보를 가져올 수 있습니다.

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

// Context 객체 생성. 아직은 빈 상자라고 생각하면 됩니다.
const AuthContext = createContext(null)

// main.jsx에서 <App />을 이 컴포넌트로 감싸면, App과 그 하위 모든 컴포넌트에서
// useAuth()를 통해 { user, profile, loading } 값을 사용할 수 있게 됩니다.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // Firebase Auth가 주는 로그인 계정 정보 (이메일 등)
  const [profile, setProfile] = useState(null) // Firestore users/{uid} 문서 (닉네임, coupleId 등)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  // 1) 로그인 상태 감시
  // onAuthStateChanged는 로그인/로그아웃이 일어날 때마다 자동으로 호출됩니다.
  // (새로고침해도 로그인 상태가 유지되는 이유가 바로 이 함수 덕분입니다)
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
      if (!u) {
        // 로그아웃 상태라면 프로필 정보도 함께 비워줍니다.
        setProfile(null)
        setProfileLoading(false)
      }
    })
    return unsub // 컴포넌트가 사라질 때 구독 해제
  }, [])

  // 2) 로그인된 사용자의 Firestore 프로필 문서(users/{uid}) 실시간 구독
  // user가 바뀔 때마다(로그인/로그아웃 시) 다시 실행됩니다.
  useEffect(() => {
    if (!user || !db) return
    setProfileLoading(true)
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setProfileLoading(false)
    })
    return unsub
  }, [user])

  return (
    <AuthContext.Provider
      value={{ user, profile, loading: authLoading || (Boolean(user) && profileLoading) }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// 다른 컴포넌트에서 이 훅 하나로 로그인 정보에 접근합니다.
// 예: const { user, profile, loading } = useAuth()
export const useAuth = () => useContext(AuthContext)
