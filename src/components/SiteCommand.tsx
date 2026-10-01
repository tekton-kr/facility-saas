import { Link } from 'react-router-dom'
import type { SiteDef } from '../types/domain.ts'
import { cyclesFor, drawingsFor, inspectionsFor, notesFor, visitsFor } from '../lib/maintain.ts'
import { useScope } from '../lib/useScope.ts'

function SampleTag() {
  return <span className="sample-tag">예시</span>
}

export function SiteCommand({ site }: { site: SiteDef }) {
  const { search } = useScope()
  const notes = notesFor(site.id)
  const cycles = cyclesFor(site.id)
  const inspections = inspectionsFor(site.id)
  const drawings = drawingsFor(site.id).slice(0, 3)
  const visits = visitsFor(site.id).slice(0, 4)

  return (
    <div className="cmd">
      <header className="cmd-head">
        <div>
          <p>{site.location || '이 건물'}</p>
          <h1>설비</h1>
        </div>
        <p>
          {site.name}의 사진, 도면, 주기, 일정입니다. 지도는 상황판에 있습니다.
          {' · '}
          <SampleTag />
          표시는 아직 수신되지 않은 기록입니다.
        </p>
      </header>

      <section className="equip-grid" aria-label="설비">
        {notes.map((item) => {
          const cycle = cycles.find((row) => item.equipment.includes(row.equipment.slice(0, 2)) || row.equipment.includes(item.equipment.slice(0, 2)))
          const nextCheck = inspections.find((row) => item.equipment.includes(row.equipment) || row.equipment.includes('공조') && item.equipment.includes('공조'))
          return (
            <article key={item.id} className="cmd-panel is-sample equip-card">
              <div className="photo-placeholder">사진 <SampleTag /></div>
              <h2>{item.equipment}</h2>
              <p>{item.caption}</p>
              <p>다음 점검 {nextCheck?.due ?? '미정'} · 다음 {cycle ? `${cycle.kind} ${cycle.next}` : '주기 없음'}</p>
              <p className="equip-links">
                <Link to={`/sites/${site.id}/photos${search}`}>사진</Link>
                <Link to={`/sites/${site.id}/cycles${search}`}>주기</Link>
                <Link to={`/sites/${site.id}/inspections${search}`}>점검</Link>
              </p>
            </article>
          )
        })}
      </section>

      <div className="cmd-board is-site">
        <section className="cmd-panel cmd-equip is-sample">
          <h2>준공 도면<SampleTag /></h2>
          <ul>
            {drawings.map((item) => (
              <li key={item.id}>
                <Link to={`/sites/${site.id}/drawings${search}`}>
                  <span>
                    <strong>{item.name}</strong>
                    <em>{item.equipment} · {item.kind}</em>
                  </span>
                  <b>보기</b>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="cmd-panel cmd-plant is-sample">
          <h2>이번 일정<SampleTag /></h2>
          <ul className="equip-schedule">
            {visits.map((item) => (
              <li key={item.id}>
                <Link to={`/sites/${site.id}/schedule${search}`}>
                  <strong>{item.title}</strong>
                  <em>{item.kind} · {item.vendor} · {item.equipment}</em>
                  <time>{item.date}</time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
