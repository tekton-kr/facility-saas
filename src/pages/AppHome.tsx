import { DomainAppPage } from './DomainAppPage.tsx'
import { EventsPage } from './EventsPage.tsx'
import { dutySiteId } from '../lib/roleHome.ts'
import { hasPortfolio, visibleSiteIds } from '../lib/siteScope.ts'
import { useScope } from '../lib/useScope.ts'
import { Navigate } from 'react-router-dom'

export function AppHome() {
  const { app, siteId, role, command, search } = useScope()
  if (role === 'ops' && !siteId && !command) {
    return <Navigate to={`/apps/${app}/sites/${dutySiteId(app)}${search}`} replace />
  }
  if (command && !siteId && app !== 'events') {
    return <Navigate to={`/apps/${app}/sites/${dutySiteId(app)}${search}`} replace />
  }
  if (role === 'exec' && !siteId && !hasPortfolio()) {
    const only = visibleSiteIds()[0]
    if (only) return <Navigate to={`/apps/${app}/sites/${only}${search}`} replace />
  }
  return app === 'events' ? <EventsPage /> : <DomainAppPage />
}
