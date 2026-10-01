import type { SiteDef } from '../types/domain.ts'
import { listPoints } from '../lib/catalog.ts'
import { getTelemetry } from '../lib/telemetry.ts'

type MeterRow = { k: string; v: string }

const UPPER = [
  { id: 'in', label: '수전', keys: ['수전', '인입'], x: 88, through: false, source: true },
  { id: 'pv', label: '태양광', keys: ['태양광', '인버터', 'solar'], x: 196, through: true, source: false },
  { id: 'ups', label: 'UPS', keys: ['ups', '무정전'], x: 304, through: false, source: false },
  { id: 'gen', label: '비상발전', keys: ['비상', '디젤', '발전기'], x: 412, through: true, source: false },
  { id: 'ev', label: '충전기', keys: ['충전', 'ev'], x: 520, through: false, source: false },
  { id: 'pwr', label: '동력', keys: ['동력'], x: 628, through: true, source: false },
  { id: 'lt', label: '조명', keys: ['조명'], x: 736, through: false, source: false },
  { id: 'ac', label: '냉방', keys: ['냉방', '공조'], x: 844, through: true, source: false },
  { id: 'ehp', label: 'EHP', keys: ['ehp'], x: 952, through: false, source: false },
  { id: 'genl', label: '일반', keys: ['일반', '전열'], x: 1060, through: false, source: false },
]

const LOWER = [
  { id: 'l1', label: '저압1', keys: ['저압'], x: 120 },
  { id: 'l2', label: '저압2', keys: ['저압반'], x: 310 },
  { id: 'heat', label: '전열', keys: ['전열'], x: 520 },
  { id: 'ch', label: '냉동기', keys: ['냉동'], x: 730 },
  { id: 'fan', label: '급배기', keys: ['급기', '배기', '팬'], x: 940 },
  { id: 'spare', label: '예비', keys: ['예비'], x: 1100 },
]

function formatValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)
}

function reading(siteId: string, keys: string[], kind: 'a' | 'kw'): string {
  if (!siteId) return '수신 없음'
  const row = listPoints({ siteId }).find((item) => {
    const hay = `${item.system.name} ${item.equipment.name} ${item.point.name} ${item.point.tags.join(' ')} ${item.point.unit}`.toLowerCase()
    if (!keys.some((key) => hay.includes(key.toLowerCase()))) return false
    if (kind === 'a') return item.point.unit === 'A' || hay.includes('전류')
    return item.point.unit.toLowerCase() === 'kw' || (hay.includes('전력') && item.point.unit !== 'kWh')
  })
  if (!row) return '수신 없음'
  const tel = getTelemetry(row, 'live')
  if (tel.current == null || tel.certainty === 'unknown' || tel.certainty === 'estimate') return '수신 없음'
  return `${formatValue(tel.current)} ${kind === 'a' ? 'A' : 'kW'}`
}

function meters(siteId: string, keys: string[]): MeterRow[] {
  const blank = (value: string) => (value === '수신 없음' ? '—' : value)
  return [
    { k: 'Ua', v: '—' },
    { k: 'Ub', v: '—' },
    { k: 'Uc', v: '—' },
    { k: 'I', v: blank(reading(siteId, keys, 'a')) },
    { k: 'P', v: blank(reading(siteId, keys, 'kw')) },
  ]
}

function Breaker({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 7} y={y} width="14" height="18" className="sld-break" />
      <line x1={x - 5} y1={y + 3} x2={x + 5} y2={y + 14} className="sld-wire" />
    </g>
  )
}

function Arrow({ x, y }: { x: number; y: number }) {
  return <polygon points={`${x},${y + 13} ${x - 7},${y} ${x + 7},${y}`} className="sld-arrow" />
}

function Node({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r="2.4" className="sld-node" />
}

function MeterText({ x, y, rows }: { x: number; y: number; rows: MeterRow[] }) {
  return (
    <g>
      {rows.map((row, index) => (
        <text key={row.k} x={x} y={y + index * 14} className="sld-live" fontSize="11">
          {row.k} {row.v}
        </text>
      ))}
    </g>
  )
}

function UpperBay({
  x,
  label,
  rows,
  through,
  source,
}: {
  x: number
  label: string
  rows: MeterRow[]
  through: boolean
  source: boolean
}) {
  return (
    <g>
      {source && (
        <g>
          <line x1={x - 14} y1="42" x2={x + 14} y2="42" className="sld-wire" />
          <line x1={x - 8} y1="48" x2={x + 8} y2="48" className="sld-wire" />
          <line x1={x} y1="48" x2={x} y2="68" className="sld-wire" />
        </g>
      )}
      <Node x={x} y={68} />
      <line x1={x} y1="68" x2={x} y2="96" className="sld-wire" />
      <Breaker x={x} y={96} />
      <text x={x + 16} y="110" className="sld-name" fontSize="13">{label}</text>
      <line x1={x} y1="114" x2={x} y2="408" className="sld-wire" />
      <MeterText x={x + 16} y={132} rows={rows} />
      <Arrow x={x} y={395} />
      {through && (
        <g>
          <line x1={x} y1="408" x2={x} y2="468" className="sld-wire" />
          <Node x={x} y={468} />
        </g>
      )}
    </g>
  )
}

function LowerBay({ x, label, rows }: { x: number; label: string; rows: MeterRow[] }) {
  return (
    <g>
      <Node x={x} y={468} />
      <line x1={x} y1="468" x2={x} y2="496" className="sld-wire" />
      <Breaker x={x} y={496} />
      <text x={x + 16} y="510" className="sld-name" fontSize="13">{label}</text>
      <line x1={x} y1="514" x2={x} y2="612" className="sld-wire" />
      <MeterText x={x + 16} y={528} rows={rows} />
      <Arrow x={x} y={612} />
    </g>
  )
}

export function PowerBoard({ site }: { site?: SiteDef }) {
  const siteId = site?.id ?? ''

  return (
    <div className="cmd desk power-watch">
      <header className="cmd-head">
        <div>
          <p>{site?.name ?? '현장'}</p>
          <h1>전력감시</h1>
        </div>
        <p>
          {site?.location || '이 건물'} · 단선도. 받지 못한 전압·전류·전력은 — 입니다.{' '}
          <span className="sample-tag">예시</span> 배치는 현장 도면이 아닙니다.
        </p>
      </header>
      <section className="sld" aria-label="전력감시 단선도">
        <svg viewBox="0 0 1200 680">
          <text x="600" y="44" textAnchor="middle" className="sld-title" fontSize="26">
            {site?.name ?? '현장'}
          </text>
          <rect x="48" y="68" width="1104" height="340" className="sld-frame" />
          {UPPER.map((item) => (
            <UpperBay
              key={item.id}
              x={item.x}
              label={item.label}
              rows={meters(siteId, item.keys)}
              through={item.through}
              source={item.source}
            />
          ))}
          <line x1="90" y1="468" x2="1140" y2="468" className="sld-bus" />
          {LOWER.map((item) => (
            <LowerBay key={item.id} x={item.x} label={item.label} rows={meters(siteId, item.keys)} />
          ))}
        </svg>
      </section>
    </div>
  )
}
