import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { accountLabel, getSession, getToken, homePath, leaveLabel, signOut } from '../lib/auth.ts'
import { getSite } from '../lib/catalog.ts'
import { DEMO_SITES } from '../data/ownerDemo.ts'
import { useAuth } from '../lib/useAuth.ts'
import { AppNav } from './AppNav.tsx'
import { PropertyFilter } from './PropertyFilter.tsx'
import { TimeWindow } from './TimeWindow.tsx'
import { hasPortfolio, visibleSites } from '../lib/siteScope.ts'
import { formatDateTime, KIND_LABEL, ROLE_LABEL } from '../lib/format.ts'
import { lastSyncAt, liveAlarms, siteHealth, subscribeTelemetry } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'
import type { AppId, Role } from '../types/domain.ts'

const SERVICE_LABEL: Partial<Record<AppId, string>> = {
  events: '기계설비',
  power: '전력',
  metering: '원격검침',
  solar: '제로에너지',
}

function siteLabel(siteId: string | undefined): string | undefined {
  if (!siteId) return undefined
  return getSite(siteId)?.name ?? DEMO_SITES.find((site) => site.id === siteId)?.name
}

function headerCopy(pathname: string, siteName: string | undefined, app: AppId | undefined): { kicker: string, title: string } {
  const place = siteName ?? '전체 현장'
  if (pathname.startsWith('/profile')) return { kicker: '계정', title: '프로필' }
  if (pathname.startsWith('/settings')) return { kicker: '계정', title: place }
  if (pathname.startsWith('/reports')) return { kicker: '대시보드', title: '리포트' }
  if (!siteName && /^\/apps\/[^/]+$/.test(pathname)) {
    return { kicker: '대시보드', title: '배정 현황' }
  }
  if (/\/(roster|work|staff|sheets)(\/|$)/.test(pathname) || pathname.includes('/domains/')) {
    return { kicker: '현장', title: place }
  }
  if (/\/(inspections|diagnosis|cycles|photos|drawings|meters|schedule|contract|calendar|packages|assets|sheets)(\/|$)/.test(pathname)) {
    return { kicker: '대시보드', title: place }
  }
  return {
    kicker: (app && SERVICE_LABEL[app]) || '시설관리',
    title: place,
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
  const { app, siteId, range, query, role, command, search, view, patchParams, goSite, goHome, goRole } = useScope()
  const sync = lastSyncAt()
  const alarms = liveAlarms(siteId)
  const critical = alarms.filter((item) => item.severity === 'critical').length
  const ownerHome = role === 'exec' && !command
  const staffDesk = role !== 'exec' && !command
  const place = siteLabel(siteId)
  const heading = view === 'flow'
    ? { kicker: '현장', title: headerCopy(location.pathname, place, app).title }
    : headerCopy(location.pathname, place, app)

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
              {siteId ? <SiteSwitch siteId={siteId} onPick={goSite} /> : null}
            </div>
          </div>
        ) : null}
        {ownerHome || staffDesk ? null : (
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
        {compact || ownerHome || staffDesk ? null : <span className="filter-sync">마지막 동기화 {formatDateTime(sync)}</span>}
        <div className="filter-end">
          <SystemStatus compact={compact} siteId={siteId} />
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
      {compact || ownerHome || staffDesk ? null : <PropertyFilter />}
      {ownerHome || staffDesk ? null : (
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

function SystemStatus({ compact, siteId }: { compact: boolean; siteId?: string }) {
  const [open, setOpen] = useState(false)
  const [, setTick] = useState(0)
  useEffect(() => subscribeTelemetry(() => setTick((value) => value + 1)), [])
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const session = getSession()
  const signedIn = Boolean(session && getToken())
  const health = siteHealth(siteId)
  const alarms = liveAlarms(siteId)
  const collected = health.filter((item) => item.collected)
  const offline = health.filter((item) => item.offline)
  const delayed = health.filter((item) => item.delayed && !item.offline)
  const silent = health.filter((item) => !item.collected)
  const sync = lastSyncAt()
  const age = Date.now() - new Date(sync).getTime()
  const stale = !Number.isFinite(age) || age > 24 * 60 * 60 * 1000
  const tone = !signedIn ? 'down' : offline.length > 0 ? 'down' : silent.length === health.length && health.length > 0 ? 'wait' : stale || delayed.length > 0 ? 'late' : 'ok'
  const label = !signedIn ? '끊김' : offline.length > 0 ? '통신 이상' : silent.length === health.length && health.length > 0 ? '수집 없음' : delayed.length > 0 || stale ? '지연' : '수집 중'
  const summary = [
    `수집 ${collected.length}곳, 수신 없음 ${silent.length}곳`,
    offline.length > 0 ? `통신 이상 ${offline.map((item) => item.name).join(', ')}` : '확인된 통신 이상은 없습니다',
    `알람 ${alarms.length}`,
  ].join('. ')

  return (
    <div className="sys-status-wrap">
      <button
        className={`sys-status is-${tone}${compact ? ' is-compact' : ''}`}
        type="button"
        aria-expanded={open}
        aria-label={`시스템 ${label}. ${summary}`}
        onClick={() => setOpen((value) => !value)}
      >
        <i />
        {compact ? null : (
          <>
            <em>시스템</em>
            {label}
          </>
        )}
        {alarms.length > 0 ? <b>{alarms.length}</b> : null}
      </button>
      {open ? (
        <div className="sys-panel" role="dialog" aria-label="시스템 상태">
          <p>수집</p>
          <strong>{collected.length}곳 수신 · {silent.length}곳 수신 없음</strong>
          <p>현장 통신</p>
          {offline.length === 0 && delayed.length === 0 ? (
            <strong>확인된 통신 이상은 없습니다. 상태를 받지 못한 현장은 판단하지 않습니다.</strong>
          ) : (
            <ul>
              {offline.map((item) => <li key={item.id}>{item.name} · 통신 이상</li>)}
              {delayed.map((item) => <li key={item.id}>{item.name} · 수신 지연</li>)}
            </ul>
          )}
          <p>알람</p>
          <strong>{alarms.length === 0 ? '없음' : `${alarms.length}`}</strong>
          <p>목록 수신 {formatDateTime(sync)}</p>
        </div>
      ) : null}
    </div>
  )
}

function SiteSwitch({ siteId, onPick }: { siteId: string; onPick: (id: string) => void }) {
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
  if (sites.length < 2) return null

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
