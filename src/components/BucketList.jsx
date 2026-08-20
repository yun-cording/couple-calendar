// 커플이 함께 쓰는 공유 위시리스트(가보고 싶은 곳/하고 싶은 일 목록) 화면입니다.
// 완료/미완료를 체크할 수 있고, 완료된 항목은 접었다 펼 수 있는 목록으로 따로 모아둡니다.
// 날짜가 아직 안 정해진 항목을 적어뒀다가, 날짜가 정해지면 캘린더 일정으로 바로 등록할 수 있습니다.

import { useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function BucketList({ coupleId, todos, members, myUid }) {
  const [text, setText] = useState('')
  const [location, setLocation] = useState('')
  const [memo, setMemo] = useState('')
  // 캘린더 일정으로 등록 중인 위시리스트 항목의 id (없으면 null)
  const [schedulingId, setSchedulingId] = useState(null)
  const [scheduleDate, setScheduleDate] = useState('')

  // 새 항목 추가
  const add = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    await addDoc(collection(db, 'couples', coupleId, 'todos'), {
      text: text.trim(),
      location: location.trim(),
      memo: memo.trim(),
      done: false,
      authorId: myUid,
      createdAt: serverTimestamp(),
    })
    setText('') // 입력창 비우기
    setLocation('')
    setMemo('')
  }

  // 체크박스를 누르면 done 값을 반대로 뒤집습니다 (true <-> false)
  const toggle = (todo) =>
    updateDoc(doc(db, 'couples', coupleId, 'todos', todo.id), { done: !todo.done })

  const remove = (todo) => deleteDoc(doc(db, 'couples', coupleId, 'todos', todo.id))

  const startSchedule = (todo) => {
    setSchedulingId(todo.id)
    setScheduleDate('')
  }
  const cancelSchedule = () => {
    setSchedulingId(null)
    setScheduleDate('')
  }

  // 위시리스트 항목의 날짜가 정해졌을 때, 그 내용 그대로 캘린더 일정으로 등록합니다.
  // 등록 후에는 위시리스트에서 "완료"로 표시하고, 등록된 날짜를 함께 남겨둡니다.
  const confirmSchedule = async (todo) => {
    if (!scheduleDate) return
    await addDoc(collection(db, 'couples', coupleId, 'events'), {
      title: todo.text,
      date: scheduleDate,
      dateTo: scheduleDate,
      timeFrom: null,
      timeTo: null,
      category: 'date',
      color: null,
      location: todo.location || '',
      memo: todo.memo || '',
      yearly: false,
      authorId: myUid,
      createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'couples', coupleId, 'todos', todo.id), {
      done: true,
      scheduledDate: scheduleDate,
    })
    cancelSchedule()
  }

  // 화면에 보여줄 때는 완료 여부로 두 그룹으로 나눠서 표시합니다.
  const pending = todos.filter((t) => !t.done)
  const done = todos.filter((t) => t.done)

  const rowProps = {
    members,
    onToggle: toggle,
    onRemove: remove,
    onStartSchedule: startSchedule,
    schedulingId,
    scheduleDate,
    onScheduleDateChange: setScheduleDate,
    onConfirmSchedule: confirmSchedule,
    onCancelSchedule: cancelSchedule,
  }

  return (
    <div className="card">
      <div className="section-title-row">
        <h2>💕 우리의 위시리스트</h2>
        <span className="muted small">
          {done.length}/{todos.length} 완료
        </span>
      </div>

      <form className="form-stack todo-form" onSubmit={add}>
        <input
          placeholder="가보고 싶은 카페/맛집/전시회 등을 적어보세요"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="form-row">
          <input
            placeholder="장소 (선택)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <input
            placeholder="메모 (선택)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
        <button className="primary-btn" type="submit">
          추가
        </button>
      </form>

      {/* 아직 완료하지 않은 항목들 */}
      <ul className="todo-list">
        {pending.map((t) => (
          <TodoRow key={t.id} todo={t} {...rowProps} />
        ))}
      </ul>

      {/* 완료한 항목들은 <details>로 접어서 보여줍니다 (클릭하면 펼쳐짐) */}
      {done.length > 0 && (
        <details className="done-details">
          <summary>완료한 항목 ({done.length})</summary>
          <ul className="todo-list">
            {done.map((t) => (
              <TodoRow key={t.id} todo={t} {...rowProps} />
            ))}
          </ul>
        </details>
      )}

      {todos.length === 0 && <p className="muted small">아직 목록이 비어있어요. 첫 항목을 추가해보세요!</p>}
    </div>
  )
}

// 위시리스트 항목 한 줄을 그려주는 작은 컴포넌트 (재사용을 위해 분리)
function TodoRow({
  todo,
  members,
  onToggle,
  onRemove,
  onStartSchedule,
  schedulingId,
  scheduleDate,
  onScheduleDateChange,
  onConfirmSchedule,
  onCancelSchedule,
}) {
  const isScheduling = schedulingId === todo.id

  return (
    <li className={`todo-item ${todo.done ? 'done' : ''}`}>
      <label className="todo-check">
        <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo)} />
        <div className="todo-check-body">
          <span>{todo.text}</span>
          {todo.location && <span className="todo-sub">📍 {todo.location}</span>}
          {todo.memo && <span className="todo-sub">{todo.memo}</span>}
          {/* 날짜가 정해져서 캘린더 일정으로 등록된 항목에는 등록된 날짜를 표시합니다 */}
          {todo.scheduledDate && <span className="todo-sub">📅 {todo.scheduledDate} 일정 등록됨</span>}
        </div>
      </label>
      <div className="todo-meta">
        <span className="muted small">{members[todo.authorId]?.displayName}</span>
        {/* 아직 일정으로 등록되지 않은 항목만 "캘린더에 등록" 버튼을 보여줍니다 */}
        {!todo.scheduledDate && (
          <button
            className="icon-btn small"
            onClick={() => onStartSchedule(todo)}
            aria-label="캘린더에 일정으로 등록"
            title="날짜가 정해지면 캘린더 일정으로 등록"
          >
            📅
          </button>
        )}
        <button className="icon-btn small" onClick={() => onRemove(todo)} aria-label="삭제">
          🗑
        </button>
      </div>

      {isScheduling && (
        <div className="todo-schedule-row">
          <input
            type="date"
            value={scheduleDate}
            onChange={(e) => onScheduleDateChange(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            className="primary-btn"
            onClick={() => onConfirmSchedule(todo)}
            disabled={!scheduleDate}
          >
            일정으로 등록
          </button>
          <button type="button" className="secondary-btn" onClick={onCancelSchedule}>
            취소
          </button>
        </div>
      )}
    </li>
  )
}
