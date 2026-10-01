import type { ReactNode } from 'react'
import type { SiteDef } from '../types/domain.ts'
import { listPoints } from '../lib/catalog.ts'
import { getTelemetry } from '../lib/telemetry.ts'

type Kind = 'v' | 'a' | 'kw'

const NODES: { id: string; label: string; keys: string[]; row: 'top' | 'bottom' }[] = [
  { id: 'grid', label: '수전', keys: ['수전', '인입', '한전', 'grid'], row: 'top' },
  { id: 'pv', label: '태양광', keys: ['태양광', '인버터', 'pv', 'solar'], row: 'top' },
  { id: 'wind', label: '풍력', keys: ['풍력', 'wind'], row: 'top' },
  { id: 'gen', label: '비상발전', keys: ['비상', '디젤', '발전기', 'diesel'], row: 'bottom' },
  { id: 'bat', label: '배터리', keys: ['배터리', '축전', 'ess'], row: 'bottom' },
  { id: 'ev', label: '충전기', keys: ['충전', 'charger', 'ev'], row: 'bottom' },
  { id: 'load', label: '부하', keys: ['부하', 'load'], row: 'bottom' },
]

function formatValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(value)
}

function reading(siteId: string, keys: string[], kind: Kind): string {
  const rows = listPoints({ siteId })
  const row = rows.find((item) => {
    const hay = `${item.system.name} ${item.equipment.name} ${item.point.name} ${item.point.tags.join(' ')} ${item.point.unit}`.toLowerCase()
    if (!keys.some((key) => hay.includes(key))) return false
    if (kind === 'v') return item.point.unit === 'V' || hay.includes('전압')
    if (kind === 'a') return item.point.unit === 'A' || hay.includes('전류')
    return item.point.unit.toLowerCase() === 'kw' || hay.includes('전력') || hay.includes('kw')
  })
  if (!row) return '수신 없음'
  const tel = getTelemetry(row, 'live')
  if (tel.current == null || tel.certainty === 'unknown' || tel.certainty === 'estimate') return '수신 없음'
  return formatValue(tel.current)
}

function NodeIcon({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 64 48" aria-hidden="true">
      {id === 'grid' ? (
        <>
          <path d="M18 40V14M32 40V8M46 40V14M14 14h8M28 8h8M42 14h8M18 22h14M32 22h14" />
        </>
      ) : null}
      {id === 'pv' ? (
        <>
          <path d="M8 30h48l-6 10H14L8 30Z" />
          <path d="M20 30v10M32 30v10M44 30v10M8 30l24-8 24 8" />
        </>
      ) : null}
      {id === 'wind' ? (
        <>
          <path d="M32 40V18" />
          <circle cx="32" cy="16" r="2" />
          <path d="M32 16 32 4M32 16 44 22M32 16 20 22" />
        </>
      ) : null}
      {id === 'gen' ? (
        <>
          <path d="M10 18h28v18H10V18Z" />
          <path d="M38 24h10M44 20v8M16 18V12h12v6" />
        </>
      ) : null}
      {id === 'bat' ? (
        <>
          <path d="M16 12h24v26H16V12Z" />
          <path d="M24 8h16v4H24V8ZM22 22h12M32 18v12" />
        </>
      ) : null}
      {id === 'ev' ? (
        <>
          <path d="M14 28h28l-3-10H20L14 28Z" />
          <path d="M20 28v6M36 28v6M40 16h8v8" />
        </>
      ) : null}
      {id === 'load' ? (
        <>
          <path d="M12 40V20l20-10 20 10v20H12Z" />
          <path d="M28 40V28h8v12" />
        </>
      ) : null}
    </svg>
  )
}

function Reads({ siteId, keys }: { siteId: string; keys: string[] }) {
  const volts = reading(siteId, keys, 'v')
  const amps = reading(siteId, keys, 'a')
  const power = reading(siteId, keys, 'kw')
  return (
    <p>
      <b className={volts === '수신 없음' ? 'is-empty' : ''}>{volts === '수신 없음' ? 'V 수신 없음' : `${volts} V`}</b>
      <b className={amps === '수신 없음' ? 'is-empty' : ''}>{amps === '수신 없음' ? 'A 수신 없음' : `${amps} A`}</b>
      <b className={power === '수신 없음' ? 'is-empty' : ''}>{power === '수신 없음' ? 'kW 수신 없음' : `${power} kW`}</b>
    </p>
  )
}

function Node({ siteId, id, label, keys }: { siteId: string; id: string; label: string; keys: string[] }): ReactNode {
  return (
    <article className="flow-node">
      <NodeIcon id={id} />
      <Reads siteId={siteId} keys={keys} />
      <strong>{label}</strong>
    </article>
  )
}

export function PowerFlow({ site }: { site: SiteDef }) {
  const top = NODES.filter((item) => item.row === 'top')
  const bottom = NODES.filter((item) => item.row === 'bottom')
  return (
    <div className="cmd flow">
      <header className="cmd-head">
        <div>
          <p>{site.name}</p>
          <h1>종합관제</h1>
        </div>
        <p>{site.location || '이 건물'} · 수신된 전압, 전류, 전력만 숫자로 둡니다.</p>
      </header>
      <section className="flow-board" aria-label="전력 흐름">
        <div className="flow-row is-top">
          {top.map((item) => <Node key={item.id} siteId={site.id} {...item} />)}
        </div>
        <svg className="flow-wires" viewBox="0 0 1000 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M166 0v28M500 0v28M834 0v28M166 28h668M125 62v28M375 62v28M625 62v28M875 62v28M125 62h750" />
        </svg>
        <div className="flow-row is-bottom">
          {bottom.map((item) => <Node key={item.id} siteId={site.id} {...item} />)}
        </div>
      </section>
    </div>
  )
}
