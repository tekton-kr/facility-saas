import type { HeatmapRow } from '../lib/portfolio.ts'

type Props = {
  title: string
  rows: HeatmapRow[]
  note?: string
}

export function Heatmap({ title, rows, note }: Props) {
  const values = rows.flatMap((row) => row.values).filter((value): value is number => value != null)
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1
  const span = max - min || 1

  if (rows.length === 0) return null

  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="kpi-note">{note ?? '색은 부하 크기입니다. 정상·이상이 아닙니다.'}</p>
      <div className="heatmap">
        {rows.map((row) => (
          <div key={row.id} className="heatmap-row">
            <span className="heatmap-label">{row.label}</span>
            <div className="heatmap-cells">
              {row.values.map((value, index) => {
                const t = value == null ? 0 : (value - min) / span
                return (
                  <span
                    key={`${row.id}-${index}`}
                    className={`heatmap-cell${value == null ? ' is-empty' : ''}`}
                    style={value == null ? undefined : { background: `rgb(37 99 235 / ${0.12 + t * 0.72})` }}
                    title={value == null ? '데이터 없음' : String(value)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
