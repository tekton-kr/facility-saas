import { Link } from 'react-router-dom'
import { CertaintyBadge } from './CertaintyBadge.tsx'
import { KIND_LABEL, formatNumber } from '../lib/format.ts'
import type { SiteCardModel } from '../lib/portfolio.ts'

type Props = {
  items: SiteCardModel[]
  hrefFor: (siteId: string) => string
}

export function SiteCards({ items, hrefFor }: Props) {
  if (items.length === 0) {
    return <div className="empty">이 범위에 현장이 없습니다.</div>
  }

  return (
    <section className="site-cards" aria-label="현장">
      {items.map((item) => (
        <Link
          key={item.site.id}
          className={`site-card${item.critical > 0 ? ' is-critical' : item.warning > 0 ? ' is-warning' : ''}`}
          to={hrefFor(item.site.id)}
        >
          {item.site.photo ? (
            <div className="site-photo" aria-hidden="true">
              <img src={item.site.photo} alt="" loading="lazy" />
            </div>
          ) : (
            <div className={`site-facade is-${item.site.kind}`} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          )}
          <div className="site-card-body">
            <div className="site-card-top">
              <strong>{item.site.name}</strong>
              <span className="tree-kind">{KIND_LABEL[item.site.kind]}</span>
            </div>
            <div className="kpi-meta">{item.site.location}</div>
            <div className="site-card-stats">
              <span>{item.site.areaM2 != null ? `${formatNumber(item.site.areaM2, 0)} m²` : '면적 미등록'}</span>
              <span>관제점 {item.points}</span>
            </div>
            {item.metricLabel ? (
              <div className="site-card-metric">
                <span>{item.metricLabel} {formatNumber(item.metricValue)} {item.metricUnit}</span>
                <CertaintyBadge certainty={item.metricCertainty} />
              </div>
            ) : null}
            <div className="site-card-alarms">
              {item.critical > 0 ? <span className="badge is-critical">위험 {item.critical}</span> : null}
              {item.warning > 0 ? <span className="badge is-warning">주의 {item.warning}</span> : null}
              {item.critical + item.warning === 0 ? <span className="kpi-meta">열린 알람 없음</span> : null}
            </div>
          </div>
        </Link>
      ))}
    </section>
  )
}
