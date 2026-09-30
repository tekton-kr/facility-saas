import { useState } from 'react'
import { CollectionPending } from '../components/CollectionPending.tsx'
import { PortfolioDashboard } from '../components/PortfolioDashboard.tsx'
import { SiteDashboard } from '../components/SiteDashboard.tsx'
import { DomainBoard } from '../components/DomainBoard.tsx'
import { ExecBrief } from '../components/ExecBrief.tsx'
import { InsightChips } from '../components/InsightChips.tsx'
import { KpiRow } from '../components/KpiRow.tsx'
import { PointCards } from '../components/PointCards.tsx'
import { PointDrawer } from '../components/PointDrawer.tsx'
import { PointTable, type PointRow } from '../components/PointTable.tsx'
import { PidBoard } from '../components/PidBoard.tsx'
import { getSite, listPidPoints, listPoints, siteHasApp } from '../lib/catalog.ts'
import { isAppCollected } from '../lib/collection.ts'
import { APP_LABEL, KIND_LABEL } from '../lib/format.ts'
import { insightsForScope } from '../lib/portfolio.ts'
import { useCompact } from '../lib/media.ts'
import { kpisForScope } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'
import { FocusView } from './FocusView.tsx'

function mergeRows(pidRows: PointRow[], appRows: PointRow[]): PointRow[] {
  const seen = new Set(pidRows.map((row) => `${row.site.id}.${row.system.id}.${row.equipment.id}.${row.point.id}`))
  return [
    ...pidRows,
    ...appRows.filter((row) => !seen.has(`${row.site.id}.${row.system.id}.${row.equipment.id}.${row.point.id}`)),
  ]
}

export function DomainAppPage() {
  const compact = useCompact()
  const { app, siteId, range, query, role, search, view, goPoint } = useScope()
  const site = getSite(siteId)
  const [drawer, setDrawer] = useState<PointRow | null>(null)
  const rows = listPoints({ siteId, app, query })
  const siteHref = (id: string) => `/apps/${app}/sites/${id}${search}`

  if (!isAppCollected(app)) {
    return <CollectionPending title={`${APP_LABEL[app]} · 연동 대기`} />
  }

  if (view === 'peak' || view === 'eui' || view === 'pr' || view === 'gaps' || view === 'compare') {
    return <FocusView />
  }

  if (site && !siteHasApp(site, app)) {
    return <SiteDashboard site={site} service={app} />
  }

  if (role === 'exec' && siteId) {
    return <ExecBrief />
  }

  if (role === 'exec') {
    return <PortfolioDashboard service={app} />
  }

  const kpis = kpisForScope({ app, siteId, range })
  const insights = insightsForScope({ app, siteId, range, role: 'ops' })
  const pid = site?.pid
  const tableRows = pid && site
    ? mergeRows(listPidPoints(site), rows)
    : rows

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-kicker">{site ? site.name : APP_LABEL[app]}</p>
          <h1>{site ? `${site.name} · ${pid ? pid.title : APP_LABEL[app]}` : APP_LABEL[app]}</h1>
          <p>
            {site
              ? pid
                ? `${KIND_LABEL[site.kind]} · ${site.location}. 조회 전용. 보호동작은 현장 헤드엔드.`
                : `${KIND_LABEL[site.kind]} · ${site.location}. 계통·장비·관제점.`
              : '이 현장의 관제점입니다.'}
          </p>
        </div>
      </div>
      {kpis.length > 0 ? <KpiRow items={kpis} /> : (
        <div className="empty">이 앱에 표시할 실측이 없습니다.</div>
      )}
      {pid && site ? (
        <PidBoard site={site} diagram={pid} range={range} onOpen={setDrawer} />
      ) : (
        <DomainBoard app={app} siteId={siteId} range={range} />
      )}
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
          <PointCards rows={tableRows} range={range} onOpen={setDrawer} />
        ) : (
          <PointTable rows={tableRows} range={range} onOpen={setDrawer} />
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
