import { Link } from 'react-router-dom'
import type { AppId, Kpi } from '../types/domain.ts'
import {
  DEMO_ALARMS,
  DEMO_GAUGES,
  DEMO_POWER_LABELS,
  DEMO_POWER_VALUES,
  DEMO_SERVICES,
  DEMO_SITES,
  DEMO_WEEK_LABELS,
  DEMO_WEEK_VALUES,
} from '../data/ownerDemo.ts'
import { formatDateTime } from '../lib/format.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { apiAlarms, kpisForScope } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'
import { OwnerGauge, OwnerLine, OwnerMix, OwnerWeek } from './OwnerCharts.tsx'
import { SiteMap } from './SiteMap.tsx'

const SERVICE_TONE: Record<(typeof DEMO_SERVICES)[number]['id'], string> = {
  events: 'is-events',
  power: 'is-power',
  metering: 'is-metering',
  solar: 'is-solar',
}

function SampleTag() {
  return <span className="sample-tag">예시</span>
}

function formatMeasure(value: number): string {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)
}

function liveKpi(app: AppId, range: 'live' | '1h' | 'today' | '24h' | '7d' | '30d'): Kpi | undefined {
  return kpisForScope({ app, range }).find((item) => item.value != null && (item.certainty === 'confirmed' || item.certainty === 'stale'))
}

function dayKey(date: Date): string {
  return `${`${date.getMonth() + 1}`.padStart(2, '0')}/${`${date.getDate()}`.padStart(2, '0')}`
}

