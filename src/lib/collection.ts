import type { AlarmKind, AppId, SystemDomain } from '../types/domain.ts'

export type CollectionState = 'live' | 'pending'

export const APP_COLLECTION: Record<AppId, CollectionState> = {
  events: 'live',
  power: 'live',
  metering: 'live',
  solar: 'live',
  parking: 'pending',
  ev: 'pending',
}

export const DOMAIN_COLLECTION: Record<SystemDomain, CollectionState> = {
  events: 'live',
  power: 'live',
  metering: 'live',
  solar: 'live',
  hvac: 'live',
  parking: 'pending',
  ev: 'pending',
  fire: 'pending',
  security: 'pending',
}

export const PENDING_ALARM_KINDS: AlarmKind[] = ['fire', 'intrusion']

export type PendingSlot = {
  id: string
  label: string
  note: string
  app?: AppId
}

export const PENDING_SLOTS: PendingSlot[] = [
  { id: 'fire', label: '소방수신기', note: '수신기 업체 협의' },
  { id: 'cctv', label: 'CCTV', note: '현장 VMS. 아카이브 없음' },
  { id: 'parking', label: '주차', note: '주차관제 협의', app: 'parking' },
  { id: 'ev', label: 'EV', note: '충전기 협의', app: 'ev' },
  { id: 'elevator', label: '엘리베이터', note: '카탈로그 없음' },
]

export function isAppCollected(app: AppId): boolean {
  return APP_COLLECTION[app] === 'live'
}

export function isDomainCollected(domain: SystemDomain): boolean {
  return DOMAIN_COLLECTION[domain] === 'live'
}

export function isAlarmKindCollected(kind: AlarmKind): boolean {
  return !PENDING_ALARM_KINDS.includes(kind)
}
