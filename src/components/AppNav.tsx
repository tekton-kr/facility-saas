import { AppIcon } from './AppIcon.tsx'
import { APP_IDS } from '../lib/catalog.ts'
import { APP_LABEL } from '../lib/format.ts'
import { useScope } from '../lib/useScope.ts'

export function AppNav() {
  const { app, goApp } = useScope()

  return (
    <nav className="app-nav" aria-label="도메인 앱">
      {APP_IDS.map((id) => (
        <button
          key={id}
          type="button"
          className={id === app ? 'is-active' : ''}
          onClick={() => goApp(id)}
        >
          <AppIcon app={id} />
          {APP_LABEL[id]}
        </button>
      ))}
    </nav>
  )
}
