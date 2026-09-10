import { formatDateTime, formatSource, SEVERITY_LABEL } from '../lib/format.ts'
import type { Alarm } from '../types/domain.ts'

type Props = {
  alarms: Alarm[]
  empty: string
  onOpen: (alarm: Alarm) => void
}

export function AlarmCards({ alarms, empty, onOpen }: Props) {
  if (alarms.length === 0) {
    return <div className="empty">{empty}</div>
  }

  return (
    <div className="card-list" aria-label="알람 목록">
      {alarms.map((alarm) => (
        <button
          key={alarm.id}
          type="button"
          className={`alarm-card is-line ${alarm.severity === 'info' ? 'is-muted' : `is-${alarm.severity}`}`}
          data-severity={alarm.severity}
          onClick={() => onOpen(alarm)}
        >
          <span className="alarm-card-main">
            {alarm.severity === 'info' ? null : (
              <span className={`badge is-${alarm.severity}`}>{SEVERITY_LABEL[alarm.severity]}</span>
            )}
            <strong>{alarm.title}</strong>
          </span>
          <span className="alarm-card-meta">
            <span className="mono-time">{formatDateTime(alarm.at)}</span>
            <span className="mono-source">{formatSource(alarm.source)}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
