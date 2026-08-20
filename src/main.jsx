// 앱의 진입점(entry point)입니다. index.html의 <div id="root"></div> 안에
// React 앱 전체를 그려 넣는(render) 역할을 합니다.
// (훅 테스트용 주석: 자동 커밋/푸시/빌드/배포 파이프라인 동작 확인)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // 전역 스타일(디자인) 불러오기
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CoupleProvider } from './context/CoupleContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

// AuthProvider와 CoupleProvider로 App을 감싸서,
// App 내부의 모든 컴포넌트가 useAuth(), useCouple() 훅을 사용할 수 있게 합니다.
// (감싸는 순서가 중요합니다: CoupleProvider가 useAuth()를 쓰기 때문에 AuthProvider가 더 바깥쪽에 있어야 합니다)
// ToastProvider는 어디에서든 useToast()로 알림을 띄울 수 있도록 가장 바깥쪽에 둡니다.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <CoupleProvider>
          <App />
        </CoupleProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
