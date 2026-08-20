// 일정을 추가하거나 수정할 때 쓰는 입력 폼입니다.
// initial 값이 있으면 "수정 모드"(기존 값이 채워짐), 없으면 "새로 추가 모드"로 동작합니다.

import { useState } from 'react'
import { CATEGORIES } from '../lib/categories'

// initial: 수정할 기존 일정 데이터 (새로 추가하는 경우 undefined/null)
// dateKey: 이 일정이 등록될 날짜 ('YYYY-MM-DD')
// onSubmit: 저장 버튼을 눌렀을 때 실행할 함수 (완성된 데이터 객체를 넘겨줍니다)
// onCancel: 취소 버튼
// onDelete: 삭제 버튼 (수정 모드일 때만 전달됨)
export default function EventForm({ initial, dateKey, onSubmit, onCancel, onDelete }) {
  // 각 입력값을 useState로 관리합니다. initial이 있으면 그 값으로, 없으면 빈 값으로 시작합니다.
  const [title, setTitle] = useState(initial?.title || '')
  const [time, setTime] = useState(initial?.time || '')
  const [category, setCategory] = useState(initial?.category || 'date')
  const [location, setLocation] = useState(initial?.location || '')
  const [memo, setMemo] = useState(initial?.memo || '')
  const [yearly, setYearly] = useState(initial?.yearly || false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return // 제목이 비어있으면 저장하지 않음
    onSubmit({
      title: title.trim(),
      date: dateKey,
      time: time || null,
      category,
      location: location.trim(),
      memo: memo.trim(),
      yearly,
    })
  }

  return (
    <form className="form-stack event-form" onSubmit={handleSubmit}>
      <input placeholder="일정 제목" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />

      <div className="form-row">
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        {/* CATEGORIES 배열(lib/categories.js)을 기반으로 select 옵션을 자동 생성합니다 */}
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <input placeholder="장소 (선택)" value={location} onChange={(e) => setLocation(e.target.value)} />
      <textarea placeholder="메모 (선택)" value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} />

      <label className="checkbox-row">
        <input type="checkbox" checked={yearly} onChange={(e) => setYearly(e.target.checked)} />
        매년 반복되는 기념일/생일이에요
      </label>

      <div className="form-actions">
        {/* onDelete가 전달된 경우(=수정 모드)에만 삭제 버튼을 보여줍니다 */}
        {onDelete && (
          <button type="button" className="danger-btn" onClick={onDelete}>
            삭제
          </button>
        )}
        <button type="button" className="secondary-btn" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="primary-btn">
          저장
        </button>
      </div>
    </form>
  )
}
