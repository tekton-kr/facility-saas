import { NavLink } from 'react-router-dom'
import { siteHasApp, systemMatchesApp } from '../lib/catalog.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { getScreens } from '../data/screens.ts'
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
  const { app, search, siteId, systemId, query, role } = useScope()
  const q = query.trim().toLowerCase()
  const portfolioTo = role === 'exec'
    ? `/apps/${app}${search}`
    : `/apps/${app}/sites/${dutySiteId(app)}${search}`

  return (
    <aside className={`tree${open ? ' is-open' : ''}`}>
      <div className="tree-head">현장</div>
      <nav className="tree-nav" aria-label="현장 트리">
        <NavLink
          to={portfolioTo}
          end={role === 'exec'}
          className={({ isActive }) => `tree-link${role === 'exec' && isActive && !siteId ? ' is-active' : ''}`}
          onClick={onNavigate}
        >
          {role === 'exec' ? '포트폴리오' : '근무 현장'}
        </NavLink>
        <NavLink
          to={siteId ? `/sites/${siteId}/work${search}` : `/work${search}`}
          className="tree-link"
          onClick={onNavigate}
        >
          작업
        </NavLink>
        <NavLink
          to={siteId ? `/sites/${siteId}/contract${search}` : role === 'ops' ? `/sites/${dutySiteId('events')}/contract${search}` : `/packages${search}`}
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
        <NavLink to={`/screens${search}`} className="tree-link" onClick={onNavigate}>
          화면 {getScreens().length}면
        </NavLink>
        <NavLink to={`/quality${search}`} className="tree-link" onClick={onNavigate}>
          데이터 품질
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
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
