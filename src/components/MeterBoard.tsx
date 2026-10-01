import { useState } from 'react'
import type { SiteDef } from '../types/domain.ts'
import { listPoints } from '../lib/catalog.ts'
import { getTelemetry } from '../lib/telemetry.ts'
import { OwnerGauge, OwnerLine } from './OwnerCharts.tsx'

const KINDS = [
  { id: 'gas', label: '가스', keys: ['가스', 'gas'], unit: 'Nm³', color: '#0f766e', sample: 12.4, max: 40 },
  { id: 'elec', label: '전기', keys: ['전기', '전력', 'elec', 'kwh'], unit: 'kWh', color: '#2563eb', sample: 428, max: 800 },
  { id: 'dhw', label: '급탕', keys: ['급탕', '온수'], unit: 'm³', color: '#b45309', sample: 3.1, max: 10 },
  { id: 'heat', label: '난방', keys: ['난방', '열량'], unit: 'Mcal', color: '#dc2626', sample: 86, max: 200 },
  { id: 'water', label: '급수', keys: ['급수', '수도', '유량', 'water'], unit: 'm³', color: '#0369a1', sample: 42, max: 80 },
] as const

const MONTHS = ['5월', '6월', '7월', '8월', '9월', '10월']

function monthSeries(base: number): number[] {
  return [0.82, 0.91, 0.86, 0.97, 1.08, 1].map((rate) => Math.round(base * rate * 10) / 10)
}

function belongs(hay: string, kind: (typeof KINDS)[number]): boolean {
  if (kind.id !== 'dhw' && (hay.includes('급탕') || hay.includes('온수'))) return false
  if (kind.id === 'heat' && (hay.includes('급탕') || hay.includes('전기') || hay.includes('elec'))) return false
  if (kind.id === 'elec' && (hay.includes('급탕') || hay.includes('난방') || hay.includes('가스'))) return false
  if (kind.id === 'water' && (hay.includes('급탕') || hay.includes('난방'))) return false
  return kind.keys.some((key) => hay.includes(key))
}

function liveValue(row: ReturnType<typeof listPoints>[number]): number | null {
  const tel = getTelemetry(row, 'live')
  if (tel.current == null || tel.certainty === 'unknown' || tel.certainty === 'estimate') return null
  return tel.current
}

function GaugeCard({
  title,
  value,
  max,
  unit,
  color,
  sample,
  place,
}: {
  title: string
  value: number
  max: number
  unit: string
  color: string
  sample: boolean
  place: string
}) {
  return (
    <article className={`meter-gauge${sample ? ' is-sample' : ''}`}>
      <header>
        <strong>{title}{sample ? <span className="sample-tag">예시</span> : null}</strong>
        <em>정상</em>
      </header>
      <OwnerGauge value={value} max={max} color={color} />
      <p>{unit}</p>
      <span>{place}</span>
    </article>
  )
}

export function MeterBoard({ site }: { site?: SiteDef }) {
  const points = site ? listPoints({ siteId: site.id }) : []
  const [picked, setPicked] = useState<string[]>(KINDS.map((item) => item.id))
  const cards = KINDS.flatMap((kind) => {
    const rows = points.filter((row) => {
      const hay = `${row.system.name} ${row.equipment.name} ${row.point.name} ${row.point.tags.join(' ')}`.toLowerCase()
      return belongs(hay, kind)
    })
    const live = rows.flatMap((row) => {
      const value = liveValue(row)
      if (value == null) return []
      return [{
        id: `${row.equipment.id}-${row.point.id}`,
        title: row.equipment.name,
        value,
        sample: false,
        place: row.point.name,
      }]
    })
    if (live.length > 0) return live.map((item) => ({ ...item, kind }))
    return [{
      id: kind.id,
      title: kind.label,
      value: kind.sample,
      sample: true,
      place: site?.name ?? '현장',
      kind,
    }]
  })

  return (
    <div className="cmd desk">
      <header className="cmd-head">
        <div>
          <p>{site?.name ?? '현장'}</p>
          <h1>원격검침</h1>
        </div>
        <p>{site?.location || '이 건물'} · 가스, 전기, 급탕, 난방, 급수. 예시 게이지는 수신 값이 아닙니다.</p>
      </header>
      <div className="meter-gauges">
        {cards.map((item) => (
          <GaugeCard
            key={item.id}
            title={item.title}
            value={item.value}
            max={item.kind.max}
            unit={item.kind.unit}
            color={item.kind.color}
            sample={item.sample}
            place={item.place}
          />
        ))}
      </div>
      <section className="cmd-panel meter-trend">
        <h2>사용량 <span className="sample-tag">예시</span></h2>
        <div className="meter-checks" role="group" aria-label="그래프 항목">
          {KINDS.map((kind) => (
            <label key={kind.id}>
              <input
                type="checkbox"
                checked={picked.includes(kind.id)}
                onChange={() => setPicked((current) => (
                  current.includes(kind.id) ? current.filter((id) => id !== kind.id) : [...current, kind.id]
                ))}
              />
              {kind.label}
            </label>
          ))}
        </div>
        {picked.length === 0 ? <p className="manage-note">보고 싶은 항목을 고르십시오.</p> : (
          <div className="meter-charts">
            {KINDS.filter((kind) => picked.includes(kind.id)).map((kind) => {
              const series = monthSeries(kind.sample)
              const current = series[series.length - 1] ?? 0
              const previous = series[series.length - 2] ?? 0
              const delta = previous === 0 ? 0 : ((current - previous) / previous) * 100
              const sign = delta > 0 ? '+' : ''
              return (
                <article key={kind.id}>
                  <header>
                    <strong>{kind.label}</strong>
                    <em>전월 대비 {sign}{delta.toFixed(1)}%</em>
                  </header>
                  <p>이번 달 {current} {kind.unit} · 전월 {previous} {kind.unit}</p>
                  <OwnerLine labels={MONTHS} values={series} color={kind.color} />
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
