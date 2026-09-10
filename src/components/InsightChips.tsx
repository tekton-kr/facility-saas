import { Link } from 'react-router-dom'
import { CertaintyBadge } from './CertaintyBadge.tsx'
import { getSite } from '../lib/catalog.ts'
import { ROLE_LABEL } from '../lib/format.ts'
import type { Insight } from '../lib/portfolio.ts'
import type { Role } from '../types/domain.ts'

type Props = {
  items: Insight[]
  role: Role
  hrefFor?: (siteId: string) => string
}

export function InsightChips({ items, role, hrefFor }: Props) {
  if (items.length === 0) return null

  return (
    <section className="insight-grid" aria-label="인사이트">
      {items.map((item) => {
        const site = item.siteId ? getSite(item.siteId) : undefined
        const inner = (
          <>
            <div className="insight-kicker">
              <span>{ROLE_LABEL[item.role === 'both' ? role : item.role]} · {item.impact}</span>
              <CertaintyBadge certainty={item.certainty} />
            </div>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
            {site ? <div className="kpi-meta">{site.name}</div> : null}
          </>
        )
        if (item.siteId && hrefFor) {
          return (
            <Link key={item.id} className={`insight-card is-${item.certainty}`} to={hrefFor(item.siteId)}>
              {inner}
            </Link>
          )
        }
        return (
          <article key={item.id} className={`insight-card is-${item.certainty}`}>
            {inner}
          </article>
        )
      })}
    </section>
  )
}
