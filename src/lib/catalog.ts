import { catalog as seedCatalog } from '../data/catalog.ts'
import { isBrowser } from './env.ts'
import type {
  AppId,
  Catalog,
  ConnectorDef,
  EquipmentDef,
  PointDef,
  PointRef,
  SiteDef,
  SystemDef,
  SystemDomain,
} from '../types/domain.ts'

export const APP_IDS: AppId[] = ['events', 'power', 'metering', 'solar', 'parking', 'ev']

let catalog: Catalog = seedCatalog

const EXTRA_KEY = 't-arch-extra-sites'

function loadExtraSites(): SiteDef[] {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(EXTRA_KEY)
    return raw ? JSON.parse(raw) as SiteDef[] : []
  } catch {
    return []
  }
}

function mergeSites(base: SiteDef[], extra: SiteDef[]): SiteDef[] {
  const seen = new Set(base.map((item) => item.id))
  return [...base, ...extra.filter((item) => !seen.has(item.id))]
}

if (isBrowser()) {
  catalog = { ...catalog, sites: mergeSites(catalog.sites, loadExtraSites()) }
}

export function hydrateCatalog(next: Catalog) {
  catalog = { ...next, sites: mergeSites(next.sites, loadExtraSites()) }
}

export function appendSite(site: SiteDef) {
  catalog = { ...catalog, sites: mergeSites(catalog.sites, [site]) }
  if (!isBrowser()) return
  const extra = mergeSites(loadExtraSites(), [site])
  try {
    localStorage.setItem(EXTRA_KEY, JSON.stringify(extra))
  } catch {
    /* ignore */
  }
}

export function getCatalog(): Catalog {
  return catalog
}

const APP_DOMAINS: Record<AppId, SystemDomain[]> = {
  events: ['fire', 'security', 'hvac'],
  power: ['power'],
  metering: ['metering'],
  solar: ['solar'],
  parking: ['parking'],
  ev: ['ev'],
}

export function pointKey(ref: PointRef): string {
  return `${ref.siteId}.${ref.systemId}.${ref.equipmentId}.${ref.pointId}`
}

export function getConnectors(): ConnectorDef[] {
  return catalog.connectors
}

export function connectorById(id: string): ConnectorDef | undefined {
  return catalog.connectors.find((item) => item.id === id)
}

export function getSites(): SiteDef[] {
  return catalog.sites
}

export function getSite(siteId: string | undefined): SiteDef | undefined {
  if (!siteId) return undefined
  return catalog.sites.find((site) => site.id === siteId)
}

export function domainsForApp(app: AppId): SystemDomain[] {
  return APP_DOMAINS[app]
}

export function systemMatchesApp(system: SystemDef, app: AppId): boolean {
  return APP_DOMAINS[app].includes(system.domain)
}

export function siteHasApp(site: SiteDef, app: AppId): boolean {
  if (app === 'events') return true
  return site.systems.some((system) => systemMatchesApp(system, app))
}

export function getSystem(
  siteId: string | undefined,
  systemId: string | undefined,
): { site: SiteDef; system: SystemDef } | undefined {
  const site = getSite(siteId)
  if (!site || !systemId) return undefined
  const system = site.systems.find((item) => item.id === systemId)
  if (!system) return undefined
  return { site, system }
}

export function getEquipment(
  siteId: string | undefined,
  systemId: string | undefined,
  equipmentId: string | undefined,
): { site: SiteDef; system: SystemDef; equipment: EquipmentDef } | undefined {
  const found = getSystem(siteId, systemId)
  if (!found || !equipmentId) return undefined
  const equipment = found.system.equipment.find((item) => item.id === equipmentId)
  if (!equipment) return undefined
  return { ...found, equipment }
}

export function getPoint(ref: PointRef): {
  site: SiteDef
  system: SystemDef
  equipment: EquipmentDef
  point: PointDef
} | undefined {
  const found = getEquipment(ref.siteId, ref.systemId, ref.equipmentId)
  if (!found) return undefined
  const point = found.equipment.points.find((item) => item.id === ref.pointId)
  if (!point) return undefined
  return { ...found, point }
}

export function listPidPoints(site: SiteDef) {
  if (!site.pid) return []
  const seen = new Set<string>()
  const rows: ReturnType<typeof listPoints> = []
  for (const node of site.pid.nodes) {
    if (!node.point) continue
    const ref = { siteId: site.id, ...node.point }
    const key = pointKey(ref)
    if (seen.has(key)) continue
    seen.add(key)
    const found = getPoint(ref)
    if (found) rows.push({ ...ref, ...found })
  }
  return rows
}

export function countPoints(site: SiteDef): number {
  return site.systems.reduce(
    (sum, system) => sum + system.equipment.reduce((inner, equipment) => inner + equipment.points.length, 0),
    0,
  )
}

export function listPoints(options: {
  siteId?: string
  siteIds?: string[]
  systemId?: string
  equipmentId?: string
  app?: AppId
  query?: string
}): Array<PointRef & { site: SiteDef; system: SystemDef; equipment: EquipmentDef; point: PointDef }> {
  const query = options.query?.trim().toLowerCase() ?? ''
  const rows: Array<PointRef & { site: SiteDef; system: SystemDef; equipment: EquipmentDef; point: PointDef }> = []

  for (const site of catalog.sites) {
    if (options.siteId && site.id !== options.siteId) continue
    if (options.siteIds && !options.siteIds.includes(site.id)) continue
    for (const system of site.systems) {
      if (options.systemId && system.id !== options.systemId) continue
      if (options.app && options.app !== 'events' && !systemMatchesApp(system, options.app)) continue
      for (const equipment of system.equipment) {
        if (options.equipmentId && equipment.id !== options.equipmentId) continue
        for (const point of equipment.points) {
          if (query) {
            const hay = `${site.name} ${system.name} ${equipment.name} ${point.name} ${point.tags.join(' ')}`.toLowerCase()
            if (!hay.includes(query)) continue
          }
          rows.push({
            siteId: site.id,
            systemId: system.id,
            equipmentId: equipment.id,
            pointId: point.id,
            site,
            system,
            equipment,
            point,
          })
        }
      }
    }
  }

  return rows
}
