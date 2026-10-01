import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchNotices, type Notice } from '../lib/api.ts'
import { getSite } from '../lib/catalog.ts'
import { formatDateTime, formatTime, KIND_ALARM_LABEL, SEVERITY_LABEL } from '../lib/format.ts'
import { alarmsForScope } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'

export type RailMode = 'closed' | 'alarms' | 'notices'

type Props = {
  mode: RailMode
  onMode: (mode: RailMode) => void
}

export function AlarmRail({ mode, onMode }: Props) {
  const { siteId, app, eventHref } = useScope()
  const alarms = alarmsForScope({ siteId, app: app === 'events' ? 'events' : app })
  const critical = alarms.filter((item) => item.severity === 'critical').length
  const warning = alarms.filter((item) => item.severity === 'warning').length
  const [notices, setNotices] = useState<Notice[]>([])

  useEffect(() => {
    let cancelled = false
    void fetchNotices()
      .then((rows) => {
        if (!cancelled) setNotices(rows)
      })
      .catch(() => {
        if (!cancelled) setNotices([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  function pick(next: Exclude<RailMode, 'closed'>) {
    onMode(mode === next ? 'closed' : next)
  }

  return (
    <aside className={`alarm${mode === 'closed' ? ' is-collapsed' : ''}`}>
      <div className="alarm-tabs">
        <button
          className={mode === 'alarms' ? 'is-on' : ''}
          type="button"
          aria-label={mode === 'alarms' ? '알람 접기' : '알람'}
          title={mode === 'alarms' ? '알람 접기' : '알람'}
          aria-pressed={mode === 'alarms'}
          onClick={() => pick('alarms')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.2 5.2 1.2 5.2H4.8S6 13.5 6 9.5Z" />
            <path d="M10 18a2 2 0 0 0 4 0" />
          </svg>
          {critical + warning > 0 ? <span className="alarm-tab-count">{critical + warning}</span> : null}
        </button>
        <button
          className={mode === 'notices' ? 'is-on' : ''}
          type="button"
          aria-label={mode === 'notices' ? '공지 접기' : '공지'}
          title={mode === 'notices' ? '공지 접기' : '공지'}
          aria-pressed={mode === 'notices'}
          onClick={() => pick('notices')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 10v4h3l5 3V7L8 10H5Z" />
            <path d="M16 9.5a3.5 3.5 0 0 1 0 5" />
          </svg>
          {notices.length > 0 ? <span className="alarm-tab-count is-notice">{notices.length}</span> : null}
        </button>
        {mode !== 'closed' ? (
          <button className="alarm-fold" type="button" aria-label="접기" onClick={() => onMode('closed')}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 6l6 6-6 6" />
            </svg>
            접기
          </button>
        ) : null}
      </div>
      {mode === 'closed' ? null : (
        <div className="alarm-sheet">
          {mode === 'alarms' ? (
            <>
              <div className="alarm-head">
                <span>알람</span>
                <button type="button" onClick={() => onMode('closed')}>접기</button>
              </div>
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
          ) : (
            <>
              <div className="alarm-head">
                <span>공지</span>
                <button type="button" onClick={() => onMode('closed')}>접기</button>
              </div>
              <div className="alarm-body">
                {notices.length === 0 ? (
                  <div className="empty">등록된 공지가 없습니다.</div>
                ) : (
                  notices.map((notice) => (
                    <article key={notice.id} className="alarm-item">
                      <strong>{notice.title}</strong>
                      {notice.body ? <p>{notice.body}</p> : null}
                      {notice.at ? <span>{formatDateTime(notice.at)}</span> : null}
                    </article>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  )
}
