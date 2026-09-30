import { TENANTS, type TenantDef } from '../data/tenants.ts'
import { getSite, getSites } from './catalog.ts'
import type { SiteDef } from '../types/domain.ts'

export function getTenants(): TenantDef[] {
  return TENANTS
}

export function getTenant(id: string | undefined): TenantDef | undefined {
  if (!id) return undefined
  return TENANTS.find((item) => item.id === id)
}

export function tenantBySlug(slug: string | undefined): TenantDef | undefined {
  if (!slug) return undefined
  const key = slug.trim().toLowerCase()
  return TENANTS.find((item) => item.slug === key)
}

export function tenantBySiteId(siteId: string | undefined): TenantDef | undefined {
  if (!siteId) return undefined
  return TENANTS.find((item) => item.siteIds.includes(siteId))
}

export function tenantSites(tenant: TenantDef): SiteDef[] {
  return tenant.siteIds.map((id) => getSite(id)).filter((site): site is SiteDef => Boolean(site))
}

export function contractedSiteIds(): string[] {
  const known = new Set(getSites().map((site) => site.id))
  const fromTenants = getTenants().flatMap((tenant) => tenant.siteIds).filter((id) => known.has(id))
  const seen = new Set(fromTenants)
  return [...fromTenants, ...getSites().map((site) => site.id).filter((id) => !seen.has(id))]
}
