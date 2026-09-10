import { Link } from 'react-router-dom'
import { formatNumber, KIND_LABEL } from '../lib/format.ts'
import type { SiteCardModel } from '../lib/portfolio.ts'

type Props = {
  items: SiteCardModel[]
  hrefFor: (siteId: string) => string
}

export function QuietSites({ items, hrefFor }: Props) {
  if (items.length === 0) return null

  return (
    <section className="deck">
      <h2>예외로 집계되지 않은 현장 {items.length}</h2>
      <div className="quiet-sites">
        {items.map((item) => (
          <Link key={item.site.id} className="quiet-site" to={hrefFor(item.site.id)}>
            <span className="quiet-site-name">{item.site.name}</span>
            <span>{KIND_LABEL[item.site.kind]} · {item.site.location}</span>
            <span className="mono-source">
              {item.metricLabel
                ? `${item.metricLabel} ${formatNumber(item.metricValue)} ${item.metricUnit ?? ''}`
                : '지표 없음'}
            </span>
            <span className="mono-source">관제점 {item.points}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
