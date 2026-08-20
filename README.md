# Us. — 우리 커플 캘린더

커플이 함께 쓰는 웹 캘린더입니다. 배포하면 웹 브라우저로 언제 어디서든(휴대폰, PC 어디서든) 접속할 수 있고, 두 사람이 실시간으로 같은 데이터를 보고 편집합니다.

## 담긴 기능

- 이메일/비밀번호 로그인 + 회원가입
- **초대코드로 커플 연결**: 한 명이 캘린더를 만들고 6자리 코드를 상대방에게 공유하면 연결됨
- 월간 캘린더, 일정 추가/수정/삭제 (제목·시간·장소·메모·카테고리 색상)
- **매년 반복** 옵션으로 생일·기념일을 한 번만 등록하면 매년 자동 표시
- 상단 대시보드: 사귄 지 며칠째(D+n), 다음 기념일까지 D-day, 다가오는 일정
- 날짜별 **무드 기록 + 한 줄 다이어리** (달력에 이모지로 표시)
- 다이어리 피드: 지난 기록을 검색하고 모아보기
- 커플 **버킷리스트**(공유 할 일 목록, 완료 체크)
- 다크 모드
- 모바일 반응형 + 홈 화면에 앱처럼 추가 가능(PWA manifest)
- Firestore 보안 규칙: 커플 두 사람만 서로의 데이터를 읽고 쓸 수 있음

## 기술 스택

React + Vite (프론트엔드) / Firebase Authentication, Firestore, Hosting (백엔드 · 무료 티어로 충분)

---

## 1. 로컬에서 실행해보기

```bash
npm install
npm run dev
```

이 상태로 브라우저를 열면 "Firebase 설정이 필요해요" 화면이 뜹니다. 아래 2단계를 따라 실제 데이터베이스를 연결해야 로그인/캘린더 기능을 쓸 수 있습니다.

## 2. Firebase 프로젝트 만들기 (무료)

1. https://console.firebase.google.com 접속 → 로그인 → **프로젝트 추가**
2. 프로젝트 이름은 자유롭게 (예: `us-calendar`)
3. 왼쪽 메뉴 **Authentication** → 시작하기 → 로그인 방법 탭 → **이메일/비밀번호** 사용 설정
4. 왼쪽 메뉴 **Firestore Database** → 데이터베이스 만들기 → (위치는 `asia-northeast3(서울)` 추천) → **테스트 모드 대신** "프로덕션 모드"로 시작해도 무방 (규칙은 이후 배포로 덮어씀)
5. 왼쪽 메뉴 **Storage** → 시작하기 (사진 첨부 등 추후 확장을 위해 만들어 둡니다. 지금 당장 필수는 아님)
6. 프로젝트 개요 옆 톱니바퀴 → **프로젝트 설정** → 아래로 스크롤 → "내 앱" → **웹 앱 추가**(</> 아이콘) → 앱 닉네임 입력 → 등록
7. 화면에 나오는 `firebaseConfig` 값을 복사

## 3. 이 프로젝트에 키 연결하기

`.env.example` 파일을 복사해서 `.env` 파일을 만들고, 방금 복사한 값을 채워 넣습니다.

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=us-calendar.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=us-calendar
VITE_FIREBASE_STORAGE_BUCKET=us-calendar.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

다시 `npm run dev` 실행 → 회원가입 → "새 커플 캘린더 만들기" → 상대방은 회원가입 후 초대코드로 "참여하기".

## 4. 보안 규칙 배포 (중요)

Firestore 콘솔의 기본 규칙은 개발 중에만 열려 있거나 잠겨 있습니다. 이 저장소에 포함된 `firestore.rules`(커플 두 명만 자기 데이터에 접근 가능)를 반드시 배포하세요.

```bash
npm install -g firebase-tools   # 최초 1회
firebase login
firebase use --add              # 방금 만든 Firebase 프로젝트 선택
firebase deploy --only firestore:rules,storage
```

## 5. 웹으로 배포해서 어디서든 접속하기

### 방법 A — Firebase Hosting (추천, 같은 프로젝트로 한 번에 관리)

```bash
npm run build
firebase deploy --only hosting
```

배포가 끝나면 `https://<프로젝트ID>.web.app` 주소가 나옵니다. 이 주소를 상대방과 공유하면 됩니다. 이후 수정할 때마다 `npm run build && firebase deploy --only hosting`만 반복하면 됩니다.

### 방법 B — Vercel

1. https://vercel.com 가입 → "Add New Project" → 이 폴더를 GitHub에 올린 뒤 저장소 연결 (또는 `vercel` CLI로 직접 배포)
2. Environment Variables에 `.env`에 넣었던 `VITE_FIREBASE_*` 값들을 동일하게 등록
3. Build Command: `npm run build`, Output Directory: `dist`

두 방법 다 무료 플랜으로 충분합니다.

---

## 데이터 구조 (Firestore)

```
users/{uid}                 표시 이름, 이메일, 소속 coupleId
couples/{coupleId}          members(uid 2개), inviteCode, startDate(사귄 날)
  events/{eventId}          제목, date, time, category, location, memo, yearly(매년 반복 여부)
  diary/{dateKey}           날짜별 무드+한 줄 기록 (dateKey = YYYY-MM-DD)
  todos/{todoId}            버킷리스트 항목
```

## 다음에 더 추가하면 좋은 기능 아이디어

- 다이어리에 사진 첨부 (Storage 규칙은 `storage.rules`에 미리 준비되어 있음)
- 브라우저 푸시 알림으로 일정 리마인드
- 주간 뷰 / 일정 검색
- 커플 사진을 배경으로 커스터마이즈
