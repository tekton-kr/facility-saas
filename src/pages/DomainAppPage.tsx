import { Navigate } from 'react-router-dom'
import { DomainDesk, type DeskId } from '../components/DomainDesk.tsx'
import { PortfolioDashboard } from '../components/PortfolioDashboard.tsx'
import { getSite } from '../lib/catalog.ts'
import { dutySiteId } from '../lib/roleHome.ts'
import { useScope } from '../lib/useScope.ts'
import { FocusView } from './FocusView.tsx'

const DESK: Partial<Record<string, DeskId>> = {
  power: 'power',
  metering: 'metering',
  parking: 'parking',
  ev: 'ev',
}

export function DomainAppPage() {
  const { app, siteId, view, role, command, search } = useScope()
  const site = getSite(siteId)
  const desk = DESK[app]

  if (view === 'peak' || view === 'eui' || view === 'pr' || view === 'gaps' || view === 'compare') {
    return <FocusView />
  }

  if (!siteId) {
    if (role !== 'exec' && !command) {
      const duty = dutySiteId(app)
      if (duty) return <Navigate to={`/apps/${app}/sites/${duty}${search}`} replace />
    }
    return <PortfolioDashboard service={app} />
  }

  if (site && desk) return <DomainDesk site={site} desk={desk} />

  return <PortfolioDashboard service={app} />
}
