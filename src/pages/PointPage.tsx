import { Link, Navigate } from 'react-router-dom'
import { CertaintyBadge } from '../components/CertaintyBadge.tsx'
import { TrendChart } from '../components/TrendChart.tsx'
import { getPoint } from '../lib/catalog.ts'
import { APP_LABEL, formatDateTime, formatNumber } from '../lib/format.ts'
import { getTelemetry } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'

export function PointPage() {
  const { app, siteId, systemId, equipmentId, pointId, range, search, role } = useScope()
  if (role === 'exec' && siteId) {
    return <Navigate to={`/apps/${app}/sites/${siteId}${search}`} replace />
  }
  const found = siteId && systemId && equipmentId && pointId
    ? getPoint({ siteId, systemId, equipmentId, pointId })
    : undefined

  if (!found) {
    return (
      <div className="panel">
        <h1>관제점을 찾을 수 없습니다</h1>
        <p><Link to={`/apps/${app}${search}`}>돌아가기</Link></p>
      </div>
    )
  }

  const tel = getTelemetry(
    {
      siteId: found.site.id,
      systemId: found.system.id,
      equipmentId: found.equipment.id,
      pointId: found.point.id,
    },
    range,
  )

  return (
    <>
      <div className="crumbs">
        <Link to={`/apps/${app}${search}`}>{APP_LABEL[app]}</Link>
        <span>/</span>
        <Link to={`/apps/${app}/sites/${found.site.id}${search}`}>{found.site.name}</Link>
        <span>/</span>
        <Link to={`/apps/${app}/sites/${found.site.id}/systems/${found.system.id}${search}`}>{found.system.name}</Link>
        <span>/</span>
        <Link to={`/apps/${app}/sites/${found.site.id}/systems/${found.system.id}/equipment/${found.equipment.id}${search}`}>
          {found.equipment.name}
        </Link>
        <span>/</span>
        <span>{found.point.name}</span>
      </div>
      <div className="page-head">
        <div>
          <h1>{found.point.name}</h1>
          <p>{found.equipment.name}</p>
        </div>
        <CertaintyBadge certainty={tel.certainty} />
      </div>
      <section className="kpi-row is-single">
        <article className={`kpi is-${tel.certainty}`}>
          <div className="kpi-top">
            <span className="kpi-label">현재값</span>
            <CertaintyBadge certainty={tel.certainty} />
          </div>
          <div className="kpi-value">
            {formatNumber(tel.current)}
            <span className="kpi-unit">{found.point.unit}</span>
          </div>
          <div className="kpi-meta">수신 {formatDateTime(tel.receivedAt)}</div>
          {tel.note ? <div className="kpi-note">{tel.note}</div> : null}
        </article>
      </section>
      <section className="panel">
        <h2>추세</h2>
        <TrendChart values={tel.series} label={`${found.point.name} 추세`} />
      </section>
    </>
  )
}
