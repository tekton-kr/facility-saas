import { getTenant } from './tenant.ts'

export const STAFF_RANKS = ['관리소장', '시설팀장', '시설직원', '방재실'] as const
export type StaffRank = (typeof STAFF_RANKS)[number]

export type StaffRecord = {
  phone: string
  name: string
  rank: StaffRank
  tenantId: string
  siteIds: string[]
}

export type ExecRecord = {
  email: string
  name: string
  tenantId: string
  siteIds: string[]
}

export type DeskRecord = {
  email: string
  name: string
}

const KEY = 't-arch-staff-roster'
const EVENT = 't-arch-staff'

const SEED: StaffRecord[] = [
  {
    phone: '01012345678',
    name: '김현장',
    rank: '시설직원',
    tenantId: 'tekton',
    siteIds: ['hanam-hq'],
  },
  {
    phone: '01022223333',
    name: '이소장',
    rank: '관리소장',
    tenantId: 'tekton',
    siteIds: ['hanam-hq', 'suwon-off'],
  },
  {
    phone: '01033334444',
    name: '최시설',
    rank: '방재실',
    tenantId: 'tekton',
    siteIds: ['hanam-hq'],
  },
]

const EXECS: ExecRecord[] = [
  {
    email: 'exec@t-arch',
    name: '박경영',
    tenantId: 'tekton',
    siteIds: ['hanam-hq', 'hanam-plant'],
  },
]

const DESKS: DeskRecord[] = [
  {
    email: 'desk@t-arch',
    name: '텍톤 관제',
  },
]

const pendingOtp = new Map<string, string>()

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatPhone(value: string): string {
  const digits = normalizePhone(value).slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function phoneTail(phone: string): string {
  const digits = normalizePhone(phone)
  return digits.slice(-4)
}

function isRank(value: unknown): value is StaffRank {
  return STAFF_RANKS.some((rank) => rank === value)
}

function rankOf(phone: string, value: unknown): StaffRank {
  if (isRank(value)) return value
  return SEED.find((row) => row.phone === phone)?.rank ?? '시설직원'
}

function copyStaff(rows: StaffRecord[]): StaffRecord[] {
  return rows.map((row) => ({ ...row, siteIds: [...row.siteIds] }))
}

function loadStaff(): StaffRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return copyStaff(SEED)
    const parsed = JSON.parse(raw) as StaffRecord[]
    if (!Array.isArray(parsed)) return copyStaff(SEED)
    return parsed
      .filter((row) => row && typeof row.phone === 'string' && typeof row.name === 'string')
      .map((row) => ({
        phone: normalizePhone(row.phone),
        name: row.name,
        rank: rankOf(normalizePhone(row.phone), row.rank),
        tenantId: row.tenantId,
        siteIds: [...(row.siteIds ?? [])],
      }))
  } catch {
    return copyStaff(SEED)
  }
}

function saveStaff(rows: StaffRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(rows))
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT))
}

export function subscribeStaff(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  return () => window.removeEventListener(EVENT, onChange)
}

function scopedRecord<T extends { tenantId: string; siteIds: string[] }>(row: T): T | null {
  const tenant = getTenant(row.tenantId)
  if (!tenant) return null
  const siteIds = row.siteIds.filter((id) => tenant.siteIds.includes(id))
  if (siteIds.length === 0) return null
  return { ...row, siteIds }
}

export function listStaff(tenantId: string): StaffRecord[] {
  return loadStaff()
    .filter((row) => row.tenantId === tenantId)
    .map((row) => scopedRecord(row))
    .filter((row): row is StaffRecord => Boolean(row))
}

export function lookupStaff(phone: string): StaffRecord | null {
  const digits = normalizePhone(phone)
  if (digits.length !== 11 || !digits.startsWith('010')) return null
  const row = loadStaff().find((item) => item.phone === digits)
  if (!row) return null
  return scopedRecord(row)
}

