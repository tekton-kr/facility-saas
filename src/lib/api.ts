import type { QuerySnapshot, Role } from '../types/domain.ts'
import { hydrateCatalog } from './catalog.ts'
import { hydrateFindings } from './findings.ts'
import { applyStreamTick, hydrateTelemetry } from './telemetry.ts'
import { getToken } from './auth.ts'

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

export type AuthAccount = {
  email: string
  name: string
  role: Role
  note: string
}

export type LoginResult = {
  token: string
  email: string
  name: string
  role: Role
}

function headers(extra?: HeadersInit): HeadersInit {
  const token = getToken()
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

const API_HINT = '.env의 API_ORIGIN이 중앙 조회 서버를 가리키는지 확인하십시오.'

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

export async function fetchAccounts(): Promise<AuthAccount[]> {
  const response = await fetch(`${API_BASE}/auth/accounts`, { headers: headers() })
  const body = await parse<{ accounts: AuthAccount[] }>(response)
  return body.accounts
}

export async function loginRequest(email: string, password: string): Promise<LoginResult> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ email, password }),
  })
  return parse<LoginResult>(response)
}

export async function loginDemoRequest(email: string): Promise<LoginResult> {
  const response = await fetch(`${API_BASE}/auth/demo`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ email }),
  })
  return parse<LoginResult>(response)
}

export async function fetchSnapshot(): Promise<QuerySnapshot> {
  const response = await fetch(`${API_BASE}/snapshot`, { headers: headers() })
  return parse<QuerySnapshot>(response)
}

export function hydrateSnapshot(snapshot: QuerySnapshot) {
  hydrateCatalog(snapshot.catalog)
  hydrateFindings(snapshot.findings)
  hydrateTelemetry(snapshot)
}

export function openQueryStream(onTick: () => void): () => void {
  const token = getToken()
  if (!token || typeof EventSource === 'undefined') return () => {}
  const source = new EventSource(`${API_BASE}/stream?access_token=${encodeURIComponent(token)}`)
  source.onmessage = (event) => {
    let payload: {
      syncAt: string
      points: Array<{ key: string; current: number | null; receivedAt: string | null }>
    }
    try {
      payload = JSON.parse(event.data) as typeof payload
    } catch {
      return
    }
    applyStreamTick(payload)
    onTick()
  }
  return () => source.close()
}
