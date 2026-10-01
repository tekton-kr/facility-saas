import { NavLink } from 'react-router-dom'
import { siteHasApp, systemMatchesApp } from '../lib/catalog.ts'
import { isDomainCollected } from '../lib/collection.ts'
import { hasPortfolio, visibleSites } from '../lib/siteScope.ts'
import { KIND_LABEL } from '../lib/format.ts'
import { dutySiteId } from '../lib/roleHome.ts'
import { alarmsForScope } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'
import type { AlarmSeverity } from '../types/domain.ts'

function siteDot(siteId: string): AlarmSeverity | 'ok' {
  const alarms = alarmsForScope({ siteId })
  if (alarms.some((item) => item.severity === 'critical')) return 'critical'
  if (alarms.some((item) => item.severity === 'warning')) return 'warning'
  return 'ok'
}

type Props = {
  open: boolean
  onNavigate: () => void
}

export function SiteTree({ open, onNavigate }: Props) {
  const { app, search, siteId, systemId, query, role, command } = useScope()
  const q = query.trim().toLowerCase()
  const portfolio = (role === 'exec' || command) && hasPortfolio()
  const portfolioTo = command
    ? `/apps/events${search}`
    : portfolio
      ? `/apps/${app}${search}`
      : `/apps/${app}/sites/${dutySiteId(app)}${search}`

  return (
    <aside className={`tree${open ? ' is-open' : ''}`}>
      <div className="tree-head">현장</div>
      <nav className="tree-nav" aria-label="현장 트리">
        <NavLink
          to={portfolioTo}
          end={portfolio}
          className={({ isActive }) => `tree-link${portfolio && isActive && !siteId ? ' is-active' : ''}`}
          onClick={onNavigate}
        >
          {command ? '전체 현장' : portfolio ? '포트폴리오' : '배정 현장'}
        </NavLink>
        {visibleSites().filter((site) => siteHasApp(site, app)).map((site) => {
          const hay = `${site.name} ${site.location} ${site.systems.map((system) => system.name).join(' ')}`.toLowerCase()
          if (q && !hay.includes(q)) return null
          const severity = siteDot(site.id)
          const expanded = role === 'ops' && siteId === site.id
          const systems = site.systems.filter((system) => app === 'events' || systemMatchesApp(system, app))
          return (
            <div key={site.id}>
              <NavLink
                to={`/apps/${app}/sites/${site.id}${search}`}
                className={({ isActive }) => `tree-site${isActive ? ' is-active' : ''}`}
                onClick={onNavigate}
              >
                <span>{site.name}<span className="tree-kind"> {KIND_LABEL[site.kind]}</span></span>
                <span className={`tree-dot is-${severity}`} aria-hidden="true" />
              </NavLink>
              {expanded ? (
                <div className="tree-children">
                  {systems.map((system) => (
                    <NavLink
                      key={system.id}
                      to={`/apps/${app}/sites/${site.id}/systems/${system.id}${search}`}
                      className={() => `tree-child${systemId === system.id ? ' is-active' : ''}`}
                      onClick={onNavigate}
                    >
                      {system.wing ? `${system.wing} · ` : ''}{system.name}
                      {isDomainCollected(system.domain) ? null : <span className="tree-pending"> 대기</span>}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
        <div className="tree-head">관리</div>
        {role === 'ops' ? (
          <NavLink
            to={siteId ? `/sites/${siteId}/work${search}` : `/work${search}`}
            className="tree-link"
            onClick={onNavigate}
          >
            작업
          </NavLink>
        ) : null}
        <NavLink
          to={siteId ? `/sites/${siteId}/contract${search}` : `/sites/${dutySiteId('events')}/contract${search}`}
          className="tree-link"
          onClick={onNavigate}
        >
          계약
        </NavLink>
        <NavLink to={`/packages${search}`} className="tree-link" onClick={onNavigate}>
          개보수
        </NavLink>
        <NavLink to={`/settings${search}`} className="tree-link" onClick={onNavigate}>
          설정
        </NavLink>
      </nav>
    </aside>
  )
}
