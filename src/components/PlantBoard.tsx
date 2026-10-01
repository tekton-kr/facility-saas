import type { EquipmentDef, SiteDef, SystemDef } from '../types/domain.ts'
import { alarmsForScope, getTelemetry } from '../lib/telemetry.ts'

const ROLES = [
  { id: 'ahu', label: '공조기', keys: ['공조', 'ahu', '급기'] },
  { id: 'chiller', label: '냉동기', keys: ['냉동', '칠러', 'chiller'] },
  { id: 'tower', label: '냉각탑', keys: ['냉각탑', 'tower'] },
  { id: 'pump', label: '펌프', keys: ['펌프', 'pump'] },
] as const

type Status = 'run' | 'stop' | 'alarm' | 'none'

type Unit = {
  id: string
  label: string
  status: Status
  temp: string
  extra: string
  sample: boolean
}

const SAMPLE_FLOW: Unit[] = [
  { id: 'ahu', label: '공조기', status: 'run', temp: '18.4 °C', extra: '설정 18.0 °C', sample: true },
  { id: 'chiller', label: '냉동기', status: 'run', temp: '7.2 °C', extra: '냉수 출구', sample: true },
  { id: 'tower', label: '냉각탑', status: 'run', temp: '29.6 °C', extra: '냉각수 출구', sample: true },
  { id: 'pump', label: '펌프', status: 'stop', temp: '정지', extra: '냉수 펌프', sample: true },
]

const SAMPLE_CARDS: Unit[] = [
  { id: 'ahu-1', label: '공조기 AHU-1', status: 'run', temp: '18.4 °C', extra: '설정 18.0 · 환기 24.1', sample: true },
  { id: 'ahu-2', label: '공조기 AHU-2', status: 'run', temp: '19.1 °C', extra: '설정 18.5 · 환기 24.6', sample: true },
  { id: 'ch-1', label: '냉동기 CH-1', status: 'run', temp: '7.2 °C', extra: '부하 68%', sample: true },
  { id: 'ct-1', label: '냉각탑 CT-1', status: 'run', temp: '29.6 °C', extra: '팬 운전', sample: true },
  { id: 'p-1', label: '냉수펌프 P-1', status: 'run', temp: '운전', extra: '주파수 42 Hz', sample: true },
  { id: 'p-2', label: '냉각수펌프 P-2', status: 'stop', temp: '정지', extra: '대기', sample: true },
  { id: 'b-1', label: '보일러 B-1', status: 'alarm', temp: '82 °C', extra: '고온 경보', sample: true },
  { id: 'hex-1', label: '열교환기 HEX-1', status: 'run', temp: '45.2 °C', extra: '2차측', sample: true },
]

function formatValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)
}

function pointText(siteId: string, system: SystemDef, equipment: EquipmentDef, keys: string[]): string | null {
  const point = equipment.points.find((item) => {
    const hay = `${item.name} ${item.tags.join(' ')} ${item.unit}`.toLowerCase()
    return keys.some((key) => hay.includes(key))
  })
  if (!point) return null
  const tel = getTelemetry({ siteId, systemId: system.id, equipmentId: equipment.id, pointId: point.id }, 'live')
  if (tel.current == null || tel.certainty === 'unknown' || tel.certainty === 'estimate') return null
  return `${formatValue(tel.current)}${point.unit ? ` ${point.unit}` : ''}`
}

const STATUS_LABEL: Record<Status, string> = {
  run: '운전',
  stop: '정지',
  alarm: '알람',
  none: '수신 없음',
}

function statusOf(siteId: string, system: SystemDef, equipment: EquipmentDef): Status {
  const alarm = alarmsForScope({ siteId }).some((item) => item.equipmentId === equipment.id && item.severity !== 'info')
  if (alarm) return 'alarm'
  const run = pointText(siteId, system, equipment, ['운전', '기동', 'run'])
  if (run == null) return 'none'
  if (run.startsWith('0')) return 'stop'
  return 'run'
}

function unitsOf(site: SiteDef): Unit[] {
  const gear = site.systems
    .filter((system) => system.domain === 'hvac' || system.domain === 'events')
    .flatMap((system) => system.equipment.map((equipment) => ({ system, equipment })))
  return ROLES.map((role) => {
    const found = gear.find(({ equipment }) => {
      const hay = `${equipment.name} ${equipment.tags.join(' ')}`.toLowerCase()
      return role.keys.some((key) => hay.includes(key))
    })
    if (!found) return SAMPLE_FLOW.find((item) => item.id === role.id) ?? {
      id: role.id, label: role.label, status: 'none' as const, temp: '수신 없음', extra: '', sample: true,
    }
    const temp = pointText(site.id, found.system, found.equipment, ['온도', '급기'])
    return {
      id: `${found.system.id}-${found.equipment.id}`,
      label: found.equipment.name,
      status: statusOf(site.id, found.system, found.equipment),
      temp: temp ?? '수신 없음',
      extra: found.system.name,
      sample: false,
    }
  })
}

export function PlantBoard({ site }: { site?: SiteDef }) {
  const roles = site ? unitsOf(site) : SAMPLE_FLOW
  const sample = roles.every((item) => item.sample)
  const cards = sample ? SAMPLE_CARDS : roles

  return (
    <div className="cmd desk">
      <header className="cmd-head">
        <div>
          <p>{site?.name ?? '현장'}</p>
          <h1>기계설비</h1>
        </div>
        <p>
          {site?.location || '이 건물'}
          {sample ? ' · 아래 숫자와 상태는 예시입니다.' : ' · 받은 운전과 온도만 숫자로 둡니다.'}
        </p>
      </header>
      <div className="plant-cards">
        {cards.map((item) => <PlantNode key={item.id} unit={item} />)}
      </div>
    </div>
  )
}

function PlantNode({ unit }: { unit: Unit }) {
  return (
    <article className={`plant-node is-${unit.status}${unit.sample ? ' is-sample' : ''}`}>
      <header>
        <strong>{unit.label}{unit.sample ? <span className="sample-tag">예시</span> : null}</strong>
        <em>{STATUS_LABEL[unit.status]}</em>
      </header>
      <b>{unit.temp}</b>
      {unit.extra ? <span>{unit.extra}</span> : null}
    </article>
  )
}
