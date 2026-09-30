import type { TenantDef } from '../data/tenants.ts'

const KEY = 't-arch-passkeys'

export type StoredPasskey = {
  tenantId: string
  credentialId: string
  userId: string
  name: string
  createdAt: string
}

function read(): StoredPasskey[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) as StoredPasskey[] : []
  } catch {
    return []
  }
}

function write(items: StoredPasskey[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

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

export function passkeySupported(): boolean {
  return typeof window !== 'undefined' && Boolean(window.PublicKeyCredential)
}

export function passkeysFor(tenantId: string): StoredPasskey[] {
  return read().filter((item) => item.tenantId === tenantId)
}

function challenge(): Uint8Array {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return bytes
}

export async function registerPasskey(tenant: TenantDef): Promise<StoredPasskey> {
  if (!passkeySupported()) throw new Error('이 브라우저는 패스키를 지원하지 않습니다.')
  const userId = crypto.randomUUID()
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: challenge().buffer as ArrayBuffer,
      rp: { name: 'T-ARCH', id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(userId),
        name: `${tenant.slug}@t-arch`,
        displayName: tenant.name,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      timeout: 60_000,
    },
  })
  if (!(credential instanceof PublicKeyCredential)) throw new Error('패스키를 만들지 못했습니다.')
  const stored: StoredPasskey = {
    tenantId: tenant.id,
    credentialId: bytesToUrl(new Uint8Array(credential.rawId)),
    userId,
    name: tenant.name,
    createdAt: new Date().toISOString(),
  }
  write([...read().filter((item) => item.credentialId !== stored.credentialId), stored])
  return stored
}

export async function assertPasskey(tenant: TenantDef): Promise<StoredPasskey> {
  if (!passkeySupported()) throw new Error('이 브라우저는 패스키를 지원하지 않습니다.')
  const known = passkeysFor(tenant.id)
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: challenge().buffer as ArrayBuffer,
      rpId: window.location.hostname,
      userVerification: 'preferred',
      timeout: 60_000,
      allowCredentials: known.map((item) => ({
        type: 'public-key' as const,
        id: urlToBytes(item.credentialId).buffer as ArrayBuffer,
      })),
    },
  })
  if (!(credential instanceof PublicKeyCredential)) throw new Error('패스키를 확인하지 못했습니다.')
  const id = bytesToUrl(new Uint8Array(credential.rawId))
  const matched = known.find((item) => item.credentialId === id)
  if (!matched) throw new Error('이 워크스페이스에 등록된 패스키가 아닙니다.')
  return matched
}
