import type { ReactNode } from 'react'
import { CertaintyBadge } from '../components/CertaintyBadge.tsx'
import { KpiRow } from '../components/KpiRow.tsx'
import { TrendChart } from '../components/TrendChart.tsx'
import { getSite, listPoints } from '../lib/catalog.ts'
import { findingsForScope } from '../lib/findings.ts'
import { APP_LABEL, formatNumber } from '../lib/format.ts'
import { getTelemetry, kpisForScope } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'
import type { TimeRange } from '../types/domain.ts'

export function FocusView() {
  const { app, siteId, range, view } = useScope()
  const site = getSite(siteId)
  const kpis = kpisForScope({ app, siteId, range })
  const compareRange: TimeRange = range === '7d' ? '24h' : '7d'
  const primary = listPoints({ siteId, app: app === 'events' ? undefined : app })[0]
  const now = primary ? getTelemetry(primary, range) : null
  const prev = primary ? getTelemetry(primary, compareRange) : null

  if (view === 'peak') {
    const peak = kpis.find((item) => item.id === 'peak')
    return (
      <FocusShell title={`${site?.name ?? ''} · 최대수요`} note="실측. 차단기 제어 없음.">
        {peak ? <KpiRow items={[peak]} /> : <div className="empty">피크 실측이 없습니다.</div>}
        <section className="panel">
          <h2>추세</h2>
          <TrendChart values={peak?.series ?? null} label="최대수요" />
        </section>
      </FocusShell>
    )
  }

  if (view === 'eui') {
    const eui = kpis.find((item) => item.id === 'eui')
    return (
      <FocusShell title={`${site?.name ?? ''} · EUI`} note={eui?.note ?? '연면적 기준으로 환산. 면적이 없으면 판정 불가.'}>
        {eui ? <KpiRow items={[eui]} /> : <div className="empty">EUI를 계산할 수 없습니다.</div>}
      </FocusShell>
    )
  }

  if (view === 'pr') {
    const pr = kpis.find((item) => item.id === 'pr')
    return (
      <FocusShell title={`${site?.name ?? ''} · 추정 PR`} note="일사량 계수 가정. 보장이 아닙니다.">
        {pr ? <KpiRow items={[pr]} /> : <div className="empty">추정 PR을 표시할 실측이 없습니다.</div>}
      </FocusShell>
    )
  }

  if (view === 'gaps') {
    const rows = listPoints({ siteId, app }).filter((row) => getTelemetry(row, range).certainty === 'unknown' || row.point.flags?.noTelemetry)
    const notes = findingsForScope({ app, siteId }).filter((item) => item.certainty === 'unknown')
    return (
      <FocusShell title={`${site?.name ?? ''} · 검침 공백`} note="0으로 채우지 않습니다.">
        <div className="list">
          {rows.length === 0 ? <div className="empty">이 범위에 공백 관제점이 없습니다.</div> : null}
          {rows.map((row) => {
            const tel = getTelemetry(row, range)
            return (
              <div key={row.pointId} className="list-item">
                <span>
                  <strong>{row.point.name}</strong>
                  <div className="kpi-meta">{tel.note ?? '데이터 없음'} · {formatNumber(tel.current)}</div>
                </span>
                <CertaintyBadge certainty={tel.certainty} />
              </div>
            )
          })}
        </div>
        {notes.map((item) => (
          <p key={item.id} className="kpi-note">{item.narrative}</p>
        ))}
      </FocusShell>
    )
  }

  if (view === 'compare') {
    return (
      <FocusShell title={`${site?.name ?? ''} · 비교 기간`} note={`${APP_LABEL[app]} · 시리즈 2개. 추정을 확정처럼 겹치지 않습니다.`}>
        <section className="panel">
          <h2>현재 구간</h2>
          <TrendChart values={now?.series ?? null} label="현재 구간" />
        </section>
        <section className="panel">
          <h2>비교 구간</h2>
          <TrendChart values={prev?.series ?? null} label="비교 구간" />
        </section>
      </FocusShell>
    )
  }

  return null
}

function FocusShell({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p>{note}</p>
        </div>
      </div>
      {children}
    </>
  )
}
