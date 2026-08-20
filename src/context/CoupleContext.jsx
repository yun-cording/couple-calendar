// 로그인한 사용자가 속한 "커플 스페이스"(couples/{coupleId} 문서) 정보를 앱 전체에서
// 꺼내 쓸 수 있게 해주는 Context입니다. AuthContext와 구조가 거의 동일합니다.

import { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'

const CoupleContext = createContext(null)

export function CoupleProvider({ children }) {
  const { profile } = useAuth() // 로그인 정보에서 coupleId를 꺼내 쓰기 위해 AuthContext를 참고
  const [couple, setCouple] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 아직 커플과 연결되지 않은 사용자라면(coupleId가 없으면) 구독하지 않습니다.
    if (!profile?.coupleId || !db) {
      setCouple(null)
      setLoading(false)
      return
    }

    setLoading(true)
    // couples/{coupleId} 문서를 실시간 구독합니다.
    // 상대방이 사귄 날짜를 수정하거나 초대코드를 바꾸면 여기서 자동으로 반영됩니다.
    const unsub = onSnapshot(doc(db, 'couples', profile.coupleId), (snap) => {
      setCouple(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    })
    return unsub
  }, [profile?.coupleId])

  return <CoupleContext.Provider value={{ couple, loading }}>{children}</CoupleContext.Provider>
}

// 예: const { couple, loading } = useCouple()
export const useCouple = () => useContext(CoupleContext)
