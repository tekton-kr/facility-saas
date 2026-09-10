import type { AppId, Kpi, TimeRange } from '../types/domain.ts'
import { siteHasApp } from './catalog.ts'
import { visibleSites } from './siteScope.ts'
import { contractsDueSoon, openSlaCount, packagesForScope } from './field.ts'
import { findingsForScope } from './findings.ts'
import { siteCards, type SiteCardModel } from './portfolio.ts'
import { alarmsForScope, kpisForScope, lastSyncAt } from './telemetry.ts'

export function dutySiteId(app: AppId = 'events'): string {
  const sites = visibleSites().filter((site) => siteHasApp(site, app))
  const ranked = [...sites].sort((a, b) => alarmScore(b.id) - alarmScore(a.id))
  return ranked[0]?.id ?? visibleSites()[0]?.id ?? ''
}

function alarmScore(siteId: string): number {
  const alarms = alarmsForScope({ siteId })
  return (
    alarms.filter((item) => item.severity === 'critical').length * 10 +
    alarms.filter((item) => item.severity === 'warning').length
  )
}

// 추정 등급 발견 사항은 예외로 올리지 않는다. 계약 제7조 — 추정은 확정 예외와 같은 카드로 그리지 않는다.
// 추정 이슈는 InsightChips에서 따로 읽는다.
export function isExceptionCard(card: SiteCardModel, _app: AppId): boolean {
  if (card.critical + card.warning > 0) return true
  return card.metricCertainty === 'unknown' || card.metricCertainty === 'stale'
}

export function exceptionSiteCards(options: { app: AppId; query?: string; range: TimeRange }): SiteCardModel[] {
  return siteCards(options).filter((card) => isExceptionCard(card, options.app))
}

export function quietSiteCards(options: { app: AppId; query?: string; range: TimeRange }): SiteCardModel[] {
  return siteCards(options).filter((card) => !isExceptionCard(card, options.app))
}

export function quietSiteCount(options: { app: AppId; query?: string; range: TimeRange }): number {
  return quietSiteCards(options).length
}

export type PortfolioHeadline = {
  siteId: string
  severity: 'critical' | 'warning' | 'data'
  text: string
  rest: number
}

export function portfolioHeadline(
  options: { app: AppId; query?: string; range: TimeRange },
): PortfolioHeadline | null {
  const cards = exceptionSiteCards(options)
  const top = cards[0]
  if (!top) return null

  const alarms = alarmsForScope({
    siteId: top.site.id,
    app: options.app === 'events' ? 'events' : options.app,
  })
  const worst = alarms.find((item) => item.severity === 'critical')
    ?? alarms.find((item) => item.severity === 'warning')
  const rest = cards.length - 1

  if (worst) {
    return {
      siteId: top.site.id,
      severity: worst.severity === 'critical' ? 'critical' : 'warning',
      text: `${top.site.name} · ${worst.title}`,
      rest,
    }
  }

  const reason = top.metricCertainty === 'stale' ? '수신 지연' : '판정 불가'
  return {
    siteId: top.site.id,
    severity: 'data',
    text: `${top.site.name} · ${top.metricLabel ?? '지표'} ${reason}`,
    rest,
  }
}

export function execKpis(options: { app: AppId; siteId?: string; range: TimeRange }): Kpi[] {
  const receivedAt = lastSyncAt()
  const exceptionCards = exceptionSiteCards({ app: options.app === 'events' ? 'events' : options.app, range: options.range })
  const alarms = alarmsForScope({
    siteId: options.siteId,
    app: options.app === 'events' ? 'events' : options.app,
  })
  const open = alarms.filter((item) => item.severity === 'critical' || item.severity === 'warning').length
  const savings = findingsForScope({ app: options.app, siteId: options.siteId })
    .reduce((sum, item) => sum + (item.estimatedSaving ?? 0), 0)

  const exceptionKpi: Kpi = {
    id: 'exceptions',
    label: options.siteId ? '열린 예외' : '이상 현장',
    value: options.siteId ? open : exceptionCards.length,
    unit: options.siteId ? '건' : '곳',
    certainty: 'confirmed',
    receivedAt,
  }
  const savingKpi: Kpi = {
    id: 'finding-saving',
    label: '추정 절감',
    value: savings > 0 ? savings : null,
    unit: '천원',
    certainty: savings > 0 ? 'estimate' : 'unknown',
    receivedAt,
    note: '요금제·계수 가정. 보장이 아님',
  }
  const contractKpi: Kpi = {
    id: 'contracts-due',
    label: '계약 만료',
    value: contractsDueSoon(options.siteId),
    unit: '곳',
    certainty: 'confirmed',
    receivedAt,
    note: '120일 안',
  }
  const slaKpi: Kpi = {
    id: 'sla-open',
    label: '미닫힌 SLA',
    value: openSlaCount(options.siteId),
    unit: '건',
    certainty: 'confirmed',
    receivedAt,
  }
  const packageKpi: Kpi = {
    id: 'packages',
    label: '공사 후보',
    value: packagesForScope(options.siteId).filter((item) => item.status !== 'done').length,
    unit: '건',
    certainty: 'confirmed',
    receivedAt,
  }

  if (options.app === 'events') {
    return [
      exceptionKpi,
      slaKpi,
      contractKpi,
      packageKpi,
      savingKpi,
    ].slice(0, 6)
  }

  const domain = kpisForScope(options).filter((item) => item.id !== 'saving').slice(0, 3)
  const saving = kpisForScope(options).find((item) => item.id === 'saving') ?? savingKpi
  return [...domain, exceptionKpi, contractKpi, packageKpi, saving].slice(0, 6)
}
