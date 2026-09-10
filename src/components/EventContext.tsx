import { Link, useNavigate } from 'react-router-dom'
import { createWorkFromAlarm, workByAlarm } from '../lib/field.ts'
import { useField } from '../lib/useField.ts'
import { useScope } from '../lib/useScope.ts'
import type { Alarm, CameraRef, FloorPlan, SiteDef } from '../types/domain.ts'

type Props = {
  selected: Alarm | undefined
  site: SiteDef | undefined
  plan: FloorPlan | undefined
  cameras: CameraRef[]
  search: string
}

export function EventContext({ selected, site, plan, cameras, search }: Props) {
  const navigate = useNavigate()
  const { role } = useScope()
  useField()
  const existing = selected ? workByAlarm(selected.id) : undefined

  return (
    <>
      <section className="panel event-plan">
        <h2>도면 {plan ? `· ${plan.name}` : ''}</h2>
        {selected && plan ? (
          <div className="plan" data-plan={plan.id}>
            {site?.plans.map((item) => (
              <div
                key={item.id}
                className={`plan-zone${item.id === plan.id ? ' is-hot' : ''}`}
              >
                {item.name}
                {item.id === plan.id ? <span>알람 위치</span> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">알람을 선택하면 해당 도면이 열립니다.</div>
        )}
      </section>
      <section className="panel event-links">
        <h2>연동</h2>
        {selected ? (
          <>
            <p className="kpi-note">{selected.source}</p>
            <h3 className="subhead">관련 CCTV</h3>
            {cameras.length === 0 ? (
              <p className="kpi-meta">연결된 카메라가 없습니다. 영상 아카이브는 보유하지 않습니다.</p>
            ) : (
              cameras.map((camera) => (
                <div key={camera.id} className="cctv-card">
                  <div className="cctv-tile" aria-hidden="true" />
                  <strong>{camera.name}</strong>
                  <p className="kpi-meta">딥링크만 전달합니다. 재생·보관은 현장 VMS입니다.</p>
                  <code>{camera.deepLink}</code>
                </div>
              ))
            )}
            {role === 'ops' && selected ? (
              <p>
                {existing ? (
                  <Link className="drawer-open" to={`/work/${existing.id}${search}`}>열린 작업</Link>
                ) : (
                  <button
                    className="drawer-open"
                    type="button"
                    onClick={() => {
                      const created = createWorkFromAlarm(selected)
                      navigate(`/work/${created.id}${search}`)
                    }}
                  >
                    출동 작업
                  </button>
                )}
              </p>
            ) : null}
            {selected.systemId && selected.equipmentId && selected.pointId ? (
              <p>
                <Link
                  className="drawer-open"
                  to={`/apps/events/sites/${selected.siteId}/systems/${selected.systemId}/equipment/${selected.equipmentId}/points/${selected.pointId}${search}`}
                >
                  관제점 추세
                </Link>
              </p>
            ) : null}
          </>
        ) : (
          <div className="empty">선택된 이벤트가 없습니다.</div>
        )}
      </section>
    </>
  )
}
