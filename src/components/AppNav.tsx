import { AppIcon } from './AppIcon.tsx'
import type { AppId } from '../types/domain.ts'
import { useScope } from '../lib/useScope.ts'

const SERVICES: { id: AppId; label: string }[] = [
  { id: 'events', label: '설비자동제어' },
  { id: 'power', label: '전력' },
  { id: 'metering', label: '원격검침' },
  { id: 'solar', label: '제로에너지' },
]

export function AppNav() {
  const { app, goApp } = useScope()

  return (
    <nav className="app-nav" aria-label="서비스">
      {SERVICES.map((item) => (
        <button
          key={item.id}
          type="button"
          className={item.id === app ? 'is-active' : ''}
          onClick={() => goApp(item.id)}
        >
          <AppIcon app={item.id} />
          {item.label}
        </button>
      ))}
    </nav>
  )
}
