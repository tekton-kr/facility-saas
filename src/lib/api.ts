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

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const body = text ? JSON.parse(text) as T & { error?: string } : ({} as T)
  if (!response.ok) {
    const message = typeof (body as { error?: string }).error === 'string'
      ? (body as { error: string }).error
      : `요청 실패 (${response.status})`
    throw new Error(message)
  }
  return body
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
    const payload = JSON.parse(event.data) as {
      syncAt: string
      points: Array<{ key: string; current: number | null; receivedAt: string | null }>
    }
    applyStreamTick(payload)
    onTick()
  }
  return () => source.close()
}
