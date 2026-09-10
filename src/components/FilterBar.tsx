import { Link } from 'react-router-dom'
import { signOut } from '../lib/auth.ts'
import { useAuth } from '../lib/useAuth.ts'
import { AppNav } from './AppNav.tsx'
import { PropertyFilter } from './PropertyFilter.tsx'
import { TimeWindow } from './TimeWindow.tsx'
import { getSites } from '../lib/catalog.ts'
import { formatDateTime, KIND_LABEL, ROLE_LABEL } from '../lib/format.ts'
import { alarmsForScope, lastSyncAt } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'
import type { Role } from '../types/domain.ts'

type Props = {
  compact: boolean
  onToggleTree: () => void
  onOpenCommand: () => void
}

export function FilterBar({ compact, onToggleTree, onOpenCommand }: Props) {
  const session = useAuth()
  const { app, siteId, range, query, role, search, patchParams, goSite, goHome, goRole } = useScope()
  const sync = lastSyncAt()
  const critical = alarmsForScope({ siteId, app: 'events' }).filter((item) => item.severity === 'critical').length

  return (
    <header className="filter">
      <div className="filter-row">
        <button className="filter-toggle" type="button" onClick={onToggleTree}>
          현장
        </button>
        <div className="filter-fields">
          <select
            aria-label="현장"
            value={siteId ?? ''}
            onChange={(event) => {
              const value = event.target.value
              if (!value) goHome()
              else goSite(value)
            }}
          >
            {role === 'exec' ? <option value="">포트폴리오</option> : null}
            {getSites().map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} · {KIND_LABEL[site.kind]}
              </option>
            ))}
          </select>
          {compact || (app === 'events' && role === 'ops') ? null : (
            <TimeWindow value={range} onChange={(value) => patchParams({ range: value })} />
          )}
          <input
            aria-label="검색"
            placeholder={role === 'exec' ? '이상 현장' : '장비·관제점'}
            value={query}
            onChange={(event) => patchParams({ q: event.target.value })}
          />
          {compact ? null : (
            <button className="filter-command" type="button" onClick={onOpenCommand}>
              점프 Ctrl+K
            </button>
          )}
        </div>
        {compact ? null : <span className="filter-sync">마지막 동기화 {formatDateTime(sync)}</span>}
        {compact ? null : (
          <span className="filter-user">
            {session ? `${session.name} · ${ROLE_LABEL[session.role]}` : role === 'exec' ? '경영 · 감시' : '운전자 · 감시'}
          </span>
        )}
        <button
          className="filter-logout"
          type="button"
          onClick={() => signOut()}
        >
          로그아웃
        </button>
        {compact && app !== 'events' ? (
          <Link className="alarm-badge" to={`/apps/events${siteId ? `/sites/${siteId}` : ''}${search}`}>
            위험 {critical}
          </Link>
        ) : null}
        {compact ? (
          <div className="role-switch" role="group" aria-label="역할">
            {(['ops', 'exec'] as Role[]).map((item) => (
              <button
                key={item}
                type="button"
                className={role === item ? 'is-active' : ''}
                onClick={() => goRole(item)}
              >
                {ROLE_LABEL[item]}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {compact ? null : <PropertyFilter />}
      {compact ? null : (
        <div className="filter-row filter-apps">
          <AppNav />
          <div className="role-switch" role="group" aria-label="역할">
            {(['ops', 'exec'] as Role[]).map((item) => (
              <button
                key={item}
                type="button"
                className={role === item ? 'is-active' : ''}
                onClick={() => goRole(item)}
              >
                {ROLE_LABEL[item]}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
