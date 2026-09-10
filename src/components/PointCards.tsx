import { CertaintyBadge } from './CertaintyBadge.tsx'
import { formatDateTime, formatNumber } from '../lib/format.ts'
import { getTelemetry } from '../lib/telemetry.ts'
import type { PointRow } from './PointTable.tsx'
import type { TimeRange } from '../types/domain.ts'

type Props = {
  rows: PointRow[]
  range: TimeRange
  onOpen: (row: PointRow) => void
}

export function PointCards({ rows, range, onOpen }: Props) {
  if (rows.length === 0) {
    return <div className="empty">이 앱·범위에 관제점이 없습니다.</div>
  }

  return (
    <div className="card-list" aria-label="관제점 목록">
      {rows.map((row) => {
        const tel = getTelemetry({
          siteId: row.site.id,
          systemId: row.system.id,
          equipmentId: row.equipment.id,
          pointId: row.point.id,
        }, range)
        return (
          <button
            key={`${row.site.id}.${row.system.id}.${row.equipment.id}.${row.point.id}`}
            type="button"
            className="point-card"
            onClick={() => onOpen(row)}
          >
            <span>
              <strong>{row.point.name}</strong>
              <span className="kpi-meta">{row.equipment.name} · {row.system.name}</span>
            </span>
            <span className="point-card-value">
              <span className="mono">{formatNumber(tel.current)} {row.point.unit}</span>
              <CertaintyBadge certainty={tel.certainty} />
              <span className="kpi-meta">{formatDateTime(tel.receivedAt)}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
