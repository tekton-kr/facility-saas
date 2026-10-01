import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CollectionPending } from '../components/CollectionPending.tsx'
import { OwnerGauge } from '../components/OwnerCharts.tsx'
import { PointDrawer } from '../components/PointDrawer.tsx'
import { PointTable, type PointRow } from '../components/PointTable.tsx'
import { TrendChart } from '../components/TrendChart.tsx'
import { getEquipment, listPoints } from '../lib/catalog.ts'
import { isAppCollected, isDomainCollected } from '../lib/collection.ts'
import { APP_LABEL, DOMAIN_LABEL, formatNumber } from '../lib/format.ts'
import { getTelemetry } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'
import type { PointDef, SystemDomain } from '../types/domain.ts'

const PHASES = [
  { label: 'A', volt: ['a상 전압', '전압 a', 'van'], amp: ['a상 전류', '전류 a'] },
  { label: 'B', volt: ['b상 전압', '전압 b', 'vbn'], amp: ['b상 전류', '전류 b'] },
  { label: 'C', volt: ['c상 전압', '전압 c', 'vcn'], amp: ['c상 전류', '전류 c'] },
]

function pointText(point: PointDef | undefined, siteId: string, systemId: string, equipmentId: string, range: Parameters<typeof getTelemetry>[1]): string {
  if (!point) return '수신 없음'
  const tel = getTelemetry({ siteId, systemId, equipmentId, pointId: point.id }, range)
  if (tel.current == null || tel.certainty === 'unknown' || tel.certainty === 'estimate') return '수신 없음'
  return `${formatNumber(tel.current)}${point.unit ? ` ${point.unit}` : ''}`
}

function findPoint(points: PointDef[], keys: string[]): PointDef | undefined {
  return points.find((point) => {
    const hay = `${point.name} ${point.tags.join(' ')} ${point.unit}`.toLowerCase()
    return keys.some((key) => hay.includes(key.toLowerCase()))
  })
}

function powerPoint(points: PointDef[]): PointDef | undefined {
  return points.find((point) => {
    const hay = `${point.name} ${point.unit}`.toLowerCase()
    if (hay.includes('전압') || point.unit === 'V') return false
    return point.unit.toLowerCase() === 'kw' || hay.includes('유효전력') || hay.includes('전력')
  })
}

function Silhouette({ domain }: { domain: SystemDomain }) {
  return (
    <svg className="equip-silhouette" viewBox="0 0 160 220" aria-hidden="true">
      {domain === 'power' ? (
        <>
          <path d="M28 18h104v184H28V18Z" />
          <path d="M40 36h80v28H40V36ZM40 76h80v16H40V76ZM40 104h36v16H40v-16ZM84 104h36v16H84v-16ZM40 136h80v40H40v-40Z" />
        </>
      ) : null}
      {domain === 'hvac' || domain === 'events' ? (
        <>
          <path d="M18 48h124v120H18V48Z" />
          <path d="M18 72h124M18 148h124M46 48v120M114 48v120" />
          <path d="M62 28h36v20H62V28Z" />
        </>
      ) : null}
      {domain === 'ev' ? (
        <>
          <path d="M24 150h100l-12-40H40L24 150Z" />
          <path d="M48 150v16M100 150v16M108 96h20v28" />
        </>
      ) : null}
      {domain !== 'power' && domain !== 'hvac' && domain !== 'events' && domain !== 'ev' ? (
        <>
          <path d="M36 28h88v164H36V28Z" />
          <path d="M52 52h56v24H52V52ZM52 92h56M52 112h40M52 148h56v20H52v-20Z" />
        </>
      ) : null}
    </svg>
  )
}

