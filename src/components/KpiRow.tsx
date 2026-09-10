import { KpiCard } from './KpiCard.tsx'
import type { Kpi } from '../types/domain.ts'

type Props = {
  items: Kpi[]
}

export function KpiRow({ items }: Props) {
  return (
    <section className="kpi-row" aria-label="핵심 지표">
      {items.slice(0, 6).map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </section>
  )
}
