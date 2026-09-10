import type { Alarm, AppId, Kpi, PointRef, QuerySnapshot, Telemetry, TimeRange } from '../types/domain.ts'
import { getPoint, getSite, getSites, listPoints, pointKey } from './catalog.ts'
import { isBrowser } from './env.ts'

const SAMPLE_AT = new Date('2026-09-10T20:04:00+09:00')

function hash(input: string): number {
  let value = 0
  for (let i = 0; i < input.length; i += 1) {
    value = (value * 31 + input.charCodeAt(i)) >>> 0
  }
  return value
}

function seriesLength(range: TimeRange): number {
  if (range === 'live' || range === '1h') return 12
  if (range === 'today' || range === '24h') return 24
  if (range === '7d') return 28
  return 30
}

function isoMinutesAgo(minutes: number): string {
  return new Date(SAMPLE_AT.getTime() - minutes * 60_000).toISOString()
}

function baseline(ref: PointRef): number {
  const seed = hash(pointKey(ref))
  if (ref.pointId === 'daily' || ref.pointId === 'today' || ref.pointId === 'kwh') return 180 + (seed % 40)
  if (ref.pointId === 'peak' || ref.pointId === 'cap') return 90 + (seed % 20)
  if (ref.pointId === 'occ') return 40 + (seed % 30)
  return 40 + (seed % 25)
}

function telCacheKey(ref: PointRef, range: TimeRange): string {
  return `${pointKey(ref)}|${range}`
}

const missingTel: Telemetry = {
  current: null,
  receivedAt: null,
  series: null,
  certainty: 'unknown',
  note: '조회 API 미수신',
}

let queryHydrated = false
let telemetryCache = new Map<string, Telemetry>()
let alarmCache: Alarm[] | null = null
let syncAt = SAMPLE_AT.toISOString()

export function hydrateTelemetry(snapshot: Pick<QuerySnapshot, 'telemetry' | 'alarms' | 'syncAt'>) {
  queryHydrated = true
  telemetryCache = new Map(Object.entries(snapshot.telemetry))
  alarmCache = snapshot.alarms
  syncAt = snapshot.syncAt
}

export function applyStreamTick(update: {
  syncAt: string
  points: Array<{ key: string; current: number | null; receivedAt: string | null }>
}) {
  syncAt = update.syncAt
  for (const point of update.points) {
    for (const [cacheKey, value] of telemetryCache) {
      if (!cacheKey.startsWith(`${point.key}|`)) continue
      telemetryCache.set(cacheKey, { ...value, current: point.current, receivedAt: point.receivedAt })
    }
  }
}

export function generateTelemetry(ref: PointRef, range: TimeRange): Telemetry {
  const found = getPoint(ref)
  if (!found) {
    return {
      current: null,
      receivedAt: null,
      series: null,
      certainty: 'unknown',
      note: '카탈로그에 없는 관제점',
    }
  }

  const flags = found.point.flags
  if (flags?.noTelemetry) {
    return { current: null, receivedAt: null, series: null, certainty: 'unknown', note: '데이터 없음' }
  }
  if (flags?.offline) {
    return {
      current: null,
      receivedAt: isoMinutesAgo(180),
      series: null,
      certainty: 'unknown',
      note: '통신 두절',
    }
  }

  const n = seriesLength(range)
  const seed = hash(pointKey(ref) + range)
  const base = baseline(ref)
  const series = Array.from({ length: n }, (_, index) => {
    const wave = Math.sin((index + (seed % 7)) / 3.2) * (base * 0.08)
    return Math.round((base + wave) * 10) / 10
  })
  const current = series[n - 1] ?? null

  if (flags?.stale) {
    return {
      current,
      receivedAt: isoMinutesAgo(95),
      series,
      certainty: 'stale',
      note: '마지막 수신 후 지연',
    }
  }

  return { current, receivedAt: isoMinutesAgo(3), series, certainty: 'confirmed' }
}

export function getTelemetry(ref: PointRef, range: TimeRange): Telemetry {
  if (queryHydrated) {
    return telemetryCache.get(telCacheKey(ref, range)) ?? missingTel
  }
  if (isBrowser()) return missingTel
  return generateTelemetry(ref, range)
}

