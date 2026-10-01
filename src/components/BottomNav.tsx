import { useLocation, useNavigate } from 'react-router-dom'
import { dutySiteId } from '../lib/roleHome.ts'
import { useScope } from '../lib/useScope.ts'

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { siteId, search, role, command } = useScope()
  const owner = role === 'exec' || command
  const duty = siteId ?? dutySiteId('events')
  const siteApp = (app: string) => duty ? `/apps/${app}/sites/${duty}${search}` : `/apps/${app}${search}`
  const flowSearch = (() => {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    params.set('view', 'flow')
    const query = params.toString()
    return query ? `?${query}` : ''
  })()
  const items = owner
    ? [
        { id: 'wall', label: '대시보드', to: `/apps/events${search}` },
        { id: 'board', label: '현장', to: duty ? `/apps/events/sites/${duty}${flowSearch}` : `/apps/events${search}` },
        { id: 'inspect', label: '점검', to: duty ? `/sites/${duty}/inspections${search}` : `/inspections${search}` },
        { id: 'schedule', label: '방문', to: duty ? `/sites/${duty}/schedule${search}` : `/schedule${search}` },
        { id: 'contract', label: '유지보수', to: duty ? `/sites/${duty}/contract${search}` : `/contract${search}` },
      ]
    : [
        { id: 'events', label: '기계설비', to: siteApp('events') },
        { id: 'power', label: '전력', to: siteApp('power') },
        { id: 'metering', label: '검침', to: siteApp('metering') },
        { id: 'ev', label: '전기차충전기', to: siteApp('ev') },
        { id: 'parking', label: '주차운영', to: siteApp('parking') },
      ]

  function active(id: string) {
    const path = location.pathname
    if (id === 'wall') return path === '/apps/events'
    if (id === 'board') return path.startsWith('/apps/events/sites/')
    if (id === 'inspect') return path.includes('/inspections')
    if (id === 'schedule') return path.includes('/schedule')
    if (id === 'contract') return path.endsWith('/contract') || path === '/contract'
    if (id === 'events') return path.startsWith('/apps/events')
    if (id === 'power') return path.startsWith('/apps/power')
    if (id === 'metering') return path.startsWith('/apps/metering')
    if (id === 'ev') return path.startsWith('/apps/ev')
    if (id === 'parking') return path.startsWith('/apps/parking')
    return false
  }

  return (
    <nav className="bottom-nav" aria-label="현장관리">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={active(item.id) ? 'is-active' : ''}
          onClick={() => navigate(item.to)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
