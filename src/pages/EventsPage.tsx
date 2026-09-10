import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { AlarmCards } from '../components/AlarmCards.tsx'
import { DataTable } from '../components/DataTable.tsx'
import { EventContext } from '../components/EventContext.tsx'
import { EventFilters } from '../components/EventFilters.tsx'
import { ExecBrief } from '../components/ExecBrief.tsx'
import { IncidentBanner } from '../components/IncidentBanner.tsx'
import { WorkQueue } from '../components/WorkQueue.tsx'
import { connectorById, getSite } from '../lib/catalog.ts'
import { formatDateTime, formatSource, KIND_ALARM_LABEL, KIND_LABEL, SEVERITY_LABEL } from '../lib/format.ts'
import { useCompact } from '../lib/media.ts'
import { featuredAlarm } from '../lib/portfolio.ts'
import { alarmInRange, alarmsForScope } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'
import type { Alarm } from '../types/domain.ts'
import { EventFocus } from './EventFocus.tsx'

export function EventsPage() {
  const navigate = useNavigate()
  const compact = useCompact()
  const { siteId, eventId, query, range, severity, kind, role, search, view, eventHref, patchParams } = useScope()
  const alarms = alarmsForScope({ siteId, app: 'events' })
    .filter((alarm) => {
      if (!alarmInRange(alarm.at, range)) return false
      if (severity && alarm.severity !== severity) return false
      if (kind && alarm.kind !== kind) return false
      if (query.trim()) {
        const hay = `${alarm.title} ${getSite(alarm.siteId)?.name ?? ''} ${KIND_ALARM_LABEL[alarm.kind]} ${alarm.source}`.toLowerCase()
        if (!hay.includes(query.trim().toLowerCase())) return false
      }
      return true
    })
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  const selected = alarms.find((item) => item.id === eventId) ?? (compact ? undefined : alarms[0])
  const scopedSite = getSite(siteId)
  const site = selected ? getSite(selected.siteId) : scopedSite
  const plan = site?.plans.find((item) => item.id === selected?.planId) ?? site?.plans[0]
  const cameras = (site?.cameras ?? []).filter((camera) => selected?.cameraIds.includes(camera.id))
  const headline = featuredAlarm({ app: 'events', siteId })
  const mobileDetail = compact && Boolean(eventId && selected)

  const columns = useMemo<ColumnDef<Alarm, unknown>[]>(() => [
    {
      accessorKey: 'severity',
      header: '심각도',
      cell: ({ row }) =>
        row.original.severity === 'info' ? (
          <span className="mono-source">{SEVERITY_LABEL.info}</span>
        ) : (
          <span className={`badge is-${row.original.severity}`}>{SEVERITY_LABEL[row.original.severity]}</span>
        ),
    },
    {
      accessorKey: 'kind',
      header: '종류',
      cell: ({ row }) => <span className="mono-source">{KIND_ALARM_LABEL[row.original.kind]}</span>,
    },
    {
      accessorKey: 'title',
      header: '알람',
    },
    {
      accessorKey: 'at',
      header: '시각',
      cell: ({ row }) => <span className="mono-time">{formatDateTime(row.original.at)}</span>,
    },
    {
      accessorKey: 'source',
      header: '출처',
      cell: ({ row }) => <span className="mono-source">{formatSource(row.original.source)}</span>,
    },
  ], [])

  if (role === 'exec') {
    return <ExecBrief />
  }

  if (view === 'history' || view === 'plan' || view === 'cameras') {
    return <EventFocus />
  }

  const context = (
    <EventContext
      selected={selected}
      site={site}
      plan={plan}
      cameras={cameras}
      search={search}
    />
  )

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{mobileDetail ? selected?.title : scopedSite ? scopedSite.name : '이벤트'}</h1>
          <p>
            {mobileDetail
              ? '도면과 연동만 봅니다. 목록으로 돌아가 다른 알람을 고를 수 있습니다.'
              : `구간을 멈추고 다시 봅니다. 이상한 행만 색이 납니다.${scopedSite ? ` · ${KIND_LABEL[scopedSite.kind]}` : ''}`}
          </p>
        </div>
      </div>
      {mobileDetail ? (
        <div className="event-sheet">
          <button className="sheet-back" type="button" onClick={() => patchParams({ event: null })}>
            목록
          </button>
          {context}
        </div>
      ) : (
        <>
          <EventFilters />
          {headline && !compact && alarms.some((item) => item.id === headline.id) ? (
            <IncidentBanner alarm={headline} to={eventHref(headline.id)} />
          ) : null}
          {scopedSite ? (
            <section className="deck">
              <h2>오늘 작업</h2>
              <WorkQueue siteId={scopedSite.id} limit={4} />
            </section>
          ) : null}
          {compact ? (
            <section className="deck">
              <h2>알람 {alarms.length}</h2>
              <AlarmCards
                alarms={alarms}
                empty="이 구간·필터에 알람이 없습니다."
                onOpen={(alarm) => navigate(eventHref(alarm.id))}
              />
            </section>
          ) : (
            <div className="event-shell">
              <section className="deck event-list">
                <h2>알람 {alarms.length}</h2>
                <DataTable
                  data={alarms}
                  columns={columns}
                  empty="이 구간·필터에 알람이 없습니다."
                  getRowId={(row) => row.id}
                  selectedId={selected?.id}
                  rowClassName={(row) => (row.severity === 'info' ? 'is-muted' : `is-${row.severity}`)}
                  onRowClick={(row) => navigate(eventHref(row.id))}
                />
              </section>
              {context}
            </div>
          )}
          {scopedSite && !compact ? (
            <section className="deck">
              <h2>커넥터</h2>
              <p className="kpi-meta">
                {scopedSite.connectorIds.map((id) => connectorById(id)?.name ?? id).join(' · ')}
              </p>
            </section>
          ) : null}
        </>
      )}
    </>
  )
}
