import type { EquipmentDef, PointDef, SiteDef, SystemDef } from '../types/domain.ts'
import { getTelemetry } from '../lib/telemetry.ts'

type Direction = 'up' | 'down' | 'none'

type Car = {
  id: string
  name: string
  floor: string | null
  direction: Direction
  doorOpen: boolean
  fault: boolean
  sample: boolean
}

function formatFloor(value: number): string {
  if (value === 0) return 'B1'
  if (value < 0) return `B${Math.abs(value)}`
  return String(Math.round(value))
}

function liveValue(siteId: string, system: SystemDef, equipment: EquipmentDef, point: PointDef): number | null {
  const tel = getTelemetry({ siteId, systemId: system.id, equipmentId: equipment.id, pointId: point.id }, 'live')
  if (tel.current == null || tel.certainty === 'unknown' || tel.certainty === 'estimate') return null
  return tel.current
}

function isDoorName(name: string): boolean {
  const hay = name.toLowerCase()
  if (hay.includes('도어') || hay.includes('door')) return true
  return hay.includes('문') && !hay.includes('문제')
}

function readCar(siteId: string, system: SystemDef, equipment: EquipmentDef): Pick<Car, 'floor' | 'direction' | 'doorOpen' | 'fault'> {
  const floorPoint = equipment.points.find((item) => {
    const hay = `${item.name} ${item.tags.join(' ')}`.toLowerCase()
    return hay.includes('층') || hay.includes('floor')
  })
  const floorValue = floorPoint ? liveValue(siteId, system, equipment, floorPoint) : null
  const dirPoint = equipment.points.find((item) => {
    const hay = item.name.toLowerCase()
    return hay.includes('방향') || hay.includes('상승') || hay.includes('하강')
  })
  const dirValue = dirPoint ? liveValue(siteId, system, equipment, dirPoint) : null
  let direction: Direction = 'none'
  if (dirValue === 1) direction = 'up'
  if (dirValue === -1 || dirValue === 2) direction = 'down'
  const doorPoint = equipment.points.find((item) => isDoorName(item.name))
  const doorValue = doorPoint ? liveValue(siteId, system, equipment, doorPoint) : null
  const faultPoint = equipment.points.find((item) => item.name.includes('고장'))
  const faultValue = faultPoint ? liveValue(siteId, system, equipment, faultPoint) : null
  return {
    floor: floorValue == null ? null : formatFloor(floorValue),
    direction,
    doorOpen: doorValue === 1,
    fault: faultValue != null && faultValue !== 0,
  }
}

function carsOf(site: SiteDef): Car[] {
  return site.systems.flatMap((system) => system.equipment.flatMap((equipment) => {
    const hay = `${equipment.name} ${equipment.tags.join(' ')} ${system.name}`.toLowerCase()
    if (!['엘리베이터', '승강', 'el'].some((key) => hay.includes(key))) return []
    return [{ id: `${system.id}-${equipment.id}`, name: equipment.name, sample: false, ...readCar(site.id, system, equipment) }]
  }))
}

function samples(): Car[] {
  return ['EL 1', 'EL 2', 'EL 3', 'EL 4'].map((name) => ({
    id: name,
    name,
    floor: null,
    direction: 'none' as const,
    doorOpen: false,
    fault: false,
    sample: true,
  }))
}

function floorRank(floor: string): number {
  if (floor === 'RF') return 1000
  if (floor.startsWith('B')) return -Number(floor.slice(1) || 1)
  const level = Number(floor)
  return Number.isFinite(level) ? level : 0
}

function scaleOf(floor: string | null): string[] {
  const marks = new Set(['RF', '1', 'B2'])
  if (floor) marks.add(floor)
  return [...marks].sort((a, b) => floorRank(b) - floorRank(a))
}

function CarCard({ car }: { car: Car }) {
  const marks = scaleOf(car.floor)
  return (
    <article className={`lift-car${car.sample ? ' is-sample' : ''}${car.fault ? ' is-fault' : ''}`}>
      <header>
        <strong>{car.name}</strong>
        {car.sample ? <span className="sample-tag">예시</span> : null}
        {car.fault ? <em>고장</em> : null}
      </header>
      <div className="lift-body">
        <div className="lift-cabin">
          <b className={car.floor ? '' : 'is-empty'}>{car.floor ?? '수신 없음'}</b>
          <span>
            {car.direction === 'up' ? <i aria-label="상승">▲</i> : null}
            {car.direction === 'down' ? <i aria-label="하강">▼</i> : null}
            {car.doorOpen ? <i className="lift-door" aria-label="문 열림" /> : null}
          </span>
        </div>
        <ol className="lift-scale" aria-label={`${car.name} 위치`}>
          {marks.map((floor) => (
            <li key={floor} className={car.floor === floor ? 'is-car' : ''}>
              <span>{floor}</span>
            </li>
          ))}
        </ol>
      </div>
    </article>
  )
}

export function LiftBoard({ site }: { site?: SiteDef }) {
  const live = site ? carsOf(site) : []
  const cars = live.length > 0 ? live : samples()
  const sample = live.length === 0

  return (
    <div className="cmd desk lift-desk">
      <header className="cmd-head">
        <div>
          <p>{site?.name ?? '현장'}</p>
          <h1>엘리베이터</h1>
        </div>
        <p>
          {site?.location || '이 건물'} · 호기 {cars.length}
          {sample ? ' · 호기 배치는 예시입니다. 층과 방향은 수신 없음으로 둡니다.' : ' · 받은 층만 칸에 둡니다.'}
        </p>
      </header>
      <div className="lift-row">
        {cars.map((car) => <CarCard key={car.id} car={car} />)}
      </div>
    </div>
  )
}
