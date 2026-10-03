import type { SensorLatest, SiteSensor } from '../lib/siteTags.ts'

type Kind = 'current' | 'voltage' | 'power' | 'temp' | 'status' | 'other'
type Phase = 'a' | 'b' | 'c'
type FigureKind = 'power' | 'air' | 'heat'

const PHASES: Phase[] = ['a', 'b', 'c']

function formatValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)
}

function formatAt(at: string | null): string {
  if (!at) return '시각 없음'
  const date = new Date(at)
  if (Number.isNaN(date.getTime())) return at
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

function point(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)]
}

function arcPath(cx: number, cy: number, r: number, ratio: number): string {
  const sweep = 240 * Math.min(1, Math.max(0, ratio))
  if (sweep < 0.8) return ''
  const start = 210
  const end = start - sweep
  const large = sweep > 180 ? 1 : 0
  const [x1, y1] = point(cx, cy, r, start)
  const [x2, y2] = point(cx, cy, r, end)
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

function niceMax(value: number): number {
  if (value <= 0) return 1
  const exp = 10 ** Math.floor(Math.log10(value))
  const fraction = value / exp
  const step = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return step * exp
}

function gaugeMax(unit: string, value: number): number {
  const u = unit.toLowerCase()
  if (u.includes('°') || u === 'c' || u.includes('℃')) return 50
  if (u === '%') return 100
  if (u === 'v') return value > 300 ? 500 : 250
  if (u === 'a') return niceMax(Math.max(value * 1.25, 50))
  if (u === 'kw') return niceMax(Math.max(value * 1.3, 10))
  return niceMax(Math.max(value * 1.2, 1))
}

function signalOf(sensor: SiteSensor): { kind: Kind; phase: Phase | null } {
  const name = sensor.name.toUpperCase()
  const unit = sensor.unit.toLowerCase()
  const tail = name.match(/(?:^|[._\s])(KWH|KVAR|KW|PF|A|V|U|I)([123])?$/)
  const token = tail?.[1] ?? ''
  const digit = tail?.[2]
  const phase: Phase | null = digit === '1' ? 'a' : digit === '2' ? 'b' : digit === '3' ? 'c' : null
  if (token === 'A' || token === 'I' || unit === 'a' || sensor.name.includes('전류')) return { kind: 'current', phase }
  if (token === 'V' || token === 'U' || unit === 'v' || sensor.name.includes('전압')) return { kind: 'voltage', phase }
  if (token === 'KW' || token === 'KWH' || token === 'PF' || token === 'KVAR' || unit === 'kw' || unit === 'kwh') return { kind: 'power', phase: null }
  if (sensor.name.includes('온도') || unit.includes('°') || unit === 'c' || unit.includes('℃')) return { kind: 'temp', phase: null }
  if (/기동|운전|가동/.test(sensor.name) && !sensor.unit) return { kind: 'status', phase: null }
  return { kind: 'other', phase: null }
}

function readingText(sensor: SiteSensor, latest: Map<string, SensorLatest>): { text: string; received: boolean; value: number | null } {
  const reading = latest.get(sensor.id)
  const value = reading?.value ?? null
  if (value == null) return { text: '수신 없음', received: false, value: null }
  if (!sensor.unit && (value === 0 || value === 1) && /기동|운전|가동/.test(sensor.name)) {
    return { text: value === 1 ? '기동' : '정지', received: true, value }
  }
  return {
    text: `${formatValue(value)}${sensor.unit ? ` ${sensor.unit}` : ''}`,
    received: true,
    value,
  }
}

function figureKind(sensors: SiteSensor[]): FigureKind {
  const hay = sensors.map((sensor) => `${sensor.name} ${sensor.unit}`).join(' ').toLowerCase()
  if (/acb|전압|전류|kwh|\bkw\b|계측/.test(hay)) return 'power'
  if (/냉동|냉각|냉수|펌프/.test(hay)) return 'heat'
  return 'air'
}

function shortName(name: string, equipment: string): string {
  const index = name.toUpperCase().lastIndexOf(equipment.toUpperCase())
  const rest = index >= 0
    ? name.slice(index + equipment.length).replace(/^[).\s._-]+/, '').trim()
    : ''
  const tail = (rest || name).toUpperCase()
  if (tail === 'KWH') return '전력량'
  if (tail === 'KW') return '전력'
  if (tail === 'PF') return '역률'
  if (tail === 'KVAR') return '무효전력'
  return rest || name
}

