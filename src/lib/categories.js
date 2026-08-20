// 일정에 붙일 수 있는 카테고리 목록과, 다이어리에 쓸 무드(기분) 이모지 목록입니다.
// 새로운 카테고리를 추가하고 싶으면 이 배열에 { id, label, color } 객체를 추가하면
// EventForm(일정 작성 폼)과 CalendarView(달력)에 자동으로 반영됩니다.

export const CATEGORIES = [
  { id: 'date', label: '데이트', color: '#ff6f91' },
  { id: 'anniversary', label: '기념일', color: '#c86dd7' },
  { id: 'birthday', label: '생일', color: '#ffb84c' },
  { id: 'travel', label: '여행', color: '#38bdf8' },
  { id: 'schedule', label: '일정', color: '#4ade80' },
  { id: 'etc', label: '기타', color: '#94a3b8' },
]

// id(문자열)로 카테고리 정보를 찾아주는 함수.
// 혹시 못 찾으면(예: 예전에 쓰다가 삭제된 카테고리) 마지막 항목인 "기타"를 기본값으로 줍니다.
export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[5]

// 일정 글자 색으로 고를 수 있는, 많이 사용하는 색 12가지입니다. (EventForm의 색상 선택에 사용)
export const TEXT_COLORS = [
  { label: '빨강', value: '#ef4444' },
  { label: '주황', value: '#f97316' },
  { label: '노랑', value: '#eab308' },
  { label: '연두', value: '#22c55e' },
  { label: '민트', value: '#14b8a6' },
  { label: '하늘', value: '#38bdf8' },
  { label: '파랑', value: '#3b82f6' },
  { label: '남색', value: '#6366f1' },
  { label: '보라', value: '#a855f7' },
  { label: '분홍', value: '#ec4899' },
  { label: '갈색', value: '#92400e' },
  { label: '검정', value: '#475569' },
]

// 다이어리 작성 시 고를 수 있는 기분 이모지 목록입니다.
export const MOODS = ['😍', '🥰', '😊', '😐', '😢', '😡', '🥱', '🤒']
