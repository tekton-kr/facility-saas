import { visibleSites } from './siteScope.ts'
import { getSite } from './catalog.ts'
import type { SiteDef } from '../types/domain.ts'

export type Inspection = {
  id: string
  siteId: string
  equipment: string
  due: string
  result: string
  owner: string
  sample: true
}

export type Cycle = {
  id: string
  siteId: string
  equipment: string
  kind: '세척' | '교체'
  every: string
  last: string
  next: string
  sample: true
}

export type EquipmentNote = {
  id: string
  siteId: string
  equipment: string
  caption: string
  sample: true
}

export type Drawing = {
  id: string
  siteId: string
  name: string
  equipment: string
  kind: string
  sample: true
}

export type Visit = {
  id: string
  siteId: string
  title: string
  kind: '공사' | '방문'
  vendor: string
  date: string
  equipment: string
  sample: true
}

export type Upcoming = {
  id: string
  siteId: string
  siteName: string
  title: string
  when: string
  kind: '점검' | '세척' | '교체' | '방문' | '공사'
  to: string
  sample: true
}

function sites(siteId?: string): SiteDef[] {
  const all = visibleSites()
  if (!siteId) return all
  const one = all.find((item) => item.id === siteId) ?? getSite(siteId)
  return one ? [one] : []
}

export function inspectionsFor(siteId?: string): Inspection[] {
  return sites(siteId).flatMap((site) => [
    { id: `${site.id}-ins-1`, siteId: site.id, equipment: '공조기', due: '2026-10-08', result: '예정', owner: '관리소장', sample: true as const },
    { id: `${site.id}-ins-2`, siteId: site.id, equipment: '수배전반', due: '2026-10-18', result: '예정', owner: '전기 협력사', sample: true as const },
    { id: `${site.id}-ins-3`, siteId: site.id, equipment: '소화 펌프', due: '2026-09-12', result: '이상 없음', owner: '소방 협력사', sample: true as const },
  ])
}

export function cyclesFor(siteId?: string): Cycle[] {
  const rows = sites(siteId).flatMap((site) => [
    { id: `${site.id}-cy-1`, siteId: site.id, equipment: '공조기 필터', kind: '세척' as const, every: '3개월', last: '2026-07-02', next: '2026-10-02', sample: true as const },
    { id: `${site.id}-cy-2`, siteId: site.id, equipment: '냉각수 스트레이너', kind: '세척' as const, every: '6개월', last: '2026-05-20', next: '2026-11-20', sample: true as const },
    { id: `${site.id}-cy-3`, siteId: site.id, equipment: '급기 필터', kind: '교체' as const, every: '1년', last: '2025-10-15', next: '2026-10-15', sample: true as const },
  ])
  return rows.sort((a, b) => a.next.localeCompare(b.next))
}

export function notesFor(siteId?: string): EquipmentNote[] {
  return sites(siteId).flatMap((site) => [
    { id: `${site.id}-ph-1`, siteId: site.id, equipment: '공조기 AHU-1', caption: '지하 2층 기계실. 필터 문은 북쪽.', sample: true as const },
    { id: `${site.id}-ph-2`, siteId: site.id, equipment: '냉동기 CH-1', caption: '옥외 장비. 겨울 동파 주의.', sample: true as const },
    { id: `${site.id}-ph-3`, siteId: site.id, equipment: '수배전반', caption: '전기실. 명판은 문 안쪽.', sample: true as const },
  ])
}

export function drawingsFor(siteId?: string): Drawing[] {
  return sites(siteId).flatMap((site) => [
    { id: `${site.id}-dw-1`, siteId: site.id, name: '기계 설비 준공도', equipment: '공조 · 냉동', kind: '준공도', sample: true as const },
    { id: `${site.id}-dw-2`, siteId: site.id, name: '수변전 단선도', equipment: '수배전반', kind: '계통도', sample: true as const },
    { id: `${site.id}-dw-3`, siteId: site.id, name: '소화 배관 준공도', equipment: '소화 펌프', kind: '준공도', sample: true as const },
  ])
}

export function visitsFor(siteId?: string): Visit[] {
  return sites(siteId).flatMap((site) => [
    { id: `${site.id}-vs-1`, siteId: site.id, title: '필터 세척', kind: '방문' as const, vendor: '중부공조', date: '2026-10-09', equipment: '공조기', sample: true as const },
    { id: `${site.id}-vs-2`, siteId: site.id, title: '수변전 절연 보강', kind: '공사' as const, vendor: '경기전기', date: '2026-10-21', equipment: '수배전반', sample: true as const },
    { id: `${site.id}-vs-3`, siteId: site.id, title: '소방 작동 점검', kind: '방문' as const, vendor: '한강소방점검', date: '2026-11-04', equipment: '소화 펌프', sample: true as const },
  ]).sort((a, b) => a.date.localeCompare(b.date))
}

export function upcomingAcross(): Upcoming[] {
  const rows: Upcoming[] = []
  for (const site of visibleSites()) {
    const name = site.name
    for (const item of inspectionsFor(site.id)) {
      if (item.result !== '예정') continue
      rows.push({ id: item.id, siteId: site.id, siteName: name, title: `${item.equipment} 점검`, when: item.due, kind: '점검', to: `/sites/${site.id}/inspections`, sample: true })
    }
    for (const item of cyclesFor(site.id)) {
      rows.push({ id: item.id, siteId: site.id, siteName: name, title: `${item.equipment} ${item.kind}`, when: item.next, kind: item.kind, to: `/sites/${site.id}/cycles`, sample: true })
    }
    for (const item of visitsFor(site.id)) {
      rows.push({ id: item.id, siteId: site.id, siteName: name, title: item.title, when: item.date, kind: item.kind, to: `/sites/${site.id}/schedule`, sample: true })
    }
  }
  return rows.sort((a, b) => a.when.localeCompare(b.when)).slice(0, 8)
}
