import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ManageFrame } from '../components/ManageFrame.tsx'
import { getSite } from '../lib/catalog.ts'
import { addShift, dayNote, removeShift, rosterFor, saveDayNote, SHIFT_HOURS, SHIFT_PARTS, type Shift, type ShiftPart, type ShiftSlot } from '../lib/diary.ts'
import { worksForScope } from '../lib/field.ts'
import { visitsFor } from '../lib/maintain.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { useDiary } from '../lib/useDiary.ts'
import { useField } from '../lib/useField.ts'
import { useScope } from '../lib/useScope.ts'

const WEEK = ['일', '월', '화', '수', '목', '금', '토']

function seoulToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function monthStart(cursor: string): { year: number; month: number } {
  const [year, month] = cursor.slice(0, 7).split('-').map(Number)
  return { year, month }
}

function shiftMonth(cursor: string, delta: number): string {
  const { year, month } = monthStart(cursor)
  const date = new Date(year, month - 1 + delta, 1)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-01`
}

function cellsOf(cursor: string): Array<string | null> {
  const { year, month } = monthStart(cursor)
  const first = new Date(`${year}-${pad(month)}-01T12:00:00+09:00`)
  const count = new Date(year, month, 0).getDate()
  const cells: Array<string | null> = Array.from({ length: first.getDay() }, () => null)
  for (let day = 1; day <= count; day += 1) cells.push(`${year}-${pad(month)}-${pad(day)}`)
  return cells
}

function workDay(iso: string | null): string | null {
  if (!iso) return null
  const time = Date.parse(iso)
  if (Number.isNaN(time)) return null
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date(time))
}

function SiteChoices({ title, path }: { title: string; path: string }) {
  const { search } = useScope()
  const sites = visibleSites()
  return (
    <ManageFrame kicker="" title={title}>
      <p className="manage-note">건물을 고르면 그 현장 달력이 열립니다.</p>
      <section className="manage-card">
        {sites.length === 0 ? <div className="empty">배정된 건물이 없습니다.</div> : (
          <div className="manage-list">
            {sites.map((site) => (
              <Link key={site.id} className="manage-row" to={`/sites/${site.id}/${path}${search}`}>
                <span>
                  <strong>{site.name}</strong>
                  <em>{site.location || '위치 미등록'}</em>
                </span>
                <b>열기</b>
              </Link>
            ))}
          </div>
        )}
      </section>
    </ManageFrame>
  )
}

export function CalendarPage() {
  const { siteId, search } = useScope()
  useField()
  useDiary()
  const site = siteId ? getSite(siteId) : undefined
  const [cursor, setCursor] = useState(seoulToday)
  const [picked, setPicked] = useState(seoulToday)
  const [draft, setDraft] = useState<string | null>(null)

  if (!siteId) return <SiteChoices title="일정표" path="calendar" />
  if (!site) return <ManageFrame kicker="일정표" title="현장을 찾지 못했습니다"><div className="empty">배정 목록에 없는 건물입니다.</div></ManageFrame>

  const visits = visitsFor(site.id)
  const done = worksForScope(site.id).flatMap((work) => {
    if (work.status !== 'done') return []
    const date = workDay(work.arrivedAt) ?? workDay(work.createdAt)
    return date ? [{ work, date }] : []
  })
  const dayVisits = visits.filter((item) => item.date === picked)
  const dayDone = done.filter((item) => item.date === picked)
  const saved = dayNote(site.id, picked)
  const marked = new Set([
    ...visits.map((item) => item.date),
    ...done.map((item) => item.date),
  ])
  const note = draft ?? saved

  function openDay(date: string) {
    setPicked(date)
    setDraft(dayNote(site!.id, date))
  }

  function onSave(event: FormEvent) {
    event.preventDefault()
    saveDayNote(site!.id, picked, draft ?? saved)
  }

  return (
    <ManageFrame kicker="" title="일정표">
      <p className="manage-note">날짜를 누르면 그날의 공사, 업체 방문, 끝난 작업과 근무 내용이 열립니다.</p>
      <section className="manage-card">
        <div className="cal-nav">
          <button type="button" onClick={() => setCursor(shiftMonth(cursor, -1))}>이전달</button>
          <strong>{cursor.slice(0, 7)}</strong>
          <button type="button" onClick={() => setCursor(shiftMonth(cursor, 1))}>다음달</button>
        </div>
        <div className="cal-grid" role="grid" aria-label="일정표">
          {WEEK.map((label) => <span key={label} className="cal-week">{label}</span>)}
          {cellsOf(cursor).map((date, index) => date ? (
            <button
              key={date}
              type="button"
              className={`cal-day${date === picked ? ' is-on' : ''}${marked.has(date) ? ' has-mark' : ''}`}
              onClick={() => openDay(date)}
            >
              {Number(date.slice(8))}
            </button>
          ) : <span key={`pad-${index}`} />)}
        </div>
      </section>
      <section className="manage-card">
        <h2>{picked}</h2>
        {dayVisits.length === 0 && dayDone.length === 0 ? (
          <div className="empty">이 날짜에 공사, 방문, 끝난 작업이 없습니다.</div>
        ) : (
          <div className="manage-list">
            {dayVisits.map((item) => (
              <Link key={item.id} className="manage-row" to={`/sites/${site.id}/schedule${search}`}>
                <span>
                  <strong>{item.title}{item.sample ? <span className="sample-tag">예시</span> : null}</strong>
                  <em>{item.kind} · {item.vendor} · {item.equipment}</em>
                </span>
                <b>일정</b>
              </Link>
            ))}
            {dayDone.map(({ work }) => (
              <Link key={work.id} className="manage-row" to={`/work/${work.id}${search}`}>
                <span>
                  <strong>{work.title}</strong>
                  <em>끝난 작업</em>
                </span>
                <b>작업</b>
              </Link>
            ))}
          </div>
        )}
        <form className="cal-note" onSubmit={onSave}>
          <label htmlFor="day-note">근무 내용</label>
          <textarea id="day-note" value={note} onChange={(event) => setDraft(event.target.value)} placeholder="이날 한 일을 적습니다." />
          <button type="submit">저장</button>
        </form>
        {note === saved && saved ? <p className="manage-note">이 브라우저에 저장되어 있습니다.</p> : null}
      </section>
    </ManageFrame>
  )
}

function dutyOf(rows: Shift[]): Shift | undefined {
  return rows.find((item) => item.duty)
}

function ShiftBoard({ rows, title }: { rows: Shift[]; title: string }) {
  const duty = dutyOf(rows)
  const sample = rows.length > 0 && rows.every((item) => item.sample)
  const crews = new Set(rows.map((item) => item.slot)).size
  return (
    <section className="manage-card roster-board">
      <header>
        <div>
          <p>{title}</p>
          <h2>{crews}교대{sample ? <span className="sample-tag roster-sample">예시</span> : null}</h2>
        </div>
        <p>
          당직{' '}
          {duty ? <strong>{duty.name}</strong> : '미지정'}
          {duty?.part ? <em> · {duty.part}</em> : null}
        </p>
      </header>
      <div className="roster-shifts">
        {rows.map((item) => (
          <article key={item.id} className={item.duty ? 'roster-shift is-duty' : 'roster-shift'}>
            <b>{item.slot} {SHIFT_HOURS[item.slot]}</b>
            <strong>{item.name}{item.duty ? <i>당직</i> : null}</strong>
            <em>{item.part ?? '파트 미등록'}</em>
          </article>
        ))}
      </div>
    </section>
  )
}

export function RosterPage() {
  const { siteId } = useScope()
  useDiary()
  const site = siteId ? getSite(siteId) : undefined
  const today = seoulToday()
  const [cursor, setCursor] = useState(today)
  const [picked, setPicked] = useState(today)
  const [name, setName] = useState('')
  const [part, setPart] = useState<ShiftPart>('기계')
  const [slot, setSlot] = useState<ShiftSlot>('주간')
  const [duty, setDuty] = useState(false)

  if (!siteId) return <SiteChoices title="근무표" path="roster" />
  if (!site) return <ManageFrame kicker="근무표" title="현장을 찾지 못했습니다"><div className="empty">배정 목록에 없는 건물입니다.</div></ManageFrame>

  const todayRows = rosterFor(site.id, today)
  const dayShifts = rosterFor(site.id, picked)
  const daySample = dayShifts.length > 0 && dayShifts.every((item) => item.sample)

  function onAdd(event: FormEvent) {
    event.preventDefault()
    addShift({ siteId: site!.id, date: picked, name, slot, part, duty })
    setName('')
    setDuty(false)
  }

  return (
    <ManageFrame kicker="" title="근무표">
      <p className="manage-note">3교대입니다. 주간, 석간, 야간 중 야간 근무자가 그날 당직입니다. 달력 이름은 당직자이고, 예시인 날은 직접 근무를 넣으면 그날 예시가 빠집니다.</p>
      <ShiftBoard rows={todayRows} title={`오늘 ${today}`} />
      <section className="manage-card">
        <div className="cal-nav">
          <button type="button" onClick={() => setCursor(shiftMonth(cursor, -1))}>이전달</button>
          <strong>{cursor.slice(0, 7)}</strong>
          <button type="button" onClick={() => setCursor(shiftMonth(cursor, 1))}>다음달</button>
        </div>
        <div className="cal-grid" role="grid" aria-label="근무표">
          {WEEK.map((label) => <span key={label} className="cal-week">{label}</span>)}
          {cellsOf(cursor).map((date, index) => {
            if (!date) return <span key={`pad-${index}`} />
            const dutyName = dutyOf(rosterFor(site.id, date))?.name
            return (
              <button
                key={date}
                type="button"
                className={`cal-day is-roster${date === picked ? ' is-on' : ''}`}
                title={dutyName ? `${date} 당직 ${dutyName}` : date}
                onClick={() => setPicked(date)}
              >
                <b>{Number(date.slice(8))}</b>
                {dutyName ? <em>{dutyName}</em> : null}
              </button>
            )
          })}
        </div>
      </section>
      {picked === today ? null : <ShiftBoard rows={dayShifts} title={picked} />}
      <section className="manage-card">
        <h2>{picked}{daySample ? <span className="sample-tag roster-sample">예시</span> : null}</h2>
        <div className="manage-list">
          {dayShifts.map((item) => (
            <div key={item.id} className="manage-row">
              <span>
                <strong>
                  {item.name}
                  {item.duty ? <i className="roster-pill">당직</i> : null}
                </strong>
                <em>{item.slot} {SHIFT_HOURS[item.slot]} · {item.part ?? '파트 미등록'}</em>
              </span>
              {item.sample ? null : <button type="button" onClick={() => removeShift(item.id)}>빼기</button>}
            </div>
          ))}
        </div>
        <form className="cal-note" onSubmit={onAdd}>
          <label htmlFor="shift-name">이름</label>
          <input id="shift-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="근무자 이름" required />
          <label htmlFor="shift-part">파트</label>
          <select id="shift-part" value={part} onChange={(event) => setPart(event.target.value as ShiftPart)}>
            {SHIFT_PARTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <label htmlFor="shift-slot">근무</label>
          <select id="shift-slot" value={slot} onChange={(event) => setSlot(event.target.value as ShiftSlot)}>
            <option value="주간">주간 08:00–16:00</option>
            <option value="석간">석간 16:00–24:00</option>
            <option value="야간">야간 00:00–08:00</option>
          </select>
          <label className="roster-check">
            <input type="checkbox" checked={duty} onChange={(event) => setDuty(event.target.checked)} />
            이날 당직
          </label>
          <button type="submit">추가</button>
        </form>
      </section>
    </ManageFrame>
  )
}
