import { Link } from 'react-router-dom'
import { getSite } from '../lib/catalog.ts'
import { formatTime, KIND_ALARM_LABEL, SEVERITY_LABEL } from '../lib/format.ts'
import { alarmsForScope } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'

type Props = {
  collapsed: boolean
  open: boolean
  onToggle: () => void
}

export function AlarmRail({ collapsed, open, onToggle }: Props) {
  const { siteId, app, eventHref } = useScope()
  const alarms = alarmsForScope({ siteId, app: app === 'events' ? 'events' : app })
  const critical = alarms.filter((item) => item.severity === 'critical').length
  const warning = alarms.filter((item) => item.severity === 'warning').length

  return (
    <aside className={`alarm${collapsed ? ' is-collapsed' : ''}${open ? ' is-open' : ''}`}>
      <div className="alarm-head">
        <span>알람</span>
        <button type="button" onClick={onToggle}>{collapsed ? '펼치기' : '접기'}</button>
      </div>
      {collapsed ? null : (
        <>
          <div className="alarm-counts">
            <span className="badge is-critical">위험 {critical}</span>
            <span className="badge is-warning">주의 {warning}</span>
          </div>
          <div className="alarm-body">
            {alarms.length === 0 ? (
              <div className="empty">현재 범위에 알람이 없습니다.</div>
            ) : (
              alarms.map((alarm) => (
                <Link key={alarm.id} className={`alarm-item is-${alarm.severity}`} to={eventHref(alarm.id, alarm.siteId)}>
                  <span className={`badge is-${alarm.severity}`}>{SEVERITY_LABEL[alarm.severity]}</span>
                  <strong>{alarm.title}</strong>
                  <span>{getSite(alarm.siteId)?.name} · {KIND_ALARM_LABEL[alarm.kind]} · {formatTime(alarm.at)}</span>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </aside>
  )
}
