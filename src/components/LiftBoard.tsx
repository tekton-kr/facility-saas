import type { EquipmentDef, SiteDef, SystemDef } from '../types/domain.ts'
import { getTelemetry } from '../lib/telemetry.ts'

const FLOORS = ['RF', '13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'B1', 'B2']

type Car = {
  id: string
  name: string
  floor: string | null
  direction: 'up' | 'down' | 'none'
  fault: boolean
  sample: boolean
}

function formatFloor(value: number): string {
  if (value === 0) return 'B1'
  if (value < 0) return `B${Math.abs(value)}`
  return String(Math.round(value))
}

function readFloor(siteId: string, system: SystemDef, equipment: EquipmentDef): { floor: string | null; direction: Car['direction']; fault: boolean } {
  const point = equipment.points.find((item) => {
    const hay = `${item.name} ${item.tags.join(' ')}`.toLowerCase()
    return ['층', 'floor'].some((key) => hay.includes(key))
  })
  const faultPoint = equipment.points.find((item) => `${item.name}`.includes('고장'))
  let fault = false
  if (faultPoint) {
    const tel = getTelemetry({ siteId, systemId: system.id, equipmentId: equipment.id, pointId: faultPoint.id }, 'live')
    fault = tel.current != null && tel.current !== 0 && tel.certainty !== 'unknown' && tel.certainty !== 'estimate'
  }
  if (!point) return { floor: null, direction: 'none', fault }
  const tel = getTelemetry({ siteId, systemId: system.id, equipmentId: equipment.id, pointId: point.id }, 'live')
  if (tel.current == null || tel.certainty === 'unknown' || tel.certainty === 'estimate') {
    return { floor: null, direction: 'none', fault }
  }
  const dirPoint = equipment.points.find((item) => {
    const hay = `${item.name}`.toLowerCase()
    return hay.includes('방향') || hay.includes('상승') || hay.includes('하강')
  })
  let direction: Car['direction'] = 'none'
  if (dirPoint) {
    const dir = getTelemetry({ siteId, systemId: system.id, equipmentId: equipment.id, pointId: dirPoint.id }, 'live')
    if (dir.current === 1) direction = 'up'
    if (dir.current === -1 || dir.current === 2) direction = 'down'
  }
  return { floor: formatFloor(tel.current), direction, fault }
}

function carsOf(site: SiteDef): Car[] {
  return site.systems.flatMap((system) => system.equipment.flatMap((equipment) => {
    const hay = `${equipment.name} ${equipment.tags.join(' ')} ${system.name}`.toLowerCase()
    if (!['엘리베이터', '승강', 'el'].some((key) => hay.includes(key))) return []
    const live = readFloor(site.id, system, equipment)
    return [{ id: `${system.id}-${equipment.id}`, name: equipment.name, sample: false, ...live }]
  }))
}

function samples(): Car[] {
  return ['EL 1', 'EL 2', 'EL 3', 'EL 4'].map((name) => ({
    id: name,
    name,
    floor: null,
    direction: 'none' as const,
    fault: false,
    sample: true,
  }))
}

function Shaft({ car }: { car: Car }) {
  return (
    <article className={`lift-shaft${car.sample ? ' is-sample' : ''}`}>
      <header>
        <strong>{car.name}{car.sample ? <span className="sample-tag">예시</span> : null}</strong>
        <em className={car.fault ? 'is-fault' : ''}>{car.fault ? '고장' : car.floor ? '정상' : '수신 없음'}</em>
      </header>
      <div className="lift-doors" aria-hidden="true"><i /><i /></div>
      <ol>
        {FLOORS.map((floor) => (
          <li key={floor} className={car.floor === floor ? 'is-car' : ''}>
            <span>{floor}</span>
            {car.floor === floor ? (
              <b>
                {car.direction === 'up' ? '▲' : car.direction === 'down' ? '▼' : ''}
                {floor}
              </b>
            ) : <b />}
          </li>
        ))}
      </ol>
      {car.floor ? null : <p>위치 수신 없음</p>}
    </article>
  )
}

export function LiftBoard({ site }: { site?: SiteDef }) {
  const live = site ? carsOf(site) : []
  const cars = live.length > 0 ? live : samples()
  const sample = live.length === 0

  return (
    <div className="cmd desk">
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
        {cars.map((car) => <Shaft key={car.id} car={car} />)}
      </div>
    </div>
  )
}
