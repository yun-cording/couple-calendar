// Vite(빌드 도구) 설정 파일입니다.
// react() 플러그인을 추가하면 .jsx 파일을 브라우저가 이해할 수 있는 코드로 변환해주고,
// 코드를 수정했을 때 새로고침 없이 화면에 바로 반영되는 기능(HMR)도 제공합니다.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
