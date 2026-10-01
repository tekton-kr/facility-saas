import { Link } from 'react-router-dom'
import { ManageFrame } from '../components/ManageFrame.tsx'
import { getSite } from '../lib/catalog.ts'
import { contractCovers, contractForSite, openMeterWork } from '../lib/field.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { getTelemetry } from '../lib/telemetry.ts'
import { useField } from '../lib/useField.ts'
import { useScope } from '../lib/useScope.ts'
import type { EquipmentDef, SiteDef, SystemDef } from '../types/domain.ts'

function formatKwh(value: number): string {
  return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)} kWh`
}

function meterPoint(equipment: EquipmentDef) {
  return equipment.points.find((point) => point.unit === 'kWh' || point.tags.includes('meter'))
}

function readingOf(siteId: string, system: SystemDef, equipment: EquipmentDef) {
  const point = meterPoint(equipment)
  if (!point) return { kwh: null as number | null, compare: '수신 없음', high: false }
  const tel = getTelemetry({
    siteId,
    systemId: system.id,
    equipmentId: equipment.id,
    pointId: point.id,
  }, 'today')
  if (tel.current == null || tel.certainty === 'unknown' || tel.certainty === 'estimate') {
    return { kwh: null, compare: '수신 없음', high: false }
  }
  const series = (tel.series ?? []).filter((value) => Number.isFinite(value))
  if (series.length < 2) return { kwh: tel.current, compare: '수신 없음', high: false }
  const average = series.reduce((sum, value) => sum + value, 0) / series.length
  const high = average > 0 && tel.current > average * 1.5
  return { kwh: tel.current, compare: high ? '평소보다 높음' : '평소 범위', high }
}

function equipmentOf(site: SiteDef) {
  return site.systems.flatMap((system) => system.equipment.map((equipment) => ({ system, equipment })))
}

export function MetersPage() {
  const { siteId, search } = useScope()
  const field = useField()
  const site = siteId ? getSite(siteId) : undefined

  if (!siteId) {
    const sites = visibleSites()
    return (
      <ManageFrame kicker="" title="설비 전력량계">
        <p className="manage-note">건물을 고르면 그 현장 설비의 전력량계가 열립니다. 수전 화면과는 따로입니다.</p>
        <section className="manage-card">
          {sites.length === 0 ? <div className="empty">배정된 건물이 없습니다.</div> : (
            <div className="manage-list">
              {sites.map((item) => (
                <Link key={item.id} className="manage-row" to={`/sites/${item.id}/meters${search}`}>
                  <span>
                    <strong>{item.name}</strong>
                    <em>{item.location || '위치 미등록'}</em>
                  </span>
                  <b>열기</b>
                </Link>
              ))}
            </div>
          )}
        </section>
      </ManageFrame>
    )
  }

  if (!site) {
    return <ManageFrame kicker="설비 전력량계" title="현장을 찾지 못했습니다"><div className="empty">배정 목록에 없는 건물입니다.</div></ManageFrame>
  }

  const contract = contractForSite(site.id)
  const covered = contractCovers(contract, 'submeter')
  const rows = equipmentOf(site)

  return (
    <ManageFrame kicker="" title="설비 전력량계">
      <p className="manage-note">
        {covered
          ? '이 현장 계약에 설비 전력량계가 포함됩니다. 평소보다 높으면 그 계약의 작업으로 넘길 수 있습니다.'
          : contract
            ? '이 화면은 계약 범위 밖입니다. 설비 전력량계 줄이 없습니다.'
            : '이 건물에 등록된 유지보수 계약이 없습니다.'}
      </p>
      <section className="manage-card">
        {rows.length === 0 ? <div className="empty">이 건물에 등록된 설비가 없습니다.</div> : (
          <div className="manage-list">
            {rows.map(({ system, equipment }) => {
              const reading = readingOf(site.id, system, equipment)
              const opened = field.works.find((item) => (
                item.siteId === site.id
                && item.equipmentId === equipment.id
                && item.title === `${equipment.name} 전력량`
                && item.status !== 'done'
              ))
              return (
                <div key={`${system.id}-${equipment.id}`} className="manage-row">
                  <span>
                    <strong>{equipment.name}</strong>
                    <em>{system.name} · {reading.compare}</em>
                    {reading.high && covered ? (
                      opened ? (
                        <Link to={`/work/${opened.id}${search}`}>이 설비 작업</Link>
                      ) : (
                        <button
                          className="alarm-handoff"
                          type="button"
                          onClick={() => openMeterWork({
                            siteId: site.id,
                            systemId: system.id,
                            equipmentId: equipment.id,
                            equipmentName: equipment.name,
                          })}
                        >
                          작업으로 넘기기
                        </button>
                      )
                    ) : null}
                  </span>
                  <b>{reading.kwh == null ? '수신 없음' : formatKwh(reading.kwh)}</b>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </ManageFrame>
  )
}
