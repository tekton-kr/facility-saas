import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DomainBoard } from '../components/DomainBoard.tsx'
import { ExecBrief } from '../components/ExecBrief.tsx'
import { InsightChips } from '../components/InsightChips.tsx'
import { KpiRow } from '../components/KpiRow.tsx'
import { PointCards } from '../components/PointCards.tsx'
import { PointDrawer } from '../components/PointDrawer.tsx'
import { PointTable, type PointRow } from '../components/PointTable.tsx'
import { PortfolioLine } from '../components/PortfolioLine.tsx'
import { QuietSites } from '../components/QuietSites.tsx'
import { RankBars } from '../components/RankBars.tsx'
import { SiteCards } from '../components/SiteCards.tsx'
import { getSite, listPoints, siteHasApp } from '../lib/catalog.ts'
import { APP_LABEL, KIND_LABEL } from '../lib/format.ts'
import { insightsForScope, rankSites } from '../lib/portfolio.ts'
import { exceptionSiteCards, execKpis, portfolioHeadline, quietSiteCards } from '../lib/roleHome.ts'
import { useCompact } from '../lib/media.ts'
import { kpisForScope } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'
import { FocusView } from './FocusView.tsx'

export function DomainAppPage() {
  const compact = useCompact()
  const { app, siteId, range, query, role, search, view, goPoint } = useScope()
  const site = getSite(siteId)
  const [drawer, setDrawer] = useState<PointRow | null>(null)
  const rows = listPoints({ siteId, app, query })
  const siteHref = (id: string) => `/apps/${app}/sites/${id}${search}`

  if (view === 'peak' || view === 'eui' || view === 'pr' || view === 'gaps' || view === 'compare') {
    return <FocusView />
  }

  if (site && !siteHasApp(site, app)) {
    return (
      <div className="panel">
        <h1>{site.name} · {APP_LABEL[app]}</h1>
        <p className="kpi-meta">이 현장에 해당 앱 데이터가 없습니다. 카탈로그에 계통을 넣으면 같은 화면이 채워집니다.</p>
        <p><Link to={`/apps/${app}/sites/${site.id}${search}`}>현장으로</Link></p>
      </div>
    )
  }

  if (role === 'exec' && siteId) {
    return <ExecBrief />
  }

  if (role === 'exec') {
    const kpis = execKpis({ app, range })
    const insights = insightsForScope({ app, range, role: 'exec' })
    const cards = exceptionSiteCards({ app, query, range })
    const ranks = rankSites({ app, range }).filter((item) => cards.some((card) => card.site.id === item.id))
    const quiet = quietSiteCards({ app, query, range })
    const headline = portfolioHeadline({ app, query, range })

    return (
      <>
        <div className="page-head">
          <div>
            <h1>{APP_LABEL[app]} · 포트폴리오</h1>
            <p>예외 현장이 먼저입니다. 나머지 현장은 아래에 무채색으로 둡니다.</p>
          </div>
        </div>
        {headline ? <PortfolioLine headline={headline} to={siteHref(headline.siteId)} /> : null}
        {kpis.length > 0 ? <KpiRow items={kpis} /> : (
          <div className="empty">이 앱에 표시할 실측이 없습니다.</div>
        )}
        <DomainBoard app={app} range={range} />
        {insights.length > 0 ? (
          compact ? (
            <details className="deck insight-fold">
              <summary>추정 이슈 {insights.length}</summary>
              <InsightChips items={insights} role="exec" hrefFor={siteHref} />
            </details>
          ) : (
            <InsightChips items={insights} role="exec" hrefFor={siteHref} />
          )
        ) : null}
        {cards.length > 0 ? <SiteCards items={cards} hrefFor={siteHref} /> : (
          <div className="empty">이상 현장이 없습니다.</div>
        )}
        <QuietSites items={quiet} hrefFor={siteHref} />
        <RankBars
          title="이상 현장 비교"
          note="예외 현장만 그립니다. 없는 값은 채우지 않습니다."
          items={ranks}
          hrefFor={siteHref}
        />
      </>
    )
  }

  const kpis = kpisForScope({ app, siteId, range })
  const insights = insightsForScope({ app, siteId, range, role: 'ops' })

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{site ? `${site.name} · ${APP_LABEL[app]}` : APP_LABEL[app]}</h1>
          <p>
            {site ? `${KIND_LABEL[site.kind]} · ${site.location}. 계통·장비·관제점.` : '이 현장의 관제점입니다.'}
          </p>
        </div>
      </div>
      {kpis.length > 0 ? <KpiRow items={kpis} /> : (
        <div className="empty">이 앱에 표시할 실측이 없습니다.</div>
      )}
      <DomainBoard app={app} siteId={siteId} range={range} />
      {insights.length > 0 ? (
        compact ? (
          <details className="deck insight-fold">
            <summary>추정 이슈 {insights.length}</summary>
            <InsightChips items={insights} role="ops" hrefFor={siteHref} />
          </details>
        ) : (
          <InsightChips items={insights} role="ops" hrefFor={siteHref} />
        )
      ) : null}
      <section className="deck">
        <h2>관제점</h2>
        {compact ? (
          <PointCards rows={rows} range={range} onOpen={setDrawer} />
        ) : (
          <PointTable rows={rows} range={range} onOpen={setDrawer} />
        )}
      </section>
      <PointDrawer
        row={drawer}
        range={range}
        onClose={() => setDrawer(null)}
        onOpenPage={() => {
          if (!drawer) return
          goPoint(drawer.site.id, drawer.system.id, drawer.equipment.id, drawer.point.id)
        }}
      />
    </>
  )
}
