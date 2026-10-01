import type { ReactNode } from 'react'
import type { EquipmentDef, SiteDef, SystemDef } from '../types/domain.ts'
import { formatDateTime } from '../lib/format.ts'
import { alarmsForScope, getTelemetry } from '../lib/telemetry.ts'
import { EhpBoard } from './EhpBoard.tsx'
import { ChargeBoard } from './ChargeBoard.tsx'
import { FireReceiver } from './FireReceiver.tsx'
import { MeterBoard } from './MeterBoard.tsx'
import { LiftBoard } from './LiftBoard.tsx'
import { PowerBoard } from './PowerBoard.tsx'
import { PlantBoard } from './PlantBoard.tsx'

export type DeskId = 'events' | 'power' | 'light' | 'metering' | 'ehp' | 'fire' | 'elevator' | 'ev' | 'parking'

const COPY: Record<DeskId, { title: string; lead: string; tiles: { label: string; keys: string[] }[] }> = {
  events: {
    title: '기계설비',
    lead: '운전, 정지, 경보를 설비별로 봅니다.',
    tiles: [
      { label: '운전', keys: ['운전', '기동', 'run'] },
      { label: '정지', keys: ['정지', 'stop'] },
      { label: '경보', keys: ['경보', '알람', 'fault'] },
      { label: '통신', keys: ['통신', '온라인'] },
    ],
  },
  power: {
    title: '전력',
    lead: '수전 전압, 전류, 유효전력, 역률입니다.',
    tiles: [
      { label: 'A상 전압', keys: ['a상', '전압 a', 'van'] },
      { label: 'B상 전압', keys: ['b상', '전압 b'] },
      { label: 'C상 전압', keys: ['c상', '전압 c'] },
      { label: '전류', keys: ['전류'] },
      { label: '유효전력', keys: ['유효전력', '전력'] },
      { label: '역률', keys: ['역률'] },
    ],
  },
  light: {
    title: '조명',
    lead: '회로별 점등, 소등, 디밍입니다. 없는 값은 비워 둡니다.',
    tiles: [
      { label: '점등', keys: ['점등', 'on', '조명'] },
      { label: '소등', keys: ['소등', 'off'] },
      { label: '디밍', keys: ['디밍', '조도', 'dim'] },
      { label: '고장', keys: ['고장', '경보'] },
    ],
  },
  metering: {
    title: '원격검침',
    lead: '가스, 전기, 급탕, 난방, 급수입니다. 없는 값은 비워 둡니다.',
    tiles: [
      { label: '가스', keys: ['가스', 'gas'] },
      { label: '전기', keys: ['전기', '전력', 'kwh'] },
      { label: '급탕', keys: ['급탕', '온수'] },
      { label: '난방', keys: ['난방', '열량'] },
      { label: '급수', keys: ['급수', '수도', '유량'] },
    ],
  },
  ehp: {
    title: 'EHP',
    lead: '실내기 운전, 설정 온도, 모드입니다.',
    tiles: [
      { label: '운전', keys: ['운전', '기동'] },
      { label: '설정 온도', keys: ['설정', 'set'] },
      { label: '실내 온도', keys: ['실내', '환기온도'] },
      { label: '모드', keys: ['모드', '냉방', '난방'] },
    ],
  },
  fire: {
    title: '소방',
    lead: '수신기 구역과 경보입니다. 인증 계통을 대체하지 않습니다.',
    tiles: [
      { label: '화재', keys: ['화재', 'fire'] },
      { label: '고장', keys: ['고장'] },
      { label: '수신기', keys: ['수신'] },
      { label: '펌프', keys: ['펌프'] },
    ],
  },
  elevator: {
    title: '엘리베이터',
    lead: '호기별 층, 방향, 문 상태입니다.',
    tiles: [
      { label: '층', keys: ['층', 'floor'] },
      { label: '방향', keys: ['방향', '상승', '하강'] },
      { label: '문', keys: ['문', 'door'] },
      { label: '고장', keys: ['고장', '경보'] },
    ],
  },
  ev: {
    title: '전기차충전',
    lead: '충전기별 상태와 충전 전력입니다.',
    tiles: [
      { label: '충전', keys: ['충전'] },
      { label: '대기', keys: ['대기'] },
      { label: '충전 전력', keys: ['충전 전력', '전력', 'kw'] },
      { label: '고장', keys: ['고장'] },
    ],
  },
  parking: {
    title: '주차',
    lead: '면수와 입출차입니다.',
    tiles: [
      { label: '주차', keys: ['주차', '재차'] },
      { label: '빈 면', keys: ['빈', '여유'] },
      { label: '입차', keys: ['입차'] },
      { label: '출차', keys: ['출차'] },
    ],
  },
}

type PointRow = {
  system: SystemDef
  equipment: EquipmentDef
  point: EquipmentDef['points'][number]
}

