import { CertaintyBadge } from './CertaintyBadge.tsx'
import { getPoint } from '../lib/catalog.ts'
import { formatNumber } from '../lib/format.ts'
import { alarmsForScope, getTelemetry } from '../lib/telemetry.ts'
import type { PointRow } from './PointTable.tsx'
import type { PidDiagram, PidNode, PidNodeKind, SiteDef, TimeRange } from '../types/domain.ts'

type Props = {
  site: SiteDef
  diagram: PidDiagram
  range: TimeRange
  onOpen: (row: PointRow) => void
}

const VIEW_W = 920
const VIEW_H = 300

export function PidBoard({ site, diagram, range, onOpen }: Props) {
  const alarms = alarmsForScope({ siteId: site.id })
  const byId = new Map(diagram.nodes.map((node) => [node.id, node]))

  return (
    <section className="panel pid-board">
      <h2>{diagram.title} 계통 (P&ID 개요)</h2>
      <p className="kpi-note">{diagram.note}</p>
      <div className="pid-frame">
        <svg
          className="pid-svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="img"
          aria-label={`${site.name} ${diagram.title} 계통도. 조회 전용.`}
        >
          {diagram.edges.map((edge) => {
            const from = byId.get(edge.from)
            const to = byId.get(edge.to)
            if (!from || !to) return null
            const points = [{ x: from.x, y: from.y }, ...(edge.via ?? []), { x: to.x, y: to.y }]
            return (
              <polyline
                key={`${edge.from}-${edge.to}`}
                className="pid-pipe"
                fill="none"
                points={points.map((item) => `${item.x},${item.y}`).join(' ')}
              />
            )
          })}
          {diagram.nodes.map((node) => (
            <PidSymbol key={node.id} node={node} />
          ))}
        </svg>
        {diagram.nodes.map((node) => (
          <PidChip
            key={node.id}
            site={site}
            node={node}
            range={range}
            hot={Boolean(node.point && alarms.some((item) => (
              item.systemId === node.point?.systemId
              && item.equipmentId === node.point?.equipmentId
              && item.pointId === node.point?.pointId
              && (item.severity === 'critical' || item.severity === 'warning')
            )))}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  )
}

function PidChip({
  site,
  node,
  range,
  hot,
  onOpen,
}: {
  site: SiteDef
  node: PidNode
  range: TimeRange
  hot: boolean
  onOpen: (row: PointRow) => void
}) {
  const style = {
    left: `${(node.x / VIEW_W) * 100}%`,
    top: `${(node.y / VIEW_H) * 100}%`,
  }
  const slot = node.slot ?? chipSlot(node.kind)

  if (!node.point) {
    return (
      <div className={`pid-chip is-${slot} is-${node.kind}`} style={style}>
        <span className="pid-tag">{node.tag || node.label}</span>
      </div>
    )
  }

  const found = getPoint({ siteId: site.id, ...node.point })
  const tel = found ? getTelemetry({ siteId: site.id, ...node.point }, range) : null
  const showValue = node.kind === 'source' || node.kind === 'sink' || node.kind === 'sensor'
  const label = node.label || node.tag || found?.point.name || node.id

  if (!found || !tel) {
    return (
      <div className={`pid-chip is-${slot} is-unknown`} style={style}>
        <span className="pid-tag">{label}</span>
        {showValue ? <span className="pid-value">—</span> : null}
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`pid-chip is-${slot} is-${node.kind} is-${tel.certainty}${hot ? ' is-hot' : ''}`}
      style={style}
      onClick={() => onOpen(found)}
    >
      <span className="pid-tag">{label}</span>
      {showValue ? (
        <span className="pid-value">
          {formatNumber(tel.current)}
          <small>{found.point.unit}</small>
        </span>
      ) : null}
      {showValue && tel.certainty !== 'confirmed' ? <CertaintyBadge certainty={tel.certainty} /> : null}
    </button>
  )
}

function chipSlot(kind: PidNodeKind): 'above' | 'below' | 'on' {
  if (kind === 'source' || kind === 'sink') return 'on'
  if (kind === 'sensor') return 'below'
  return 'above'
}

function PidSymbol({ node }: { node: PidNode }) {
  const { x, y, kind } = node
  if (kind === 'source') {
    return (
      <g transform={`translate(${x} ${y})`} className="pid-sym">
        <rect x="-34" y="-20" width="68" height="40" rx="5" />
      </g>
    )
  }
  if (kind === 'pump') {
    return (
      <g transform={`translate(${x} ${y})`} className="pid-sym">
        <circle r="15" />
        <path d="M-2 -6 L10 0 L-2 6 Z" />
      </g>
    )
  }
  if (kind === 'valve') {
    return (
      <g transform={`translate(${x} ${y})`} className="pid-sym">
        <path d="M-11 0 L0 -9 L11 0 L0 9 Z" />
        <line x1="0" y1="-9" x2="0" y2="-15" />
      </g>
    )
  }
  if (kind === 'exchanger') {
    return (
      <g transform={`translate(${x} ${y})`} className="pid-sym is-exchanger">
        <rect x="-56" y="-26" width="112" height="52" rx="6" />
        <path d="M-42 0 C-34 -12 -26 12 -18 0 S-2 12 6 0 S22 -12 30 0 S42 12 42 0" />
      </g>
    )
  }
  if (kind === 'sensor') {
    return (
      <g transform={`translate(${x} ${y})`} className="pid-sym">
        <circle r="6" />
      </g>
    )
  }
  return (
    <g transform={`translate(${x} ${y})`} className="pid-sym">
      <circle r="17" />
    </g>
  )
}
