import type { QuerySnapshot, Role, SiteDef, SiteKind, SystemDef, SystemDomain } from '../types/domain.ts'
import { hydrateCatalog } from './catalog.ts'
import { hydrateFindings } from './findings.ts'
import { hydrateTelemetry } from './telemetry.ts'
import { getToken } from './auth.ts'

const API_BASE = import.meta.env.VITE_API_BASE || '/api/saas'
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
  invalid_login: '이메일·비밀번호 또는 인증번호가 맞지 않습니다.',
  phone_not_registered: '등록되지 않은 휴대폰 번호입니다.',
  email_not_registered: '관리단·건물주 계정이 아닙니다.',
  code_recently_sent: '인증번호는 60초에 한 번만 받을 수 있습니다.',
  reset_recently_sent: '비밀번호 찾기는 잠시 뒤에 다시 요청하십시오.',
}

export function authFailure(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : ''
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

const API_HINT = '개발 서버와 배포가 /api 를 https://saas-api.tekton.co.kr 로 넘기는지 확인하십시오.'

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const contentType = response.headers.get('Content-Type') ?? ''

  // 프록시가 없으면 /api 요청이 SPA 폴백에 걸려 index.html이 돌아온다.
  // 그대로 JSON.parse 하면 "Unexpected token '<'" 만 남아 원인을 못 찾는다.
  if (text && !contentType.includes('json')) {
    throw new Error(`조회 API가 JSON이 아닌 응답을 보냈습니다 (${response.status}). ${API_HINT}`)
  }

  let body: (T & { error?: string }) | undefined
  if (text) {
    try {
      body = JSON.parse(text) as T & { error?: string }
    } catch {
      throw new Error(`조회 API 응답을 읽지 못했습니다 (${response.status}). ${API_HINT}`)
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
    role?: string
    mustChangePassword?: boolean
  }
}

function readLogin(body: LoginPayload, fallbackName: string, kind: 'account' | 'phone'): LoginResult {
  if (!body.token) throw new Error('로그인 응답에 토큰이 없습니다.')
  const user = body.user
  const roleName = (user?.role ?? '').toUpperCase()
  const apiRole: ApiRole = roleName === 'SUPER_ADMIN' || roleName === 'MANAGEMENT' ? roleName : 'OTHER'
  return {
    token: body.token,
    email: fallbackName,
    name: user?.username || fallbackName,
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
  for (const key of ['sites', 'items', 'data', 'rows', 'list', 'result']) {
    const value = bag[key]
    if (Array.isArray(value)) return value
    const nested = asRecord(value)
    if (nested && Array.isArray(nested.sites)) return nested.sites
  }
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
    const id = textOf(row, ['id', 'siteId', 'site_id'])
    const name = textOf(row, ['name', 'siteName', 'site_name', 'title'])
    if (!id || !name) return []
    const kind = textOf(row, ['kind', 'type'])
    return [{
      id,
      name,
      kind: SITE_KINDS.has(kind as SiteKind) ? kind as SiteKind : 'building',
      location: textOf(row, ['location', 'address', 'addr']),
      connectorIds: [],
      plans: [],
      cameras: [],
      systems: systemsOf(row.systems),
    }]
  })
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