function systemsFor(site: SiteDef, desk: DeskId): SystemDef[] {
  if (desk === 'events') return site.systems.filter((item) => item.domain === 'hvac' || item.domain === 'events')
  if (desk === 'power') return site.systems.filter((item) => item.domain === 'power')
  if (desk === 'light') {
    return site.systems.filter((system) => system.equipment.some((item) => mentions(item, ['조명', '전등', '라이트', 'light'])))
  }
  if (desk === 'metering') return site.systems.filter((item) => item.domain === 'metering')
  if (desk === 'fire') return site.systems.filter((item) => item.domain === 'fire')
  if (desk === 'ev') return site.systems.filter((item) => item.domain === 'ev')
  if (desk === 'parking') return site.systems.filter((item) => item.domain === 'parking')
  if (desk === 'ehp') {
    return site.systems.filter((system) => system.equipment.some((item) => mentions(item, ['ehp', '실내', '냉난방'])))
  }
  return site.systems.filter((system) => system.equipment.some((item) => mentions(item, ['엘리베이터', '승강'])))
}

function mentions(equipment: EquipmentDef, keys: string[]): boolean {
  const hay = `${equipment.name} ${equipment.tags.join(' ')}`.toLowerCase()
  return keys.some((key) => hay.includes(key))
}

function pointsOf(systems: SystemDef[]): PointRow[] {
  return systems.flatMap((system) => system.equipment.flatMap((equipment) => (
    equipment.points.map((point) => ({ system, equipment, point }))
  )))
}

function shown(siteId: string, row: PointRow) {
  const tel = getTelemetry({
    siteId,
    systemId: row.system.id,
    equipmentId: row.equipment.id,
    pointId: row.point.id,
  }, 'live')
  if (tel.current == null || tel.certainty === 'unknown' || tel.certainty === 'estimate') return null
  return tel
}

function formatValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)
}

function matchTile(rows: PointRow[], keys: string[]): PointRow | undefined {
  return rows.find((row) => {
    const hay = `${row.point.name} ${row.point.tags.join(' ')} ${row.point.unit}`.toLowerCase()
    return keys.some((key) => hay.includes(key.toLowerCase()))
  })
}

export function DomainDesk({ site, desk }: { site?: SiteDef; desk: DeskId }) {
  if (desk === 'events') return <PlantBoard site={site} />
  if (desk === 'ehp') return <EhpBoard site={site} />
  if (desk === 'ev') return <ChargeBoard site={site} />
  if (desk === 'fire') return <FireReceiver site={site} />
  if (desk === 'metering') return <MeterBoard site={site} />
  if (desk === 'elevator') return <LiftBoard site={site} />
  if (desk === 'power') return <PowerBoard site={site} />
  const copy = COPY[desk]
  const systems = site ? systemsFor(site, desk) : []
  const rows = pointsOf(systems)
  const alarms = site
    ? alarmsForScope({ siteId: site.id }).filter((alarm) => (
      systems.some((system) => system.id === alarm.systemId)
    ))
    : []

  return (
    <div className="cmd desk">
      <header className="cmd-head">
        <div>
          <p>{site?.name ?? '현장'}</p>
          <h1>{copy.title}</h1>
        </div>
        <p>{site?.location || '이 건물'} · {copy.lead}</p>
      </header>

      <section className="desk-tiles" aria-label={copy.title}>
        {copy.tiles.map((tile) => {
          const row = site ? matchTile(rows, tile.keys) : undefined
          const tel = site && row ? shown(site.id, row) : null
          return (
            <article key={tile.label} className="cmd-panel desk-tile">
              <h2>{tile.label}</h2>
              <strong>{tel ? formatValue(tel.current as number) : '수신 없음'}</strong>
              <em>{tel ? row?.point.unit || '수신' : row ? row.point.name : '계측 없음'}</em>
            </article>
          )
        })}
      </section>

      <div className="desk-split">
        <section className="cmd-panel desk-list">
          <h2>설비</h2>
          {systems.length === 0 ? <div className="empty">이 건물에 등록된 설비가 없습니다.</div> : (
            <ul>
              {systems.flatMap((system) => system.equipment.map((equipment) => (
                <li key={`${system.id}-${equipment.id}`}>
                  <div>
                    <strong>{equipment.name}</strong>
                    <em>{system.name}</em>
                  </div>
                  <PointLines siteId={site!.id} system={system} equipment={equipment} />
                </li>
              )))}
            </ul>
          )}
        </section>
        <section className="cmd-panel desk-list">
          <h2>알람</h2>
          {alarms.length === 0 ? <div className="empty">이 범위에 알람이 없습니다.</div> : (
            <ul>
              {alarms.map((alarm) => (
                <li key={alarm.id}>
                  <div>
                    <strong>{alarm.title}</strong>
                    <em>{formatDateTime(alarm.at)}</em>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function PointLines({ siteId, system, equipment }: { siteId: string; system: SystemDef; equipment: EquipmentDef }): ReactNode {
  if (equipment.points.length === 0) return <b>관제점 없음</b>
  return (
    <b>
      {equipment.points.slice(0, 4).map((point) => {
        const tel = shown(siteId, { system, equipment, point })
        return <span key={point.id}>{point.name} {tel ? formatValue(tel.current as number) : '수신 없음'}</span>
      })}
    </b>
  )
}
