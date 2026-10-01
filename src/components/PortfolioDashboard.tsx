import { Link } from 'react-router-dom'
import type { AppId } from '../types/domain.ts'
import { alarmsForScope } from '../lib/telemetry.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { useScope } from '../lib/useScope.ts'
import { SiteMap } from './SiteMap.tsx'

const TITLE: Record<'events' | 'power' | 'metering' | 'solar', string> = {
  events: '설비자동제어',
  power: '전력',
  metering: '원격검침',
  solar: '제로에너지',
}

export function PortfolioDashboard({ service }: { service: AppId }) {
  const { search } = useScope()
  const focus = service === 'power' || service === 'metering' || service === 'solar' ? service : 'events'
  const title = TITLE[focus]
  const sites = visibleSites()
    .map((site) => {
      const alarms = alarmsForScope({ siteId: site.id }).filter((item) => item.severity === 'critical' || item.severity === 'warning')
      return { site, alarms }
    })
    .sort((a, b) => b.alarms.length - a.alarms.length)
  const attention = sites.filter((item) => item.alarms.length > 0).length

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <p className="page-kicker">배정 현장 {sites.length}</p>
          <h1>현장 · {title}</h1>
          <p>어디가 이상한지 고릅니다. 현장을 열면 그 건물의 {title}을 봅니다.</p>
        </div>
      </header>
      <section className="dash-stats" aria-label="배정 현장 상태">
        <article>
          <span>현장</span>
          <strong>{sites.length}</strong>
          <em>배정된 건물</em>
        </article>
        <article>
          <span>이상 현장</span>
          <strong>{attention}</strong>
          <em>{attention > 0 ? '시설팀에 연락할 곳' : '열린 위험·주의 없음'}</em>
        </article>
        <article>
          <span>수신</span>
          <strong>{sites.filter((item) => item.site.systems.length === 0).length}</strong>
          <em>계측 대기 현장</em>
        </article>
        <article>
          <span>서비스</span>
          <strong>{title}</strong>
          <em>설비자동제어가 기본입니다</em>
        </article>
      </section>
      <SiteMap
        sites={sites.map(({ site, alarms }) => ({
          id: site.id,
          name: site.name,
          location: site.location,
          lat: site.lat,
          lng: site.lng,
          to: `/apps/${service}/sites/${site.id}${search}`,
          attention: alarms.length > 0,
        }))}
      />
      <section className="dash-sites" aria-label="현장 목록">
        {sites.map(({ site, alarms }) => (
          <Link
            key={site.id}
            className={`dash-site${alarms.length > 0 ? ' is-attention' : ''}`}
            to={`/apps/${service}/sites/${site.id}${search}`}
          >
            <div className="dash-site-top">
              <strong>{site.name}</strong>
              <em>{alarms.length > 0 ? `이상 ${alarms.length}` : '이상 없음'}</em>
            </div>
            <span>{site.location || '위치 미등록'}</span>
            <ul>
              <li>{site.systems.length > 0 ? `설비 ${site.systems.length}` : '자동제어 연동 대기'}</li>
              <li>{alarms[0]?.title ?? '수신 대기'}</li>
            </ul>
          </Link>
        ))}
      </section>
    </div>
  )
}
