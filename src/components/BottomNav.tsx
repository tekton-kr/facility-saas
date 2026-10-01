import { useLocation, useNavigate } from 'react-router-dom'
import { dutySiteId } from '../lib/roleHome.ts'
import { useScope } from '../lib/useScope.ts'

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { siteId, search } = useScope()
  const duty = siteId ?? dutySiteId('events')
  const items = [
    { id: 'wall', label: '상황판', to: `/apps/events${search}` },
    { id: 'board', label: '대시보드', to: duty ? `/apps/events/sites/${duty}${search}` : `/apps/events${search}` },
    { id: 'inspect', label: '점검', to: duty ? `/sites/${duty}/inspections${search}` : `/inspections${search}` },
    { id: 'schedule', label: '일정', to: duty ? `/sites/${duty}/schedule${search}` : `/schedule${search}` },
    { id: 'contract', label: '계약', to: duty ? `/sites/${duty}/contract${search}` : `/contract${search}` },
  ]

  function active(id: string) {
    const path = location.pathname
    if (id === 'wall') return path === '/apps/events'
    if (id === 'board') return path.startsWith('/apps/') && path.includes('/sites/')
    if (id === 'inspect') return path.includes('/inspections')
    if (id === 'schedule') return path.includes('/schedule')
    if (id === 'contract') return path.endsWith('/contract') || path === '/contract'
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
