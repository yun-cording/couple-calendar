// 커플이 함께 쓰는 공유 버킷리스트(할 일 목록) 화면입니다.
// 완료/미완료를 체크할 수 있고, 완료된 항목은 접었다 펼 수 있는 목록으로 따로 모아둡니다.

import { useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function BucketList({ coupleId, todos, members, myUid }) {
  const [text, setText] = useState('')

  // 새 항목 추가
  const add = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    await addDoc(collection(db, 'couples', coupleId, 'todos'), {
      text: text.trim(),
      done: false,
      authorId: myUid,
      createdAt: serverTimestamp(),
    })
    setText('') // 입력창 비우기
  }

  // 체크박스를 누르면 done 값을 반대로 뒤집습니다 (true <-> false)
  const toggle = (todo) =>
    updateDoc(doc(db, 'couples', coupleId, 'todos', todo.id), { done: !todo.done })

  const remove = (todo) => deleteDoc(doc(db, 'couples', coupleId, 'todos', todo.id))

  // 화면에 보여줄 때는 완료 여부로 두 그룹으로 나눠서 표시합니다.
  const pending = todos.filter((t) => !t.done)
  const done = todos.filter((t) => t.done)

  return (
    <div className="card">
      <div className="section-title-row">
        <h2>💕 우리의 버킷리스트</h2>
        <span className="muted small">
          {done.length}/{todos.length} 완료
        </span>
      </div>

      <form className="form-row" onSubmit={add}>
        <input
          placeholder="함께 하고 싶은 일을 적어보세요"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="primary-btn" type="submit">
          추가
        </button>
      </form>

      {/* 아직 완료하지 않은 항목들 */}
      <ul className="todo-list">
        {pending.map((t) => (
          <TodoRow key={t.id} todo={t} members={members} onToggle={toggle} onRemove={remove} />
        ))}
      </ul>

      {/* 완료한 항목들은 <details>로 접어서 보여줍니다 (클릭하면 펼쳐짐) */}
      {done.length > 0 && (
        <details className="done-details">
          <summary>완료한 항목 ({done.length})</summary>
          <ul className="todo-list">
            {done.map((t) => (
              <TodoRow key={t.id} todo={t} members={members} onToggle={toggle} onRemove={remove} />
            ))}
          </ul>
        </details>
      )}

      {todos.length === 0 && <p className="muted small">아직 목록이 비어있어요. 첫 항목을 추가해보세요!</p>}
    </div>
  )
}

// 버킷리스트 항목 한 줄을 그려주는 작은 컴포넌트 (재사용을 위해 분리)
function TodoRow({ todo, members, onToggle, onRemove }) {
  return (
    <li className={`todo-item ${todo.done ? 'done' : ''}`}>
      <label className="todo-check">
        <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo)} />
        <span>{todo.text}</span>
      </label>
      <div className="todo-meta">
        <span className="muted small">{members[todo.authorId]?.displayName}</span>
        <button className="icon-btn small" onClick={() => onRemove(todo)} aria-label="삭제">
          🗑
        </button>
      </div>
    </li>
  )
}
