import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { SiteDef } from '../types/domain.ts'
import { isMechanical, peekSiteTags, refreshLatest, refreshSensors, type SensorLatest, type SiteSensor } from '../lib/siteTags.ts'
import { PlantDetail } from './PlantDetail.tsx'

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

function TagCard({
  sensor,
  latest,
  onOpen,
}: {
  sensor: SiteSensor
  latest: Map<string, SensorLatest>
  onOpen: (id: string) => void
}) {
  const value = latest.get(sensor.id)?.value
  const received = value != null
  return (
    <button type="button" className={`plant-node${received ? '' : ' is-missing'}`} onClick={() => onOpen(sensor.id)}>
      <header>
        <strong>{sensor.name}</strong>
        <em>{received ? '수신' : '수신 없음'}</em>
      </header>
      <b>{received ? `${formatValue(value)}${sensor.unit ? ` ${sensor.unit}` : ''}` : '수신 없음'}</b>
      <span>{systemLabel(sensor)}</span>
    </button>
  )
}

function Hit({
  sensor,
  onOpen,
  children,
}: {
  sensor?: SiteSensor
  onOpen: (id: string) => void
  children: ReactNode
}) {
  if (!sensor) return <g>{children}</g>
  const picked = sensor
  function onKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onOpen(picked.id)
  }
  return (
    <g className="plant-hit" role="button" tabIndex={0} aria-label={picked.name} onClick={() => onOpen(picked.id)} onKeyDown={onKeyDown}>
      {children}
    </g>
  )
}

function DuctValue({
  x,
  y,
  label,
  sensor,
  latest,
  mode,
  onOpen,
}: {
  x: number
  y: number
  label: string
  sensor?: SiteSensor
  latest: Map<string, SensorLatest>
  mode: SlotMode
  onOpen: (id: string) => void
}) {
  const reading = readingOf(sensor, latest, mode)
  const body = (
    <g>
      <rect x={x - 46} y={y - 14} width={104} height={40} fill="transparent" />
      <text x={x} y={y} textAnchor="middle" className="plant-duct-label" fontSize="12">{label}</text>
      <text x={x} y={y + 16} textAnchor="middle" className={reading.received ? 'plant-value' : 'plant-value is-empty'} fontSize="13">
        {reading.text}
      </text>
      {reading.received ? <circle cx={x + 42} cy={y + 11} r="3.5" className="plant-live-dot" /> : null}
      {sensor ? <title>{sensor.name}</title> : null}
    </g>
  )
  if (!sensor) return body
  return <Hit sensor={sensor} onOpen={onOpen}>{body}</Hit>
}

function AirLoop({
  air,
  latest,
  onOpen,
}: {
  air: Map<string, SiteSensor>
  latest: Map<string, SensorLatest>
  onOpen: (id: string) => void
}) {
  const run = air.get('run')
  const runReading = readingOf(run, latest, 'run')
  return (
    <section className="plant-air" aria-label="공조 루프">
      <div className="plant-schematic">
        <svg viewBox="0 0 1000 360">
          <rect x="28" y="118" width="268" height="36" className="plant-duct-metal" />
          <rect x="28" y="198" width="268" height="36" className="plant-duct-metal" />
          <rect x="624" y="118" width="292" height="36" className="plant-duct-metal" />
          <rect x="880" y="154" width="36" height="118" className="plant-duct-metal" />
          <polygon points="246,130 258,136 246,142" className="plant-chevron" />
          <polygon points="246,210 258,216 246,222" className="plant-chevron" />
          <polygon points="860,130 872,136 860,142" className="plant-chevron" />
          <polygon points="892,246 898,258 904,246" className="plant-chevron" />
          <rect x="292" y="96" width="348" height="188" className="plant-case" />
          <line x1="430" y1="96" x2="430" y2="284" className="plant-seam" />
          <rect x="318" y="118" width="86" height="146" className="plant-coil" />
          {Array.from({ length: 10 }, (_, index) => (
            <line key={index} x1={328 + index * 7} y1="126" x2={328 + index * 7} y2="256" className="plant-fin" />
          ))}
          <path d="M470 196 a 46 46 0 1 1 62 -46 h 92 v 34 h -108 a 46 46 0 0 1 -46 12 z" className="plant-scroll" />
          <circle cx="516" cy="186" r="7" className="plant-hub" />
          <rect x="310" y="284" width="312" height="7" className="plant-skid" />
          <rect x="324" y="291" width="22" height="8" className="plant-skid" />
          <rect x="586" y="291" width="22" height="8" className="plant-skid" />
          <Hit sensor={run} onOpen={onOpen}>
            <rect x="470" y="232" width="120" height="40" fill="transparent" />
            <text x="530" y="250" textAnchor="middle" className="plant-duct-label" fontSize="12">기동</text>
            <text x="530" y="266" textAnchor="middle" className={runReading.received ? 'plant-value' : 'plant-value is-empty'} fontSize="13">
              {runReading.text}
            </text>
            {runReading.received ? <circle cx="578" cy="262" r="3.5" className="plant-live-dot" /> : null}
            {run ? <title>{run.name}</title> : null}
          </Hit>
          <text x="466" y="86" textAnchor="middle" className="plant-duct-label" fontSize="13">공조기</text>
          <DuctValue x="150" y="86" label="외기" sensor={air.get('oa')} latest={latest} mode="value" onOpen={onOpen} />
          <DuctValue x="150" y="268" label="환기" sensor={air.get('ra')} latest={latest} mode="value" onOpen={onOpen} />
          <DuctValue x="760" y="86" label="급기" sensor={air.get('sa')} latest={latest} mode="value" onOpen={onOpen} />
          <DuctValue x="898" y="300" label="실내" sensor={air.get('room')} latest={latest} mode="value" onOpen={onOpen} />
        </svg>
      </div>
      <p className="plant-caption">고정된 공조 루프입니다. 현장 배관도가 아닙니다. 외기·급기·환기·실내·기동 이름이 있는 태그만 숫자가 붙습니다.</p>
    </section>
  )
}

