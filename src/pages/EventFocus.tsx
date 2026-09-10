import { EventContext } from '../components/EventContext.tsx'
import { DataTable } from '../components/DataTable.tsx'
import { connectorById, getSite } from '../lib/catalog.ts'
import { formatDateTime, KIND_ALARM_LABEL, SEVERITY_LABEL } from '../lib/format.ts'
import { alarmInRange, alarmsForScope } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'
import type { Alarm } from '../types/domain.ts'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

export function EventFocus() {
  const { siteId, range, view, search } = useScope()
  const site = getSite(siteId)
  const alarms = alarmsForScope({ siteId, app: 'events' })
    .filter((alarm) => alarmInRange(alarm.at, range))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  const selected = alarms[0]
  const plan = site?.plans.find((item) => item.id === selected?.planId) ?? site?.plans[0]
  const cameras = site?.cameras ?? []

  const columns = useMemo<ColumnDef<Alarm, unknown>[]>(() => [
    {
      accessorKey: 'severity',
      header: '심각도',
      cell: ({ row }) => <span className={`badge is-${row.original.severity}`}>{SEVERITY_LABEL[row.original.severity]}</span>,
    },
    {
      accessorKey: 'kind',
      header: '종류',
      cell: ({ row }) => KIND_ALARM_LABEL[row.original.kind],
    },
    { accessorKey: 'title', header: '알람' },
    {
      accessorKey: 'at',
      header: '시각',
      cell: ({ row }) => <span className="mono-time">{formatDateTime(row.original.at)}</span>,
    },
  ], [])

  if (view === 'history') {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>{site?.name} · 알람 이력</h1>
            <p>구간을 멈추고 다시 봅니다. ack·제어 없음.</p>
          </div>
        </div>
        <section className="deck">
          <h2>이력 {alarms.length}</h2>
          <DataTable data={alarms} columns={columns} empty="이 구간에 알람이 없습니다." getRowId={(row) => row.id} />
        </section>
      </>
    )
  }

  if (view === 'plan') {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>{site?.name} · 평면도</h1>
            <p>알람 위치만 강조합니다. 트윈을 복제하지 않습니다.</p>
          </div>
        </div>
        <EventContext selected={selected} site={site} plan={plan} cameras={[]} search={search} />
      </>
    )
  }

  if (view === 'cameras') {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>{site?.name} · CCTV 링크</h1>
            <p>딥링크만 전달합니다. 영상 원본은 현장 VMS입니다.</p>
          </div>
        </div>
        <section className="panel">
          {cameras.length === 0 ? <div className="empty">카메라 링크가 없습니다.</div> : null}
          {cameras.map((camera) => (
            <div key={camera.id} className="cctv-card">
              <strong>{camera.name}</strong>
              <p className="kpi-meta">커넥터 {site?.connectorIds.map((id) => connectorById(id)?.name).join(' · ')}</p>
              <code>{camera.deepLink}</code>
            </div>
          ))}
        </section>
      </>
    )
  }

  return null
}
