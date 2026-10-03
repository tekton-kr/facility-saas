import { useEffect, useId, useMemo, useState } from 'react'
import type { SiteDef } from '../types/domain.ts'
import { isMechanical, peekSiteTags, refreshLatest, refreshSensors, type SensorLatest, type SiteSensor } from '../lib/siteTags.ts'

type SlotKind = 'air' | 'heat'
type SlotMode = 'value' | 'run'

type SlotDef = {
  id: string
  label: string
  kind: SlotKind
  mode: SlotMode
  score: (name: string) => number
}

const AIR_SLOTS: SlotDef[] = [
  {
    id: 'oa',
    label: '외기온도',
    kind: 'air',
    mode: 'value',
    score: (name) => {
      if (name.includes('외기온도') || /\boat\b/.test(name)) return 100
      if (name.includes('외기') || /\boutdoor\b/.test(name)) return 80
      return 0
    },
  },
  {
    id: 'sa',
    label: '급기온도',
    kind: 'air',
    mode: 'value',
    score: (name) => {
      if (name.includes('급기온도')) return 100
      if (name.includes('급기') || /\bsupply\b/.test(name)) return 80
      return 0
    },
  },
  {
    id: 'ra',
    label: '환기온도',
    kind: 'air',
    mode: 'value',
    score: (name) => {
      if (name.includes('환기온도')) return 100
      if (name.includes('환기') || /\breturn\b/.test(name)) return 70
      return 0
    },
  },
  {
    id: 'room',
    label: '실내온도',
    kind: 'air',
    mode: 'value',
    score: (name) => {
      if (name.includes('실내온도') || name.includes('실온')) return 100
      if (name.includes('실내') || /\broom\b/.test(name)) return 80
      return 0
    },
  },
  {
    id: 'run',
    label: '공조기 기동',
    kind: 'air',
    mode: 'run',
    score: (name) => {
      if (/기동|운전상태|가동상태|\brun\b/.test(name)) return 100
      if (/운전|가동/.test(name) && /공조|ahu|팬/.test(name)) return 80
      return 0
    },
  },
]

const HEAT_SLOTS: SlotDef[] = [
  {
    id: 'chiller',
    label: '냉동기',
    kind: 'heat',
    mode: 'value',
    score: (name) => {
      if (name.includes('냉동기') || name.includes('chiller')) return 100
      if (name.includes('냉동')) return 70
      return 0
    },
  },
  {
    id: 'tower',
    label: '냉각탑',
    kind: 'heat',
    mode: 'value',
    score: (name) => {
      if (name.includes('냉각탑')) return 100
      if (name.includes('냉각수')) return 80
      if (name.includes('냉각')) return 60
      return 0
    },
  },
  {
    id: 'chw',
    label: '냉수',
    kind: 'heat',
    mode: 'value',
    score: (name) => {
      if (name.includes('냉수온도') || /\bchw\b/.test(name)) return 100
      if (name.includes('냉수') && !name.includes('펌프')) return 90
      if (name.includes('냉수')) return 70
      return 0
    },
  },
]

const SLOTS = [...AIR_SLOTS, ...HEAT_SLOTS]

function formatValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)
}

function haystack(sensor: SiteSensor): string {
  return `${sensor.name} ${sensor.system}`.toLowerCase()
}

function displayValue(sensor: SiteSensor, value: number, mode: SlotMode): string {
  const status = mode === 'run' || /기동|운전|가동/.test(sensor.name)
  if (status && !sensor.unit && (value === 0 || value === 1)) return value === 1 ? '기동' : '정지'
  return `${formatValue(value)}${sensor.unit ? ` ${sensor.unit}` : ''}`
}

function readingOf(sensor: SiteSensor | undefined, latest: Map<string, SensorLatest>, mode: SlotMode) {
  const value = sensor ? latest.get(sensor.id)?.value : undefined
  if (!sensor || value == null) return { text: '수신 없음', received: false }
  return { text: displayValue(sensor, value, mode), received: true }
}

