import { Link } from 'react-router-dom'
import { KpiRow } from '../components/KpiRow.tsx'
import { getSites } from '../lib/catalog.ts'
import { dutySiteId } from '../lib/roleHome.ts'
import { alarmsForScope, kpisForScope } from '../lib/telemetry.ts'
import { formatTime, KIND_LABEL, SEVERITY_LABEL } from '../lib/format.ts'

export function LobbyPage() {
  const kpis = kpisForScope({ app: 'power', range: '24h' })
  const alarms = alarmsForScope({ app: 'events' })
    .filter((alarm) => alarm.severity === 'critical' || alarm.severity === 'warning')
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 6)

  const sites = getSites()
    .map((site) => {
      const open = alarmsForScope({ siteId: site.id, app: 'events' })
      return {
        site,
        critical: open.filter((item) => item.severity === 'critical').length,
        warning: open.filter((item) => item.severity === 'warning').length,
      }
    })
    .sort((a, b) => b.critical - a.critical || b.warning - a.warning)

  const duty = getSites().find((site) => site.id === dutySiteId('events')) ?? getSites()[0]
  const hotPlan = duty?.plans.find((plan) =>
    alarms.some((alarm) => alarm.siteId === duty.id && alarm.planId === plan.id),
  ) ?? duty?.plans[0]

  return (
    <div className="lobby">
      <div className="page-head">
        <div>
          <h1>로비 종합</h1>
          <p>대스크린 1면 예외. 조회 전용이라 제어 버튼이 없습니다.</p>
        </div>
      </div>
      <div className="lobby-grid">
        <section className="panel">
          <h2>지표</h2>
          <KpiRow items={kpis} />
        </section>

        <section className="panel">
          <h2>현장 {sites.length}</h2>
          {duty && hotPlan ? (
            <div className="plan" data-plan={hotPlan.id}>
              {duty.plans.map((plan) => (
                <div key={plan.id} className={`plan-zone${plan.id === hotPlan.id ? ' is-hot' : ''}`}>
                  {duty.name} · {plan.name}
                  {plan.id === hotPlan.id ? <span>알람 위치</span> : null}
                </div>
              ))}
            </div>
          ) : null}
          <div className="list">
            {sites.map((item) => (
              <Link key={item.site.id} className="list-item" to={`/apps/events/sites/${item.site.id}`}>
                <span>
                  <strong>{item.site.name}</strong>
                  <div className="kpi-meta">{KIND_LABEL[item.site.kind]} · {item.site.location}</div>
                </span>
                <span className="site-card-alarms">
                  {item.critical > 0 ? <span className="badge is-critical">위험 {item.critical}</span> : null}
                  {item.warning > 0 ? <span className="badge is-warning">주의 {item.warning}</span> : null}
                  {item.critical + item.warning === 0 ? <span className="kpi-meta">열린 알람 없음</span> : null}
                </span>
              </Link>
            ))}
          </div>
          <p className="kpi-note">알람이 있는 현장만 색이 납니다. 3D 트윈은 두지 않습니다.</p>
        </section>

        <section className="panel">
          <h2>알람 {alarms.length}</h2>
          {alarms.length === 0 ? <div className="empty">열린 위험·주의가 없습니다.</div> : null}
          <div className="list">
            {alarms.map((alarm) => (
              <Link key={alarm.id} className="list-item" to={`/apps/events/sites/${alarm.siteId}?event=${alarm.id}`}>
                <span>
                  <strong>{alarm.title}</strong>
                  <div className="kpi-meta mono-time">{formatTime(alarm.at)}</div>
                </span>
                <span className={`badge is-${alarm.severity}`}>{SEVERITY_LABEL[alarm.severity]}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
