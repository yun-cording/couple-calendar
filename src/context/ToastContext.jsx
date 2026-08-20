// 화면 하단에 잠깐 떴다 사라지는 알림(토스트) 메시지를 앱 어디서든 띄울 수 있게 해주는 Context입니다.
// 사용법: const showToast = useToast(); showToast('저장되었어요!')

import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const showToast = useCallback((message) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message }])
    // 2.5초 후 자동으로 사라지게 합니다.
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2500)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// 예: const showToast = useToast()
export const useToast = () => useContext(ToastContext)
