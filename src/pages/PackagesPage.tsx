import { Link, useParams } from 'react-router-dom'
import { CertaintyBadge } from '../components/CertaintyBadge.tsx'
import { TrendChart } from '../components/TrendChart.tsx'
import { advancePackage, packageById, packagesForScope, siteLabel } from '../lib/field.ts'
import { formatNumber, PACKAGE_STATUS_LABEL } from '../lib/format.ts'
import { generateTelemetry } from '../lib/telemetry.ts'
import { useField } from '../lib/useField.ts'
import { useScope } from '../lib/useScope.ts'

export function PackagesPage() {
  const { packageId } = useParams()
  const { siteId, search, role } = useScope()
  useField()
  const selected = packageById(packageId)
  const rows = packagesForScope(role === 'ops' ? siteId : undefined)

  if (packageId && !selected) {
    return (
      <div className="panel">
        <h1>패키지 없음</h1>
        <p><Link to={`/packages${search}`}>목록</Link></p>
      </div>
    )
  }

  if (selected) {
    const before = selected.pointRef ? generateTelemetry(selected.pointRef, '7d').series : null
    const after = selected.status === 'done' && selected.pointRef
      ? generateTelemetry(selected.pointRef, '24h').series
      : null

    return (
      <>
        <div className="page-head">
          <div>
            <p className="crumbs">
              <Link to={`/packages${search}`}>개보수 후보</Link>
              <span> / {selected.id}</span>
            </p>
            <h1>{selected.title}</h1>
            <p>
              {siteLabel(selected.siteId)} · {PACKAGE_STATUS_LABEL[selected.status]}
              {' · '}
              {selected.estimateAmount != null ? `${formatNumber(selected.estimateAmount)} 천원` : '금액 없음'}
            </p>
          </div>
        </div>
        <section className="panel">
          <h2>성격</h2>
          <CertaintyBadge certainty={selected.certainty} />
          <p className="kpi-note">{selected.note}</p>
          {selected.status !== 'done' ? (
            <button className="login-submit field-action" type="button" onClick={() => advancePackage(selected.id)}>
              {selected.status === 'candidate' ? '견적으로' : selected.status === 'quoted' ? '시공 시작' : '준공'}
            </button>
          ) : (
            <p className="kpi-meta">준공. 추정은 실측 배지로 바뀝니다.</p>
          )}
        </section>
        <div className="before-after">
          <section className="panel">
            <h2>공사 전 · 같은 관제점</h2>
            <TrendChart values={before} label="공사 전" />
          </section>
          <section className="panel">
            <h2>공사 후</h2>
            {after ? <TrendChart values={after} label="공사 후" /> : (
              <div className="empty">준공 후 같은 점으로 실측합니다.</div>
            )}
          </section>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>개보수 후보</h1>
          <p>이슈가 패키지가 됩니다. 절감액은 기본이 추정입니다.</p>
        </div>
      </div>
      <section className="deck">
        <h2>{siteId && role === 'ops' ? siteLabel(siteId) : '포트폴리오'}</h2>
        {rows.length === 0 ? <div className="empty">후보가 없습니다.</div> : (
          <div className="list">
            {rows.map((item) => (
              <Link key={item.id} className="list-item" to={`/packages/${item.id}${search}`}>
                <span>
                  <span className="badge">{PACKAGE_STATUS_LABEL[item.status]}</span>
                  {' '}
                  <CertaintyBadge certainty={item.certainty} />
                  <strong className="event-title">{item.title}</strong>
                  <div className="kpi-meta">
                    {siteLabel(item.siteId)}
                    {item.estimateAmount != null ? ` · ${formatNumber(item.estimateAmount)} 천원` : ''}
                    {' · '}
                    {item.note}
                  </div>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
