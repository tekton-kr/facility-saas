export type NotifyPayload = {
  alarmId: string
  siteId: string
  exp: number
}

const TTL_MS = 48 * 60 * 60 * 1000

function bytesToUrl(bytes: Uint8Array): string {
  let bin = ''
  bytes.forEach((byte) => {
    bin += String.fromCharCode(byte)
  })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function urlToBytes(value: string): Uint8Array {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4))
  const bin = atob(value.replace(/-/g, '+').replace(/_/g, '/') + pad)
  return Uint8Array.from(bin, (char) => char.charCodeAt(0))
}

function encodeBody(payload: NotifyPayload): string {
  return bytesToUrl(new TextEncoder().encode(JSON.stringify(payload)))
}

function decodeBody(body: string): NotifyPayload | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(urlToBytes(body))) as NotifyPayload
    if (!parsed.alarmId || !parsed.siteId || typeof parsed.exp !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

export async function issueNotifyToken(alarmId: string, siteId: string): Promise<string> {
  return encodeBody({
    alarmId,
    siteId,
    exp: Date.now() + TTL_MS,
  })
}

export async function readNotifyToken(token: string): Promise<NotifyPayload | null> {
  const trimmed = token.trim()
  if (!trimmed) return null
  const body = trimmed.split('.')[0]
  if (!body) return null
  const payload = decodeBody(body)
  if (!payload || payload.exp < Date.now()) return null
  return payload
}

export function notifyPath(token: string): string {
  return `/n/${encodeURIComponent(token)}`
}
