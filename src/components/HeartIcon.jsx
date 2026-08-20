// 앱 로고로 쓰는 하트 아이콘입니다. 이모지(💗) 대신 벡터로 직접 그려서,
// 기기마다 다르게 보이지 않고 지금 고른 테마의 포인트 색 그라데이션이 자연스럽게 입혀집니다.

import { useId } from 'react'

export default function HeartIcon({ size = 28 }) {
  const gradientId = useId()

  return (
    <svg
      className="brand-heart-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--primary)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--accent)' }} />
        </linearGradient>
      </defs>
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  )
}
