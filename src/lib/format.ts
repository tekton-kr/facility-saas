import type {
  AlarmKind,
  AlarmSeverity,
  AppId,
  Certainty,
  DirectoryRole,
  PackageStatus,
  Role,
  SiteKind,
  SitePreset,
  TimeRange,
  WorkKind,
  WorkStatus,
} from '../types/domain.ts'

export const APP_LABEL: Record<AppId, string> = {
  events: '이벤트',
  power: '전력',
  metering: '검침',
  solar: '태양광',
  parking: '주차',
  ev: 'EV',
}

export const KIND_LABEL: Record<SiteKind, string> = {
  building: '빌딩',
  utility: '유틸리티',
}

export const ROLE_LABEL: Record<Role, string> = {
  ops: '운전자',
  exec: '경영',
}

export const DIRECTORY_LABEL: Record<DirectoryRole, string> = {
  ops: '운전자',
  exec: '경영',
  vendor: '협력사',
}

export const WORK_KIND_LABEL: Record<WorkKind, string> = {
  dispatch: '출동',
  pm: '점검',
  statutory: '법정',
}

export const WORK_STATUS_LABEL: Record<WorkStatus, string> = {
  received: '접수',
  dispatch: '출동',
  'on-site': '현장',
  done: '완료',
}

export const PACKAGE_STATUS_LABEL: Record<PackageStatus, string> = {
  candidate: '후보',
  quoted: '견적',
  'in-progress': '시공중',
  done: '준공',
}

export const PRESET_LABEL: Record<SitePreset, string> = {
  office: '오피스',
  warehouse: '물류',
  hospital: '병원',
  hotel: '호텔',
  mart: '마트',
  utility: '유틸리티',
}

export const RANGE_LABEL: Record<TimeRange, string> = {
  live: '실시간',
  '1h': '1시간',
  today: '오늘',
  '24h': '24시간',
  '7d': '7일',
  '30d': '30일',
}

export const CERTAINTY_LABEL: Record<Certainty, string> = {
  confirmed: '실측',
  estimate: '추정',
  unknown: '판정 불가',
  stale: '지연',
}

export const SEVERITY_LABEL: Record<AlarmSeverity, string> = {
  critical: '위험',
  warning: '주의',
  info: '정보',
}

export const KIND_ALARM_LABEL: Record<AlarmKind, string> = {
  fire: '소방',
  intrusion: '침입',
  equipment: '설비',
  'data-quality': '데이터',
}

export function formatNumber(value: number | null, digits = 1): string {
  if (value === null) return '—'
  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: digits,
    minimumFractionDigits: Number.isInteger(value) ? 0 : Math.min(digits, 1),
  }).format(value)
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '수신 없음'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '수신 없음'
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatDelta(value: number | null, previous: number | null): string | null {
  if (value === null || previous === null || previous === 0) return null
  const pct = ((value - previous) / previous) * 100
  const sign = pct > 0 ? '+' : ''
  return `이전 대비 ${sign}${pct.toFixed(1)}%`
}

export function formatSource(source: string): string {
  const cut = source.split('.')[0]?.trim()
  return cut || source
}

export function formatTime(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}
