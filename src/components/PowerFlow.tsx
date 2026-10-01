import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { SiteDef } from '../types/domain.ts'
import { listPoints } from '../lib/catalog.ts'
import { formatDateTime } from '../lib/format.ts'
import { getTelemetry } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'

const SONGDO_PHOTO = '/img/sample/songdo_ait_center_002_3725457f57.webp'

function buildingPhoto(site: SiteDef): string | undefined {
  if (site.photo) return site.photo
  const name = site.name.replace(/\s/g, '').toLowerCase()
  if (name.includes('송도ait')) return SONGDO_PHOTO
  return undefined
}

const SERVICES: { id: string; label: string; keys: string[]; row: 'top' | 'bottom'; path: string }[] = [
  { id: 'events', label: '기계설비', keys: ['공조', '냉동', '펌프', '보일러', '열교환'], row: 'top', path: 'apps/events' },
  { id: 'power', label: '전력', keys: ['수전', '전력', '전압', '전류'], row: 'top', path: 'apps/power' },
  { id: 'light', label: '조명', keys: ['조명'], row: 'top', path: 'domains/light' },
  { id: 'metering', label: '원격검침', keys: ['검침', '가스', '급탕', '난방', '급수'], row: 'top', path: 'apps/metering' },
  { id: 'ehp', label: 'EHP', keys: ['ehp', '실내'], row: 'top', path: 'domains/ehp' },
  { id: 'fire', label: '소방', keys: ['소방', '화재'], row: 'bottom', path: 'domains/fire' },
  { id: 'elevator', label: '엘리베이터', keys: ['엘리베이터', '승강'], row: 'bottom', path: 'domains/elevator' },
  { id: 'ev', label: '전기차충전기', keys: ['충전', 'ev'], row: 'bottom', path: 'apps/ev' },
  { id: 'parking', label: '주차운영', keys: ['주차'], row: 'bottom', path: 'apps/parking' },
]

function formatValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(value)
}

function matchedPoints(siteId: string, keys: string[]) {
  return listPoints({ siteId }).filter((item) => {
    const hay = `${item.system.name} ${item.equipment.name} ${item.point.name} ${item.point.tags.join(' ')}`.toLowerCase()
    return keys.some((key) => hay.includes(key.toLowerCase()))
  })
}
function deskSearch(search: string): string {
  return search.replace(/(^\?|&)view=[^&]*/g, '').replace(/^\?&/, '?').replace(/\?$/, '')
}

function serviceHref(siteId: string, path: string, search: string): string {
  const query = deskSearch(search)
  if (path.startsWith('domains/')) return `/sites/${siteId}/${path}${query}`
  return `/${path}/sites/${siteId}${query}`
}

function NodeIcon({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 64 48" aria-hidden="true">
      {id === 'events' ? <path d="M8 16h48M8 32h48M20 16v16M44 16v16" /> : null}
      {id === 'power' ? <path d="M34 6 18 26h12l-2 16 18-24H34l2-12Z" /> : null}
      {id === 'light' ? <path d="M32 8a12 12 0 0 1 5 22.4V36H27v-5.6A12 12 0 0 1 32 8ZM28 40h8M30 44h4" /> : null}
      {id === 'metering' ? <path d="M10 40h44M16 40V20M32 40V12M48 40V26" /> : null}
      {id === 'ehp' ? <path d="M32 8v6M32 34v6M14 16l5 3M45 29l5 3M14 32l5-3M45 19l5-3M32 18a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" /> : null}
      {id === 'fire' ? <path d="M32 6s12 10 12 18a12 12 0 0 1-24 0c0-4 4-6 4-10 4 2 8 4 8 8 0-6 0-12 0-16Z" /> : null}
      {id === 'elevator' ? <path d="M18 42V8h28v34M18 22h28M32 14l-4 5h8l-4-5ZM32 34l4-5h-8l4 5Z" /> : null}
      {id === 'ev' ? <path d="M10 30h32l-2-10H16L10 30Zm4 0v4m18-4v4M32 14h8l2 6" /> : null}
      {id === 'parking' ? <path d="M18 42V8h16a10 10 0 0 1 0 20H18" /> : null}
    </svg>
  )
}

function liveText(siteId: string, keys: string[]): string {
  const row = matchedPoints(siteId, keys).find((item) => {
    const tel = getTelemetry(item, 'live')
    return tel.current != null && tel.certainty !== 'unknown' && tel.certainty !== 'estimate'
  })
  if (!row) return '수신 없음'
  const tel = getTelemetry(row, 'live')
  return `${formatValue(tel.current as number)}${row.point.unit ? ` ${row.point.unit}` : ''}`
}

