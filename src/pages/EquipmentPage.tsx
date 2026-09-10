import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { PointDrawer } from '../components/PointDrawer.tsx'
import { PointTable, type PointRow } from '../components/PointTable.tsx'
import { TrendChart } from '../components/TrendChart.tsx'
import { getEquipment, listPoints } from '../lib/catalog.ts'
import { APP_LABEL } from '../lib/format.ts'
import { getTelemetry } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'

export function EquipmentPage() {
  const { app, siteId, systemId, equipmentId, range, query, search, role, goPoint } = useScope()
  const found = getEquipment(siteId, systemId, equipmentId)
  const [drawer, setDrawer] = useState<PointRow | null>(null)
  if (role === 'exec' && siteId) {
    return <Navigate to={`/apps/${app}/sites/${siteId}${search}`} replace />
  }

  if (!found) {
    return (
      <div className="panel">
        <h1>장비를 찾을 수 없습니다</h1>
        <p><Link to={siteId ? `/apps/${app}/sites/${siteId}${search}` : `/apps/${app}${search}`}>돌아가기</Link></p>
      </div>
    )
  }

  const { site, system, equipment } = found
  const rows = listPoints({
    siteId: site.id,
    systemId: system.id,
    equipmentId: equipment.id,
    query,
  })
  const primary = equipment.points.find((point) => point.id === 'cap' || point.name.includes('면수'))
    ?? equipment.points[0]
  const series = primary
    ? getTelemetry({
        siteId: site.id,
        systemId: system.id,
        equipmentId: equipment.id,
        pointId: primary.id,
      }, range).series
    : null

  return (
    <>
      <div className="crumbs">
        <Link to={`/apps/${app}${search}`}>{APP_LABEL[app]}</Link>
        <span>/</span>
        <Link to={`/apps/${app}/sites/${site.id}${search}`}>{site.name}</Link>
        <span>/</span>
        <Link to={`/apps/${app}/sites/${site.id}/systems/${system.id}${search}`}>{system.name}</Link>
        <span>/</span>
        <span>{equipment.name}</span>
      </div>
      <div className="page-head">
        <div>
          <h1>{equipment.name}</h1>
          <p>{site.name} · {system.name}</p>
        </div>
      </div>
      <section className="panel">
        <h2>{primary ? `${primary.name} 추세` : '추세'}</h2>
        <TrendChart values={series} label={primary?.name ?? '추세'} />
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
