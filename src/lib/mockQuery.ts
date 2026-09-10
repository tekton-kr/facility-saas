import type { QuerySnapshot, Role, TimeRange } from '../types/domain.ts'
import { getCatalog, listPoints } from './catalog.ts'
import { generateFindings } from './findings.ts'
import { generateAlarms, generateTelemetry, lastSyncAt, telemetryKey } from './telemetry.ts'

const RANGES: TimeRange[] = ['live', '1h', 'today', '24h', '7d', '30d']

export type MockAccount = {
  email: string
  name: string
  role: Role
  note: string
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    email: 'ops@t-arch.local',
    name: '현장 근무',
    role: 'ops',
    note: '목업. 근무 현장 하나',
  },
  {
    email: 'exec@t-arch.local',
    name: '경영 조회',
    role: 'exec',
    note: '목업. 포트폴리오',
  },
]

export function mockLogin(email: string): {
  token: string
  email: string
  name: string
  role: Role
} {
  const trimmed = email.trim().toLowerCase()
  const matched = MOCK_ACCOUNTS.find((item) => item.email === trimmed)
  const fallback = trimmed.includes('exec')
    ? MOCK_ACCOUNTS.find((item) => item.role === 'exec')
    : MOCK_ACCOUNTS[0]
  const account = matched ?? fallback ?? MOCK_ACCOUNTS[0]
  return {
    token: `mock:${account.role}`,
    email: account.email,
    name: account.name,
    role: account.role,
  }
}

export function buildLocalSnapshot(): QuerySnapshot {
  const telemetry: QuerySnapshot['telemetry'] = {}
  for (const row of listPoints({})) {
    for (const range of RANGES) {
      telemetry[telemetryKey(row, range)] = generateTelemetry(row, range)
    }
  }
  return {
    catalog: getCatalog(),
    alarms: generateAlarms(),
    findings: generateFindings(),
    telemetry,
    syncAt: lastSyncAt(),
  }
}
