import type { QuerySnapshot, Role, SiteDef, SiteKind, SystemDef, SystemDomain } from '../types/domain.ts'
import { hydrateCatalog } from './catalog.ts'
import { hydrateFindings } from './findings.ts'
import { hydrateTelemetry } from './telemetry.ts'
import { getToken } from './auth.ts'

const API_BASE = '/api/saas'
const AUTH_ROOT = '/api'

export type ApiRole = 'SUPER_ADMIN' | 'MANAGEMENT' | 'OTHER'

export type LoginResult = {
  token: string
  email: string
  name: string
  role: Role
  apiRole: ApiRole
  tenantId?: string
  siteIds?: string[]
  mustChangePassword: boolean
}

const AUTH_ERRORS: Record<string, string> = {
  invalid_phone: '휴대폰 번호 형식이 맞지 않습니다.',
  invalid_email: '이메일 형식이 맞지 않습니다.',
  invalid_body: '인증번호는 숫자 6자리입니다.',
  invalid_login: '이메일 또는 비밀번호가 맞지 않습니다.',
  phone_not_registered: '등록되지 않은 휴대폰 번호입니다.',
  email_not_registered: '관리단·건물주 계정이 아닙니다.',
  code_recently_sent: '인증번호는 60초에 한 번만 받을 수 있습니다.',
  reset_recently_sent: '비밀번호 찾기는 잠시 뒤에 다시 요청하십시오.',
}

export function authFailure(err: unknown, fallback: string, wording?: Record<string, string>): string {
  const message = err instanceof Error ? err.message : ''
  if (wording?.[message]) return wording[message]
  if (AUTH_ERRORS[message]) return AUTH_ERRORS[message]
  if (message && !/^[a-z0-9_]+$/.test(message)) return message
  return fallback
}

function headers(extra?: HeadersInit): HeadersInit {
  const token = getToken()
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const contentType = response.headers.get('Content-Type') ?? ''

  // 프록시가 없으면 /api 요청이 SPA 폴백에 걸려 index.html이 돌아온다.
  // 주소와 상태 코드는 화면에 두지 않는다.
  if (text && !contentType.includes('json')) {
    throw new Error('값을 받지 못했습니다. 잠시 뒤 다시 보십시오.')
  }

  let body: (T & { error?: string }) | undefined
  if (text) {
    try {
      body = JSON.parse(text) as T & { error?: string }
    } catch {
      throw new Error('값을 받지 못했습니다. 잠시 뒤 다시 보십시오.')
    }
  }

  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : `요청 실패 (${response.status})`)
  }

  return (body ?? {}) as T
}

const JSON_POST: HeadersInit = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

type LoginPayload = {
  token?: string
  user?: {
    id?: string
    username?: string
    name?: string | null
    role?: string
    mustChangePassword?: boolean
  }
}

function readLogin(body: LoginPayload, fallbackName: string, kind: 'account' | 'phone'): LoginResult {
  if (!body.token) throw new Error('로그인 응답에 토큰이 없습니다.')
  const user = body.user
  const roleName = (user?.role ?? '').toUpperCase()
  const apiRole: ApiRole = roleName === 'SUPER_ADMIN' || roleName === 'MANAGEMENT' ? roleName : 'OTHER'
  const username = typeof user?.username === 'string' ? user.username.trim() : ''
  const personName = typeof user?.name === 'string' ? user.name.trim() : ''
  return {
    token: body.token,
    email: kind === 'phone' ? '' : (fallbackName || username),
    name: personName,
    role: apiRole === 'MANAGEMENT' ? 'exec' : 'ops',
    apiRole,
    mustChangePassword: kind === 'phone' ? false : user?.mustChangePassword === true,
  }
}

export async function loginRequest(email: string, password: string): Promise<LoginResult> {
  const value = email.trim()
  const response = await fetch(`${AUTH_ROOT}/login`, {
    method: 'POST',
    headers: JSON_POST,
    body: JSON.stringify({ email: value, password }),
  })
  return readLogin(await parse<LoginPayload>(response), value, 'account')
}

export async function requestLoginCode(phone: string): Promise<number> {
  const response = await fetch(`${AUTH_ROOT}/login/code`, {
    method: 'POST',
    headers: JSON_POST,
    body: JSON.stringify({ phone }),
  })
  const body = await parse<{ sent?: boolean; expiresIn?: number }>(response)
  if (body.sent === false) throw new Error('인증번호를 보내지 못했습니다.')
  return body.expiresIn ?? 180
}

