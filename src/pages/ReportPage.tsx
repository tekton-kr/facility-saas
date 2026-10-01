import { ManageFrame } from '../components/ManageFrame.tsx'
import {
  CONTRACT_LINE_LABEL,
  contractForSite,
  contractLines,
  daysUntil,
} from '../lib/field.ts'
import { formatNumber } from '../lib/format.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { apiAlarms, kpisForScope } from '../lib/telemetry.ts'
import { useField } from '../lib/useField.ts'
import type { Kpi } from '../types/domain.ts'

function monthLabel(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
  const [year, month] = parts.split('-')
  return `${year}년 ${Number(month)}월`
}

function powerText(siteId: string): string {
  const kpi = kpisForScope({ app: 'power', siteId, range: 'today' }).find((item) => (
    item.value != null && (item.certainty === 'confirmed' || item.certainty === 'stale')
  ))
  if (!kpi || kpi.value == null) return '수신 없음'
  return `${formatNumber(kpi.value)} ${kpi.unit}`
}

function alarmText(siteId: string, alarms: ReturnType<typeof apiAlarms>): string {
  if (!alarms || alarms.length === 0) return '수신 없음'
  const count = alarms.filter((item) => item.siteId === siteId && item.severity !== 'info').length
  return count > 0 ? `${count}건` : '없음'
}

function contractText(siteId: string): { title: string; note: string } {
  const contract = contractForSite(siteId)
  if (!contract) return { title: '계약 없음', note: '' }
  const days = daysUntil(contract.end)
  const when = days < 0 ? '만료' : days === 0 ? '오늘 만료' : `${days}일 남음`
  const lines = contractLines(contract).map((line) => CONTRACT_LINE_LABEL[line]).join(' · ')
  return { title: contract.end, note: `${when}${lines ? ` · ${lines}` : ''}` }
}

function liveValue(kpi: Kpi | undefined): string {
  if (!kpi || kpi.value == null || (kpi.certainty !== 'confirmed' && kpi.certainty !== 'stale')) return '수신 없음'
  return `${formatNumber(kpi.value)} ${kpi.unit}`
}

export function ReportPage() {
  useField()
  const sites = visibleSites()
  const alarms = apiAlarms()
  const ending = sites.filter((site) => {
    const contract = contractForSite(site.id)
    if (!contract) return false
    const days = daysUntil(contract.end)
    return days >= 0 && days <= 30
  }).length
  const portfolioPower = liveValue(kpisForScope({ app: 'power', range: 'today' }).find((item) => item.id === 'energy'))

  return (
    <ManageFrame kicker="" title="리포트">
      <p className="manage-note">
        {monthLabel()} 배정 건물 요약입니다. 수신되지 않은 전력과 알람은 비워 둡니다.
      </p>
      <section className="report-stats" aria-label="요약">
        <article>
          <b>{sites.length}</b>
          <span>배정 건물</span>
        </article>
        <article>
          <b>{ending}</b>
          <span>30일 내 계약 만료</span>
        </article>
        <article>
          <b>{portfolioPower}</b>
          <span>금일 전력</span>
        </article>
      </section>
      <section className="manage-card">
        {sites.length === 0 ? <div className="empty">배정된 건물이 없습니다.</div> : (
          <div className="report-list">
            {sites.map((site) => {
              const contract = contractText(site.id)
              return (
                <div key={site.id} className="report-line">
                  <span>
                    <strong>{site.name}</strong>
                    <em>{site.location || '위치 미등록'}</em>
                  </span>
                  <span>
                    <strong>{contract.title}</strong>
                    <em>{contract.note || '유지보수'}</em>
                  </span>
                  <span>
                    <strong>{alarmText(site.id, alarms)}</strong>
                    <em>알람</em>
                  </span>
                  <span>
                    <strong>{powerText(site.id)}</strong>
                    <em>금일 전력</em>
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </ManageFrame>
  )
}
