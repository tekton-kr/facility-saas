import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchNotices, type Notice } from '../lib/api.ts'
import { getSite } from '../lib/catalog.ts'
import { formatDateTime, formatTime, KIND_ALARM_LABEL, SEVERITY_LABEL } from '../lib/format.ts'
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

  return (
    <aside className={`alarm${collapsed ? ' is-collapsed' : ''}${open ? ' is-open' : ''}`}>
      {collapsed ? (
        <button className="alarm-tab" type="button" aria-label="알림 펼치기" onClick={onToggle}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.2 5.2 1.2 5.2H4.8S6 13.5 6 9.5Z" />
            <path d="M10 18a2 2 0 0 0 4 0" />
          </svg>
          {critical + warning > 0 ? <span className="alarm-tab-count">{critical + warning}</span> : null}
        </button>
      ) : (
        <>
          <div className="alarm-head">
            <span>알림</span>
            <button type="button" aria-label="알림 접기" aria-expanded onClick={onToggle}>접기</button>
          </div>
          <div className="alarm-counts">
            <span className="badge is-critical">위험 {critical}</span>
            <span className="badge is-warning">주의 {warning}</span>
          </div>
          <div className="alarm-body">
            <section>
              <h2>알람</h2>
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
            </section>
            <section className="alarm-notices">
              <h2>공지</h2>
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
            </section>
          </div>
        </>
      )}
    </aside>
  )
}
