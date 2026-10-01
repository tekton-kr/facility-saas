import type { SiteDef } from '../types/domain.ts'
import { listPoints } from '../lib/catalog.ts'
import { liveAlarms, getTelemetry } from '../lib/telemetry.ts'

type Zone = {
  id: string
  name: string
  state: 'none' | 'fire' | 'fault' | 'ok'
  sample: boolean
}

function zoneState(siteId: string, systemId: string, equipmentId: string, pointId: string, fired: boolean): Zone['state'] {
  if (fired) return 'fire'
  const tel = getTelemetry({ siteId, systemId, equipmentId, pointId }, 'live')
  if (tel.note === '통신 두절') return 'fault'
  if (tel.current == null || tel.certainty === 'unknown' || tel.certainty === 'estimate') return 'none'
  return 'ok'
}

function zonesOf(site: SiteDef): Zone[] {
  const alarms = liveAlarms(site.id).filter((item) => item.kind === 'fire')
  return listPoints({ siteId: site.id }).flatMap((row) => {
    if (row.system.domain !== 'fire' && !row.point.tags.includes('fire')) return []
    const fired = alarms.some((item) => item.pointId === row.point.id || item.equipmentId === row.equipment.id)
    return [{
      id: `${row.system.id}-${row.equipment.id}-${row.point.id}`,
      name: row.point.name,
      state: zoneState(site.id, row.system.id, row.equipment.id, row.point.id, fired),
      sample: false,
    }]
  })
}

function sampleZones(): Zone[] {
  return Array.from({ length: 16 }, (_, index) => ({
    id: `sample-${index + 1}`,
    name: `${index + 1}구역`,
    state: 'none' as const,
    sample: true,
  }))
}

const STATE_LABEL = {
  none: '수신 없음',
  fire: '화재',
  fault: '고장',
  ok: '정상',
}

export function FireReceiver({ site }: { site?: SiteDef }) {
  const live = site ? zonesOf(site) : []
  const zones = live.length > 0 ? live : sampleZones()
  const sample = live.length === 0
  const fire = zones.filter((item) => item.state === 'fire').length
  const fault = zones.filter((item) => item.state === 'fault').length

  return (
    <div className="cmd desk">
      <header className="cmd-head">
        <div>
          <p>{site?.name ?? '현장'}</p>
          <h1>소방</h1>
        </div>
        <p>
          {site?.location || '이 건물'} · R형 수신기. 인증 계통을 대체하지 않습니다.
          {sample ? ' 구역 배치는 예시이고, 화재로 채우지 않습니다.' : ' 받은 구역만 표시합니다.'}
        </p>
      </header>
      <section className="receiver" aria-label="R형 수신기">
        <header className="receiver-lamps">
          <span className={fire > 0 ? 'is-fire' : ''}>화재 {fire > 0 ? fire : '수신 없음'}</span>
          <span className={fault > 0 ? 'is-fault' : ''}>고장 {fault > 0 ? fault : '수신 없음'}</span>
          <span>교류전원 수신 없음</span>
          <span>예비전원 수신 없음</span>
        </header>
        <div className="receiver-window">
          {zones.map((zone) => (
            <article key={zone.id} className={`receiver-zone is-${zone.state}${zone.sample ? ' is-sample' : ''}`}>
              <strong>{zone.name}{zone.sample ? <span className="sample-tag">예시</span> : null}</strong>
              <em>{STATE_LABEL[zone.state]}</em>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
