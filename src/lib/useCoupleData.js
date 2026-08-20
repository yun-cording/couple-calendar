// 커플 데이터(일정/다이어리/위시리스트)를 Firestore에서 실시간으로 읽어오는 커스텀 훅들입니다.
// 세 훅 모두 내부적으로는 같은 로직(useSubcollection)을 재사용합니다.

import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from './firebase'

// couples/{coupleId}/{name} 서브컬렉션(하위 컬렉션) 전체를 실시간으로 구독하는 공통 함수.
// name: 'events' | 'diary' | 'todos' 처럼 서브컬렉션 이름
// orderField: 정렬 기준 필드 (예: 'date', 'createdAt')
function useSubcollection(coupleId, name, orderField) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 아직 커플 연결이 안 됐으면(coupleId가 없으면) 아무것도 하지 않습니다.
    if (!coupleId) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)

    // orderField가 주어졌으면 정렬 조건을 붙인 쿼리를, 아니면 컬렉션 전체를 그대로 사용합니다.
    const q = orderField
      ? query(collection(db, 'couples', coupleId, name), orderBy(orderField))
      : collection(db, 'couples', coupleId, name)

    // onSnapshot: 처음 한 번 데이터를 읽어온 뒤, 이후 나나 상대방이 데이터를 바꿀 때마다
    // 자동으로 다시 호출되어 최신 목록으로 갱신해줍니다. (실시간 동기화의 핵심)
    const unsub = onSnapshot(
      q,
      (snap) => {
        // 문서 목록(snap.docs)을 { id, ...데이터 } 형태의 배열로 변환합니다.
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => setLoading(false), // 에러가 나도 로딩 상태는 풀어줍니다.
    )

    // 컴포넌트가 사라지거나 coupleId가 바뀌면 이전 구독을 정리합니다.
    return unsub
  }, [coupleId, name, orderField])

  return { items, loading }
}

// 일정 목록 (날짜순 정렬)
export const useEvents = (coupleId) => useSubcollection(coupleId, 'events', 'date')
// 다이어리 목록 (날짜순 정렬)
export const useDiaryEntries = (coupleId) => useSubcollection(coupleId, 'diary', 'date')
// 위시리스트 목록 (등록순 정렬)
export const useTodos = (coupleId) => useSubcollection(coupleId, 'todos', 'createdAt')
