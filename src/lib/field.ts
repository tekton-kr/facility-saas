import { heatLoopPid } from '../data/pid.ts'
import {
  accounts as seedAccounts,
  contracts as seedContracts,
  packages as seedPackages,
  vendors as seedVendors,
  works as seedWorks,
} from '../data/field.ts'
import type {
  Alarm,
  Contract,
  DirectoryAccount,
  PackageStatus,
  RenovationPackage,
  SiteDef,
  SitePreset,
  SystemDomain,
  Vendor,
  WorkOrder,
  WorkStatus,
} from '../types/domain.ts'
import { appendSite, getSite } from './catalog.ts'
import { isSiteAllowed } from './siteScope.ts'
import { lastSyncAt } from './telemetry.ts'

const KEY = 't-arch-field'
const EVENT = 't-arch-field'

export type FieldState = {
  vendors: Vendor[]
  accounts: DirectoryAccount[]
  contracts: Contract[]
  works: WorkOrder[]
  packages: RenovationPackage[]
}

const seed: FieldState = {
  vendors: seedVendors,
  accounts: seedAccounts,
  contracts: seedContracts,
  works: seedWorks,
  packages: seedPackages,
}

function load(): FieldState {
  if (typeof window === 'undefined') return seed
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seed
    const parsed = JSON.parse(raw) as Partial<FieldState>
    return {
      vendors: parsed.vendors?.length ? parsed.vendors : seed.vendors,
      accounts: parsed.accounts?.length ? parsed.accounts : seed.accounts,
      contracts: parsed.contracts?.length ? parsed.contracts : seed.contracts,
      works: parsed.works?.length ? parsed.works : seed.works,
      packages: parsed.packages?.length ? parsed.packages : seed.packages,
    }
  } catch {
    return seed
  }
}

let state = load()

function emit() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EVENT))
}

function write(next: FieldState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  emit()
}

export function getField(): FieldState {
  return state
}

export function subscribeField(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  return () => window.removeEventListener(EVENT, onChange)
}

export function getVendor(id: string | undefined): Vendor | undefined {
  if (!id) return undefined
  return state.vendors.find((item) => item.id === id)
}

export function contractForSite(siteId: string | undefined): Contract | undefined {
  if (!siteId) return undefined
  return state.contracts.find((item) => item.siteId === siteId)
}

