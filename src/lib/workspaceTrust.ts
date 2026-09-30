import { tenantBySlug } from './tenant.ts'

const KEY = 't-arch-workspace-trust'

type Trust = {
  tenantId: string
  trustedAt: string
}

function read(): Trust[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) as Trust[] : []
  } catch {
    return []
  }
}

function write(items: Trust[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function isWorkspaceTrusted(tenantId: string): boolean {
  return read().some((item) => item.tenantId === tenantId)
}

export function trustWorkspace(tenantId: string) {
  if (!tenantId || isWorkspaceTrusted(tenantId)) return
  write([...read(), { tenantId, trustedAt: new Date().toISOString() }])
}

export function trustedTenantFromSlug(slug: string) {
  const tenant = tenantBySlug(slug)
  if (!tenant || !isWorkspaceTrusted(tenant.id)) return undefined
  return tenant
}
