import { CollectionPending } from '../components/CollectionPending.tsx'
import { PortfolioDashboard } from '../components/PortfolioDashboard.tsx'
import { SiteCommand } from '../components/SiteCommand.tsx'
import { getSite } from '../lib/catalog.ts'
import { APP_LABEL } from '../lib/format.ts'
import { useScope } from '../lib/useScope.ts'
import { FocusView } from './FocusView.tsx'

export function DomainAppPage() {
  const { app, siteId, view } = useScope()
  const site = getSite(siteId)

  if (view === 'peak' || view === 'eui' || view === 'pr' || view === 'gaps' || view === 'compare') {
    return <FocusView />
  }

  if (!siteId) {
    return <PortfolioDashboard service={app} />
  }

  if (site) {
    return <SiteCommand site={site} />
  }

  return <CollectionPending title={`${APP_LABEL[app]} · 현장을 찾지 못했습니다`} />
}
