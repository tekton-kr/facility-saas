import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { accountLabel, homePath, leaveLabel, signOut } from '../lib/auth.ts'
import { getSite } from '../lib/catalog.ts'
import { DEMO_SITES } from '../data/ownerDemo.ts'
import { useAuth } from '../lib/useAuth.ts'
import { AppNav } from './AppNav.tsx'
import { PropertyFilter } from './PropertyFilter.tsx'
import { TimeWindow } from './TimeWindow.tsx'
import { hasPortfolio, visibleSites } from '../lib/siteScope.ts'
import { formatDateTime, KIND_LABEL, ROLE_LABEL } from '../lib/format.ts'
import { alarmsForScope, lastSyncAt } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'
import type { AppId, Role } from '../types/domain.ts'

const SERVICE_LABEL: Partial<Record<AppId, string>> = {
  events: '설비자동제어',
  power: '전력',
  metering: '원격검침',
  solar: '제로에너지',
}

function siteLabel(siteId: string | undefined): string | undefined {
  if (!siteId) return undefined
  return getSite(siteId)?.name ?? DEMO_SITES.find((site) => site.id === siteId)?.name
}

function headerCopy(pathname: string, siteName: string | undefined, app: AppId | undefined): { kicker: string, title: string } {
  if (pathname.startsWith('/profile')) return { kicker: siteName ?? '계정', title: '프로필' }
  if (pathname.startsWith('/settings')) return { kicker: siteName ?? '계정', title: '설정' }
  if (pathname.includes('/contract')) return { kicker: siteName ?? '시설관리', title: '유지보수' }
  if (pathname.includes('/calendar')) return { kicker: siteName ?? '시설관리', title: '일정표' }
  if (pathname.includes('/roster')) return { kicker: siteName ?? '시설관리', title: '근무표' }
  if (pathname.includes('/meters')) return { kicker: siteName ?? '시설관리', title: '설비 전력량계' }
  if (pathname.includes('/domains/ehp')) return { kicker: siteName ?? '대시보드', title: 'EHP' }
  if (pathname.includes('/domains/fire')) return { kicker: siteName ?? '대시보드', title: '소방' }
  if (pathname.includes('/domains/elevator')) return { kicker: siteName ?? '대시보드', title: '엘리베이터' }
  if (pathname.startsWith('/packages')) return { kicker: siteName ?? '시설관리', title: '개보수' }
  return {
    kicker: (app && SERVICE_LABEL[app]) || '시설관리',
    title: siteName ?? '전체 현장',
  }
}

type Props = {
  compact: boolean
  onToggleTree: () => void
  onOpenCommand: () => void
}

export function FilterBar({ compact, onToggleTree, onOpenCommand }: Props) {
  const session = useAuth()
  const location = useLocation()
  const { app, siteId, range, query, role, command, search, patchParams, goSite, goHome, goRole } = useScope()
  const sync = lastSyncAt()
  const critical = alarmsForScope({ siteId, app: 'events' }).filter((item) => item.severity === 'critical').length
  const ownerHome = role === 'exec' && !command
  const place = siteLabel(siteId)
  const heading = headerCopy(location.pathname, place, app)

  return (
    <header className="filter">
      <div className="filter-row">
        <button className="filter-toggle" type="button" onClick={onToggleTree}>
          현장
        </button>
        {ownerHome ? (
          <div className="filter-title">
            <span>{heading.kicker}</span>
            <div className="filter-title-line">
              <strong>{heading.title}</strong>
              <SiteSwitch siteId={siteId} onPick={goSite} onAll={goHome} />
            </div>
          </div>
        ) : null}
        {ownerHome ? null : (
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
        )}
        {compact || ownerHome ? null : <span className="filter-sync">마지막 동기화 {formatDateTime(sync)}</span>}
        <div className="account-chip">
          {compact ? null : (
            <Link className="filter-user" to="/profile">
              {session ? accountLabel(session) : role === 'exec' ? '관리단 · 건물주' : '관리소장 · 시설직원'}
            </Link>
          )}
          {compact ? <Link className="filter-user" to="/profile">프로필</Link> : null}
          <LogoutButton label={leaveLabel(session?.entry)} />
        </div>
        <FullscreenButton />
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
      {compact || ownerHome ? null : <PropertyFilter />}
      {ownerHome ? null : (
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
      )}
    </header>
  )
}

function SiteSwitch({ siteId, onPick, onAll }: { siteId: string | undefined; onPick: (id: string) => void; onAll: () => void }) {
  const sites = visibleSites()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    function close() {
      setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', close)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', close)
    }
  }, [open])
  if (sites.length === 0) return null

  return (
    <div className="site-switch" onPointerDown={(event) => event.stopPropagation()}>
      <button
        type="button"
        aria-label="현장 변경"
        aria-expanded={open}
        title="현장 변경"
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 7h11M15 4l3 3-3 3M17 17H6M9 14l-3 3 3 3" />
        </svg>
      </button>
      {open ? (
        <div className="site-switch-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { onAll(); setOpen(false) }}>전체 현장</button>
          {sites.map((site) => (
            <button
              key={site.id}
              type="button"
              role="menuitem"
              className={site.id === siteId ? 'is-on' : ''}
              onClick={() => { onPick(site.id); setOpen(false) }}
            >
              {site.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function BackButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = useAuth()
  const home = session ? homePath(session).split('?')[0] : ''
  const onOwnerMain = session?.role === 'exec'
    && /^\/apps\/(events|power|metering|solar)(\/sites\/[^/]+)?$/.test(location.pathname)
  const onMain = onOwnerMain || (home !== '' && location.pathname === home)
  const canBack = location.key !== 'default' && !onMain

  if (!canBack) return null

  return (
    <button
      className="filter-fullscreen"
      type="button"
      aria-label="뒤로가기"
      onClick={() => {
        if (window.history.length > 1) navigate(-1)
        else if (session) navigate(homePath(session))
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.5 5.5 8 12l6.5 6.5" />
      </svg>
    </button>
  )
}

function FullscreenButton() {
  const [active, setActive] = useState(() => Boolean(document.fullscreenElement))

  useEffect(() => {
    const sync = () => setActive(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  async function toggle() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      /* 브라우저가 전체보기를 막은 경우 */
    }
  }

  return (
    <button
      className="filter-fullscreen"
      type="button"
      aria-label={active ? '전체보기 끝내기' : '전체보기'}
      aria-pressed={active}
      onClick={() => void toggle()}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {active ? (
          <path d="M9 4v5H4M15 4v5h5M20 15h-5v5M4 15h5v5" />
        ) : (
          <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
        )}
      </svg>
    </button>
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
