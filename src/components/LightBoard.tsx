import { useEffect, useMemo, useState } from 'react'
import type { SiteDef } from '../types/domain.ts'
import { formatDateTime } from '../lib/format.ts'
import {
  layerOf,
  peekSiteTags,
  refreshLatest,
  refreshSensors,
  type SensorLatest,
  type SiteSensor,
} from '../lib/siteTags.ts'

type LightKind = 'switch' | 'dim' | 'dali' | 'lux'
type LightState = 'on' | 'off' | 'level' | 'none'

const KIND_LABEL: Record<LightKind, string> = {
  switch: '점소등',
  dim: '0-10V',
  dali: 'DALI',
  lux: '조도',
}

type LightPoint = {
  id: string
  name: string
  floor: string
  unit: string
  kind: LightKind
  state: LightState
  text: string
  at: string | null
  sample: boolean
}

function blank(id: string, name: string, floor: string, kind: LightKind): LightPoint {
  return { id, name, floor, unit: '', kind, state: 'none', text: '수신 없음', at: null, sample: true }
}

const SAMPLE: LightPoint[] = [
  blank('s-b1-1', '주차장', '지하1', 'switch'),
  blank('s-b1-2', '복도', '지하1', 'switch'),
  blank('s-b1-3', '조도', '지하1', 'lux'),
  blank('s-1-1', '로비', '1층', 'switch'),
  blank('s-1-2', '복도 1', '1층', 'switch'),
  blank('s-1-3', '사무실', '1층', 'dim'),
  blank('s-1-4', '회의실', '1층', 'dali'),
  blank('s-1-5', '로비 조도', '1층', 'lux'),
  blank('s-2-1', '복도', '2층', 'switch'),
  blank('s-2-2', '디밍', '2층', 'dim'),
  blank('s-2-3', 'DALI 1', '2층', 'dali'),
]

function formatValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)
}

function floorOf(name: string): string {
  const basement = name.match(/지하\s*(\d+)/) ?? name.match(/B\s*(\d+)/i)
  if (basement) return `지하${basement[1]}`
  const dong = name.match(/(\d+)\s*동/)
  const floor = name.match(/(\d+)\s*층/) ?? name.match(/(\d+)\s*F\b/i)
  if (dong && floor) return `${dong[1]}동 ${floor[1]}층`
  if (floor) return `${floor[1]}층`
  if (dong) return `${dong[1]}동`
  return '층 미상'
}

function floorRank(label: string): number {
  if (label === '층 미상') return 10000
  const basement = label.match(/지하(\d+)/)
  if (basement) return -Number(basement[1])
  const floor = label.match(/(\d+)층/)
  if (floor) return Number(floor[1])
  return 9000
}

function kindOf(sensor: SiteSensor): LightKind {
  const hay = `${sensor.name} ${sensor.unit}`.toUpperCase()
  if (hay.includes('LUX') || hay.includes('조도')) return 'lux'
  if (hay.includes('DALI')) return 'dali'
  if (hay.includes('0-10') || hay.includes('0~10') || hay.includes('디밍')) return 'dim'
  return 'switch'
}

function isLevel(kind: LightKind): boolean {
  return kind === 'lux' || kind === 'dim'
}

function pointOf(sensor: SiteSensor, latest: Map<string, SensorLatest>): LightPoint {
  const kind = kindOf(sensor)
  const reading = latest.get(sensor.id)
  const value = reading?.value ?? null
  const floor = floorOf(sensor.name)
  if (value == null) {
    return { id: sensor.id, name: sensor.name, floor, unit: sensor.unit, kind, state: 'none', text: '수신 없음', at: null, sample: false }
  }
  if (isLevel(kind)) {
    return {
      id: sensor.id,
      name: sensor.name,
      floor,
      unit: sensor.unit,
      kind,
      state: 'level',
      text: `${formatValue(value)}${sensor.unit ? ` ${sensor.unit}` : ''}`,
      at: reading?.at ?? null,
      sample: false,
    }
  }
  if (value === 0) {
    return { id: sensor.id, name: sensor.name, floor, unit: sensor.unit, kind, state: 'off', text: '소등', at: reading?.at ?? null, sample: false }
  }
  if (value === 1) {
    return { id: sensor.id, name: sensor.name, floor, unit: sensor.unit, kind, state: 'on', text: '점등', at: reading?.at ?? null, sample: false }
  }
  return {
    id: sensor.id,
    name: sensor.name,
    floor,
    unit: sensor.unit,
    kind,
    state: 'level',
    text: `${formatValue(value)}${sensor.unit ? ` ${sensor.unit}` : ''}`,
    at: reading?.at ?? null,
    sample: false,
  }
}

