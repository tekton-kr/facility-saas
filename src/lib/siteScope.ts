import { getSite, getSites } from './catalog.ts'
import type { SiteDef } from '../types/domain.ts'

const SESSION_KEY = 't-arch-session'

type StoredScope = {
  role?: 'ops' | 'exec'
  siteIds?: string[]
}

function readScope(): StoredScope | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredScope
  } catch {
    return null
  }
}

export function visibleSiteIds(): string[] {
  const scope = readScope()
  const known = getSites().map((site) => site.id)
  if (!scope) return []
  const listed = (scope.siteIds ?? []).filter((id) => known.includes(id))
  if (listed.length > 0) return listed
  return scope.role === 'exec' ? known : []
}

export function visibleSites(): SiteDef[] {
  const allowed = new Set(visibleSiteIds())
  return getSites().filter((site) => allowed.has(site.id))
}

export function isSiteAllowed(siteId: string | undefined): boolean {
  if (!siteId) return true
  return visibleSiteIds().includes(siteId)
}

export function visibleSite(siteId: string | undefined): SiteDef | undefined {
  const site = getSite(siteId)
  if (!site || !isSiteAllowed(site.id)) return undefined
  return site
}