export function PortfolioDashboard({ service }: { service: AppId }) {
  const { search, range } = useScope()
  const focus = service === 'power' || service === 'metering' || service === 'solar' ? service : 'events'
  const live = visibleSites()
  const fromApi = apiAlarms()
  const realAlarms = (fromApi ?? []).filter((item) => item.severity === 'critical' || item.severity === 'warning')
  const alarmsAreSample = realAlarms.length === 0

  const realSites = live.map((site, index) => {
    const alarms = realAlarms.filter((item) => item.siteId === site.id)
    const tone = alarms.length > 0 ? 'warn' : site.systems.length === 0 ? 'wait' : 'ok'
    const fallback = DEMO_SITES[index % DEMO_SITES.length]
    return {
      id: site.id,
      name: site.name,
      location: site.location || fallback.location,
      locationSample: !site.location,
      lat: site.lat ?? fallback.lat,
      lng: site.lng ?? fallback.lng,
      positionSample: site.lat == null || site.lng == null,
      tone,
      badge: tone === 'warn' ? `이상 ${alarms.length}` : tone === 'wait' ? '대기' : '정상',
      sample: false,
    }
  })
  const taken = new Set(realSites.map((site) => site.id))
  const sampleSites = DEMO_SITES.filter((site) => !taken.has(site.id)).slice(0, Math.max(0, 4 - realSites.length)).map((site) => ({
    ...site,
    locationSample: false,
    positionSample: false,
    sample: true,
  }))
  const sites = [...realSites, ...sampleSites]
  const attention = realSites.filter((item) => item.tone === 'warn').length
  const waiting = realSites.filter((item) => item.tone === 'wait').length
  const calm = realSites.length - attention - waiting

  const services = DEMO_SERVICES.map((demo) => {
    const kpi = liveKpi(demo.id, range)
    if (!kpi || kpi.value == null) return { ...demo, sample: true }
    return {
      ...demo,
      value: formatMeasure(kpi.value),
      unit: kpi.unit,
      note: kpi.label,
      sample: false,
    }
  })

  const powerKpi = kpisForScope({ app: 'power', range }).find((item) => item.series && item.series.length > 0)
  const powerSeries = powerKpi?.series && powerKpi.value != null && powerKpi.certainty !== 'estimate' ? powerKpi.series : null
  const powerSample = !powerSeries
  const powerLabels = powerSeries ? powerSeries.map((_, index) => String(index + 1)) : DEMO_POWER_LABELS
  const powerValues = powerSeries ?? DEMO_POWER_VALUES

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    return date
  })
  const weekSample = alarmsAreSample
  const weekLabels = weekSample ? DEMO_WEEK_LABELS : weekDays.map(dayKey)
  const weekValues = weekSample ? DEMO_WEEK_VALUES : weekDays.map((date) => {
    const next = new Date(date)
    next.setDate(date.getDate() + 1)
    return realAlarms.filter((alarm) => {
      const at = new Date(alarm.at).getTime()
      return at >= date.getTime() && at < next.getTime()
    }).length
  })

  const alarmRows = alarmsAreSample
    ? DEMO_ALARMS.map((alarm) => ({ ...alarm, sample: true }))
    : realAlarms.slice(0, 8).map((alarm) => ({
        id: alarm.id,
        title: alarm.title,
        siteName: live.find((site) => site.id === alarm.siteId)?.name ?? alarm.siteId,
        at: formatDateTime(alarm.at),
        sample: false,
        siteId: alarm.siteId,
      }))

  return (
    <div className="cmd">
      <header className="cmd-head">
        <div>
          <p>관리단 · 건물주</p>
          <h1>시설관리</h1>
        </div>
        <p>
          배정 건물 {realSites.length}
          {sampleSites.length > 0 ? ` · 예시 건물 ${sampleSites.length}` : ''}
          {' · '}
          <span className="sample-tag">예시</span>
          표시는 아직 수신되지 않은 값입니다.
        </p>
      </header>

      <section className="cmd-services" aria-label="서비스 현황">
        {services.map((item) => (
          <Link key={item.id} className={`cmd-service ${SERVICE_TONE[item.id]}${focus === item.id ? ' is-on' : ''}${item.sample ? ' is-sample' : ''}`} to={`/apps/${item.id}${search}`}>
            <span>{item.label}{item.sample ? <SampleTag /> : null}</span>
            <strong>{item.value}<small>{item.unit}</small></strong>
            <em>{item.note}</em>
          </Link>
        ))}
      </section>

      <section className="cmd-gauges is-sample" aria-label="실시간 계측 예시">
        {DEMO_GAUGES.map((item) => (
          <article key={item.label} className="cmd-panel is-sample">
            <h2>{item.label}<SampleTag /></h2>
            <OwnerGauge value={item.value} max={item.max} color={item.color} />
            <p>{item.value} {item.unit}</p>
          </article>
        ))}
      </section>

      <div className="cmd-board">
        <aside className="cmd-panel cmd-sites">
          <h2>건물</h2>
          <OwnerMix
            total={realSites.length}
            slices={[
              { name: '이상', value: attention, color: '#f5b942' },
              { name: '수신 대기', value: waiting, color: '#38bdf8' },
              { name: '이상 없음', value: calm, color: '#34d399' },
            ]}
          />
          <ul>
            {sites.map((site) => (
              <li key={site.id} className={site.sample ? 'is-sample' : undefined}>
                <Link to={site.sample ? `/apps/events${search}` : `/apps/events/sites/${site.id}${search}`}>
                  <i className={`is-${site.tone}`} />
                  <span>
                    <strong>{site.name}{site.sample ? <SampleTag /> : null}</strong>
                    <em>
                      {site.location}
                      {site.sample ? '' : site.locationSample ? ' · 위치 예시' : ''}
                    </em>
                  </span>
                  <b>{site.sample ? '예시' : site.badge}</b>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <section className="cmd-map-wrap">
          <SiteMap
            sites={sites.map((site) => ({
              id: site.id,
              name: site.name,
              location: site.location,
              lat: site.lat,
              lng: site.lng,
              to: site.sample ? `/apps/events${search}` : `/apps/events/sites/${site.id}${search}`,
              attention: site.tone === 'warn',
              waiting: site.tone === 'wait',
              sample: site.sample,
              positionSample: !site.sample && site.positionSample,
            }))}
          />
        </section>

        <aside className={`cmd-panel cmd-alarms${alarmsAreSample ? ' is-sample' : ''}`}>
          <h2>이상 알람{alarmsAreSample ? <SampleTag /> : null}</h2>
          <ul>
            {alarmRows.map((alarm) => (
              <li key={alarm.id} className={alarm.sample ? 'is-sample' : undefined}>
                <Link to={alarm.sample ? `/apps/events${search}` : `/apps/events/sites/${alarm.siteId}${search}`}>
                  <strong>{alarm.title}{alarm.sample ? <SampleTag /> : null}</strong>
                  <em>{alarm.siteName}</em>
                  <time>{alarm.at}</time>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <section className={`cmd-panel cmd-week${weekSample ? ' is-sample' : ''}`}>
          <h2>최근 7일 알람{weekSample ? <SampleTag /> : null}</h2>
          <OwnerWeek labels={weekLabels} values={weekValues} />
        </section>
      </div>

      <section className={`cmd-panel cmd-line${powerSample ? ' is-sample' : ''}`}>
        <h2>금일 전력{powerSample ? <SampleTag /> : null}</h2>
        <OwnerLine labels={powerLabels} values={powerValues} />
      </section>
    </div>
  )
}
