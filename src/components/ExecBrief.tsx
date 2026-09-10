import { Link } from 'react-router-dom'
import { DomainBoard } from './DomainBoard.tsx'
import { InsightChips } from './InsightChips.tsx'
import { KpiRow } from './KpiRow.tsx'
import { SiteCards } from './SiteCards.tsx'
import { WorkQueue } from './WorkQueue.tsx'
import { getSite } from '../lib/catalog.ts'
import { contractForSite, daysUntil, packagesForScope } from '../lib/field.ts'
import { APP_LABEL, formatDateTime, KIND_ALARM_LABEL, KIND_LABEL, SEVERITY_LABEL } from '../lib/format.ts'
import { insightsForScope } from '../lib/portfolio.ts'
import { exceptionSiteCards, execKpis } from '../lib/roleHome.ts'
import { alarmsForScope } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'

export function ExecBrief() {
  const { app, siteId, range, query, search, role } = useScope()
  const cards = siteId ? [] : exceptionSiteCards({ app, query, range })
  const site = getSite(siteId)
  const kpis = execKpis({ app, siteId, range })
  const insights = insightsForScope({ app, siteId, range, role: 'exec' })
  const alarms = alarmsForScope({
    siteId,
    app: app === 'events' ? 'events' : app,
  }).filter((item) => item.severity === 'critical' || item.severity === 'warning')

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{site ? `${site.name} · 요약` : `${APP_LABEL[app]} · 포트폴리오`}</h1>
          <p>
            {site
              ? `${KIND_LABEL[site.kind]} · ${site.location}. 경영 보기. 계통·관제점·도면은 열지 않습니다.`
              : '포트폴리오. 이번 기간 예외와 추정 절감만 봅니다.'}
          </p>
        </div>
      </div>
      {kpis.length > 0 ? <KpiRow items={kpis} /> : null}
      {app === 'events' ? null : <DomainBoard app={app} siteId={siteId} range={range} />}
      {cards.length > 0 ? (
        <SiteCards items={cards} hrefFor={(id) => `/apps/${app}/sites/${id}${search}`} />
      ) : null}
      {site ? (
        <section className="deck">
          <h2>계약</h2>
          {contractForSite(site.id) ? (
            <p>
              <Link className="drawer-open" to={`/sites/${site.id}/contract${search}`}>
                만료 {daysUntil(contractForSite(site.id)!.end)}일
              </Link>
            </p>
          ) : (
            <p className="kpi-meta">계약 없음</p>
          )}
        </section>
      ) : (
        <section className="deck">
          <h2>개보수 후보</h2>
          <p>
            <Link className="drawer-open" to={`/packages${search}`}>
              {packagesForScope().filter((item) => item.status !== 'done').length}건
            </Link>
          </p>
        </section>
      )}
      {site ? (
        <section className="deck">
          <h2>작업 · SLA</h2>
          <WorkQueue siteId={site.id} limit={3} />
        </section>
      ) : null}
      <InsightChips
        items={insights}
        role={role}
        hrefFor={(id) => `/apps/${app}/sites/${id}${search}`}
      />
      <section className="deck">
        <h2>이번 기간 예외</h2>
        {alarms.length === 0 ? (
          <div className="empty">열린 위험·주의 알람이 없습니다.</div>
        ) : (
          <div className="list">
            {alarms.map((alarm) => (
              <Link
                key={alarm.id}
                className="list-item"
                to={`/apps/${app}/sites/${alarm.siteId}${search}`}
              >
                <span>
                  <span className={`badge is-${alarm.severity}`}>{SEVERITY_LABEL[alarm.severity]}</span>
                  {' '}
                  <span className="badge">{KIND_ALARM_LABEL[alarm.kind]}</span>
                  <strong className="event-title">{alarm.title}</strong>
                  <div className="kpi-meta">{getSite(alarm.siteId)?.name} · {formatDateTime(alarm.at)}</div>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
