import { CertaintyBadge } from './CertaintyBadge.tsx'
import { Sparkline } from './Sparkline.tsx'
import { formatDateTime, formatDelta, formatNumber } from '../lib/format.ts'
import type { Kpi } from '../types/domain.ts'

type Props = {
  kpi: Kpi
}

export function KpiCard({ kpi }: Props) {
  const spark = kpi.series && kpi.series.length > 1 && kpi.value != null
  const tone = kpi.certainty === 'stale' ? 'stale' : kpi.certainty === 'estimate' ? 'estimate' : 'ok'

  return (
    <article className={`kpi is-${kpi.certainty}`}>
      <div className="kpi-top">
        <span className="kpi-label">{kpi.label}</span>
        <CertaintyBadge certainty={kpi.certainty} />
      </div>
      <div className="kpi-body">
        <div>
          <div className="kpi-value">
            {formatNumber(kpi.value)}
            <span className="kpi-unit">{kpi.unit}</span>
          </div>
          <div className="kpi-meta">수신 {formatDateTime(kpi.receivedAt)}</div>
        </div>
        {spark ? <Sparkline values={kpi.series ?? []} tone={tone} /> : null}
      </div>
      {kpi.previousValue != null && kpi.value != null ? (
        <div className="kpi-meta">
          {formatDelta(kpi.value, kpi.previousValue) ?? `이전 ${formatNumber(kpi.previousValue)} ${kpi.unit}`}
        </div>
      ) : null}
      {kpi.note ? <div className="kpi-note">{kpi.note}</div> : null}
    </article>
  )
}