export function lastSyncAt(): string {
  return syncAt
}

export function telemetryKey(ref: PointRef, range: TimeRange): string {
  return telCacheKey(ref, range)
}

function sumTag(points: ReturnType<typeof listPoints>, range: TimeRange, tag: string, pointId?: string) {
  let total = 0
  let ok = 0
  let receivedAt: string | null = null
  let certainty: Kpi['certainty'] = 'unknown'
  for (const row of points) {
    if (pointId && row.point.id !== pointId) continue
    if (!row.point.tags.includes(tag) && row.point.id !== pointId) continue
    const tel = getTelemetry(row, range)
    if (tel.current === null) continue
    total += tel.current
    ok += 1
    receivedAt = tel.receivedAt
    certainty = tel.certainty === 'stale' ? 'stale' : 'confirmed'
  }
  return { total, ok, receivedAt, certainty }
}

function seriesOf(
  points: ReturnType<typeof listPoints>,
  range: TimeRange,
  match: (row: ReturnType<typeof listPoints>[number]) => boolean,
): number[] | null {
  const row = points.find(match)
  return row ? getTelemetry(row, range).series : null
}

export function kpisForScope(options: {
  app: AppId
  siteId?: string
  systemId?: string
  range: TimeRange
}): Kpi[] {
  const points = listPoints({
    siteId: options.siteId,
    systemId: options.systemId,
    app: options.app === 'events' ? undefined : options.app,
  })
  const sites = options.siteId ? [getSite(options.siteId)].filter(Boolean) : getSites()
  const missingArea = sites.some((site) => site && site.areaM2 == null)
  const totalArea = sites.reduce((sum, site) => sum + (site?.areaM2 ?? 0), 0)

  if (options.app === 'power') {
    const energy = sumTag(points, options.range, 'meter', 'daily')
    const demand = points.find((row) => row.point.id === 'main')
    const demandTel = demand ? getTelemetry(demand, options.range) : undefined
    const peak = sumTag(points, options.range, 'elec', 'peak')
    const eui = !missingArea && totalArea > 0 && energy.ok > 0 ? (energy.total * 365) / totalArea : null
    return [
      {
        id: 'energy',
        label: '금일 전력',
        value: energy.ok > 0 ? Math.round(energy.total) : null,
        unit: 'kWh',
        certainty: energy.ok > 0 ? energy.certainty : 'unknown',
        receivedAt: energy.receivedAt,
        previousValue: energy.ok > 0 ? Math.round(energy.total * 0.96) : null,
        series: seriesOf(points, options.range, (row) => row.point.id === 'daily'),
      },
      {
        id: 'demand',
        label: '현재 수요',
        value: demandTel?.current ?? null,
        unit: 'kW',
        certainty: demandTel?.certainty ?? 'unknown',
        receivedAt: demandTel?.receivedAt ?? null,
        note: demandTel?.note,
        series: demandTel?.series ?? null,
      },
      {
        id: 'peak',
        label: '최대수요',
        value: peak.ok > 0 ? peak.total : null,
        unit: 'kW',
        certainty: peak.ok > 0 ? 'confirmed' : 'unknown',
        receivedAt: peak.receivedAt,
        series: seriesOf(points, options.range, (row) => row.point.id === 'peak'),
      },
      {
        id: 'eui',
        label: 'EUI',
        value: eui === null ? null : Math.round(eui * 10) / 10,
        unit: 'kWh/m²·년',
        certainty: eui === null ? 'unknown' : 'confirmed',
        receivedAt: eui === null ? null : energy.receivedAt,
        note: missingArea ? '연면적 미등록' : undefined,
      },
      {
        id: 'saving',
        label: '추정 절감',
        value: energy.ok > 0 ? Math.round(energy.total * 0.092 / 10) * 10 : null,
        unit: '천원',
        certainty: 'estimate',
        receivedAt: energy.receivedAt,
        note: '요금제·계수 가정. 보장이 아님',
      },
    ]
  }

  if (options.app === 'metering') {
    const elec = sumTag(points.filter((row) => row.point.tags.includes('elec')), options.range, 'meter')
    const water = sumTag(points.filter((row) => row.point.tags.includes('water')), options.range, 'meter')
    const gas = sumTag(points.filter((row) => row.point.tags.includes('gas')), options.range, 'meter')
    return [
      { id: 'elec', label: '전력 검침', value: elec.ok ? Math.round(elec.total) : null, unit: 'kWh', certainty: elec.ok ? elec.certainty : 'unknown', receivedAt: elec.receivedAt, series: seriesOf(points, options.range, (row) => row.point.tags.includes('elec')) },
      { id: 'water', label: '수도 검침', value: water.ok ? Math.round(water.total * 10) / 10 : null, unit: 'm³', certainty: water.ok ? water.certainty : 'unknown', receivedAt: water.receivedAt, note: water.ok ? undefined : '이 범위에 수도미터 없음', series: seriesOf(points, options.range, (row) => row.point.tags.includes('water')) },
      { id: 'gas', label: '가스 검침', value: gas.ok ? Math.round(gas.total * 10) / 10 : null, unit: 'Nm³', certainty: gas.ok ? gas.certainty : 'unknown', receivedAt: gas.receivedAt, note: gas.ok ? undefined : '이 범위에 가스미터 없음', series: seriesOf(points, options.range, (row) => row.point.tags.includes('gas')) },
    ]
  }

  if (options.app === 'solar') {
    const ac = points.find((row) => row.point.id === 'ac')
    const today = sumTag(points, options.range, 'solar', 'today')
    const tel = ac ? getTelemetry(ac, options.range) : undefined
    return [
      { id: 'ac', label: '현재 출력', value: tel?.current ?? null, unit: 'kW', certainty: tel?.certainty ?? 'unknown', receivedAt: tel?.receivedAt ?? null, note: tel ? undefined : '이 범위에 인버터 없음', series: tel?.series ?? null },
      { id: 'today', label: '금일 발전', value: today.ok ? Math.round(today.total) : null, unit: 'kWh', certainty: today.ok ? today.certainty : 'unknown', receivedAt: today.receivedAt, series: seriesOf(points, options.range, (row) => row.point.id === 'today') },
      { id: 'pr', label: '추정 PR', value: today.ok ? 0.82 : null, unit: '', certainty: 'estimate', receivedAt: today.receivedAt, note: '일사량 계수 가정' },
    ]
  }

  if (options.app === 'parking') {
    const occ = points.find((row) => row.point.id === 'occ')
    const cap = points.find((row) => row.point.id === 'cap')
    const occTel = occ ? getTelemetry(occ, options.range) : undefined
    const capTel = cap ? getTelemetry(cap, options.range) : undefined
    return [
      { id: 'occ', label: '주차 대수', value: occTel?.current ?? null, unit: '대', certainty: occTel?.certainty ?? 'unknown', receivedAt: occTel?.receivedAt ?? null, note: occTel ? undefined : '이 범위에 주차 데이터 없음', series: occTel?.series ?? null },
      { id: 'cap', label: '총 면수', value: capTel?.current ?? null, unit: '면', certainty: capTel?.certainty ?? 'unknown', receivedAt: capTel?.receivedAt ?? null },
    ]
  }

  if (options.app === 'ev') {
    const kw = points.find((row) => row.point.id === 'kw')
    const kwh = sumTag(points, options.range, 'ev', 'kwh')
    const tel = kw ? getTelemetry(kw, options.range) : undefined
    return [
      { id: 'kw', label: '충전 전력', value: tel?.current ?? null, unit: 'kW', certainty: tel?.certainty ?? 'unknown', receivedAt: tel?.receivedAt ?? null, note: tel ? undefined : '이 범위에 충전기 없음', series: tel?.series ?? null },
      { id: 'kwh', label: '금일 충전량', value: kwh.ok ? Math.round(kwh.total) : null, unit: 'kWh', certainty: kwh.ok ? kwh.certainty : 'unknown', receivedAt: kwh.receivedAt, series: seriesOf(points, options.range, (row) => row.point.id === 'kwh') },
    ]
  }

  return []
}

