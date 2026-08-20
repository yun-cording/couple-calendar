// 커플의 두 멤버(uid)에 대한 사용자 정보(닉네임 등)를 실시간으로 가져오는 커스텀 훅입니다.
// couple 문서에는 members: [uid1, uid2] 처럼 사용자 아이디만 들어있기 때문에,
// 화면에 "지민" 같은 실제 이름을 보여주려면 users 컬렉션에서 각 uid의 문서를 따로 읽어와야 합니다.

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'

// members: ['uid1', 'uid2'] 형태의 배열을 받아서
// { uid1: {displayName, ...}, uid2: {displayName, ...} } 형태의 객체로 돌려줍니다.
export function useMembers(members) {
  const [profiles, setProfiles] = useState({})

  useEffect(() => {
    if (!members || members.length === 0) return

    // 멤버 한 명 한 명마다 onSnapshot으로 "실시간 구독"을 겁니다.
    // onSnapshot은 한 번만 읽고 끝나는 게 아니라, 상대방이 닉네임을 바꾸는 등
    // 데이터가 바뀔 때마다 자동으로 콜백을 다시 실행해줍니다.
    const unsubs = members.map((uid) =>
      onSnapshot(doc(db, 'users', uid), (snap) => {
        if (snap.exists()) {
          // 기존 profiles 객체를 복사한 뒤 해당 uid 값만 갱신합니다.
          setProfiles((prev) => ({ ...prev, [uid]: { id: uid, ...snap.data() } }))
        }
      }),
    )

    // 컴포넌트가 화면에서 사라지거나 members가 바뀔 때,
    // 구독을 정리(unsubscribe)해주지 않으면 메모리 누수가 생길 수 있습니다.
    return () => unsubs.forEach((unsub) => unsub())
  }, [JSON.stringify(members)]) // 배열은 매번 새로운 참조라서, 내용을 문자열로 비교합니다.

  return profiles
}
