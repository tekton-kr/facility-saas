import { useParams } from 'react-router-dom'
import { DomainDesk, type DeskId } from '../components/DomainDesk.tsx'
import { getSite } from '../lib/catalog.ts'

const DESKS: Record<string, DeskId> = {
  ehp: 'ehp',
  fire: 'fire',
  elevator: 'elevator',
}

export function PendingDomainPage() {
  const { domain, siteId } = useParams()
  const desk = (domain && DESKS[domain]) || 'ehp'
  const site = siteId ? getSite(siteId) : undefined
  return <DomainDesk site={site} desk={desk} />
}
