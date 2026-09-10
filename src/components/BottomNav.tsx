import { useLocation, useNavigate } from 'react-router-dom'
import { dutySiteId } from '../lib/roleHome.ts'
import { useScope } from '../lib/useScope.ts'

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { siteId, search, role } = useScope()
  const duty = siteId ?? dutySiteId('events')
  const items = [
    { id: 'alarms', label: '알람', to: `/apps/events/sites/${duty}${search}` },
    { id: 'work', label: '작업', to: `/sites/${duty}/work${search}` },
    { id: 'contract', label: '계약', to: `/sites/${duty}/contract${search}` },
    { id: 'packages', label: '개보수', to: `/packages${search}` },
  ] as const

  function active(id: string) {
    const path = location.pathname
    if (id === 'alarms') return path.startsWith('/apps/events')
    if (id === 'work') return path.startsWith('/work') || path.endsWith('/work')
    if (id === 'contract') return path.endsWith('/contract')
    if (id === 'packages') return path.startsWith('/packages')
    return false
  }

  return (
    <nav className="bottom-nav" aria-label="현장관리">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={active(item.id) ? 'is-active' : ''}
          onClick={() => navigate(role === 'exec' && item.id === 'alarms' ? `/apps/power${search}` : item.to)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
