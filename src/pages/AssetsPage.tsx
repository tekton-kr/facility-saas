import { Link } from 'react-router-dom'
import { ManageFrame } from '../components/ManageFrame.tsx'
import { countPoints, getSite, listPoints } from '../lib/catalog.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { getTelemetry } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'
import type { SiteDef } from '../types/domain.ts'

function receivedCount(site: SiteDef): number {
  return listPoints({ siteId: site.id }).filter((row) => {
    const tel = getTelemetry(row, 'live')
    return tel.current != null && tel.certainty !== 'unknown' && tel.certainty !== 'estimate'
  }).length
}

function AssetCard({ site }: { site: SiteDef }) {
  const equipment = site.systems.reduce((sum, system) => sum + system.equipment.length, 0)
  const points = countPoints(site)
  const received = receivedCount(site)
  const rows = [
    { label: '설비', value: `${equipment}`, note: equipment > 0 ? '카탈로그에 등록됨' : '등록 없음' },
    { label: '관제점', value: `${points}`, note: points === 0 ? '등록 없음' : `수신 ${received} · 수신 없음 ${points - received}` },
    { label: '도면', value: site.plans.length > 0 ? `${site.plans.length}` : '없음', note: site.plans.length > 0 ? site.plans.map((item) => item.name).join(' · ') : '등록된 준공 도면 없음' },
    { label: '카메라', value: site.cameras.length > 0 ? `${site.cameras.length}` : '없음', note: site.cameras.length > 0 ? '현장 카메라 목록' : '등록된 카메라 없음' },
    { label: '연결', value: site.connectorIds.length > 0 ? `${site.connectorIds.length}` : '없음', note: site.connectorIds.length > 0 ? '수집 연결' : '등록된 연결 없음' },
  ]
  return (
    <section className="manage-card">
      <h2>{site.name}</h2>
      <p className="manage-note">{site.location || '위치 미등록'}</p>
      <div className="manage-list">
        {rows.map((row) => (
          <div key={row.label} className="manage-row">
            <span>
              <strong>{row.label}</strong>
              <em>{row.note}</em>
            </span>
            <b>{row.value}</b>
          </div>
        ))}
      </div>
    </section>
  )
}

export function AssetsPage() {
  const { siteId, search } = useScope()
  const site = siteId ? getSite(siteId) : undefined
  const sites = visibleSites()

  if (!siteId) {
    return (
      <ManageFrame kicker="" title="데이터자산">
        <p className="manage-note">배정 건물에 등록된 설비, 관제점, 도면, 카메라입니다. 예시로 채운 사진과 도면은 세지 않습니다.</p>
        {sites.length === 0 ? <div className="empty">배정된 건물이 없습니다.</div> : (
          <>
            <section className="manage-card">
              <div className="manage-list">
                {sites.map((item) => (
                  <Link key={item.id} className="manage-row" to={`/sites/${item.id}/assets${search}`}>
                    <span>
                      <strong>{item.name}</strong>
                      <em>관제점 {countPoints(item)} · 설비 {item.systems.reduce((sum, system) => sum + system.equipment.length, 0)}</em>
                    </span>
                    <b>열기</b>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </ManageFrame>
    )
  }

  if (!site) {
    return (
      <ManageFrame kicker="데이터자산" title="현장을 찾지 못했습니다">
        <div className="empty">배정 목록에 없는 건물입니다.</div>
      </ManageFrame>
    )
  }

  return (
    <ManageFrame kicker="" title="데이터자산">
      <p className="manage-note">이 건물에 등록된 데이터입니다. 값을 받지 못한 관제점은 수신 없음으로 셉니다. 예시 자료는 넣지 않습니다.</p>
      <AssetCard site={site} />
    </ManageFrame>
  )
}
