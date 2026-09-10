import { CertaintyBadge } from './CertaintyBadge.tsx'
import { formatNumber } from '../lib/format.ts'
import type { Score } from '../lib/portfolio.ts'

type Props = {
  items: Score[]
}

export function ScoreRow({ items }: Props) {
  return (
    <section className="score-row" aria-label="점수">
      {items.map((item) => (
        <article key={item.id} className="score-card">
          <div className="kpi-top">
            <span className="kpi-label">{item.label}</span>
            <CertaintyBadge certainty={item.certainty} />
          </div>
          <div className="kpi-value">
            {formatNumber(item.value, 0)}
            {item.value != null ? <span className="kpi-unit">/100</span> : null}
          </div>
          <div className="score-bar" aria-hidden="true">
            <span style={{ width: item.value == null ? '0%' : `${item.value}%` }} />
          </div>
          <div className="kpi-note">{item.note}</div>
        </article>
      ))}
    </section>
  )
}