function Cabinet({ live }: { live: boolean }) {
  return (
    <svg className="plant-figure" viewBox="0 0 200 280" aria-hidden="true">
      <rect x="36" y="248" width="128" height="10" rx="3" fill="#d5e0e8" />
      <rect x="28" y="16" width="144" height="236" rx="10" fill="#f8fbfd" stroke="#c5d3df" strokeWidth="2" />
      <rect x="40" y="30" width="120" height="42" rx="6" fill="#173044" />
      <text x="100" y="56" textAnchor="middle" fill="#9fd4ee" fontSize="13" fontWeight="700">LIVE</text>
      <circle cx="148" cy="42" r="6" fill={live ? '#16a34a' : '#94a3b8'} />
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <rect key={row} x="46" y={88 + row * 16} width="108" height="7" rx="2" fill="#e4edf3" />
      ))}
      <rect x="46" y="190" width="108" height="46" rx="6" fill="#eef5f8" stroke="#d5e0e8" />
      <rect x="92" y="200" width="16" height="26" rx="4" fill="#c5d3df" />
    </svg>
  )
}

function AirUnit({ live }: { live: boolean }) {
  return (
    <svg className="plant-figure" viewBox="0 0 240 200" aria-hidden="true">
      <rect x="18" y="78" width="36" height="28" rx="4" fill="#d5e4ee" />
      <rect x="186" y="78" width="36" height="28" rx="4" fill="#d5e4ee" />
      <rect x="48" y="36" width="144" height="128" rx="16" fill="#f8fbfd" stroke="#c5d3df" strokeWidth="2" />
      <circle cx="120" cy="96" r="36" fill="#e7f0f6" stroke="#6d92aa" strokeWidth="3" />
      <path d="M120 90 C132 66 146 74 126 92" fill="none" stroke={live ? '#0f766e' : '#3d6d8a'} strokeWidth="3" strokeLinecap="round" />
      <path d="M125 100 C148 106 144 122 124 104" fill="none" stroke={live ? '#0f766e' : '#3d6d8a'} strokeWidth="3" strokeLinecap="round" />
      <path d="M115 100 C100 120 90 108 112 98" fill="none" stroke={live ? '#0f766e' : '#3d6d8a'} strokeWidth="3" strokeLinecap="round" />
      <circle cx="120" cy="96" r="5" fill={live ? '#0f766e' : '#3d6d8a'} />
    </svg>
  )
}

function HeatUnit({ live }: { live: boolean }) {
  return (
    <svg className="plant-figure" viewBox="0 0 240 200" aria-hidden="true">
      <rect x="28" y="48" width="120" height="112" rx="14" fill="#f8fbfd" stroke="#c5d3df" strokeWidth="2" />
      <rect x="44" y="66" width="88" height="28" rx="6" fill="#173044" />
      <circle cx="168" cy="78" r="7" fill={live ? '#16a34a' : '#94a3b8'} />
      <rect x="156" y="96" width="56" height="64" rx="28" fill="#e7f0f6" stroke="#6d92aa" strokeWidth="3" />
      <path d="M184 112 v32" stroke="#3d6d8a" strokeWidth="3" strokeLinecap="round" />
      <path d="M172 128 h24" stroke="#3d6d8a" strokeWidth="3" strokeLinecap="round" />
      <path d="M148 104 H128" stroke="#8eafc4" strokeWidth="8" strokeLinecap="round" />
      <path d="M148 148 H128" stroke="#8eafc4" strokeWidth="8" strokeLinecap="round" />
    </svg>
  )
}

function Gauge({
  value,
  max,
  color,
  unit,
  empty,
}: {
  value: number | null
  max: number
  color: string
  unit: string
  empty: boolean
}) {
  const ratio = value == null || max <= 0 ? 0 : value / max
  const progress = arcPath(120, 118, 78, ratio)
  return (
    <div className="plant-gauge">
      <svg viewBox="0 0 240 188" aria-hidden="true">
        <path d={arcPath(120, 118, 78, 1)} className="plant-gauge-track" />
        {progress ? <path d={progress} className="plant-gauge-value" stroke={color} /> : null}
      </svg>
      <div className={`plant-gauge-read${empty ? ' is-empty' : ''}`}>
        <b>{empty || value == null ? '수신 없음' : formatValue(value)}</b>
        {!empty && unit ? <span>{unit}</span> : null}
      </div>
    </div>
  )
}

