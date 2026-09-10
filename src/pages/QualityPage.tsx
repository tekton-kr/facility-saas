import { CertaintyBadge } from '../components/CertaintyBadge.tsx'
import { getSites, listPoints } from '../lib/catalog.ts'
import { getTelemetry } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'
import { findingsForScope } from '../lib/findings.ts'
import { formatDateTime, formatNumber } from '../lib/format.ts'

export function QualityPage() {
  const { range, view } = useScope()
  const rows = listPoints({})
  const findings = findingsForScope({ app: 'events' })
  const confirmed = rows.filter((row) => getTelemetry(row, range).certainty === 'confirmed')
  const unknown = rows.filter((row) => {
    const tel = getTelemetry(row, range)
    return tel.certainty === 'unknown' || row.point.flags?.noTelemetry
  })
  const stale = rows.filter((row) => getTelemetry(row, range).certainty === 'stale')
  const offline = rows.filter((row) => row.point.flags?.offline)
  const missingArea = getSites().filter((site) => site.areaM2 == null)
  const focus = view === 'unknown' ? unknown : rows.filter((row) => {
    const tel = getTelemetry(row, range)
    return tel.certainty !== 'confirmed'
  })

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{view === 'unknown' ? '판정 불가 모음' : '데이터 품질'}</h1>
          <p>빈 값은 0으로 채우지 않습니다. 지연·두절·공백을 성격 배지로 구분합니다.</p>
        </div>
      </div>
      <section className="kpi-row">
        <article className="kpi">
          <div className="kpi-label">실측</div>
          <div className="kpi-value">{confirmed.length}<span className="kpi-unit">점</span></div>
        </article>
        <article className="kpi">
          <div className="kpi-label">지연</div>
          <div className="kpi-value">{stale.length}<span className="kpi-unit">점</span></div>
        </article>
        <article className="kpi is-unknown">
          <div className="kpi-label">판정 불가</div>
          <div className="kpi-value">{unknown.length}<span className="kpi-unit">점</span></div>
        </article>
        <article className="kpi is-unknown">
          <div className="kpi-label">통신 두절</div>
          <div className="kpi-value">{offline.length}<span className="kpi-unit">점</span></div>
        </article>
      </section>
      <section className="deck">
        <h2>관제점</h2>
        <div className="list">
          {focus.map((row) => {
            const tel = getTelemetry(row, range)
            return (
              <div key={`${row.siteId}.${row.point.id}.${row.equipmentId}`} className="list-item">
                <span>
                  <strong>{row.site.name} · {row.point.name}</strong>
                  <div className="kpi-meta">{row.equipment.name} · 수신 {formatDateTime(tel.receivedAt)} · {tel.note ?? formatNumber(tel.current)}</div>
                </span>
                <CertaintyBadge certainty={tel.certainty} />
              </div>
            )
          })}
        </div>
      </section>
      {view === 'unknown' ? (
        <>
          <section className="panel">
            <h2>임차 공백</h2>
            {findings.filter((item) => item.certainty === 'unknown').map((item) => (
              <p key={item.id} className="kpi-note">{item.title} — {item.note}</p>
            ))}
          </section>
          <section className="panel">
            <h2>면적 없음</h2>
            {missingArea.length === 0 ? <div className="empty">연면적이 빠진 현장이 없습니다.</div> : null}
            {missingArea.map((site) => (
              <p key={site.id} className="kpi-note">{site.name} — 연면적 미등록. EUI는 판정 불가. 0으로 채우지 않습니다.</p>
            ))}
          </section>
        </>
      ) : null}
    </>
  )
}
