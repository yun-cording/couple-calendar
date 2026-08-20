// 달력에서 특정 날짜를 클릭했을 때 화면 아래(또는 가운데)에서 올라오는 상세 패널입니다.
// 이 날의 일정 목록을 보여주고, 일정 추가/수정/삭제와 다이어리(기분+한 줄 기록) 작성을 할 수 있습니다.

import { useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatFullDate, parseDateKey } from '../lib/dateUtils'
import { categoryById, MOODS } from '../lib/categories'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { useToast } from '../context/ToastContext'
import EventForm from './EventForm'
import { eventMatchesDate } from './CalendarView'

// coupleId: Firestore 경로에 쓸 커플 문서 id
// dateKey: 열려있는 날짜 ('YYYY-MM-DD')
// events: 전체 일정 목록 (여기서 이 날짜에 해당하는 것만 걸러냄)
// smartAnniversaries: 사귄 날짜로 자동 계산되는 D+100/N주년 목록 (lib/anniversaries.js)
// diaryEntry: 이 날짜의 다이어리 데이터 (없으면 undefined)
// members: 멤버 프로필 정보 (작성자 이름 표시용)
// myUid: 로그인한 나의 uid
// initialEditingEvent: 패널이 열리자마자 바로 보여줄 일정 (예: "다가오는 일정" 클릭으로 들어온 경우). 없으면 목록만 보여줍니다.
// onClose: 패널 닫기
export default function DayPanel({
  coupleId,
  dateKey,
  events,
  smartAnniversaries = [],
  diaryEntry,
  members,
  myUid,
  initialEditingEvent,
  onClose,
}) {
  // editingEvent: undefined면 폼 숨김, null이면 "새 일정 추가" 폼, 객체면 "해당 일정 수정" 폼
  const [editingEvent, setEditingEvent] = useState(() => initialEditingEvent || undefined)
  const [moodDraft, setMoodDraft] = useState(diaryEntry?.mood || '')
  const [textDraft, setTextDraft] = useState(diaryEntry?.text || '')
  const [savingDiary, setSavingDiary] = useState(false)
  const showToast = useToast()
  // 이 패널이 열려 있는 동안(=마운트되어 있는 동안)에는 배경 화면 스크롤을 잠급니다.
  useBodyScrollLock(true)

  const date = parseDateKey(dateKey)
  // 이 날짜에 해당하는 일정만 골라서, 시간 순서대로 정렬합니다.
  // 시간이 없는 일정(하루 종일 일정)은 '99:99'로 취급해서 맨 뒤로 보냅니다.
  // (예전 데이터는 time 필드만 있을 수 있어서 timeFrom이 없으면 time으로 대신합니다)
  const dayEvents = events
    .filter((ev) => eventMatchesDate(ev, date))
    .sort((a, b) =>
      (a.timeFrom || a.time || '99:99').localeCompare(b.timeFrom || b.time || '99:99'),
    )
  // 이 날짜에 해당하는 스마트 기념일 (사귄 날짜로 자동 계산된 것이라 수정/삭제는 할 수 없습니다)
  const dayAnniversaries = smartAnniversaries.filter((a) => a.date === dateKey)

  // 일정 저장: editingEvent에 id가 있으면 "수정"(updateDoc), 없으면 "새로 추가"(addDoc)
  const saveEvent = async (data) => {
    if (editingEvent && editingEvent.id) {
      await updateDoc(doc(db, 'couples', coupleId, 'events', editingEvent.id), data)
      showToast('일정이 수정되었어요!')
    } else {
      await addDoc(collection(db, 'couples', coupleId, 'events'), {
        ...data,
        authorId: myUid, // 누가 등록했는지 기록
        createdAt: serverTimestamp(), // Firebase 서버 시각으로 자동 기록
      })
      showToast('일정이 등록되었어요!')
    }
    setEditingEvent(undefined) // 저장 후 폼 닫기
  }

  const deleteEvent = async () => {
    if (!editingEvent?.id) return
    await deleteDoc(doc(db, 'couples', coupleId, 'events', editingEvent.id))
    setEditingEvent(undefined)
  }

  // 다이어리 저장: 문서 id를 날짜(dateKey)로 고정해서, 하루에 다이어리 문서가 하나만 존재하도록 합니다.
  // setDoc은 문서가 없으면 새로 만들고, 있으면 통째로 덮어씁니다(= 마지막에 저장한 사람 내용이 남음).
  const saveDiary = async () => {
    setSavingDiary(true)
    try {
      await setDoc(doc(db, 'couples', coupleId, 'diary', dateKey), {
        date: dateKey,
        mood: moodDraft,
        text: textDraft,
        authorId: myUid,
        updatedAt: serverTimestamp(),
      })
      showToast('오늘의 기록이 등록되었어요!')
    } finally {
      setSavingDiary(false)
    }
  }

  // uid로 표시 이름을 찾아주는 헬퍼. 아직 프로필을 못 불러왔으면 "상대방"으로 대체 표시.
  const authorName = (uid) => members[uid]?.displayName || '상대방'

  return (
    // 반투명 배경(backdrop)을 클릭하면 패널이 닫히도록 onClose 연결
    <div className="day-panel-backdrop" onClick={onClose}>
      {/* 패널 내부 클릭은 배경 클릭으로 전파되지 않도록 stopPropagation */}
      <div className="card day-panel" onClick={(e) => e.stopPropagation()}>
        <div className="day-panel-header">
          <h2>{formatFullDate(date)}</h2>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 사귄 날짜로 자동 계산된 기념일(D+100, N주년 등)입니다. 직접 만든 일정이 아니라서 수정/삭제는 할 수 없습니다 */}
        {dayAnniversaries.length > 0 && (
          <div className="day-anniversary-banner">
            {dayAnniversaries.map((a) => (
              <span key={a.id} className="badge">
                🎉 {a.title}
              </span>
            ))}
          </div>
        )}

        {/* ---------- 일정 섹션 ---------- */}
        <section className="day-panel-section">
          <div className="section-title-row">
            <h3>일정</h3>
            <button className="link-btn" onClick={() => setEditingEvent(null)}>
              + 추가
            </button>
          </div>

          {/* editingEvent가 undefined가 아니면(추가/수정 모드면) 폼을 보여줌 */}
          {editingEvent !== undefined && (
            <EventForm
              initial={editingEvent}
              dateKey={dateKey}
              onSubmit={saveEvent}
              onCancel={() => setEditingEvent(undefined)}
              onDelete={editingEvent?.id ? deleteEvent : undefined}
            />
          )}

          {dayEvents.length === 0 && editingEvent === undefined && (
            <p className="muted small">등록된 일정이 없어요.</p>
          )}

          <ul className="event-list">
            {dayEvents.map((ev) => (
              // 목록에서 일정을 클릭하면 그 일정의 수정 폼이 열립니다.
              <li key={ev.id} className="event-item" onClick={() => setEditingEvent(ev)}>
                <span
                  className="event-color-dot"
                  style={{ background: ev.color || categoryById(ev.category).color }}
                />
                <div className="event-item-body">
                  <div className="event-item-title" style={{ color: ev.color || categoryById(ev.category).color }}>
                    {(ev.timeFrom || ev.time) && (
                      <span className="event-time">
                        {ev.timeFrom || ev.time}
                        {ev.timeTo && ` ~ ${ev.timeTo}`}
                      </span>
                    )}
                    {ev.title}
                    {ev.yearly && <span className="badge">매년</span>}
                  </div>
                  {ev.dateTo && ev.dateTo !== ev.date && (
                    <div className="event-item-sub">
                      🗓️ {formatFullDate(parseDateKey(ev.date))} ~ {formatFullDate(parseDateKey(ev.dateTo))}
                    </div>
                  )}
                  {ev.location && <div className="event-item-sub">📍 {ev.location}</div>}
                  {ev.memo && <div className="event-item-sub">{ev.memo}</div>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- 다이어리(기분 + 한 줄 기록) 섹션 ---------- */}
        <section className="day-panel-section">
          <h3>오늘의 기록</h3>
          <div className="mood-picker">
            {MOODS.map((m) => (
              <button
                key={m}
                className={`mood-btn ${moodDraft === m ? 'active' : ''}`}
                onClick={() => setMoodDraft(m)}
                type="button"
              >
                {m}
              </button>
            ))}
          </div>
          <textarea
            placeholder="오늘 있었던 일, 느낀 점을 남겨보세요"
            value={textDraft}
            onChange={(e) => setTextDraft(e.target.value)}
            rows={3}
          />
          {diaryEntry?.authorId && (
            <p className="muted small">마지막 기록: {authorName(diaryEntry.authorId)}</p>
          )}
          <button className="primary-btn" onClick={saveDiary} disabled={savingDiary}>
            {savingDiary ? '저장 중…' : '기록 저장'}
          </button>
        </section>
      </div>
    </div>
  )
}
