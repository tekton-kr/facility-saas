import { Link } from 'react-router-dom'
import type { AppId } from '../types/domain.ts'
import { alarmsForScope } from '../lib/telemetry.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { useScope } from '../lib/useScope.ts'
import { SiteMap } from './SiteMap.tsx'
import { serviceState, SiteServices } from './SiteServices.tsx'

const TITLE: Record<'events' | 'power' | 'metering' | 'solar', string> = {
  events: '설비자동제어',
  power: '전력',
  metering: '원격검침',
  solar: '제로에너지',
}

export function PortfolioDashboard({ service }: { service: AppId }) {
  const { search, query } = useScope()
  const focus = service === 'power' || service === 'metering' || service === 'solar' ? service : 'events'
  const title = TITLE[focus]
  const needle = query.trim().toLowerCase()
  const sites = visibleSites()
    .map((site) => {
      const alarms = alarmsForScope({ siteId: site.id }).filter((item) => item.severity === 'critical' || item.severity === 'warning')
      const focusState = serviceState(site.id, site.systems, focus)
      return { site, alarms, focusState }
    })
    .filter(({ site, alarms }) => {
      if (!needle) return true
      const hay = `${site.name} ${site.location} ${alarms.map((item) => item.title).join(' ')}`.toLowerCase()
      return hay.includes(needle)
    })
    .sort((a, b) => b.alarms.length - a.alarms.length || a.site.name.localeCompare(b.site.name, 'ko'))
  const attention = sites.filter((item) => item.alarms.length > 0).length
  const waiting = sites.filter((item) => item.site.systems.length === 0).length

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <p className="page-kicker">배정 현장 {sites.length}</p>
          <h1>내 건물</h1>
          <p>설비자동제어를 기본으로, 전력·원격검침·제로에너지를 건물마다 같이 봅니다. 지금 고른 서비스는 {title}입니다.</p>
        </div>
      </header>
      <section className="dash-stats" aria-label="배정 현장 상태">
        <article>
          <span>건물</span>
          <strong>{sites.length}</strong>
          <em>배정된 현장</em>
        </article>
        <article>
          <span>이상</span>
          <strong>{attention}</strong>
          <em>{attention > 0 ? '시설팀에 확인할 건물' : '열린 위험·주의 없음'}</em>
        </article>
        <article>
          <span>수신 대기</span>
          <strong>{waiting}</strong>
          <em>계측이 아직 없는 건물</em>
        </article>
        <article>
          <span>보는 중</span>
          <strong>{title}</strong>
          <em>칸을 누르면 그 서비스로 들어갑니다</em>
        </article>
      </section>
      <section className="owner-map" aria-label="배정 현장 지도">
        <header className="owner-map-head">
          <div>
            <h2>현장 지도</h2>
            <p>배정된 건물을 지도에서 고릅니다. 이름을 누르면 그 건물로 들어갑니다.</p>
          </div>
          <p className="owner-map-key">
            <span><i className="is-ok" />이상 없음</span>
            <span><i className="is-warn" />이상</span>
            <span><i className="is-wait" />수신 대기</span>
          </p>
        </header>
        <SiteMap
          sites={sites.map(({ site, alarms }) => ({
            id: site.id,
            name: site.name,
            location: site.location,
            lat: site.lat,
            lng: site.lng,
            to: `/apps/events/sites/${site.id}${search}`,
            attention: alarms.length > 0,
            waiting: alarms.length === 0 && site.systems.length === 0,
          }))}
        />
      </section>
      <section className="dash-sites" aria-label="건물 목록">
        {sites.length === 0 ? <div className="empty">찾는 건물이 없습니다.</div> : null}
        {sites.map(({ site, focusState }) => (
          <article key={site.id} className={`dash-site${focusState.tone === 'warn' ? ' is-attention' : ''}`}>
            <Link className="dash-site-main" to={`/apps/events/sites/${site.id}${search}`}>
              <div className="dash-site-top">
                <strong>{site.name}</strong>
                <em className={`is-${focusState.tone}`}>{focusState.line}</em>
              </div>
              <span>{site.location || '위치 미등록'}</span>
            </Link>
            <SiteServices siteId={site.id} systems={site.systems} search={search} current={focus} />
          </article>
        ))}
      </section>
    </div>
  )
}
