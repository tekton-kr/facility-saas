import { useLocation, useNavigate } from 'react-router-dom'
import { dutySiteId } from '../lib/roleHome.ts'
import { useScope } from '../lib/useScope.ts'

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { siteId, search, role } = useScope()
  const duty = siteId ?? dutySiteId('events')
  const owner = role === 'exec'
  const items = owner
    ? [
        { id: 'alarms', label: '시설', to: `/apps/events${search}` },
        { id: 'contract', label: '계약', to: `/sites/${duty}/contract${search}` },
        { id: 'packages', label: '개보수', to: `/packages${search}` },
        { id: 'settings', label: '설정', to: `/settings${search}` },
      ]
    : [
        { id: 'alarms', label: '알람', to: `/apps/events/sites/${duty}${search}` },
        { id: 'work', label: '작업', to: `/sites/${duty}/work${search}` },
        { id: 'contract', label: '계약', to: `/sites/${duty}/contract${search}` },
        { id: 'packages', label: '개보수', to: `/packages${search}` },
      ]

  function active(id: string) {
    const path = location.pathname
    if (id === 'alarms') return path.startsWith('/apps/events')
    if (id === 'work') return path.startsWith('/work') || path.endsWith('/work')
    if (id === 'contract') return path.endsWith('/contract')
    if (id === 'packages') return path.startsWith('/packages')
    if (id === 'settings') return path.startsWith('/settings')
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
