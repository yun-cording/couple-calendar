// 모달/팝업이 열려 있는 동안 배경 화면이 함께 스크롤되는 것을 막는 훅입니다.
// 아이폰·갤럭시에서 DayPanel 같은 바텀시트를 열었을 때 뒤 배경이 밀리듯 스크롤되는 문제의 원인이라
// 열려 있는 동안에는 body 스크롤을 잠급니다.

import { useEffect } from 'react'

export function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [active])
}
