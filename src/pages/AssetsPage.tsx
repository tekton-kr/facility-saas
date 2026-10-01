import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ManageFrame } from '../components/ManageFrame.tsx'
import { countPoints, getSite, listPoints } from '../lib/catalog.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { getTelemetry } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'

const KINDS = [
  { id: 'all', label: '전체' },
  { id: 'gas', label: '가스' },
  { id: 'elec', label: '전기' },
  { id: 'dhw', label: '급탕' },
  { id: 'heat', label: '난방' },
  { id: 'water', label: '급수' },
] as const

type KindId = (typeof KINDS)[number]['id']

function kindOf(hay: string): Exclude<KindId, 'all'> | 'other' {
  if (hay.includes('급탕') || hay.includes('온수')) return 'dhw'
  if (hay.includes('난방') || hay.includes('열량')) return 'heat'
  if (hay.includes('가스') || hay.includes('gas')) return 'gas'
  if (hay.includes('급수') || hay.includes('수도') || hay.includes('유량') || hay.includes('water')) return 'water'
  if (hay.includes('전기') || hay.includes('전력') || hay.includes('elec') || hay.includes('kwh')) return 'elec'
  return 'other'
}

const KIND_LABEL: Record<Exclude<KindId, 'all'> | 'other', string> = {
  gas: '가스',
  elec: '전기',
  dhw: '급탕',
  heat: '난방',
  water: '급수',
  other: '기타',
}

export function AssetsPage() {
  const { siteId, search } = useScope()
  const site = siteId ? getSite(siteId) : undefined
  const sites = visibleSites()
  const [kind, setKind] = useState<KindId>('all')

  if (!siteId) {
    return (
      <ManageFrame kicker="" title="데이터자산">
        <p className="manage-note">건물을 고르면 그 현장의 계량기 목록이 열립니다.</p>
        <section className="manage-card">
          {sites.length === 0 ? <div className="empty">배정된 건물이 없습니다.</div> : (
            <div className="manage-list">
              {sites.map((item) => (
                <Link key={item.id} className="manage-row" to={`/sites/${item.id}/assets${search}`}>
                  <span>
                    <strong>{item.name}</strong>
                    <em>관제점 {countPoints(item)}</em>
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
    return (
      <ManageFrame kicker="데이터자산" title="현장을 찾지 못했습니다">
        <div className="empty">배정 목록에 없는 건물입니다.</div>
      </ManageFrame>
    )
  }

  const rows = listPoints({ siteId: site.id }).map((row) => {
    const hay = `${row.system.name} ${row.equipment.name} ${row.point.name} ${row.point.tags.join(' ')}`.toLowerCase()
    const tel = getTelemetry(row, 'live')
    const received = tel.current != null && tel.certainty !== 'unknown' && tel.certainty !== 'estimate'
    return {
      id: `${row.system.id}-${row.equipment.id}-${row.point.id}`,
      kind: kindOf(hay),
      place: row.equipment.name,
      point: row.point.name,
      system: row.system.name,
      received,
    }
  })
  const shown = kind === 'all' ? rows : rows.filter((row) => row.kind === kind)

  return (
    <ManageFrame kicker="" title="데이터자산">
      <p className="manage-note">{site.name} · 가스, 전기, 급탕, 난방, 급수 계량기입니다. 번호와 사용자가 없으면 비워 둡니다.</p>
      <div className="chip-row" role="group" aria-label="검침 구분">
        {KINDS.map((item) => (
          <button key={item.id} type="button" className={kind === item.id ? 'is-active' : ''} onClick={() => setKind(item.id)}>
            {item.label} {item.id === 'all' ? rows.length : rows.filter((row) => row.kind === item.id).length}
          </button>
        ))}
      </div>
      <section className="manage-card">
        {shown.length === 0 ? <div className="empty">이 구분에 등록된 계량기가 없습니다.</div> : (
          <table className="asset-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>설비</th>
                <th>관제점</th>
                <th>계통</th>
                <th>계량기 번호</th>
                <th>사용자</th>
                <th>수신</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id}>
                  <td>{KIND_LABEL[row.kind]}</td>
                  <td>{row.place}</td>
                  <td>{row.point}</td>
                  <td>{row.system}</td>
                  <td>미등록</td>
                  <td>미등록</td>
                  <td>{row.received ? '수신' : '수신 없음'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </ManageFrame>
  )
}