function clip(name: string, max = 16): string {
  const chars = [...name]
  if (chars.length <= max) return name
  return `${chars.slice(0, max).join('')}…`
}

function placeSensors(sensors: SiteSensor[]) {
  const ranked = sensors.flatMap((sensor) => {
    const name = haystack(sensor)
    return SLOTS.flatMap((slot) => {
      let score = slot.score(name)
      if (score > 0 && slot.kind === 'air' && /공조|ahu/.test(name)) score += 5
      return score > 0 ? [{ sensor, slot, score }] : []
    })
  }).sort((a, b) => b.score - a.score)

  const taken = new Set<string>()
  const air = new Map<string, SiteSensor>()
  const heat = new Map<string, SiteSensor>()
  for (const hit of ranked) {
    if (taken.has(hit.sensor.id)) continue
    const bag = hit.slot.kind === 'air' ? air : heat
    if (bag.has(hit.slot.id)) continue
    bag.set(hit.slot.id, hit.sensor)
    taken.add(hit.sensor.id)
  }
  return {
    air,
    heat,
    rest: sensors.filter((sensor) => !taken.has(sensor.id)),
  }
}

function equipmentKey(name: string): string {
  const paren = name.match(/\(([^)]+)\)/)
  if (paren?.[1].trim()) return paren[1].trim()
  const acb = name.match(/ACB[_-]?\d+/i)
  if (acb) return acb[0].toUpperCase().replace(/-/g, '_')
  const code = name.match(/\b(?:AHU|FCU|PAC|EHP)[_-]?\d+\b/i)
  if (code) return code[0].toUpperCase()
  return name.trim() || '기타'
}

function groupRest(sensors: SiteSensor[]) {
  const map = new Map<string, SiteSensor[]>()
  for (const sensor of sensors) {
    const key = equipmentKey(sensor.name)
    const list = map.get(key)
    if (list) list.push(sensor)
    else map.set(key, [sensor])
  }
  return [...map.entries()]
    .map(([key, items]) => ({
      key,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true })),
    }))
    .sort((a, b) => a.key.localeCompare(b.key, 'ko', { numeric: true }))
}

function systemLabel(sensor: SiteSensor): string {
  return `${sensor.system || '계통 없음'} · ${sensor.category || '구분 없음'}`
}

function TagCard({ sensor, latest }: { sensor: SiteSensor; latest: Map<string, SensorLatest> }) {
  const value = latest.get(sensor.id)?.value
  const received = value != null
  return (
    <article className={`plant-node${received ? ' is-run' : ''}`}>
      <header>
        <strong>{sensor.name}</strong>
        <em>{received ? '수신' : '수신 없음'}</em>
      </header>
      <b>{received ? `${formatValue(value)}${sensor.unit ? ` ${sensor.unit}` : ''}` : '수신 없음'}</b>
      <span>{systemLabel(sensor)}</span>
    </article>
  )
}

function Duct({ x1, y1, x2, y2, markerId }: { x1: number; y1: number; x2: number; y2: number; markerId: string }) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const trim = 16
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="plant-duct" markerEnd={`url(#${markerId})`} />
      <line x1={x1} y1={y1} x2={x2 - (dx / len) * trim} y2={y2 - (dy / len) * trim} className="plant-duct-core" />
    </g>
  )
}

function Callout({
  x,
  y,
  w,
  h,
  label,
  sensor,
  latest,
  mode,
}: {
  x: number
  y: number
  w: number
  h: number
  label: string
  sensor?: SiteSensor
  latest: Map<string, SensorLatest>
  mode: SlotMode
}) {
  const reading = readingOf(sensor, latest, mode)
  const cx = x + w / 2
  const valueSize = reading.text.length > 12 ? 16 : 22
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="16" className={reading.received ? 'plant-box is-live' : 'plant-box'} />
      <text x={cx} y={y + 34} textAnchor="middle" className="plant-label" fontSize="13">{label}</text>
      <text x={cx} y={y + Math.round(h * 0.58)} textAnchor="middle" className={reading.received ? 'plant-value' : 'plant-value is-empty'} fontSize={valueSize}>
        {reading.text}
      </text>
      <text x={cx} y={y + h - 22} textAnchor="middle" className="plant-name" fontSize="11">
        {sensor ? clip(sensor.name) : '—'}
      </text>
      {sensor ? <title>{sensor.name}</title> : null}
    </g>
  )
}

