import { dutySiteId } from './roleHome.ts'
import { changePassword, fetchSites, hydrateSnapshot, loginRequest, type LoginResult } from './api.ts'
import { buildLocalSnapshot } from './mockQuery.ts'
import { getCatalog } from './catalog.ts'
import { getStation } from './station.ts'
import { lookupStaff } from './staffRoster.ts'
import { contractedSiteIds, getTenant, tenantBySiteId } from './tenant.ts'
import { getSite } from './catalog.ts'
import type { TenantDef } from '../data/tenants.ts'

const KEY = 't-arch-session'
const TOKEN_KEY = 't-arch-token'
const EVENT = 't-arch-auth'
const NOTIFY_MS = 4 * 60 * 60 * 1000
const TOKEN_MS = 12 * 60 * 60 * 1000

export type Entry = 'station' | 'workspace' | 'notify' | 'staff' | 'command'

export type Session = {
  tenantId: string
  name: string
  role: 'ops' | 'exec'
  siteIds: string[]
  entry: Entry
  phone?: string
  email?: string
  displayName?: string
  expiresAt?: string
  mustChangePassword?: boolean
}

function readStore(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStore(key: string, value: string | null) {
  try {
    sessionStorage.removeItem(key)
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function getToken(): string | null {
  return readStore(TOKEN_KEY)
}

export function setToken(token: string | null) {
  writeStore(TOKEN_KEY, token)
}

export function personName(session: Session): string {
  const display = session.displayName?.trim()
  if (display) return display
  const name = session.name?.trim()
  if (name && name !== '계정' && !name.includes('@')) return name
  return ''
}

export function loginAccount(session: Session): string {
  if (session.email?.trim()) return session.email.trim()
  if (session.phone?.trim()) return session.phone.trim()
  if (session.name?.includes('@')) return session.name.trim()
  if (session.role === 'exec' || session.entry === 'command') {
    try {
      const saved = localStorage.getItem('t-arch-saved-email')?.trim()
      if (saved) return saved
    } catch {
      /* ignore */
    }
  }
  return ''
}

export function accountLabel(session: Session): string {
  const named = session.displayName?.trim()
  if (named) return named
  return session.email || session.phone || session.name
}

export function isCommand(session: Session | null | undefined): boolean {
  return session?.entry === 'command'
}

export function homePath(input: Session | Session['role'] = 'ops'): string {
  if (typeof input !== 'string' && input.entry === 'command') return '/apps/events'
  const role = typeof input === 'string' ? input : input.role
  const siteIds = typeof input === 'string' ? undefined : input.siteIds
  if (role === 'exec') {
    if (siteIds?.length === 1) return `/apps/events/sites/${siteIds[0]}?role=exec`
    return '/apps/events?role=exec'
  }
  const site = siteIds?.[0] ?? dutySiteId('events')
  return `/apps/events/sites/${site}`
}

export function notifyHome(siteId: string, alarmId: string): string {
  return `/apps/events/sites/${siteId}?event=${encodeURIComponent(alarmId)}`
}

export function safeNext(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//') || value.startsWith('/login') || value.startsWith('/w') || value.startsWith('/n') || value.startsWith('/station')) {
    return null
  }
  return value
}

export function getSession(): Session | null {
  try {
    if (!getToken()) return null
    const raw = readStore(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (!parsed.tenantId || (parsed.role !== 'ops' && parsed.role !== 'exec')) return null
    if (parsed.entry !== 'station' && parsed.entry !== 'workspace' && parsed.entry !== 'notify' && parsed.entry !== 'staff' && parsed.entry !== 'command') return null
    if (parsed.expiresAt && Date.parse(parsed.expiresAt) <= Date.now()) {
      setToken(null)
      writeStore(KEY, null)
      return null
    }
    const tenant = getTenant(parsed.tenantId)
    if (!tenant) return null
    if (parsed.entry === 'command') {
      const siteIds = contractedSiteIds()
      if (siteIds.length === 0) return null
      return { ...parsed, role: 'ops', siteIds }
    }
    if (parsed.entry === 'staff') {
      if (!parsed.phone) return null
      const siteIds = (parsed.siteIds ?? []).filter((id) => id.length > 0)
      if (siteIds.length === 0) return null
      return { ...parsed, siteIds, phone: parsed.phone }
    }
    const siteIds = (parsed.siteIds ?? []).filter((id) => id.length > 0)
    if (siteIds.length === 0) return null
    return { ...parsed, siteIds }
  } catch {
    return null
  }
}

function emit() {
  window.dispatchEvent(new Event(EVENT))
}

export function setSession(session: Session | null) {
  writeStore(KEY, session ? JSON.stringify(session) : null)
  emit()
}

function ttlMs(entry: Entry): number | null {
  if (entry === 'notify') return NOTIFY_MS
  return null
}

function newToken(): string {
  return crypto.randomUUID()
}

function establish(session: Session): Session {
  const ttl = ttlMs(session.entry)
  const signed = {
    ...session,
    expiresAt: session.expiresAt ?? (ttl == null ? undefined : new Date(Date.now() + ttl).toISOString()),
  }
  setToken(newToken())
  hydrateSnapshot(buildLocalSnapshot())
  setSession(signed)
  return signed
}

export function startStation(): Session {
  const binding = getStation()
  if (!binding) throw new Error('이 PC에 현장이 고정되어 있지 않습니다.')
  const tenant = getTenant(binding.tenantId)
  const site = getSite(binding.siteId)
  if (!tenant || !site) throw new Error('고정된 현장을 찾을 수 없습니다.')
  return establish({
    tenantId: tenant.id,
    name: site.name,
    role: 'ops',
    siteIds: [site.id],
    entry: 'station',
  })
}

export function startWorkspace(tenant: TenantDef, siteIds: string[], name = tenant.name): Session {
  return startExec({ tenant, name, siteIds })
}

export function startExec(input: { tenant: TenantDef; name?: string; siteIds: string[] }): Session {
  const siteIds = input.siteIds.filter((id) => input.tenant.siteIds.includes(id) && getSite(id))
  if (siteIds.length === 0) throw new Error('배정된 현장이 없습니다.')
  return establish({
    tenantId: input.tenant.id,
    name: input.name ?? input.tenant.name,
    role: 'exec',
    siteIds,
    entry: 'workspace',
  })
}

export function startCommand(input: { name: string }): Session {
  const siteIds = contractedSiteIds()
  if (siteIds.length === 0) throw new Error('계약된 현장이 없습니다.')
  const tenant = getTenant('tekton')
  if (!tenant) throw new Error('운영 계정을 찾을 수 없습니다.')
  return establish({
    tenantId: tenant.id,
    name: input.name,
    role: 'ops',
    siteIds,
    entry: 'command',
  })
}

export function startStaff(input: { tenantId: string; name: string; siteIds: string[]; phone: string }): Session {
  const row = lookupStaff(input.phone)
  if (!row) throw new Error('이 번호는 현장에 없습니다. 소장님에게 연락처 등록을 요청하십시오.')
  const siteIds = input.siteIds.filter((id) => row.siteIds.includes(id) && getSite(id))
  const chosen = siteIds.length > 0 ? siteIds : row.siteIds
  return establish({
    tenantId: row.tenantId,
    name: row.name,
    role: 'ops',
    siteIds: chosen,
    entry: 'staff',
    phone: row.phone,
  })
}

export function startNotify(alarmId: string, siteId: string): Session {
  const tenant = tenantBySiteId(siteId)
  const site = getSite(siteId)
  if (!tenant || !site) throw new Error('이 알림의 현장을 찾을 수 없습니다.')
  void alarmId
  return establish({
    tenantId: tenant.id,
    name: site.name,
    role: 'ops',
    siteIds: [site.id],
    entry: 'notify',
  })
}

let issuedPassword = ''

async function applyLiveSites(preferred: string[] | undefined): Promise<string[]> {
  const sites = await fetchSites()
  hydrateSnapshot({
    catalog: { connectors: getCatalog().connectors, sites },
    alarms: [],
    findings: [],
    telemetry: {},
    syncAt: new Date().toISOString(),
  })
  const known = new Set(sites.map((site) => site.id))
  const listed = (preferred ?? []).filter((id) => known.has(id))
  return listed.length > 0 ? listed : sites.map((site) => site.id)
}

export async function acceptLogin(result: LoginResult, extra: { phone?: string; currentPassword?: string; entry: Entry }): Promise<Session> {
  const tenant = getTenant(result.tenantId ?? 'tekton') ?? getTenant('tekton')
  if (!tenant) throw new Error('고객사를 찾을 수 없습니다.')
  issuedPassword = result.mustChangePassword ? (extra.currentPassword ?? '') : ''
  setToken(result.token)
  try {
    const siteIds = await applyLiveSites(result.siteIds)
    const session: Session = {
      tenantId: tenant.id,
      name: result.name || result.email || extra.phone || '계정',
      role: result.role,
      siteIds,
      entry: extra.entry,
      phone: extra.phone,
      email: result.email || undefined,
      displayName: result.name || undefined,
      expiresAt: new Date(Date.now() + TOKEN_MS).toISOString(),
      mustChangePassword: result.mustChangePassword,
    }
    setSession(session)
    return session
  } catch (err) {
    setToken(null)
    throw err
  }
}

export async function signIn(email: string, password: string): Promise<Session> {
  const result = await loginRequest(email.trim(), password)
  if (result.apiRole !== 'MANAGEMENT') throw new Error('관리단·건물주 계정이 아닙니다.')
  return acceptLogin(result, { currentPassword: password, entry: 'workspace' })
}

export async function signInCommand(email: string, password: string): Promise<Session> {
  const result = await loginRequest(email.trim(), password)
  if (result.apiRole !== 'SUPER_ADMIN') throw new Error('통합관제 계정이 아닙니다.')
  return acceptLogin(result, { currentPassword: password, entry: 'command' })
}

export async function finishPasswordChange(newPassword: string): Promise<Session> {
  const session = getSession()
  if (!session?.mustChangePassword) throw new Error('비밀번호를 바꿀 로그인이 없습니다.')
  if (!issuedPassword) throw new Error('임시 비밀번호로 다시 로그인하십시오.')
  await changePassword(issuedPassword, newPassword)
  issuedPassword = ''
  const next = { ...session, mustChangePassword: false }
  setSession(next)
  return next
}

let logoutAt = 0
let logoutTo = '/login'

export function signOut() {
  const session = getSession()
  logoutTo = session?.entry === 'command' ? '/desk' : '/login'
  if (session && session.entry !== 'command') {
    try {
      localStorage.setItem('t-arch-login-door', session.role === 'exec' ? 'exec' : 'staff')
    } catch {
      /* ignore */
    }
  }
  logoutAt = Date.now()
  issuedPassword = ''
  setToken(null)
  setSession(null)
}

export function logoutTarget() {
  return logoutTo
}

export function isLogoutRedirect() {
  return logoutAt > 0 && Date.now() - logoutAt < 1500
}

export function subscribeAuth(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === TOKEN_KEY) onChange()
  }
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

export async function restoreSession(): Promise<Session | null> {
  const session = getSession()
  if (!session || !getToken()) return null
  const siteIds = await applyLiveSites(session.siteIds)
  const next = { ...session, siteIds }
  setSession(next)
  return next
}

export function watchStream(_onTick: () => void): () => void {
  return () => {}
}

export function leaveLabel(entry: Entry | undefined): string {
  if (entry === 'station') return '교대 종료'
  if (entry === 'notify') return '닫기'
  return '로그아웃'
}
