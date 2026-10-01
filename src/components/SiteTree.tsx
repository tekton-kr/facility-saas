import { NavLink } from 'react-router-dom'
import { siteHasApp, systemMatchesApp } from '../lib/catalog.ts'
import { isDomainCollected } from '../lib/collection.ts'
import { visibleSites } from '../lib/siteScope.ts'
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
  const currentId = siteId || dutySiteId(app)
  const wallTo = `/apps/${app}${search}`
  const boardTo = currentId ? `/apps/${app}/sites/${currentId}${search}` : wallTo

  return (
    <aside className={`tree${open ? ' is-open' : ''}`}>
      <div className="tree-modes" role="group" aria-label="화면">
        <NavLink
          to={wallTo}
          end
          className={({ isActive }) => `tree-mode${isActive ? ' is-on' : ''}`}
          onClick={onNavigate}
        >
          상황판
        </NavLink>
        {currentId ? (
          <NavLink
            to={boardTo}
            className={({ isActive }) => `tree-mode${isActive ? ' is-on' : ''}`}
            onClick={onNavigate}
          >
            대시보드
          </NavLink>
        ) : (
          <span className="tree-mode is-disabled">대시보드</span>
        )}
      </div>
      <nav className="tree-nav" aria-label="현장 트리">
      <div className="tree-head">현장</div>
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
        <div className="tree-head">설비</div>
        <NavLink to={siteId ? `/sites/${siteId}/inspections${search}` : `/inspections${search}`} className="tree-link" onClick={onNavigate}>점검</NavLink>
        <NavLink to={siteId ? `/sites/${siteId}/cycles${search}` : `/cycles${search}`} className="tree-link" onClick={onNavigate}>세척·교체 주기</NavLink>
        <NavLink to={siteId ? `/sites/${siteId}/photos${search}` : `/photos${search}`} className="tree-link" onClick={onNavigate}>사진·설명</NavLink>
        <NavLink to={siteId ? `/sites/${siteId}/drawings${search}` : `/drawings${search}`} className="tree-link" onClick={onNavigate}>준공 도면</NavLink>
        <div className="tree-head">일정</div>
        <NavLink to={siteId ? `/sites/${siteId}/schedule${search}` : `/schedule${search}`} className="tree-link" onClick={onNavigate}>공사·업체 방문</NavLink>
        <div className="tree-head">기록</div>
        <NavLink
          to={siteId ? `/sites/${siteId}/work${search}` : `/work${search}`}
          className="tree-link"
          onClick={onNavigate}
        >
          작업 내역
        </NavLink>
        <NavLink
          to={siteId ? `/sites/${siteId}/contract${search}` : `/contract${search}`}
          className="tree-link"
          onClick={onNavigate}
        >
          계약
        </NavLink>
        <NavLink to={`/settings${search}`} className="tree-link" onClick={onNavigate}>
          설정
        </NavLink>
      </nav>
      <footer className="tree-foot">
        <NavLink className="tree-guide" to="/guide" onClick={onNavigate}>
          이용방법
        </NavLink>
        <p className="tree-copy">© 2026 TEKTON</p>
      </footer>
    </aside>
  )
}