function AirLoop({ air, latest }: { air: Map<string, SiteSensor>; latest: Map<string, SensorLatest> }) {
  const run = air.get('run')
  const runReading = readingOf(run, latest, 'run')
  const uid = useId().replace(/:/g, '')
  const markerId = `plant-flow-${uid}`
  const shadowId = `plant-shadow-${uid}`
  return (
    <section className="plant-air" aria-label="공조 루프">
      <div className="plant-schematic">
      <svg viewBox="0 0 1040 460">
        <defs>
          <marker id={markerId} markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" refX="14" refY="8" orient="auto">
            <path d="M0 1.5 L14 8 L0 14.5 Z" className="plant-arrow" />
          </marker>
          <filter id={shadowId} x="-8%" y="-8%" width="116%" height="124%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.6" floodColor="#173044" floodOpacity="0.08" />
          </filter>
        </defs>
        <Duct x1={218} y1={132} x2={358} y2={132} markerId={markerId} />
        <Duct x1={662} y1={132} x2={810} y2={132} markerId={markerId} />
        <Duct x1={912} y1={218} x2={912} y2={304} markerId={markerId} />
        <Duct x1={510} y1={304} x2={510} y2={242} markerId={markerId} />
        <g filter={`url(#${shadowId})`}>
          <Callout x={28} y={48} w={188} h={168} label="외기온도" sensor={air.get('oa')} latest={latest} mode="value" />
          <Callout x={812} y={48} w={200} h={168} label="급기온도" sensor={air.get('sa')} latest={latest} mode="value" />
          <Callout x={812} y={308} w={200} h={136} label="실내온도" sensor={air.get('room')} latest={latest} mode="value" />
          <Callout x={410} y={308} w={200} h={136} label="환기온도" sensor={air.get('ra')} latest={latest} mode="value" />
          <g>
            <rect x={360} y={20} width={300} height={220} rx="18" className={runReading.received ? 'plant-box is-live' : 'plant-box'} />
            <text x={510} y={52} textAnchor="middle" className="plant-label" fontSize="13">공조기</text>
            <g className="plant-fan" transform="translate(510 108)">
              <circle r="32" className="plant-fan-ring" />
              <path d="M0 -6 C 12 -30 26 -22 6 -4" className="plant-fan-blade" />
              <path d="M5 4 C 28 10 24 26 4 8" className="plant-fan-blade" />
              <path d="M-5 4 C -20 24 -30 12 -8 2" className="plant-fan-blade" />
              <circle r="4.5" className="plant-fan-hub" />
            </g>
            <text x={510} y={164} textAnchor="middle" className="plant-label" fontSize="12">기동</text>
            <text x={510} y={194} textAnchor="middle" className={runReading.received ? 'plant-value' : 'plant-value is-empty'} fontSize={runReading.text.length > 12 ? 16 : 22}>
              {runReading.text}
            </text>
            <text x={510} y={220} textAnchor="middle" className="plant-name" fontSize="11">{run ? clip(run.name) : '—'}</text>
            {run ? <title>{run.name}</title> : null}
          </g>
        </g>
      </svg>
      </div>
      <p className="plant-caption">고정된 공조 루프입니다. 현장 배관도가 아닙니다. 외기·급기·환기·실내·기동 이름이 있는 태그만 숫자가 붙습니다.</p>
    </section>
  )
}