export function worksForScope(siteId?: string): WorkOrder[] {
  return state.works
    .filter((item) => isSiteAllowed(item.siteId) && (!siteId || item.siteId === siteId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function workById(id: string | undefined): WorkOrder | undefined {
  if (!id) return undefined
  return state.works.find((item) => item.id === id)
}

export function workByAlarm(alarmId: string): WorkOrder | undefined {
  return state.works.find((item) => item.alarmId === alarmId)
}

export function packagesForScope(siteId?: string): RenovationPackage[] {
  return state.packages.filter((item) => isSiteAllowed(item.siteId) && (!siteId || item.siteId === siteId))
}

export function packageById(id: string | undefined): RenovationPackage | undefined {
  if (!id) return undefined
  return state.packages.find((item) => item.id === id)
}

export function packageByFinding(findingId: string): RenovationPackage | undefined {
  return state.packages.find((item) => item.findingId === findingId)
}

export function isSlaOpen(work: WorkOrder): boolean {
  if (work.status === 'done') return false
  return new Date(work.slaDueAt).getTime() < new Date(lastSyncAt()).getTime()
}

export function openSlaCount(siteId?: string): number {
  return worksForScope(siteId).filter(isSlaOpen).length
}

export function contractsDueSoon(siteId?: string, withinDays = 120): number {
  const now = new Date(lastSyncAt()).getTime()
  const limit = now + withinDays * 86_400_000
  return state.contracts.filter((item) => {
    if (!isSiteAllowed(item.siteId)) return false
    if (siteId && item.siteId !== siteId) return false
    const end = new Date(item.end).getTime()
    return end >= now && end <= limit
  }).length
}

export function daysUntil(isoDate: string): number {
  const end = new Date(`${isoDate}T00:00:00+09:00`).getTime()
  const now = new Date(lastSyncAt()).getTime()
  return Math.round((end - now) / 86_400_000)
}

export function nextWorkStatus(status: WorkStatus): WorkStatus | null {
  if (status === 'received') return 'dispatch'
  if (status === 'dispatch') return 'on-site'
  if (status === 'on-site') return 'done'
  return null
}

export function advanceWork(id: string) {
  const nextStatus = nextWorkStatus(workById(id)?.status ?? 'done')
  if (!nextStatus) return
  write({
    ...state,
    works: state.works.map((item) => {
      if (item.id !== id) return item
      return {
        ...item,
        status: nextStatus,
        arrivedAt: nextStatus === 'on-site' ? lastSyncAt() : item.arrivedAt,
      }
    }),
  })
}

export function addWorkProof(id: string, label: string) {
  const text = label.trim()
  if (!text) return
  write({
    ...state,
    works: state.works.map((item) => (
      item.id === id ? { ...item, proofs: [...item.proofs, text] } : item
    )),
  })
}

export function setWorkNote(id: string, note: string) {
  write({
    ...state,
    works: state.works.map((item) => (item.id === id ? { ...item, note } : item)),
  })
}

export function createWorkFromAlarm(alarm: Alarm): WorkOrder {
  const existing = workByAlarm(alarm.id)
  if (existing) return existing
  const contract = contractForSite(alarm.siteId)
  const id = `wo-${alarm.id.replace(/[^a-z0-9]+/gi, '').slice(-6)}-${Date.now().toString(36).slice(-3)}`
  const created: WorkOrder = {
    id,
    siteId: alarm.siteId,
    alarmId: alarm.id,
    contractId: contract?.id,
    vendorId: contract?.vendorId,
    kind: 'dispatch',
    title: `${alarm.title} 출동`,
    status: 'received',
    slaDueAt: new Date(new Date(lastSyncAt()).getTime() + (contract?.slaCriticalMin ?? 45) * 60_000).toISOString(),
    createdAt: lastSyncAt(),
    systemId: alarm.systemId,
    equipmentId: alarm.equipmentId,
    pointId: alarm.pointId,
    note: '',
    proofs: [],
    arrivedAt: null,
  }
  write({ ...state, works: [created, ...state.works] })
  return created
}

const PACKAGE_NEXT: Record<PackageStatus, PackageStatus | null> = {
  candidate: 'quoted',
  quoted: 'in-progress',
  'in-progress': 'done',
  done: null,
}

export function advancePackage(id: string) {
  const next = PACKAGE_NEXT[packageById(id)?.status ?? 'done']
  if (!next) return
  write({
    ...state,
    packages: state.packages.map((item) => (
      item.id === id
        ? { ...item, status: next, certainty: next === 'done' ? 'confirmed' : item.certainty }
        : item
    )),
  })
}

export function addDirectoryAccount(row: DirectoryAccount) {
  if (state.accounts.some((item) => item.email === row.email)) return
  write({ ...state, accounts: [...state.accounts, row] })
}

export function addVendor(row: Vendor) {
  if (state.vendors.some((item) => item.id === row.id)) return
  write({ ...state, vendors: [...state.vendors, row] })
}

const PRESET_SCOPE: Record<SitePreset, SystemDomain[]> = {
  office: ['hvac', 'power', 'fire'],
  warehouse: ['power', 'fire'],
  hospital: ['hvac', 'power', 'fire'],
  hotel: ['hvac', 'power', 'fire'],
  mart: ['hvac', 'power', 'fire'],
  utility: ['power', 'hvac'],
}

export function createSiteFromWizard(input: {
  name: string
  location: string
  preset: SitePreset
  connectorIds: string[]
}): SiteDef {
  const slug = input.name.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '') || 'site'
  const id = `${slug}-${Date.now().toString(36).slice(-4)}`
  const kind = input.preset === 'utility' ? 'utility' : 'building'
  const site: SiteDef = {
    id,
    name: input.name.trim() || '새 현장',
    kind,
    location: input.location.trim() || '미등록',
    connectorIds: input.connectorIds,
    plans: [{ id: '1f', name: input.preset === 'utility' ? '부지' : '1층' }],
    cameras: [],
    systems: [
      {
        id: 'power',
        name: kind === 'utility' ? '수전' : '전력',
        domain: 'power',
        equipment: [{
          id: 'incomer',
          name: '수전반',
          tags: ['elec'],
          points: [
            { id: 'main', name: '수전 유효전력', unit: 'kW', tags: ['elec', 'sensor'] },
            { id: 'daily', name: '금일 유효전력량', unit: 'kWh', tags: ['elec', 'meter'] },
          ],
        }],
      },
      ...(input.preset === 'utility'
        ? [{
            id: 'hvac',
            name: '열공급',
            domain: 'hvac' as const,
            equipment: [{
              id: 'hx-1',
              name: '열교환기',
              tags: ['hvac'],
              points: [
                { id: 'in', name: '입구온도', unit: '°C', tags: ['hvac', 'sensor'] },
                { id: 'out', name: '출구온도', unit: '°C', tags: ['hvac', 'sensor'] },
                { id: 'ret', name: '환수온도', unit: '°C', tags: ['hvac', 'sensor'] },
              ],
            }],
          }]
        : [{
            id: 'fire',
            name: '소방',
            domain: 'fire' as const,
            equipment: [{
              id: 'facp',
              name: '수신기',
              tags: ['fire'],
              points: [{ id: 'z1', name: '1구역 상태', unit: '', tags: ['fire', 'sensor'] }],
            }],
          }]),
    ],
    pid: input.preset === 'utility'
      ? heatLoopPid({
          powerSystem: 'power',
          incomer: 'incomer',
          hvacSystem: 'hvac',
          exchanger: 'hx-1',
        })
      : undefined,
  }
  appendSite(site)
  const start = lastSyncAt().slice(0, 10)
  const end = new Date(new Date(lastSyncAt()).getTime() + 365 * 86_400_000).toISOString().slice(0, 10)
  write({
    ...state,
    contracts: [
      ...state.contracts,
      {
        id: `c-${id}`,
        siteId: id,
        vendorId: state.vendors[0]?.id ?? 'v-gyeonggi',
        start,
        end,
        scope: PRESET_SCOPE[input.preset],
        slaCriticalMin: 45,
        slaWarningMin: 180,
        statutory: [{ id: `st-${id}`, name: '소방 점검', due: end, status: 'scheduled' }],
      },
    ],
  })
  return site
}

export function siteLabel(siteId: string): string {
  return getSite(siteId)?.name ?? siteId
}
