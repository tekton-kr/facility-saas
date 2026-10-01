import { Link } from 'react-router-dom'
import { CollectionPending } from './CollectionPending.tsx'
import { EvidenceDeck } from './EvidenceDeck.tsx'
import { InsightChips } from './InsightChips.tsx'
import { PortfolioLine } from './PortfolioLine.tsx'
import { QuietSites } from './QuietSites.tsx'
import { SiteCards } from './SiteCards.tsx'
import { SiteServices } from './SiteServices.tsx'
import { WorkQueue } from './WorkQueue.tsx'
import { isAppCollected } from '../lib/collection.ts'
import { getSite } from '../lib/catalog.ts'
import { contractForSite, daysUntil, packagesForScope } from '../lib/field.ts'
import { APP_LABEL, formatDateTime, KIND_ALARM_LABEL, KIND_LABEL, SEVERITY_LABEL } from '../lib/format.ts'
import { insightsForScope } from '../lib/portfolio.ts'
import { exceptionSiteCards, portfolioHeadline, quietSiteCards } from '../lib/roleHome.ts'
import { alarmsForScope } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'

export function ExecBrief() {
  const { app, siteId, range, query, search, role } = useScope()
  const cards = siteId ? [] : exceptionSiteCards({ app, query, range })
  const quiet = siteId ? [] : quietSiteCards({ app, query, range })
  const headline = siteId ? null : portfolioHeadline({ app, query, range })
  const site = getSite(siteId)
  const insights = insightsForScope({ app, siteId, range, role: 'exec' })
  const alarms = alarmsForScope({
    siteId,
    app: app === 'events' ? 'events' : app,
  }).filter((item) => item.severity === 'critical' || item.severity === 'warning')
  const critical = alarms.filter((item) => item.severity === 'critical').length
  const warning = alarms.length - critical
  const siteHref = (id: string) => `/apps/${app}/sites/${id}${search}`

  if (!isAppCollected(app)) {
    return <CollectionPending title={`${APP_LABEL[app]} · 연동 대기`} />
  }

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-kicker">{site ? site.name : APP_LABEL[app]}</p>
          <h1>{site ? `${site.name} · 요약` : `${APP_LABEL[app]} · 포트폴리오`}</h1>
          <p>
            {site
              ? `${KIND_LABEL[site.kind]} · ${site.location}. ${
                  alarms.length > 0
                    ? `위험 ${critical}건, 주의 ${warning}건. 시설팀에 연락할 일입니다.`
                    : '이번 기간에 열린 위험·주의가 없습니다.'
                }`
              : '이번 기간, 배정된 곳 중 어디가 이상한가. 시설팀에 전화할지만 정합니다.'}
          </p>
        </div>
      </div>
      {site ? <SiteServices siteId={site.id} systems={site.systems} search={search} current={app} /> : null}
      {headline ? <PortfolioLine headline={headline} to={siteHref(headline.siteId)} /> : null}
      {cards.length > 0 ? (
        <SiteCards items={cards} hrefFor={siteHref} />
      ) : site ? null : (
        <div className="empty">이상 현장이 없습니다.</div>
      )}
      <QuietSites items={quiet} hrefFor={siteHref} />
      {site ? (
        <section className="deck">
          <h2>이번 기간 예외</h2>
          {alarms.length === 0 ? (
            <div className="empty">열린 위험·주의 알람이 없습니다.</div>
          ) : (
            <div className="list">
              {alarms.map((alarm) => (
                <div key={alarm.id} className="list-item">
                  <span>
                    <span className={`badge is-${alarm.severity}`}>{SEVERITY_LABEL[alarm.severity]}</span>
                    {' '}
                    <span className="badge">{KIND_ALARM_LABEL[alarm.kind]}</span>
                    <strong className="event-title">{alarm.title}</strong>
                    <div className="kpi-meta">{getSite(alarm.siteId)?.name} · {formatDateTime(alarm.at)}</div>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
      <EvidenceDeck app={app} siteId={siteId} range={range} />
      {insights.length > 0 ? (
        <details className="deck insight-fold">
          <summary>추정 이슈 {insights.length}</summary>
          <InsightChips
            items={insights}
            role={role}
            hrefFor={siteHref}
          />
        </details>
      ) : null}
      <details className="deck insight-fold">
        <summary>{site ? '계약 · 작업' : '계약 · 개보수'}</summary>
        {site ? (
          <>
            <p>
              {contractForSite(site.id) ? (
                <Link className="drawer-open" to={`/sites/${site.id}/contract${search}`}>
                  만료 {daysUntil(contractForSite(site.id)!.end)}일
                </Link>
              ) : (
                <span className="kpi-meta">계약 없음</span>
              )}
            </p>
            <WorkQueue siteId={site.id} limit={3} />
          </>
        ) : (
          <p>
            <Link className="drawer-open" to={`/packages${search}`}>
              개보수 후보 {packagesForScope().filter((item) => item.status !== 'done').length}건
            </Link>
          </p>
        )}
      </details>
    </>
  )
}