function assertManagerRemains(rows: StaffRecord[], tenantId: string) {
  const managers = rows.filter((item) => item.tenantId === tenantId && item.rank === '관리소장' && item.siteIds.length > 0)
  if (managers.length === 0) throw new Error('관리소장은 한 명은 있어야 합니다.')
}

export function upsertStaff(input: {
  phone: string
  name: string
  tenantId: string
  siteIds: string[]
  rank: StaffRank
  previousPhone?: string
}): StaffRecord {
  const tenant = getTenant(input.tenantId)
  if (!tenant) throw new Error('없는 고객사입니다.')
  const phone = normalizePhone(input.phone)
  if (phone.length !== 11 || !phone.startsWith('010')) {
    throw new Error('휴대폰 번호 11자리를 넣으십시오.')
  }
  const name = input.name.trim()
  if (!name) throw new Error('이름을 넣으십시오.')
  if (!isRank(input.rank)) throw new Error('직급을 고르십시오.')
  const siteIds = input.siteIds.filter((id) => tenant.siteIds.includes(id))
  if (siteIds.length === 0) throw new Error('현장을 고르십시오.')
  const previous = input.previousPhone ? normalizePhone(input.previousPhone) : phone
  const row: StaffRecord = { phone, name, rank: input.rank, tenantId: tenant.id, siteIds }
  const next = loadStaff().filter((item) => item.phone !== phone && item.phone !== previous)
  const saved = [...next, row]
  assertManagerRemains(saved, tenant.id)
  saveStaff(saved)
  if (previous !== phone) pendingOtp.delete(previous)
  return row
}

export function removeStaff(phone: string): boolean {
  const digits = normalizePhone(phone)
  const rows = loadStaff()
  const current = rows.find((item) => item.phone === digits)
  if (!current) return false
  const next = rows.filter((item) => item.phone !== digits)
  assertManagerRemains(next, current.tenantId)
  saveStaff(next)
  pendingOtp.delete(digits)
  return true
}

export function unassignStaff(phone: string, siteId: string): void {
  const row = lookupStaff(phone)
  if (!row) return
  const siteIds = row.siteIds.filter((id) => id !== siteId)
  if (siteIds.length === 0) {
    removeStaff(phone)
    return
  }
  upsertStaff({ ...row, siteIds, previousPhone: row.phone })
}

export function issueStaffOtp(phone: string): string {
  const digits = normalizePhone(phone)
  const code = String(Math.floor(100000 + Math.random() * 900000))
  pendingOtp.set(digits, code)
  return code
}

export function checkStaffOtp(phone: string, code: string): boolean {
  return pendingOtp.get(normalizePhone(phone)) === code.replace(/\D/g, '')
}

const PASS_KEY = 't-arch-exec-passwords'
const SEED_PASSWORD = 'arch2026'

function execKey(email: string): string {
  return email.trim().toLowerCase()
}

function loadExecPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function lookupExecEmail(email: string): ExecRecord | null {
  const key = execKey(email)
  if (!key) return null
  const row = EXECS.find((item) => item.email === key)
  if (!row) return null
  return scopedRecord(row)
}

export function checkExecPassword(email: string, password: string): boolean {
  const key = execKey(email)
  if (!lookupExecEmail(key)) return false
  const saved = loadExecPasswords()[key] ?? SEED_PASSWORD
  return saved.length > 0 && saved === password
}

export function issueExecPassword(email: string): string | null {
  const key = execKey(email)
  if (!lookupExecEmail(key)) return null
  const next = `arch-${String(Math.floor(1000 + Math.random() * 9000))}`
  const all = loadExecPasswords()
  all[key] = next
  localStorage.setItem(PASS_KEY, JSON.stringify(all))
  return next
}

export function lookupDeskEmail(email: string): DeskRecord | null {
  const key = email.trim().toLowerCase()
  if (!key) return null
  return DESKS.find((item) => item.email === key) ?? null
}
