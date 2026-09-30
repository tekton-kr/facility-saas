import type { AppId, Kpi, TimeRange } from '../types/domain.ts'
import { listPoints, siteHasApp } from './catalog.ts'
import { isAppCollected } from './collection.ts'
import { visibleSiteIds, visibleSites } from './siteScope.ts'
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

export function evidenceKpis(options: { app: AppId; siteId?: string; range: TimeRange }): Kpi[] {
  if (!isAppCollected(options.app) || options.app === 'events') return []

  const domain = kpisForScope(options)
  const measured = domain.filter((item) => item.id !== 'saving' && item.id !== 'pr')
  const estimate = domain.find((item) => item.id === 'saving' || item.id === 'pr')
  const gaps = listPoints({
    siteId: options.siteId,
    siteIds: options.siteId ? undefined : visibleSiteIds(),
    app: options.app === 'solar' ? 'solar' : 'metering',
  }).filter((row) => row.point.flags?.noTelemetry).length
  const missingArea = (options.siteId ? [options.siteId] : visibleSiteIds())
    .map((id) => visibleSites().find((site) => site.id === id))
    .filter((site) => site && site.areaM2 == null).length

  const items: Kpi[] = [...measured.slice(0, 3)]
  if (gaps > 0) {
    items.push({
      id: 'gaps',
      label: '검침 공백',
      value: gaps,
      unit: '점',
      certainty: 'unknown',
      receivedAt: lastSyncAt(),
      note: '0으로 채우지 않음',
    })
  }
  if (missingArea > 0 && options.app === 'power') {
    items.push({
      id: 'area',
      label: '면적 없음',
      value: missingArea,
      unit: '곳',
      certainty: 'unknown',
      receivedAt: lastSyncAt(),
      note: 'EUI 판정 불가',
    })
  }
  if (estimate) items.push(estimate)
  return items.slice(0, 6)
}
