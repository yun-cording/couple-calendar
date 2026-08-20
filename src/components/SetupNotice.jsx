// Firebase 설정(.env)이 안 되어 있을 때 보여주는 안내 화면입니다.
// 이 화면이 보인다면 코드에 문제가 있는 게 아니라, 아직 Firebase 프로젝트를 연결하지 않은 것입니다.
export default function SetupNotice() {
  return (
    <div className="center-screen">
      <div className="card setup-notice">
        <h1>🔧 Firebase 설정이 필요해요</h1>
        <p>
          이 앱을 실제로 사용하려면 무료 Firebase 프로젝트를 하나 만들고,
          <code>.env</code> 파일에 발급받은 키를 채워 넣어야 합니다.
        </p>
        <ol>
          <li>
            <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
              Firebase 콘솔
            </a>
            에서 새 프로젝트를 만드세요.
          </li>
          <li>Authentication → 이메일/비밀번호 로그인을 사용 설정하세요.</li>
          <li>Firestore Database와 Storage를 각각 생성하세요.</li>
          <li>프로젝트 설정 → 내 앱에서 웹 앱을 추가하고 SDK 설정값을 복사하세요.</li>
          <li>
            프로젝트 루트의 <code>.env.example</code> 파일을 <code>.env</code>로 복사한 뒤 값을
            채우고 서버를 다시 시작하세요.
          </li>
        </ol>
        <p className="muted">자세한 절차는 README.md 문서를 참고하세요.</p>
      </div>
    </div>
  )
}