function Node({ siteId, id, label, keys, href }: { siteId: string; id: string; label: string; keys: string[]; href: string }): ReactNode {
  const value = liveText(siteId, keys)
  return (
    <Link className="flow-node" to={href}>
      <NodeIcon id={id} />
      <p>
        <b className={value === '수신 없음' ? 'is-empty' : ''}>{value}</b>
      </p>
      <em>{matchedPoints(siteId, keys).length}개 관제점</em>
      <strong>{label}</strong>
    </Link>
  )
}

export function PowerFlow({ site }: { site: SiteDef }) {
  const { search } = useScope()
  const top = SERVICES.filter((item) => item.row === 'top')
  const bottom = SERVICES.filter((item) => item.row === 'bottom')
  const photo = buildingPhoto(site)
  const points = listPoints({ siteId: site.id })
  const live = points.filter((row) => {
    const tel = getTelemetry(row, 'live')
    return tel.current != null && tel.certainty !== 'unknown' && tel.certainty !== 'estimate'
  })

  return (
    <div className="cmd flow">
      <header className="cmd-head">
        <div>
          <p>{site.name}</p>
          <h1>종합관제</h1>
        </div>
        <p>{site.location || '이 건물'} · 관제점 {points.length} · 수신 {live.length} · 수신 없음 {points.length - live.length}</p>
      </header>
      <section className="building-card" aria-label="건물 정보">
        <div className="building-photo">
          {photo ? <img src={photo} alt={site.name} /> : (
            <svg viewBox="0 0 80 64" aria-hidden="true">
              <path d="M8 56V28L40 8l32 20v28H8Z" />
              <path d="M32 56V36h16v20" />
            </svg>
          )}
        </div>
        <dl>
          <div><dt>주소</dt><dd>{site.location || '미등록'}</dd></div>
          <div><dt>준공일</dt><dd>{site.built || '미등록'}</dd></div>
          <div><dt>연면적</dt><dd>{site.areaM2 ? `${site.areaM2.toLocaleString('ko-KR')} m²` : '미등록'}</dd></div>
          <div><dt>건물주</dt><dd>{site.owner || '미등록'}</dd></div>
          <div><dt>연락처</dt><dd>{site.phone || '미등록'}</dd></div>
          <div><dt>관리</dt><dd>{site.manager || '미등록'}</dd></div>
          <div><dt>상태</dt><dd>{live.length > 0 ? '수신 중' : '수신 대기'}</dd></div>
        </dl>
      </section>
      <section className="flow-board" aria-label="시설 관제">
        <div className="flow-row is-top">
          {top.map((item) => (
            <Node key={item.id} siteId={site.id} id={item.id} label={item.label} keys={item.keys} href={serviceHref(site.id, item.path, search)} />
          ))}
        </div>
        <svg className="flow-wires" viewBox="0 0 1000 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M100 0v28M300 0v28M500 0v28M700 0v28M900 0v28M100 28h800M160 62v28M380 62v28M620 62v28M840 62v28M160 62h680" />
        </svg>
        <div className="flow-row is-bottom">
          {bottom.map((item) => (
            <Node key={item.id} siteId={site.id} id={item.id} label={item.label} keys={item.keys} href={serviceHref(site.id, item.path, search)} />
          ))}
        </div>
      </section>
      <section className="cmd-panel flow-points" aria-label="관제점">
        <h2>관제점</h2>
        {points.length === 0 ? <div className="empty">이 건물에 등록된 관제점이 없습니다.</div> : (
          <ul>
            {points.map((row) => {
              const tel = getTelemetry(row, 'live')
              const hasValue = tel.current != null && tel.certainty !== 'unknown' && tel.certainty !== 'estimate'
              const href = `/apps/events/sites/${site.id}/systems/${row.system.id}/equipment/${row.equipment.id}/points/${row.point.id}${search}`
              return (
                <li key={`${row.system.id}-${row.equipment.id}-${row.point.id}`}>
                  <div>
                    <strong>{row.point.name}</strong>
                    <em>{row.equipment.name} · {row.system.name}</em>
                  </div>
                  <Link to={href}>
                    {hasValue ? `${formatValue(tel.current as number)} ${row.point.unit}` : '수신 없음'}
                    <span>{hasValue ? formatDateTime(tel.receivedAt) : '값 없음'}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
