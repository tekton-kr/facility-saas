import { dutySiteId } from './roleHome.ts'
import { fetchSnapshot, hydrateSnapshot, loginDemoRequest, loginRequest, openQueryStream } from './api.ts'

const KEY = 't-arch-session'
const TOKEN_KEY = 't-arch-token'
const EVENT = 't-arch-auth'

export type Session = {
  email: string
  name: string
  role: 'ops' | 'exec'
}

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export function homePath(role: Session['role']): string {
  if (role === 'exec') return '/apps/power?role=exec'
  return `/apps/events/sites/${dutySiteId('events')}`
}

export function safeNext(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//') || value.startsWith('/login')) return null
  return value
}

export function getSession(): Session | null {
  try {
    if (!getToken()) return null
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (!parsed.email || (parsed.role !== 'ops' && parsed.role !== 'exec')) return null
    return parsed
  } catch {
    return null
  }
}

function emit() {
  window.dispatchEvent(new Event(EVENT))
}

export function setSession(session: Session | null) {
  if (session) sessionStorage.setItem(KEY, JSON.stringify(session))
  else sessionStorage.removeItem(KEY)
  emit()
}

async function establish(result: { token: string; email: string; name: string; role: Session['role'] }): Promise<Session> {
  setToken(result.token)
  try {
    const snapshot = await fetchSnapshot()
    hydrateSnapshot(snapshot)
  } catch (error) {
    setToken(null)
    sessionStorage.removeItem(KEY)
    throw error
  }
  const session = { email: result.email, name: result.name, role: result.role }
  setSession(session)
  return session
}

export async function signIn(email: string, password: string): Promise<Session | null> {
  if (!password.trim()) {
    return establish(await loginDemoRequest(email))
  }
  return establish(await loginRequest(email, password))
}

export async function signInDemo(email: string): Promise<Session> {
  return establish(await loginDemoRequest(email))
}

let logoutAt = 0

export function signOut() {
  logoutAt = Date.now()
  setToken(null)
  setSession(null)
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
  try {
    const snapshot = await fetchSnapshot()
    hydrateSnapshot(snapshot)
    return session
  } catch {
    signOut()
    return null
  }
}

export function watchStream(onTick: () => void): () => void {
  return openQueryStream(onTick)
}
