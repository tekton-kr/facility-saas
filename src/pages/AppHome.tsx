import { DomainAppPage } from './DomainAppPage.tsx'
import { EventsPage } from './EventsPage.tsx'
import { useScope } from '../lib/useScope.ts'

export function AppHome() {
  const { app } = useScope()
  return app === 'events' ? <EventsPage /> : <DomainAppPage />
}
