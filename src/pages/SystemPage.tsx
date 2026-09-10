import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { KpiRow } from '../components/KpiRow.tsx'
import { PidBoard } from '../components/PidBoard.tsx'
import { PointDrawer } from '../components/PointDrawer.tsx'
import { PointTable, type PointRow } from '../components/PointTable.tsx'
import { getSystem, listPoints } from '../lib/catalog.ts'
import { APP_LABEL } from '../lib/format.ts'
import { kpisForScope } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'

export function SystemPage() {
  const { app, siteId, systemId, range, query, search, role, goPoint, goEquipment } = useScope()
  const found = getSystem(siteId, systemId)
  const [drawer, setDrawer] = useState<PointRow | null>(null)
  if (role === 'exec' && siteId) {
    return <Navigate to={`/apps/${app}/sites/${siteId}${search}`} replace />
  }

  if (!found) {
    return (
      <div className="panel">
        <h1>계통을 찾을 수 없습니다</h1>
        <p><Link to={siteId ? `/apps/${app}/sites/${siteId}${search}` : `/apps/${app}${search}`}>돌아가기</Link></p>
      </div>
    )
  }

  const { site, system } = found
  const kpis = app === 'events' ? [] : kpisForScope({ app, siteId: site.id, systemId: system.id, range })
  const rows = listPoints({ siteId: site.id, systemId: system.id, app: app === 'events' ? undefined : app, query })

  return (
    <>
      <div className="crumbs">
        <Link to={`/apps/${app}${search}`}>{APP_LABEL[app]}</Link>
        <span>/</span>
        <Link to={`/apps/${app}/sites/${site.id}${search}`}>{site.name}</Link>
        <span>/</span>
        <span>{system.name}</span>
      </div>
      <div className="page-head">
        <div>
          <h1>{system.name}</h1>
          <p>{site.name}{system.wing ? ` · ${system.wing}` : ''}</p>
        </div>
      </div>
      {kpis.length > 0 ? <KpiRow items={kpis} /> : null}
      {site.pid ? (
        <PidBoard site={site} diagram={site.pid} range={range} onOpen={setDrawer} />
      ) : null}
      <section className="deck">
        <h2>장비</h2>
        <div className="list">
          {system.equipment.map((equipment) => (
            <button
              key={equipment.id}
              type="button"
              className="list-item"
              onClick={() => goEquipment(site.id, system.id, equipment.id)}
            >
              <span>
                <strong>{equipment.name}</strong>
                <div className="kpi-meta">관제점 {equipment.points.length}</div>
              </span>
              <span className="kpi-meta">보기</span>
            </button>
          ))}
        </div>
      </section>
      <section className="deck">
        <h2>관제점</h2>
        <PointTable rows={rows} range={range} onOpen={setDrawer} />
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