export function PlantDetail({
  equipment,
  sensor,
  siblings,
  latest,
  onSelect,
}: {
  equipment: string
  sensor: SiteSensor
  siblings: SiteSensor[]
  latest: Map<string, SensorLatest>
  onSelect: (id: string) => void
}) {
  const reading = readingText(sensor, latest)
  const signal = signalOf(sensor)
  const status = signal.kind === 'status'
  const max = gaugeMax(sensor.unit, reading.value ?? 0)
  const color = signal.kind === 'temp' ? '#0f766e' : signal.kind === 'power' || signal.kind === 'current' || signal.kind === 'voltage' ? '#1d6fbf' : '#0f766e'
  const stamp = latest.get(sensor.id)?.at ?? null
  const kind = figureKind(siblings)
  const phased = new Map<string, SiteSensor>()
  const loose: SiteSensor[] = []
  for (const item of siblings) {
    const parsed = signalOf(item)
    if ((parsed.kind === 'current' || parsed.kind === 'voltage') && parsed.phase) {
      phased.set(`${parsed.kind}-${parsed.phase}`, item)
    } else {
      loose.push(item)
    }
  }
  const phaseRows = (['current', 'voltage'] as const).flatMap((row) => (
    PHASES.some((phase) => phased.has(`${row}-${phase}`)) ? [row] : []
  ))
  const tiles = loose.filter((item) => item.id !== sensor.id)

  return (
    <div className="plant-detail">
      <section className="plant-detail-plate">
        <div className="plant-figure-wrap">
          {kind === 'power' ? <Cabinet live={reading.received} /> : null}
          {kind === 'air' ? <AirUnit live={reading.received} /> : null}
          {kind === 'heat' ? <HeatUnit live={reading.received} /> : null}
        </div>
        <dl className="plant-nameplate">
          <div><dt>설비</dt><dd>{equipment}</dd></div>
          <div><dt>태그</dt><dd>{sensor.name}</dd></div>
          <div><dt>계통</dt><dd>{sensor.system || '계통 없음'} · {sensor.category || '구분 없음'}</dd></div>
          <div><dt>단위</dt><dd>{sensor.unit || '없음'}</dd></div>
          <div><dt>시각</dt><dd>{reading.received ? formatAt(stamp) : '수신 없음'}</dd></div>
        </dl>
      </section>
      <section className="plant-detail-gauge" aria-label={sensor.name}>
        {status ? (
          <div className={`plant-state${reading.received && reading.value === 1 ? ' is-run' : ''}`}>
            <b>{reading.text}</b>
            <span>{shortName(sensor.name, equipment)}</span>
          </div>
        ) : (
          <Gauge value={reading.value} max={max} color={color} unit={sensor.unit} empty={!reading.received} />
        )}
        <p>{sensor.name}</p>
        {!status && reading.received ? <small>눈금 0–{formatValue(max)}{sensor.unit ? ` ${sensor.unit}` : ''}</small> : null}
      </section>
      <div className={`plant-modules${phaseRows.length > 0 && tiles.length > 0 ? ' is-split' : ''}`}>
        {phaseRows.length > 0 ? (
          <section className="plant-module" aria-label="상별 계측">
            <h2>상별 계측</h2>
            <table className="plant-phase">
              <thead>
                <tr>
                  <th>항목</th>
                  <th>A</th>
                  <th>B</th>
                  <th>C</th>
                </tr>
              </thead>
              <tbody>
                {phaseRows.map((row) => (
                  <tr key={row}>
                    <th>{row === 'current' ? '전류' : '전압'}</th>
                    {PHASES.map((phase) => {
                      const item = phased.get(`${row}-${phase}`)
                      if (!item) return <td key={phase} className="is-empty">—</td>
                      const cell = readingText(item, latest)
                      return (
                        <td key={phase}>
                          <button
                            type="button"
                            className={`${item.id === sensor.id ? 'is-on' : ''}${cell.received ? '' : ' is-missing'}`}
                            onClick={() => onSelect(item.id)}
                          >
                            {cell.text}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
        {tiles.length > 0 ? (
          <section className="plant-module" aria-label="같은 설비">
            <h2>{phaseRows.length > 0 ? `다른 계측 ${tiles.length}` : `같은 설비 ${tiles.length}`}</h2>
            <div className="plant-metrics">
              {tiles.map((item) => {
                const cell = readingText(item, latest)
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`plant-metric${cell.received ? '' : ' is-missing'}`}
                    onClick={() => onSelect(item.id)}
                  >
                    <span>{shortName(item.name, equipment)}</span>
                    <b>{cell.text}</b>
                  </button>
                )
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
