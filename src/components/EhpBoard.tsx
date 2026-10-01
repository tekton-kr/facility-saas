import { useState } from 'react'
import type { EquipmentDef, SiteDef, SystemDef } from '../types/domain.ts'
import { alarmsForScope, getTelemetry } from '../lib/telemetry.ts'

type Status = 'run' | 'stop' | 'alarm' | 'none'

type Unit = {
  id: string
  floor: string
  name: string
  status: Status
  indoor: string
  setpoint: string
  mode: string
  sample: boolean
}

const STATUS_LABEL: Record<Status, string> = {
  run: '운전',
  stop: '정지',
  alarm: '알람',
  none: '수신 없음',
}

const FILTERS: { id: 'all' | Status; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'run', label: '운전' },
  { id: 'stop', label: '정지' },
  { id: 'alarm', label: '알람' },
  { id: 'none', label: '수신 없음' },
]

function formatValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)
}

function floorOf(name: string): string {
  const room = name.match(/(\d{3,})/)
  if (room) return `${room[1].slice(0, -2) || room[1][0]}층`
  const floor = name.match(/(\d+)\s*층/)
  if (floor) return `${floor[1]}층`
  return '실내기'
}

function pointValue(siteId: string, system: SystemDef, equipment: EquipmentDef, keys: string[]): string {
  const point = equipment.points.find((item) => {
    const hay = `${item.name} ${item.tags.join(' ')} ${item.unit}`.toLowerCase()
    return keys.some((key) => hay.includes(key))
  })
  if (!point) return '수신 없음'
  const tel = getTelemetry({ siteId, systemId: system.id, equipmentId: equipment.id, pointId: point.id }, 'live')
  if (tel.current == null || tel.certainty === 'unknown' || tel.certainty === 'estimate') return '수신 없음'
  return `${formatValue(tel.current)}${point.unit ? ` ${point.unit}` : ''}`
}

function statusOf(siteId: string, system: SystemDef, equipment: EquipmentDef): Status {
  const alarm = alarmsForScope({ siteId }).some((item) => item.equipmentId === equipment.id && item.severity !== 'info')
  if (alarm) return 'alarm'
  const run = pointValue(siteId, system, equipment, ['운전', '기동', 'run'])
  if (run === '수신 없음') return 'none'
  if (run === '0' || run.startsWith('0 ')) return 'stop'
  return 'run'
}

function unitsFromSite(site: SiteDef): Unit[] {
  const systems = site.systems.filter((system) => system.equipment.some((item) => {
    const hay = `${item.name} ${item.tags.join(' ')}`.toLowerCase()
    return ['ehp', '실내', '냉난방'].some((key) => hay.includes(key))
  }))
  return systems.flatMap((system) => system.equipment.flatMap((equipment) => {
    const hay = `${equipment.name} ${equipment.tags.join(' ')}`.toLowerCase()
    if (!['ehp', '실내', '냉난방'].some((key) => hay.includes(key))) return []
    return [{
      id: `${system.id}-${equipment.id}`,
      floor: floorOf(equipment.name),
      name: equipment.name,
      status: statusOf(site.id, system, equipment),
      indoor: pointValue(site.id, system, equipment, ['실내', '환기온도', '온도']),
      setpoint: pointValue(site.id, system, equipment, ['설정', 'set']),
      mode: pointValue(site.id, system, equipment, ['모드', '냉방', '난방']),
      sample: false,
    }]
  }))
}

function sampleUnits(): Unit[] {
  const floors = ['4층', '5층']
  return floors.flatMap((floor, floorIndex) => Array.from({ length: 8 }, (_, index) => {
    const no = floorIndex === 0 ? 401 + index : 501 + index
    const status: Status = index % 5 === 0 ? 'alarm' : index % 4 === 0 ? 'none' : index % 3 === 0 ? 'stop' : 'run'
    return {
      id: `sample-${no}`,
      floor,
      name: String(no),
      status,
      indoor: '수신 없음',
      setpoint: '수신 없음',
      mode: '수신 없음',
      sample: true,
    }
  }))
}

export function EhpBoard({ site }: { site?: SiteDef }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')
  const live = site ? unitsFromSite(site) : []
  const units = live.length > 0 ? live : sampleUnits()
  const sample = live.length === 0
  const shown = filter === 'all' ? units : units.filter((item) => item.status === filter)
  const floors = [...new Set(shown.map((item) => item.floor))]

  return (
    <div className="cmd desk">
      <header className="cmd-head">
        <div>
          <p>{site?.name ?? '현장'}</p>
          <h1>EHP</h1>
        </div>
        <p>
          {site?.location || '이 건물'} · 실내기 {units.length}
          {sample ? ' · 아래 카드는 배치 예시입니다. 온도는 수신 없음으로 둡니다.' : ' · 받은 온도만 숫자로 둡니다.'}
        </p>
      </header>
      <div className="ehp-filters" role="group" aria-label="실내기 상태">
        {FILTERS.map((item) => (
          <button key={item.id} type="button" className={filter === item.id ? 'is-on' : ''} onClick={() => setFilter(item.id)}>
            {item.label} {item.id === 'all' ? units.length : units.filter((unit) => unit.status === item.id).length}
          </button>
        ))}
      </div>
      {floors.length === 0 ? <div className="empty">이 상태에 실내기가 없습니다.</div> : floors.map((floor) => (
        <section key={floor} className="ehp-floor" aria-label={floor}>
          <h2>{floor}</h2>
          <div className="ehp-grid">
            {shown.filter((item) => item.floor === floor).map((item) => (
              <article key={item.id} className={`ehp-card is-${item.status}${item.sample ? ' is-sample' : ''}`}>
                <header>
                  <strong>{item.name}{item.sample ? <span className="sample-tag">예시</span> : null}</strong>
                  <em>{STATUS_LABEL[item.status]}</em>
                </header>
                <p><span>실내</span><b>{item.indoor}</b></p>
                <p><span>설정</span><b>{item.setpoint}</b></p>
                <p><span>모드</span><b>{item.mode}</b></p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
