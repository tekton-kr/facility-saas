import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { type Notice } from '../lib/api.ts'
import { getSite } from '../lib/catalog.ts'
import {
  alarmContractFit,
  alarmEquipmentName,
  contractForSite,
  daysUntil,
  isSlaOpen,
  openWorkFromAlarm,
  workByAlarm,
  worksForScope,
} from '../lib/field.ts'
import { formatDateTime, formatTime, KIND_ALARM_LABEL, SEVERITY_LABEL } from '../lib/format.ts'
import { visitsOn } from '../lib/maintain.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { liveAlarms, subscribeTelemetry } from '../lib/telemetry.ts'
import { useField } from '../lib/useField.ts'
import { useScope } from '../lib/useScope.ts'

export type RailMode = 'closed' | 'alarms' | 'notices' | 'due' | 'visits'

function seoulToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

function dueLabel(days: number): string {
  if (days < 0) return '만료'
  if (days === 0) return '오늘 만료'
  return `${days}일`
}

type Props = {
  mode: RailMode
  onMode: (mode: RailMode) => void
}

export function AlarmRail({ mode, onMode }: Props) {
  const { siteId, eventHref, search } = useScope()
  useField()
  const [, setTick] = useState(0)
  useEffect(() => subscribeTelemetry(() => setTick((value) => value + 1)), [])
  const alarms = liveAlarms(siteId)
  const critical = alarms.filter((item) => item.severity === 'critical').length
  const warning = alarms.filter((item) => item.severity === 'warning').length
  const notices: Notice[] = []
  const picked = siteId ? getSite(siteId) : undefined
  const dueSites = picked ? [picked] : visibleSites()
  const dueContracts = dueSites.flatMap((site) => {
    const contract = contractForSite(site.id)
    if (!contract) return []
    const left = daysUntil(contract.end)
    if (left > 30) return []
    return [{ site, contract, left }]
  })
  const lateWorks = worksForScope(siteId).filter(isSlaOpen)
  const todayVisits = visitsOn(siteId, seoulToday())

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
        <button
          className={mode === 'due' ? 'is-on' : ''}
          type="button"
          aria-label={mode === 'due' ? '기한 접기' : '기한'}
          title={mode === 'due' ? '기한 접기' : '기한'}
          aria-pressed={mode === 'due'}
          onClick={() => pick('due')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="7" />
            <path d="M12 8.5V12l2.5 2" />
          </svg>
          {dueContracts.length + lateWorks.length > 0 ? <span className="alarm-tab-count">{dueContracts.length + lateWorks.length}</span> : null}
        </button>
        <button
          className={mode === 'visits' ? 'is-on' : ''}
          type="button"
          aria-label={mode === 'visits' ? '오늘 방문 접기' : '오늘 방문'}
          title={mode === 'visits' ? '오늘 방문 접기' : '오늘 방문'}
          aria-pressed={mode === 'visits'}
          onClick={() => pick('visits')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="8" r="2.5" />
            <path d="M4.5 18c.8-2.6 2.4-4 4.5-4s3.7 1.4 4.5 4" />
            <path d="M16 10v8M16 13.5h3.5" />
          </svg>
          {todayVisits.length > 0 ? <span className="alarm-tab-count is-notice">{todayVisits.length}</span> : null}
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
              </div>
              <div className="alarm-counts">
                <span className="badge is-critical">위험 {critical}</span>
                <span className="badge is-warning">주의 {warning}</span>
              </div>
              <div className="alarm-body">
                {alarms.length === 0 ? (
                  <div className="empty">현재 범위에 알람이 없습니다.</div>
                ) : (
                  alarms.map((alarm) => {
                    const fit = alarmContractFit(alarm)
                    const opened = workByAlarm(alarm.id)
                    return (
                      <article key={alarm.id} className={`alarm-item is-${alarm.severity}`}>
                        <Link to={eventHref(alarm.id, alarm.siteId)}>
                          <span className={`badge is-${alarm.severity}`}>{SEVERITY_LABEL[alarm.severity]}</span>
                          <strong>{alarm.title}</strong>
                          <span>
                            {alarmEquipmentName(alarm)}
                            {' · '}
                            {fit.inScope ? '계약 안' : '계약 밖'}
                            {' · '}
                            {getSite(alarm.siteId)?.name} · {KIND_ALARM_LABEL[alarm.kind]} · {formatTime(alarm.at)}
                          </span>
                        </Link>
                        {opened ? (
                          <Link className="alarm-handoff" to={`/work/${opened.id}${search}`}>이 알람의 작업</Link>
                        ) : fit.inScope ? (
                          <button className="alarm-handoff" type="button" onClick={() => openWorkFromAlarm(alarm)}>작업으로 넘기기</button>
                        ) : (
                          <em className="alarm-handoff-note">{fit.note}</em>
                        )}
                      </article>
                    )
                  })
                )}
              </div>
            </>
          ) : mode === 'notices' ? (
            <>
              <div className="alarm-head">
                <span>공지</span>
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
          ) : mode === 'due' ? (
            <>
              <div className="alarm-head">
                <span>기한</span>
              </div>
              <div className="alarm-body">
                <h2>유지보수 계약</h2>
                {dueContracts.length === 0 ? (
                  <div className="empty">곧 끝나는 계약이 없습니다.</div>
                ) : (
                  dueContracts.map(({ site, contract, left }) => (
                    <Link key={contract.id} className="alarm-item" to={`/sites/${site.id}/contract${search}`}>
                      <strong>{site.name}</strong>
                      <span>{contract.end} · {dueLabel(left)}</span>
                    </Link>
                  ))
                )}
                <h2>넘긴 작업</h2>
                {lateWorks.length === 0 ? (
                  <div className="empty">대응 시간을 넘긴 작업이 없습니다.</div>
                ) : (
                  lateWorks.map((work) => (
                    <Link key={work.id} className="alarm-item is-warning" to={`/work/${work.id}${search}`}>
                      <strong>{work.title}</strong>
                      <span>{getSite(work.siteId)?.name} · {formatDateTime(work.slaDueAt)}</span>
                    </Link>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="alarm-head">
                <span>오늘 방문</span>
              </div>
              <div className="alarm-body">
                {todayVisits.length === 0 ? (
                  <div className="empty">오늘 예정된 방문이 없습니다.</div>
                ) : (
                  todayVisits.map((visit) => (
                    <Link key={visit.id} className="alarm-item" to={`/sites/${visit.siteId}/schedule${search}`}>
                      <strong>{visit.title}{visit.sample ? <span className="sample-tag">예시</span> : null}</strong>
                      <span>{getSite(visit.siteId)?.name} · {visit.vendor} · {visit.equipment} · {visit.kind}</span>
                    </Link>
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
