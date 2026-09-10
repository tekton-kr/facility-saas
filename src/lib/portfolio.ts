import type { Alarm, AppId, Certainty, Kpi, Role, SiteDef, TimeRange } from '../types/domain.ts'
import { countPoints, getSite, getSites, listPoints, siteHasApp } from './catalog.ts'
import { findingsForScope } from './findings.ts'
import { formatNumber } from './format.ts'
import { alarmsForScope, getTelemetry, kpisForScope } from './telemetry.ts'

export type SiteCardModel = {
  site: SiteDef
  critical: number
  warning: number
  points: number
  metricLabel?: string
  metricValue: number | null
  metricUnit?: string
  metricCertainty: Certainty
}

export type Insight = {
  id: string
  role: Role | 'both'
  title: string
  body: string
  siteId?: string
  certainty: Certainty
  impact: string
}

export type RankItem = {
  id: string
  label: string
  value: number | null
  unit: string
  certainty: Certainty
}

export type HeatmapRow = {
  id: string
  label: string
  values: Array<number | null>
}

export type Score = {
  id: string
  label: string
  value: number | null
  certainty: Certainty
  note: string
}

function matchesQuery(site: SiteDef, query?: string): boolean {
  const q = query?.trim().toLowerCase() ?? ''
  if (!q) return true
  const hay = `${site.name} ${site.location} ${site.systems.map((system) => system.name).join(' ')}`.toLowerCase()
  return hay.includes(q)
}

function siteAlarms(siteId: string, app: AppId): Alarm[] {
  return alarmsForScope({ siteId, app: app === 'events' ? 'events' : app })
}

function metricForSite(siteId: string, app: AppId, range: TimeRange): Pick<
  SiteCardModel,
  'metricLabel' | 'metricValue' | 'metricUnit' | 'metricCertainty'
> {
  if (app === 'power') {
    const daily = listPoints({ siteId, app: 'power' }).find((row) => row.point.id === 'daily')
    const tel = daily ? getTelemetry(daily, range) : undefined
    return {
      metricLabel: '금일 전력',
      metricValue: tel?.current ?? null,
      metricUnit: 'kWh',
      metricCertainty: tel?.certainty ?? 'unknown',
    }
  }
  if (app === 'metering') {
    const water = listPoints({ siteId, app: 'metering' }).find((row) => row.point.tags.includes('water'))
    const gas = listPoints({ siteId, app: 'metering' }).find((row) => row.point.tags.includes('gas'))
    const elec = listPoints({ siteId, app: 'metering' }).find((row) => row.point.tags.includes('elec'))
    const row = water ?? gas ?? elec
    const tel = row ? getTelemetry(row, range) : undefined
    return {
      metricLabel: water ? '수도' : gas ? '가스' : '전력 검침',
      metricValue: tel?.current ?? null,
      metricUnit: row?.point.unit,
      metricCertainty: tel?.certainty ?? 'unknown',
    }
  }
  if (app === 'solar') {
    const today = listPoints({ siteId, app: 'solar' }).find((row) => row.point.id === 'today')
    const tel = today ? getTelemetry(today, range) : undefined
    return {
      metricLabel: '금일 발전',
      metricValue: tel?.current ?? null,
      metricUnit: 'kWh',
      metricCertainty: tel?.certainty ?? 'unknown',
    }
  }
  if (app === 'parking') {
    const occ = listPoints({ siteId, app: 'parking' }).find((row) => row.point.id === 'occ')
    const tel = occ ? getTelemetry(occ, range) : undefined
    return {
      metricLabel: '주차',
      metricValue: tel?.current ?? null,
      metricUnit: '대',
      metricCertainty: tel?.certainty ?? 'unknown',
    }
  }
  if (app === 'ev') {
    const kwh = listPoints({ siteId, app: 'ev' }).find((row) => row.point.id === 'kwh')
    const tel = kwh ? getTelemetry(kwh, range) : undefined
    return {
      metricLabel: '충전량',
      metricValue: tel?.current ?? null,
      metricUnit: 'kWh',
      metricCertainty: tel?.certainty ?? 'unknown',
    }
  }
  return { metricValue: null, metricCertainty: 'unknown' }
}

export function siteCards(options: { app: AppId; query?: string; range: TimeRange }): SiteCardModel[] {
  return getSites()
    .filter((site) => siteHasApp(site, options.app) && matchesQuery(site, options.query))
    .map((site) => {
      const alarms = siteAlarms(site.id, options.app)
      return {
        site,
        critical: alarms.filter((item) => item.severity === 'critical').length,
        warning: alarms.filter((item) => item.severity === 'warning').length,
        points: countPoints(site),
        ...metricForSite(site.id, options.app, options.range),
      }
    })
    .sort((a, b) => b.critical - a.critical || b.warning - a.warning)
}

export function featuredAlarm(options: { app: AppId; siteId?: string }): Alarm | undefined {
  const alarms = alarmsForScope({ siteId: options.siteId, app: options.app === 'events' ? 'events' : options.app })
  return alarms.find((item) => item.severity === 'critical') ?? alarms.find((item) => item.severity === 'warning')
}

