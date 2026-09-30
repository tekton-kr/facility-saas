import { KpiRow } from './KpiRow.tsx'
import { evidenceKpis } from '../lib/roleHome.ts'
import type { AppId, TimeRange } from '../types/domain.ts'

type Props = {
  app: AppId
  siteId?: string
  range: TimeRange
}

export function EvidenceDeck({ app, siteId, range }: Props) {
  const items = evidenceKpis({ app, siteId, range })
  if (items.length === 0) return null

  return (
    <section className="deck evidence-deck">
      <h2>근거 · 점수 없음</h2>
      <p className="kpi-meta">건물 가치 점수를 만들지 않습니다. 실측·공백·추정만 읽습니다.</p>
      <KpiRow items={items} />
    </section>
  )
}
