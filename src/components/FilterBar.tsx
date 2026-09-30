import { Link } from 'react-router-dom'
import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { leaveLabel, signOut } from '../lib/auth.ts'
import { useAuth } from '../lib/useAuth.ts'
import { AppNav } from './AppNav.tsx'
import { PropertyFilter } from './PropertyFilter.tsx'
import { TimeWindow } from './TimeWindow.tsx'
import { hasPortfolio, visibleSites } from '../lib/siteScope.ts'
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
  const { app, siteId, range, query, role, command, search, patchParams, goSite, goHome, goRole } = useScope()
  const sync = lastSyncAt()
  const critical = alarmsForScope({ siteId, app: 'events' }).filter((item) => item.severity === 'critical').length

  return (
    <header className="filter">
      <div className="filter-row">
        <button className="filter-toggle" type="button" onClick={onToggleTree}>
          현장
        </button>
        <div className="filter-fields">
          {visibleSites().length > 1 ? (
            <select
              aria-label="현장"
              value={siteId ?? ''}
              onChange={(event) => {
                const value = event.target.value
                if (!value) goHome()
                else goSite(value)
              }}
            >
              {(role === 'exec' || command) && hasPortfolio() ? (
                <option value="">{command ? '전체 현장' : '배정 현장'}</option>
              ) : null}
              {visibleSites().map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} · {KIND_LABEL[site.kind]}
                </option>
              ))}
            </select>
          ) : (
            <span className="filter-site-name">{visibleSites()[0]?.name ?? '현장'}</span>
          )}
          {compact || (app === 'events' && role === 'ops') ? null : (
            <TimeWindow value={range} onChange={(value) => patchParams({ range: value })} />
          )}
          <input
            aria-label="검색"
            placeholder={role === 'exec' ? '이상 현장' : '예외·장비'}
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
        <div className="account-chip">
          {compact ? null : (
            <span className="filter-user">
              {session
                ? session.entry === 'station' || session.entry === 'staff'
                  ? `${session.name} · 현장`
                  : session.entry === 'notify'
                    ? `${session.name} · 알림`
                    : session.entry === 'command'
                      ? `${session.name} · 통합 관제`
                      : `${session.name} · 경영`
                : role === 'exec' ? '경영 · 감시' : '운전자 · 감시'}
            </span>
          )}
          <LogoutButton label={leaveLabel(session?.entry)} />
        </div>
        {compact && app !== 'events' ? (
          <Link className="alarm-badge" to={`/apps/events${siteId ? `/sites/${siteId}` : ''}${search}`}>
            위험 {critical}
          </Link>
        ) : null}
        {compact && !session ? (
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
      <div className="filter-row filter-apps">
        <AppNav />
        {compact || session ? null : (
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
        )}
      </div>
    </header>
  )
}

function LogoutButton({ label }: { label: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="filter-logout" type="button">
        {label}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="confirm-backdrop" />
        <Dialog.Content className="confirm-dialog">
          <Dialog.Title>로그아웃</Dialog.Title>
          <p>정말로 로그아웃하시겠습니까?</p>
          <div className="confirm-actions">
            <button type="button" onClick={() => setOpen(false)}>취소</button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                signOut()
              }}
            >
              확인
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
