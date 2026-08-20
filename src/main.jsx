// 앱의 진입점(entry point)입니다. index.html의 <div id="root"></div> 안에
// React 앱 전체를 그려 넣는(render) 역할을 합니다.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // 전역 스타일(디자인) 불러오기
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CoupleProvider } from './context/CoupleContext.jsx'

// AuthProvider와 CoupleProvider로 App을 감싸서,
// App 내부의 모든 컴포넌트가 useAuth(), useCouple() 훅을 사용할 수 있게 합니다.
// (감싸는 순서가 중요합니다: CoupleProvider가 useAuth()를 쓰기 때문에 AuthProvider가 더 바깥쪽에 있어야 합니다)
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CoupleProvider>
        <App />
      </CoupleProvider>
    </AuthProvider>
  </StrictMode>,
)
