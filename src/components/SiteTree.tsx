import { NavLink, useLocation } from 'react-router-dom'
import { dutySiteId } from '../lib/roleHome.ts'
import { useScope } from '../lib/useScope.ts'
import type { AppId } from '../types/domain.ts'

type Props = {
  open: boolean
  onNavigate: () => void
}

const BOARD_APPS: { id: AppId; label: string }[] = [
  { id: 'events', label: '자동제어' },
  { id: 'power', label: '전력' },
  { id: 'metering', label: '원격검침' },
]

const BOARD_PENDING = [
  { id: 'ehp', label: 'EHP' },
  { id: 'fire', label: '소방' },
  { id: 'elevator', label: '엘리베이터' },
]

function Mark({ id }: { id: string }) {
  return (
    <svg className="tree-mark" viewBox="0 0 24 24" aria-hidden="true">
      {id === 'overview' ? <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /> : null}
      {id === 'control' ? <path d="M4 8h16M4 16h16M8 8v8M16 8v8" /> : null}
      {id === 'power' ? <path d="M13 3 6 13h5l-1 8 8-12h-5l1-6Z" /> : null}
      {id === 'meter' ? <path d="M4 18h16M7 18V9M12 18V6M17 18v-5" /> : null}
      {id === 'ehp' ? <path d="M12 3v3M12 18v3M4.5 7.5 7 9M17 15l2.5 1.5M4.5 16.5 7 15M17 9l2.5-1.5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /> : null}
      {id === 'fire' ? <path d="M12 3s5 4 5 8a5 5 0 0 1-10 0c0-2 2-3 2-5 2 1 3 2 3 4 0-3 0-5 0-7Z" /> : null}
      {id === 'lift' ? <path d="M8 21V4h8v17M8 10h8M12 7l-1.5 2h3L12 7ZM12 17l1.5-2h-3L12 17Z" /> : null}
      {id === 'ev' ? <path d="M4 15h14l-1-5H8L4 15Zm2 0v2m8-2v2M14 7h3l1 3" /> : null}
      {id === 'park' ? <path d="M7 19V5h6.5a4 4 0 0 1 0 8H7" /> : null}
      {id === 'check' ? <path d="M5 12.5 9 16l10-9" /> : null}
      {id === 'cycle' ? <path d="M7 7h8l2 3-2 3H7L5 10l2-3ZM9 16h6" /> : null}
      {id === 'photo' ? <path d="M4 7h4l1.5-2h5L16 7h4v11H4V7ZM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /> : null}
      {id === 'draw' ? <path d="M5 5h10l4 4v10H5V5ZM15 5v4h4" /> : null}
      {id === 'gauge' ? <path d="M5 16a7 7 0 1 1 14 0M12 16l4-4" /> : null}
      {id === 'cal' ? <path d="M5 6h14v13H5V6ZM5 10h14M8 4v4M16 4v4" /> : null}
      {id === 'visit' ? <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 19c.6-2.5 2.4-4 5-4s4.4 1.5 5 4M16 11a2.5 2.5 0 1 0 0-5M16 15c2 .4 3.4 1.6 4 4" /> : null}
      {id === 'roster' ? <path d="M8 6h11M8 12h11M8 18h11M5 6h.01M5 12h.01M5 18h.01" /> : null}
      {id === 'work' ? <path d="M4 8h16v11H4V8ZM8 8V6h8v2" /> : null}
      {id === 'contract' ? <path d="M7 4h8l3 3v13H7V4ZM15 4v3h3M9 12h6M9 16h4" /> : null}
      {id === 'gear' ? <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM12 3v2.2M12 18.8V21M4.9 6.5l1.6 1.6M17.5 15.9l1.6 1.6M3 12h2.2M18.8 12H21M4.9 17.5l1.6-1.6M17.5 8.1l1.6-1.6" /> : null}
    </svg>
  )
}
function situationPath(pathname: string): boolean {
  if (/^\/apps\/[^/]+$/.test(pathname)) return true
  if (pathname.startsWith('/settings')) return true
  return /\/(inspections|cycles|photos|drawings|meters|schedule|contract)(\/|$)/.test(pathname)
}

export function SiteTree({ open, onNavigate }: Props) {
  const { app, search, siteId, role, command, view } = useScope()
  const { pathname } = useLocation()
  const owner = role === 'exec' || command
  const wall = owner && situationPath(pathname)
  const currentId = siteId || dutySiteId(app)
  const bareSearch = search.replace(/(^\?|&)view=[^&]*/g, '').replace(/^\?&/, '?').replace(/\?$/, '')
  const wallTo = `/apps/events${bareSearch}`
  const boardTo = currentId ? `/apps/${app}/sites/${currentId}${bareSearch}` : wallTo
  const record = (path: string) => siteId ? `/sites/${siteId}/${path}${bareSearch}` : `/${path}${bareSearch}`
  const flowSearch = bareSearch ? `${bareSearch}&view=flow` : '?view=flow'
  const flowTo = currentId ? `/apps/events/sites/${currentId}${flowSearch}` : wallTo
  const serviceTo = (next: AppId) => currentId ? `/apps/${next}/sites/${currentId}${bareSearch}` : `/apps/${next}${bareSearch}`
  const pendingTo = (id: string) => currentId ? `/sites/${currentId}/domains/${id}${bareSearch}` : `/domains/${id}${bareSearch}`

  return (
    <aside className={`tree${open ? ' is-open' : ''}`}>
      <div className="tree-modes" role="group" aria-label="화면">
        {owner ? (
          <NavLink
            to={wallTo}
            end
            className={`tree-mode${wall ? ' is-on' : ''}`}
            onClick={onNavigate}
          >
            대시보드
          </NavLink>
        ) : null}
        {currentId ? (
          <NavLink
            to={boardTo}
            className={`tree-mode${wall ? '' : ' is-on'}`}
            onClick={onNavigate}
          >
            현장
          </NavLink>
        ) : (
          <span className="tree-mode is-disabled">현장</span>
        )}
      </div>
      <nav className="tree-nav" aria-label="메뉴">
        {wall ? (
          <>
            <NavLink
              to={wallTo}
              end
              className={({ isActive }) => `tree-link is-feature${isActive ? ' is-active' : ''}`}
              onClick={onNavigate}
            >
              <Mark id="overview" />
              전체 현장
            </NavLink>
            <div className="tree-head">설비</div>
            <NavLink to={record('inspections')} className="tree-link" onClick={onNavigate}><Mark id="check" />점검</NavLink>
            <NavLink to={record('cycles')} className="tree-link" onClick={onNavigate}><Mark id="cycle" />세척·교체 주기</NavLink>
            <NavLink to={record('photos')} className="tree-link" onClick={onNavigate}><Mark id="photo" />사진·설명</NavLink>
            <NavLink to={record('drawings')} className="tree-link" onClick={onNavigate}><Mark id="draw" />준공 도면</NavLink>
            <NavLink to={record('meters')} className="tree-link" onClick={onNavigate}><Mark id="gauge" />설비 전력량계</NavLink>
            <div className="tree-head">일정</div>
            <NavLink to={record('schedule')} className="tree-link" onClick={onNavigate}><Mark id="visit" />공사·업체 방문</NavLink>
            <div className="tree-head">기록</div>
            <NavLink to={record('contract')} className="tree-link" onClick={onNavigate}><Mark id="contract" />유지보수</NavLink>
            <div className="tree-head">설정</div>
            <NavLink to={`/settings${search}`} className="tree-link" onClick={onNavigate}><Mark id="gear" />설정</NavLink>
          </>
        ) : (
          <>
            <NavLink
              to={flowTo}
              className={`tree-link is-feature${view === 'flow' ? ' is-active' : ''}`}
              onClick={onNavigate}
            >
              <Mark id="overview" />
              종합관제
            </NavLink>
            <div className="tree-head">관제</div>
            {BOARD_APPS.map((item) => (
              <NavLink
                key={item.id}
                to={serviceTo(item.id)}
                className={({ isActive }) => `tree-link${(item.id === 'events' ? pathname === `/apps/events/sites/${currentId}` && view !== 'flow' : isActive) ? ' is-active' : ''}`}
                onClick={onNavigate}
              >
                <Mark id={item.id === 'events' ? 'control' : item.id === 'power' ? 'power' : 'meter'} />
                {item.label}
              </NavLink>
            ))}
            {BOARD_PENDING.map((item) => (
              <NavLink key={item.id} to={pendingTo(item.id)} className={({ isActive }) => `tree-link${isActive ? ' is-active' : ''}`} onClick={onNavigate}>
                <Mark id={item.id === 'ehp' ? 'ehp' : item.id === 'fire' ? 'fire' : 'lift'} />
                {item.label}
              </NavLink>
            ))}
            <NavLink to={serviceTo('ev')} className={({ isActive }) => `tree-link${isActive ? ' is-active' : ''}`} onClick={onNavigate}><Mark id="ev" />전기차</NavLink>
            <NavLink to={serviceTo('parking')} className={({ isActive }) => `tree-link${isActive ? ' is-active' : ''}`} onClick={onNavigate}><Mark id="park" />주차</NavLink>
            <div className="tree-head">근무</div>
            <NavLink to={record('roster')} className="tree-link" onClick={onNavigate}><Mark id="roster" />근무표</NavLink>
            <NavLink to={record('work')} className="tree-link" onClick={onNavigate}><Mark id="work" />작업 내역</NavLink>
            <div className="tree-head">설정</div>
            <NavLink to={`/settings${search}`} className="tree-link" onClick={onNavigate}><Mark id="gear" />설정</NavLink>
          </>
        )}
      </nav>
      <footer className="tree-foot">
        <p className="tree-contact">
          <span>문의</span>
          <a href="mailto:rok@tekton.co.kr">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16v10H4V7Z" />
              <path d="m4 7 8 6 8-6" />
            </svg>
            rok@tekton.co.kr
          </a>
          <a href="tel:031-000-0000">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 4h3l1 4-2 1a12 12 0 0 0 5 5l1-2 4 1v3a2 2 0 0 1-2 2A14 14 0 0 1 6 6a2 2 0 0 1 2-2Z" />
            </svg>
            031-000-0000
          </a>
        </p>
        <p className="tree-copy">© 2026 TEKTON</p>
      </footer>
    </aside>
  )
}