export function EquipmentPage() {
  const { app, siteId, systemId, equipmentId, range, query, search, role, goPoint } = useScope()
  const found = getEquipment(siteId, systemId, equipmentId)
  const [drawer, setDrawer] = useState<PointRow | null>(null)
  if (role === 'exec' && siteId) {
    return <Navigate to={`/apps/${app}/sites/${siteId}${search}`} replace />
  }

  if (!found) {
    return (
      <div className="panel">
        <h1>장비를 찾을 수 없습니다</h1>
        <p><Link to={siteId ? `/apps/${app}/sites/${siteId}${search}` : `/apps/${app}${search}`}>돌아가기</Link></p>
      </div>
    )
  }

  const { site, system, equipment } = found
  if (!isAppCollected(app) || !isDomainCollected(system.domain)) {
    return (
      <>
        <div className="crumbs">
          <Link to={`/apps/${app}${search}`}>{APP_LABEL[app]}</Link>
          <span>/</span>
          <Link to={`/apps/${app}/sites/${site.id}${search}`}>{site.name}</Link>
          <span>/</span>
          <span>{equipment.name}</span>
        </div>
        <CollectionPending title={`${DOMAIN_LABEL[system.domain]} · 연동 대기`} />
      </>
    )
  }
  const rows = listPoints({
    siteId: site.id,
    systemId: system.id,
    equipmentId: equipment.id,
    query,
  })
  const power = powerPoint(equipment.points)
  const powerTel = power
    ? getTelemetry({
        siteId: site.id,
        systemId: system.id,
        equipmentId: equipment.id,
        pointId: power.id,
      }, range)
    : null
  const powerValue = powerTel && powerTel.current != null && powerTel.certainty !== 'unknown' && powerTel.certainty !== 'estimate'
    ? powerTel.current
    : null
  const primary = power
    ?? equipment.points.find((point) => point.id === 'cap' || point.name.includes('면수'))
    ?? equipment.points[0]
  const series = primary
    ? getTelemetry({
        siteId: site.id,
        systemId: system.id,
        equipmentId: equipment.id,
        pointId: primary.id,
      }, range).series
    : null

  return (
    <>
      <div className="crumbs">
        <Link to={`/apps/${app}${search}`}>{APP_LABEL[app]}</Link>
        <span>/</span>
        <Link to={`/apps/${app}/sites/${site.id}${search}`}>{site.name}</Link>
        <span>/</span>
        <Link to={`/apps/${app}/sites/${site.id}/systems/${system.id}${search}`}>{system.name}</Link>
        <span>/</span>
        <span>{equipment.name}</span>
      </div>
      <div className="page-head">
        <div>
          <h1>{equipment.name}</h1>
          <p>{site.name} · {system.name}</p>
        </div>
      </div>
      <section className="equip-stage">
        <div className="panel equip-plate">
          <div className="equip-figure">
            {equipment.image ? <img src={equipment.image} alt="" /> : <Silhouette domain={system.domain} />}
          </div>
          <dl>
            <div><dt>설비</dt><dd>{equipment.name}</dd></div>
            <div><dt>계통</dt><dd>{system.name}</dd></div>
            <div><dt>모델</dt><dd>{equipment.model || '모델 미등록'}</dd></div>
            <div><dt>관제점</dt><dd>{equipment.points.length}</dd></div>
          </dl>
        </div>
        <div className="panel equip-read">
          <h2>{power ? power.name : '전력'}</h2>
          {powerValue != null ? (
            <OwnerGauge value={powerValue} max={Math.max(powerValue * 1.25, 1)} color="#3d8bfd" />
          ) : (
            <p className="equip-empty">수신 없음</p>
          )}
          <table>
            <thead>
              <tr><th>상</th><th>전류</th><th>전압</th></tr>
            </thead>
            <tbody>
              {PHASES.map((phase) => (
                <tr key={phase.label}>
                  <th>{phase.label}</th>
                  <td>{pointText(findPoint(equipment.points, phase.amp), site.id, system.id, equipment.id, range)}</td>
                  <td>{pointText(findPoint(equipment.points, phase.volt), site.id, system.id, equipment.id, range)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2>{primary ? `${primary.name} 추세` : '추세'}</h2>
        <TrendChart values={series} label={primary?.name ?? '추세'} />
      </section>
      <section className="deck">
        <h2>관제점</h2>
        <PointTable rows={rows} range={range} onOpen={setDrawer} />
      </section>
      <PointDrawer
        row={drawer}
        range={range}
        onClose={() => setDrawer(null)}
        onOpenPage={() => {
          if (!drawer) return
          goPoint(drawer.site.id, drawer.system.id, drawer.equipment.id, drawer.point.id)
        }}
      />
    </>
  )
}
