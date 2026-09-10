import { CertaintyBadge } from './CertaintyBadge.tsx'
import { formatNumber } from '../lib/format.ts'
import type { RankItem } from '../lib/portfolio.ts'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)']
const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type Props = {
  title: string
  items: RankItem[]
}

export function ShareRing({ title, items }: Props) {
  const parts = items.filter((item): item is RankItem & { value: number } => item.value != null && item.value > 0)
  const total = parts.reduce((sum, item) => sum + item.value, 0)
  if (parts.length < 2 || total <= 0) return null

  const slices = parts.map((item, index) => {
    const before = parts.slice(0, index).reduce((sum, prev) => sum + prev.value, 0)
    return {
      item,
      color: COLORS[index % COLORS.length],
      dash: (item.value / total) * CIRCUMFERENCE,
      offset: (before / total) * CIRCUMFERENCE,
    }
  })

  return (
    <section className="panel share-ring">
      <h2>{title}</h2>
      <p className="kpi-note">구성 비율입니다. 정상·이상이 아닙니다.</p>
      <div className="share-ring-body">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className="share-ring-track" cx="60" cy="60" r={RADIUS} />
          {slices.map((slice) => (
            <circle
              key={slice.item.id}
              className="share-ring-slice"
              cx="60"
              cy="60"
              r={RADIUS}
              stroke={slice.color}
              strokeDasharray={`${slice.dash} ${CIRCUMFERENCE - slice.dash}`}
              strokeDashoffset={-slice.offset}
            />
          ))}
        </svg>
        <ul>
          {slices.map((slice) => (
            <li key={slice.item.id}>
              <span className="share-ring-swatch" style={{ background: slice.color }} />
              <span>{slice.item.label}</span>
              <strong>
                {formatNumber(slice.item.value)} {slice.item.unit}
                <CertaintyBadge certainty={slice.item.certainty} />
              </strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