export function PlantBoard({ site }: { site?: SiteDef }) {
  const cached = site ? peekSiteTags(site.id) : undefined
  const [sensors, setSensors] = useState<SiteSensor[]>(() => cached?.sensors.filter(isMechanical) ?? [])
  const [latest, setLatest] = useState<Map<string, SensorLatest>>(() => cached?.latest ?? new Map())
  const [loading, setLoading] = useState(sensors.length === 0 && Boolean(site))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!site) return
    const siteId = site.id
    let cancelled = false
    const known = peekSiteTags(siteId)
    if (known) {
      setSensors(known.sensors.filter(isMechanical))
      setLatest(known.latest)
      setLoading(false)
    }
    async function loadList() {
      try {
        const list = await refreshSensors(siteId)
        if (cancelled) return
        setSensors(list.filter(isMechanical))
        setError('')
      } catch (err) {
        if (!cancelled && (peekSiteTags(siteId)?.sensors.length ?? 0) === 0) {
          setError(err instanceof Error ? err.message : '태그 목록을 받지 못했습니다.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    async function loadValues() {
      try {
        const values = await refreshLatest(siteId)
        if (!cancelled) setLatest(values)
      } catch {
        /* 목록은 유지하고, 값은 수신 없음으로 남긴다. */
      }
    }
    void loadList()
    void loadValues()
    const timer = window.setInterval(() => void loadValues(), 30_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [site?.id])

  const placed = useMemo(() => placeSensors(sensors), [sensors])
  const groups = useMemo(() => groupRest(placed.rest), [placed.rest])
  const heat = HEAT_SLOTS.flatMap((slot) => {
    const sensor = placed.heat.get(slot.id)
    return sensor ? [{ slot, sensor }] : []
  })
  const hvac = sensors.filter((item) => item.system.toUpperCase().includes('HVAC')).length
  const bas = sensors.filter((item) => item.category === 'BAS').length

  return (
    <div className="cmd desk">
      <header className="cmd-head">
        <div>
          <p>{site?.name ?? '현장'}</p>
          <h1>기계설비</h1>
        </div>
        <p>
          {site?.location || '이 건물'}
          {' · HVAC이거나 BAS인 태그의 최근 값입니다.'}
          {sensors.length > 0 ? ` · HVAC ${hvac} · BAS ${bas}` : ''}
        </p>
      </header>
      {loading ? <div className="empty">태그 목록을 받는 중입니다.</div> : null}
      {error ? <div className="empty">{error}</div> : null}
      {!loading && !error && sensors.length === 0 ? (
        <div className="empty">이 현장에 HVAC 계통이나 BAS 태그가 없습니다.</div>
      ) : null}
      {sensors.length > 0 ? (
        <div className="plant-sheet">
          <AirLoop air={placed.air} latest={latest} />
          {heat.length > 0 ? (
            <section className="plant-heat" aria-label="열원">
              {heat.map(({ slot, sensor }) => {
                const reading = readingOf(sensor, latest, slot.mode)
                return (
                  <article key={slot.id} className={`plant-heat-card${reading.received ? ' is-run' : ''}`}>
                    <header>
                      <strong>{slot.label}</strong>
                      <em>{reading.received ? '수신' : '수신 없음'}</em>
                    </header>
                    <b>{reading.text}</b>
                    <span>{sensor.name}</span>
                  </article>
                )
              })}
            </section>
          ) : null}
        </div>
      ) : null}
      {groups.length > 0 ? (
        <section className="plant-folds" aria-label="그림에 없는 태그">
          <h2>그림에 없는 태그 {placed.rest.length}</h2>
          {groups.map((group) => {
            const got = group.items.filter((item) => latest.get(item.id)?.value != null).length
            return (
              <details key={group.key} className="plant-fold">
                <summary>
                  <strong>{group.key}</strong>
                  <em>
                    {group.items.length}점
                    {got > 0 ? ` · 수신 ${got}` : ''}
                  </em>
                </summary>
                <div className="plant-cards">
                  {group.items.map((sensor) => (
                    <TagCard key={sensor.id} sensor={sensor} latest={latest} />
                  ))}
                </div>
              </details>
            )
          })}
        </section>
      ) : null}
    </div>
  )
}
