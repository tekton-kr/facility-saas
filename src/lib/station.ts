import { getSite } from './catalog.ts'
import { getTenant, tenantSites } from './tenant.ts'

const KEY = 't-arch-station'

export type StationBinding = {
  tenantId: string
  siteId: string
  boundAt: string
}

export function getStation(): StationBinding | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StationBinding
    const tenant = getTenant(parsed.tenantId)
    const site = getSite(parsed.siteId)
    if (!tenant || !site) return null
    if (!tenant.siteIds.includes(site.id)) return null
    return parsed
  } catch {
    return null
  }
}

export function bindStation(tenantId: string, siteId: string): StationBinding {
  const tenant = getTenant(tenantId)
  if (!tenant) throw new Error('없는 워크스페이스입니다.')
  if (!tenantSites(tenant).some((site) => site.id === siteId)) {
    throw new Error('이 워크스페이스에 없는 현장입니다.')
  }
  const binding: StationBinding = {
    tenantId,
    siteId,
    boundAt: new Date().toISOString(),
  }
  localStorage.setItem(KEY, JSON.stringify(binding))
  return binding
}

export function unbindStation() {
  localStorage.removeItem(KEY)
}
