import { DomainAppPage } from './DomainAppPage.tsx'
import { EventsPage } from './EventsPage.tsx'
import { dutySiteId } from '../lib/roleHome.ts'
import { useScope } from '../lib/useScope.ts'
import { Navigate } from 'react-router-dom'

export function AppHome() {
  const { app, siteId, role, search } = useScope()
  if (role === 'ops' && !siteId) {
    return <Navigate to={`/apps/${app}/sites/${dutySiteId(app)}${search}`} replace />
  }
  return app === 'events' ? <EventsPage /> : <DomainAppPage />
}