export function PlantBoard({ site }: { site?: SiteDef }) {
  const [params, setParams] = useSearchParams()
  const tagId = params.get('tag') ?? ''
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

  const [mode, setMode] = useState<'graphic' | 'grid'>('graphic')
  const placed = useMemo(() => placeSensors(sensors), [sensors])
  const gridGroups = useMemo(() => groupRest(sensors), [sensors])
  const heat = HEAT_SLOTS.flatMap((slot) => {
    const sensor = placed.heat.get(slot.id)
    return sensor ? [{ slot, sensor }] : []
  })
  const receivedCount = sensors.filter((item) => latest.get(item.id)?.value != null).length
  const airCount = placed.air.size
  const heatCount = sensors.filter((item) => /냉동|냉각|냉수|chiller|\bchw\b/.test(`${item.name} ${item.system}`.toLowerCase())).length
  const stats = [
    { label: '태그', value: sensors.length, empty: false },
    { label: '수신', value: receivedCount, empty: receivedCount === 0 },
    { label: '공조', value: airCount, empty: false },
    { label: '열원', value: heatCount, empty: false },
  ]
  const selected = tagId ? sensors.find((item) => item.id === tagId) : undefined
  const selectedKey = selected ? equipmentKey(selected.name) : ''
  const siblings = selected ? sensors.filter((item) => equipmentKey(item.name) === selectedKey) : []

  function openTag(id: string) {
    const next = new URLSearchParams(params)
    const opened = Boolean(params.get('tag'))
    next.set('tag', id)
    setParams(next, { replace: opened })
  }

  function closeTag() {
    const next = new URLSearchParams(params)
    next.delete('tag')
    setParams(next, { replace: true })
  }

  if (tagId) {
    return (
      <div className="cmd desk">
        <header className="cmd-head">
          <div>
            <button type="button" className="plant-back" onClick={closeTag}>← 기계설비</button>
            <h1>{selected ? selectedKey : '태그'}</h1>
          </div>
          <p>
            {site?.name ?? '현장'}
            {selected ? ` · ${selected.name}` : ''}
          </p>
        </header>
        {loading && !selected ? <div className="empty">태그를 찾는 중입니다.</div> : null}
        {!loading && !selected ? <div className="empty">이 태그를 찾지 못했습니다.</div> : null}
        {selected ? (
          <div className="plant-sheet">
            <PlantDetail
              equipment={selectedKey}
              sensor={selected}
              siblings={siblings}
              latest={latest}
              onSelect={openTag}
            />
          </div>
        ) : null}
      </div>
    )
  }

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
        </p>
      </header>
      {sensors.length > 0 ? (
        <section className="plant-stats" aria-label="기계설비 수량">
          {stats.map((item) => (
            <article key={item.label} className={`plant-stat${item.empty ? ' is-empty' : ''}`}>
              <span>{item.label}</span>
              <b>{item.value}</b>
            </article>
          ))}
        </section>
      ) : null}
      {loading ? <div className="empty">태그 목록을 받는 중입니다.</div> : null}
      {error ? <div className="empty">{error}</div> : null}
      {!loading && !error && sensors.length === 0 ? (
        <div className="empty">이 현장에 HVAC 계통이나 BAS 태그가 없습니다.</div>
      ) : null}
      {sensors.length > 0 ? (
        <div className="plant-views" role="tablist" aria-label="기계설비 보기">
          <button type="button" role="tab" aria-selected={mode === 'graphic'} className={mode === 'graphic' ? 'is-on' : ''} onClick={() => setMode('graphic')}>그래픽</button>
          <button type="button" role="tab" aria-selected={mode === 'grid'} className={mode === 'grid' ? 'is-on' : ''} onClick={() => setMode('grid')}>그리드</button>
        </div>
      ) : null}
      {sensors.length > 0 && mode === 'graphic' ? (
        <div className="plant-sheet">
          <AirLoop air={placed.air} latest={latest} onOpen={openTag} />
          {heat.length > 0 ? (
            <section className="plant-heat" aria-label="열원">
              {heat.map(({ slot, sensor }) => {
                const reading = readingOf(sensor, latest, slot.mode)
                return (
                  <button key={slot.id} type="button" className={`plant-heat-card${reading.received ? '' : ' is-missing'}`} onClick={() => openTag(sensor.id)}>
                    <header>
                      <strong>{slot.label}</strong>
                      <em>{reading.received ? '수신' : '수신 없음'}</em>
                    </header>
                    <b>{reading.text}</b>
                    <span>{sensor.name}</span>
                  </button>
                )
              })}
            </section>
          ) : null}
        </div>
      ) : null}
      {sensors.length > 0 && mode === 'grid' && gridGroups.length > 0 ? (
        <section className="plant-folds" aria-label="태그 목록">
          <h2>태그 {sensors.length}</h2>
          {gridGroups.map((group) => {
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
                    <TagCard key={sensor.id} sensor={sensor} latest={latest} onOpen={openTag} />
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
