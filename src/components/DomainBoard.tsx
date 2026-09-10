import { Heatmap } from './Heatmap.tsx'
import { ShareRing } from './ShareRing.tsx'
import { TrendChart } from './TrendChart.tsx'
import { energyBreakdown, powerHeatmap, shareFromKpis } from '../lib/portfolio.ts'
import { kpisForScope } from '../lib/telemetry.ts'
import type { AppId, TimeRange } from '../types/domain.ts'

type Props = {
  app: AppId
  siteId?: string
  range: TimeRange
}

export function DomainBoard({ app, siteId, range }: Props) {
  if (app === 'events') return null

  const kpis = kpisForScope({ app, siteId, range })
  const trend = kpis.find((item) => (
    item.series
    && item.series.length > 1
    && item.certainty !== 'estimate'
    && item.certainty !== 'unknown'
  ))
  const share = app === 'power' ? energyBreakdown({ siteId, range }) : shareFromKpis(kpis)
  const heat = app === 'power'
    ? powerHeatmap({ siteId, range })
    : trend?.series
      ? [{ id: trend.id, label: trend.label, values: trend.series }]
      : []

  if (!trend && share.length < 2 && heat.length === 0) return null

  return (
    <>
      <div className="analytics-board">
        {trend ? (
          <section className="panel">
            <h2>추세</h2>
            <p className="kpi-note">{trend.label}</p>
            <TrendChart values={trend.series ?? null} label={trend.label} />
          </section>
        ) : null}
        {share.length >= 2 ? <ShareRing title="구성" items={share} /> : null}
      </div>
      {heat.length > 0 ? (
        <Heatmap
          title="구간"
          rows={heat}
          note="색은 값의 크기입니다. 정상·이상이 아닙니다."
        />
      ) : null}
    </>
  )
}
