import { Link } from 'react-router-dom'
import { CertaintyBadge } from './CertaintyBadge.tsx'
import { formatNumber } from '../lib/format.ts'
import type { RankItem } from '../lib/portfolio.ts'

type Props = {
  title: string
  note?: string
  items: RankItem[]
  hrefFor?: (id: string) => string
}

export function RankBars({ title, note, items, hrefFor }: Props) {
  const numeric = items.map((item) => item.value).filter((value): value is number => value != null)
  const max = Math.max(...numeric, 0)

  if (items.length === 0) return null

  return (
    <section className="deck">
      <h2>{title}</h2>
      {note ? <p className="kpi-note rank-note">{note}</p> : null}
      <div className="rank-list">
        {items.map((item) => {
          const width = item.value == null || max === 0 ? 0 : (item.value / max) * 100
          const body = (
            <>
              <div className="rank-top">
                <span>{item.label}</span>
                <span>
                  {formatNumber(item.value)} {item.unit}{' '}
                  <CertaintyBadge certainty={item.certainty} />
                </span>
              </div>
              <div className="rank-track" aria-hidden="true">
                <span style={{ width: `${width}%` }} />
              </div>
            </>
          )
          if (hrefFor && item.value != null) {
            return (
              <Link key={item.id} className="rank-item" to={hrefFor(item.id)}>
                {body}
              </Link>
            )
          }
          return (
            <div key={item.id} className="rank-item">
              {body}
            </div>
          )
        })}
      </div>
    </section>
  )
}
