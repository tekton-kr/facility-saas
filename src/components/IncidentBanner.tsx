import { Link } from 'react-router-dom'
import { formatDateTime, KIND_ALARM_LABEL, SEVERITY_LABEL } from '../lib/format.ts'
import { getSite } from '../lib/catalog.ts'
import type { Alarm } from '../types/domain.ts'

type Props = {
  alarm: Alarm
  to: string
}

export function IncidentBanner({ alarm, to }: Props) {
  const site = getSite(alarm.siteId)

  return (
    <Link className={`incident is-${alarm.severity}`} to={to}>
      <div>
        <div className="incident-kicker">
          {SEVERITY_LABEL[alarm.severity]} · {KIND_ALARM_LABEL[alarm.kind]} · {site?.name}
        </div>
        <strong className="incident-title">{alarm.title}</strong>
        <div className="kpi-meta">{formatDateTime(alarm.at)} · {alarm.source}</div>
      </div>
      <span className="incident-go">이벤트</span>
    </Link>
  )
}