export function LightBoard({ site }: { site?: SiteDef }) {
  const cached = site ? peekSiteTags(site.id) : undefined
  const [sensors, setSensors] = useState<SiteSensor[]>(() => cached?.sensors.filter((item) => layerOf(item) === 'light') ?? [])
  const [latest, setLatest] = useState<Map<string, SensorLatest>>(() => cached?.latest ?? new Map())
  const [loading, setLoading] = useState(sensors.length === 0 && Boolean(site))
  const [error, setError] = useState('')
  const [floor, setFloor] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)

  useEffect(() => {
    if (!site) return
    const siteId = site.id
    let cancelled = false
    const known = peekSiteTags(siteId)
    if (known) {
      setSensors(known.sensors.filter((item) => layerOf(item) === 'light'))
      setLatest(known.latest)
      setLoading(false)
    }
    async function loadList() {
      try {
        const list = await refreshSensors(siteId)
        if (cancelled) return
        setSensors(list.filter((item) => layerOf(item) === 'light'))
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
        /* 회로 이름은 남긴다. */
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

  const points = useMemo(() => {
    if (sensors.length === 0) return SAMPLE
    return sensors.map((item) => pointOf(item, latest))
  }, [latest, sensors])
  const sample = points.every((item) => item.sample)
  const floors = useMemo(() => {
    const names = [...new Set(points.map((item) => item.floor))]
    return names.sort((a, b) => floorRank(a) - floorRank(b) || a.localeCompare(b, 'ko'))
  }, [points])
  const currentFloor = floors.includes(floor ?? '') ? floor : floors[0]
  const circuits = points.filter((item) => item.floor === currentFloor)
  const selected = circuits.find((item) => item.id === picked) ?? null

  return (
    <div className="cmd desk">
      <header className="cmd-head">
        <div>
          <p>{site?.name ?? '현장'}</p>
          <h1>조명</h1>
        </div>
        <p>
          {site?.location || '이 건물'}
          {' · 층을 고르면 그 층 회로의 점등, 소등, 조도를 봅니다. 켜고 끄는 스위치는 없습니다.'}
          {sample ? ' 아래 배치는 예시이고, 받지 않은 값은 수신 없음입니다.' : ''}
        </p>
      </header>
      {loading ? <div className="empty">조명 태그를 받는 중입니다.</div> : null}
      {error ? <div className="empty">{error}</div> : null}
      <div className="light-board">
        <aside className="light-floors" aria-label="층">
          {floors.map((item) => (
            <button
              key={item}
              type="button"
              className={item === currentFloor ? 'is-on' : ''}
              onClick={() => {
                setFloor(item)
                setPicked(null)
              }}
            >
              {item}
              {sample ? <span className="sample-tag sheet-sample">예시</span> : null}
            </button>
          ))}
        </aside>
        <section className="light-plate" aria-label="회로">
          {(Object.keys(KIND_LABEL) as LightKind[]).map((kind) => {
            const group = circuits.filter((item) => item.kind === kind)
            if (group.length === 0) return null
            return (
              <div key={kind} className={`light-zone is-${kind}`}>
                <h2>{KIND_LABEL[kind]}{sample ? <span className="sample-tag sheet-sample">예시</span> : null}</h2>
                <div>
                  {group.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`light-circuit is-${item.state}${item.id === selected?.id ? ' is-picked' : ''}`}
                      onClick={() => setPicked(item.id)}
                    >
                      <strong>{item.name}</strong>
                      <em>{item.text}</em>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </section>
        <aside className="light-detail" aria-label="선택한 회로">
          {selected ? (
            <>
              <h2>{selected.name}</h2>
              <p>{selected.floor} · {KIND_LABEL[selected.kind]}</p>
              <b>{selected.text}</b>
              <span>{selected.state === 'none' ? '값 없음' : formatDateTime(selected.at)}</span>
            </>
          ) : (
            <p>회로를 고르면 이름과 수신 값이 열립니다.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