export function generateAlarms(): Alarm[] {
  return [
    {
      id: 'a-fire-suwon',
      severity: 'critical',
      kind: 'fire',
      title: '2구역 화재 알람 (헤드엔드 상태)',
      siteId: 'suwon-off',
      systemId: 'fire',
      equipmentId: 'facp',
      pointId: 'z2',
      planId: '2f',
      cameraIds: ['cam-2f'],
      at: isoMinutesAgo(11),
      source: '현장 소방 수신기. T-ARCH는 인증 계통을 대체하지 않음',
    },
    {
      id: 'a-intrusion',
      severity: 'warning',
      kind: 'intrusion',
      title: '1층 침입 감지',
      siteId: 'hanam-hq',
      systemId: 'security',
      equipmentId: 'pir-1f',
      pointId: 'state',
      planId: '1f',
      cameraIds: ['cam-lobby'],
      at: isoMinutesAgo(28),
      source: '현장 침입반',
    },
    {
      id: 'a-equip',
      severity: 'warning',
      kind: 'equipment',
      title: 'AHU-1 급기온도 이탈',
      siteId: 'hanam-hq',
      systemId: 'hvac',
      equipmentId: 'ahu-1',
      pointId: 'sat',
      planId: 'b1',
      cameraIds: ['cam-elec'],
      at: isoMinutesAgo(36),
      source: 'BMS 상태. 제어는 현장 헤드엔드',
    },
    {
      id: 'a-power',
      severity: 'critical',
      kind: 'equipment',
      title: '수전 통신 두절',
      siteId: 'suwon-off',
      systemId: 'power',
      equipmentId: 'incomer',
      pointId: 'main',
      planId: '2f',
      cameraIds: ['cam-2f'],
      at: isoMinutesAgo(18),
      source: '전력 계측. 차단기 제어 없음',
    },
    {
      id: 'a-stale',
      severity: 'warning',
      kind: 'data-quality',
      title: '금일 전력량 수신 지연',
      siteId: 'yongin-dc',
      systemId: 'power',
      equipmentId: 'incomer',
      pointId: 'daily',
      planId: 'wh1',
      cameraIds: ['cam-dock'],
      at: isoMinutesAgo(40),
      source: '검침 게이트웨이',
    },
    {
      id: 'a-area',
      severity: 'info',
      kind: 'data-quality',
      title: '연면적 미등록으로 EUI 판정 불가',
      siteId: 'yongin-dc',
      planId: 'wh1',
      cameraIds: [],
      at: isoMinutesAgo(120),
      source: '카탈로그',
    },
  ]
}

