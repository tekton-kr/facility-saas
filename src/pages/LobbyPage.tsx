import { KpiRow } from '../components/KpiRow.tsx'
import { getSite } from '../lib/catalog.ts'
import { kpisForScope, alarmsForScope } from '../lib/telemetry.ts'
import { dutySiteId } from '../lib/roleHome.ts'
import { SEVERITY_LABEL } from '../lib/format.ts'

export function LobbyPage() {
  const siteId = dutySiteId('events')
  const site = getSite(siteId)
  const kpis = kpisForScope({ app: 'power', range: '24h' })
  const alarms = alarmsForScope({ app: 'events' }).slice(0, 6)

  return (
    <div className="lobby">
      <div className="page-head">
        <div>
          <h1>로비 종합</h1>
          <p>대스크린 1면 예외. 제어 버튼 없음. {site?.name}</p>
        </div>
      </div>
      <div className="lobby-grid">
        <section className="panel">
          <h2>지표</h2>
          <KpiRow items={kpis} />
        </section>
        <section className="panel">
          <h2>현장</h2>
          <p>{site?.name} · {site?.location}</p>
          <p className="kpi-meta">알람이 있는 구역만 강조합니다. 3D는 두지 않습니다.</p>
        </section>
        <section className="panel">
          <h2>알람</h2>
          <div className="list">
            {alarms.map((alarm) => (
              <div key={alarm.id} className="list-item">
                <span>
                  <strong>{alarm.title}</strong>
                  <div className="kpi-meta">{SEVERITY_LABEL[alarm.severity]}</div>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