export async function loginWithPhone(phone: string, code: string): Promise<LoginResult> {
  const response = await fetch(`${AUTH_ROOT}/login`, {
    method: 'POST',
    headers: JSON_POST,
    body: JSON.stringify({ phone, code }),
  })
  return readLogin(await parse<LoginPayload>(response), phone, 'phone')
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await fetch(`${AUTH_ROOT}/password/change`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  await parse<unknown>(response)
}

export async function requestPasswordReset(email: string): Promise<string> {
  const response = await fetch(`${AUTH_ROOT}/password/forgot`, {
    method: 'POST',
    headers: JSON_POST,
    body: JSON.stringify({ email: email.trim() }),
  })
  const body = await parse<{ sent?: boolean }>(response)
  if (body.sent === false) throw new Error('임시 비밀번호를 보내지 못했습니다.')
  return '임시 비밀번호를 이메일로 보냈습니다.'
}

const SITE_KINDS = new Set<SiteKind>(['building', 'utility'])
const SYSTEM_DOMAINS = new Set<SystemDomain>(['events', 'power', 'metering', 'solar', 'parking', 'ev', 'hvac', 'fire', 'security'])

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function finiteOf(row: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = row[key]
    const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function coordOf(row: Record<string, unknown>): { lat?: number; lng?: number } {
  const lat = finiteOf(row, ['lat', 'latitude'])
  const lng = finiteOf(row, ['lng', 'lon', 'longitude'])
  if (lat != null && lng != null) return { lat, lng }
  for (const key of ['geo', 'coord', 'coordinates', 'position']) {
    const nested = asRecord(row[key])
    if (!nested) continue
    const nestedLat = finiteOf(nested, ['lat', 'latitude', 'y'])
    const nestedLng = finiteOf(nested, ['lng', 'lon', 'longitude', 'x'])
    if (nestedLat != null && nestedLng != null) return { lat: nestedLat, lng: nestedLng }
  }
  return {}
}

function textOf(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number') return String(value)
  }
  return ''
}

function siteList(body: unknown): unknown[] {
  if (Array.isArray(body)) return body
  const bag = asRecord(body)
  if (!bag) return []
  const keys = ['sites', 'items', 'data', 'rows', 'list', 'result', 'content', 'records', 'buildings']
  for (const key of keys) {
    const value = bag[key]
    if (Array.isArray(value)) return value
    const nested = asRecord(value)
    if (!nested) continue
    for (const inner of ['sites', 'items', 'content', 'records', 'rows', 'list']) {
      if (Array.isArray(nested[inner])) return nested[inner] as unknown[]
    }
  }
  if (textOf(bag, ['id', 'siteId', 'site_id', 'siteCode', 'site_code'])) return [bag]
  return []
}

function systemsOf(value: unknown): SystemDef[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const row = asRecord(item)
    if (!row) return []
    const id = textOf(row, ['id', 'systemId', 'system_id'])
    const name = textOf(row, ['name', 'systemName', 'system_name', 'title'])
    const domain = textOf(row, ['domain', 'type'])
    if (!id || !name || !SYSTEM_DOMAINS.has(domain as SystemDomain)) return []
    return [{ id, name, domain: domain as SystemDomain, equipment: [] }]
  })
}

export function readSites(body: unknown): SiteDef[] {
  return siteList(body).flatMap((item) => {
    const row = asRecord(item)
    if (!row) return []
    const id = textOf(row, ['id', 'siteId', 'site_id', 'siteCode', 'site_code'])
    const name = textOf(row, ['name', 'siteName', 'site_name', 'buildingName', 'building_name', 'siteNm', 'title', 'label'])
    if (!id || !name) return []
    const kind = textOf(row, ['kind', 'type'])
    return [{
      id,
      name,
      kind: SITE_KINDS.has(kind as SiteKind) ? kind as SiteKind : 'building',
      location: textOf(row, ['location', 'address', 'addr']),
      ...coordOf(row),
      connectorIds: [],
      plans: [],
      cameras: [],
      systems: systemsOf(row.systems),
    }]
  })
}

export type Notice = {
  id: string
  title: string
  body: string
  at: string
}

export async function fetchNotices(): Promise<Notice[]> {
  // saas-api 에 GET /api/notices 가 없다. 없는 주소를 치면 브라우저가 404를 콘솔에 남긴다.
  return []
}

export async function fetchSites(): Promise<SiteDef[]> {
  const response = await fetch(`${AUTH_ROOT}/sites`, {
    method: 'GET',
    headers: headers(),
  })
  if (response.status === 404) throw new Error('현장 목록 주소를 찾지 못했습니다.')
  const body = await parse<unknown>(response)
  const sites = readSites(body)
  if (sites.length === 0) throw new Error('배정된 현장이 없습니다.')
  return sites
}

export async function fetchSiteSensors(siteId: string): Promise<unknown> {
  const response = await fetch(`${AUTH_ROOT}/sites/${encodeURIComponent(siteId)}/sensors`, { headers: headers() })
  return parse<unknown>(response)
}

export async function fetchSiteDashboard(siteId: string): Promise<unknown> {
  const response = await fetch(`${AUTH_ROOT}/dashboard?siteId=${encodeURIComponent(siteId)}`, { headers: headers() })
  return parse<unknown>(response)
}

export async function fetchSiteReadings(siteId: string) {
  const response = await fetch(`${API_BASE}/sites/${encodeURIComponent(siteId)}/readings`, { headers: headers() })
  return parse<unknown>(response)
}

export async function fetchReadings(since?: string) {
  const query = since ? `?since=${encodeURIComponent(since)}` : ''
  const response = await fetch(`${API_BASE}/readings${query}`, { headers: headers() })
  return parse<unknown>(response)
}

export async function fetchDashboardSummary(siteId: string) {
  const response = await fetch(`${API_BASE}/sites/${encodeURIComponent(siteId)}/dashboard/summary`, {
    headers: headers(),
  })
  return parse<unknown>(response)
}

export function hydrateSnapshot(snapshot: QuerySnapshot) {
  hydrateCatalog(snapshot.catalog)
  hydrateFindings(snapshot.findings)
  hydrateTelemetry(snapshot)
}