export function alarmsForScope(options: { siteId?: string; app?: AppId }): Alarm[] {
  const all = queryHydrated && alarmCache ? alarmCache : generateAlarms()
  return all.filter((alarm) => {
    if (options.siteId && alarm.siteId !== options.siteId) return false
    if (options.app && options.app !== 'events') {
      const found = alarm.systemId && alarm.equipmentId && alarm.pointId
        ? getPoint({
            siteId: alarm.siteId,
            systemId: alarm.systemId,
            equipmentId: alarm.equipmentId,
            pointId: alarm.pointId,
          })
        : undefined
      if (!found) return alarm.kind === 'data-quality' && options.app === 'power'
      return found.system.domain === options.app
    }
    return true
  })
}

export function alarmInRange(at: string, range: TimeRange): boolean {
  const time = new Date(at).getTime()
  if (Number.isNaN(time)) return false
  const now = new Date(lastSyncAt()).getTime()
  if (range === 'live') return now - time <= 20 * 60 * 1000
  if (range === '1h') return now - time <= 60 * 60 * 1000
  if (range === 'today') {
    const start = new Date(lastSyncAt())
    start.setHours(0, 0, 0, 0)
    return time >= start.getTime() && time <= now
  }
  if (range === '24h') return now - time <= 24 * 60 * 60 * 1000
  if (range === '7d') return now - time <= 7 * 24 * 60 * 60 * 1000
  return now - time <= 30 * 24 * 60 * 60 * 1000
}
