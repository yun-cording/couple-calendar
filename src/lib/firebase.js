// 이 파일은 Firebase(구글에서 제공하는 백엔드 서비스)를 초기화하는 곳입니다.
// 로그인(Authentication), 데이터베이스(Firestore), 파일 저장소(Storage)를
// 한 번만 설정해두면 다른 파일에서는 여기서 만든 auth/db/storage를 가져다 쓰기만 하면 됩니다.

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// .env 파일에 저장해둔 값들을 불러옵니다.
// Vite에서는 환경변수 이름이 반드시 VITE_ 로 시작해야 브라우저 코드에서 읽을 수 있습니다.
// (이 값들은 Firebase 콘솔 > 프로젝트 설정 > 내 앱 에서 확인할 수 있어요)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// .env 파일을 아직 채우지 않은 상태라면 apiKey/projectId가 비어있을 것입니다.
// 이 값으로 "Firebase 설정이 제대로 되어 있는가?"를 판단해서
// App.jsx에서 안내 화면(SetupNotice)을 보여줄지 결정합니다.
export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

// 설정값이 없는데 initializeApp을 호출하면 에러가 나기 때문에,
// 설정이 되어 있을 때만 실제로 Firebase 앱을 초기화합니다.
const app = firebaseConfigured ? initializeApp(firebaseConfig) : null

// 다른 파일에서는 이 세 가지를 import해서 바로 사용합니다.
// 예: import { auth } from '../lib/firebase'
export const auth = app ? getAuth(app) : null // 로그인/회원가입 담당
export const db = app ? getFirestore(app) : null // 실시간 데이터베이스(Firestore) 담당
export const storage = app ? getStorage(app) : null // 사진 등 파일 업로드 담당 (현재는 미리 준비만 해둔 상태)