export function insightsForScope(options: { app: AppId; siteId?: string; range: TimeRange; role: Role }): Insight[] {
  const fromFindings: Insight[] = findingsForScope(options).map((item) => ({
    id: item.id,
    role: item.audience,
    title: item.title,
    body: item.estimatedSaving != null
      ? `${item.narrative} 추정 효과 ${formatNumber(item.estimatedSaving)} 천원.`
      : item.narrative,
    siteId: item.siteId,
    certainty: item.certainty,
    impact: item.impact,
  }))

  const computed: Insight[] = []
  const kpis = kpisForScope({ app: options.app, siteId: options.siteId, range: options.range })
  const energy = kpis.find((item) => item.id === 'energy')
  if (energy?.value != null && energy.previousValue != null) {
    const pct = ((energy.value - energy.previousValue) / energy.previousValue) * 100
    const sign = pct > 0 ? '+' : ''
    computed.push({
      id: 'delta-energy',
      role: 'exec',
      title: pct >= 0 ? '전력이 이전 기간보다 높음' : '전력이 이전 기간보다 낮음',
      body: `${options.siteId ? getSite(options.siteId)?.name : '포트폴리오'} 금일 전력 ${formatNumber(energy.value)} kWh, 이전 대비 ${sign}${pct.toFixed(1)}%. 비교 기준은 샘플입니다.`,
      siteId: options.siteId,
      certainty: energy.certainty,
      impact: '에너지',
    })
  }

  const criticals = alarmsForScope({
    siteId: options.siteId,
    app: options.app === 'events' ? 'events' : options.app,
  }).filter((item) => item.severity === 'critical')
  if (criticals.length > 0) {
    computed.push({
      id: 'ops-critical',
      role: 'ops',
      title: `위험 알람 ${criticals.length}건`,
      body: `${getSite(criticals[0].siteId)?.name}부터 확인. 도면·CCTV는 이벤트 셸에서 엽니다.`,
      siteId: criticals[0].siteId,
      certainty: 'confirmed',
      impact: '운영',
    })
  }

  return [...computed, ...fromFindings].filter((item) => item.role === 'both' || item.role === options.role)
}

export function rankSites(options: { app: AppId; range: TimeRange }): RankItem[] {
  const cards = siteCards({ app: options.app, range: options.range })
  if (options.app === 'events') {
    return cards.map((card) => ({
      id: card.site.id,
      label: card.site.name,
      value: card.critical + card.warning,
      unit: '건',
      certainty: 'confirmed' as const,
    }))
  }
  return cards.map((card) => ({
    id: card.site.id,
    label: card.site.name,
    value: card.metricValue,
    unit: card.metricUnit ?? '',
    certainty: card.metricCertainty,
  }))
}

export function powerHeatmap(options: { siteId?: string; range: TimeRange }): HeatmapRow[] {
  const sites = options.siteId ? [getSite(options.siteId)].filter((site): site is SiteDef => Boolean(site)) : getSites()
  return sites.flatMap((site) => {
    if (!siteHasApp(site, 'power')) return []
    const main = listPoints({ siteId: site.id, app: 'power' }).find((row) => row.point.id === 'main')
    const tel = main ? getTelemetry(main, options.range) : undefined
    return [{
      id: site.id,
      label: site.name,
      values: tel?.series ?? (tel ? [] : Array.from({ length: 12 }, () => null)),
    }]
  })
}

export function shareFromKpis(kpis: Kpi[]): RankItem[] {
  const skip = new Set(['eui', 'cap', 'saving', 'exceptions', 'finding-saving', 'pr'])
  const usable = kpis.filter((item) => (
    item.value != null
    && item.value > 0
    && !skip.has(item.id)
    && (item.certainty === 'confirmed' || item.certainty === 'stale')
  ))
  const unit = usable[0]?.unit
  if (!unit || usable.length < 2 || usable.some((item) => item.unit !== unit)) return []
  return usable.map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    unit: item.unit,
    certainty: item.certainty,
  }))
}

export function energyBreakdown(options: { siteId?: string; range: TimeRange }): RankItem[] {
  const power = kpisForScope({ app: 'power', siteId: options.siteId, range: options.range }).find((item) => item.id === 'energy')
  const ev = kpisForScope({ app: 'ev', siteId: options.siteId, range: options.range }).find((item) => item.id === 'kwh')
  const solar = kpisForScope({ app: 'solar', siteId: options.siteId, range: options.range }).find((item) => item.id === 'today')
  const items: RankItem[] = [
    { id: 'power', label: '수전', value: power?.value ?? null, unit: 'kWh', certainty: power?.certainty ?? 'unknown' },
    { id: 'ev', label: 'EV 충전', value: ev?.value ?? null, unit: 'kWh', certainty: ev?.certainty ?? 'unknown' },
    { id: 'solar', label: '태양광 발전', value: solar?.value ?? null, unit: 'kWh', certainty: solar?.certainty ?? 'unknown' },
  ]
  return items.filter((item) => item.value != null).length >= 2 ? items : []
}

export function portfolioScores(options: { siteId?: string }): Score[] {
  const hvac = listPoints({ siteId: options.siteId, app: 'events' }).filter((row) => row.point.tags.includes('hvac'))
  const indoorValues = hvac
    .map((row) => getTelemetry(row, '24h').current)
    .filter((value): value is number => value != null)
  let indoor: number | null = null
  if (indoorValues.length > 0) {
    const avg = indoorValues.reduce((sum, value) => sum + value, 0) / indoorValues.length
    if (avg >= 18 && avg <= 24) indoor = 88
    else if (avg >= 16 && avg <= 26) indoor = 72
    else indoor = 54
  }

  const alarms = alarmsForScope({ siteId: options.siteId })
  const critical = alarms.filter((item) => item.severity === 'critical').length
  const warning = alarms.filter((item) => item.severity === 'warning').length

  return [
    {
      id: 'indoor',
      label: '실내환경',
      value: indoor,
      certainty: indoor == null ? 'unknown' : 'estimate',
      note: indoor == null ? '공조 관제점 없음' : '급기온도 구간 환산. 전 공간 평균이 아님',
    },
    {
      id: 'equipment',
      label: '설비',
      value: Math.max(0, 100 - critical * 18 - warning * 7),
      certainty: 'estimate',
      note: '열린 알람 건수 환산. 설비 건전성 실측이 아님',
    },
  ]
}
