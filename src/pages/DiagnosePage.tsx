import { Link } from 'react-router-dom'
import { ManageFrame } from '../components/ManageFrame.tsx'
import { listPoints, getSite } from '../lib/catalog.ts'
import { alarmEquipmentName } from '../lib/field.ts'
import { SEVERITY_LABEL } from '../lib/format.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { liveAlarms } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'

type Row = {
  id: string
  equipment: string
  result: string
  detail: string
  sample: boolean
}

const SAMPLES: Omit<Row, 'id' | 'sample'>[] = [
  { equipment: '공조기', result: '확인', detail: '급기 온도가 설정과 떨어져 있습니다.' },
  { equipment: '수배전반', result: '통신 지연', detail: '마지막 수신이 평소보다 늦습니다.' },
  { equipment: '냉동기', result: '이상 없음', detail: '받은 값에서 벗어난 항목이 없습니다.' },
]

function receivedRows(siteId: string): Row[] {
  const alarms = liveAlarms(siteId).map((alarm) => ({
    id: alarm.id,
    equipment: alarmEquipmentName(alarm),
    result: SEVERITY_LABEL[alarm.severity],
    detail: alarm.title,
    sample: false,
  }))
  const points = listPoints({ siteId }).flatMap((row) => {
    if (row.point.flags?.offline) {
      return [{
        id: `${row.equipment.id}-${row.point.id}-off`,
        equipment: row.equipment.name,
        result: '통신 이상',
        detail: `${row.point.name} 통신이 끊겨 있습니다.`,
        sample: false,
      }]
    }
    if (row.point.flags?.stale) {
      return [{
        id: `${row.equipment.id}-${row.point.id}-stale`,
        equipment: row.equipment.name,
        result: '수신 지연',
        detail: `${row.point.name} 수신이 늦습니다.`,
        sample: false,
      }]
    }
    return []
  })
  return [...alarms, ...points]
}

export function DiagnosePage() {
  const { siteId, search } = useScope()
  const site = siteId ? getSite(siteId) : undefined

  if (!siteId) {
    const sites = visibleSites()
    return (
      <ManageFrame kicker="" title="진단">
        <p className="manage-note">건물을 고르면 그 현장 진단이 열립니다.</p>
        <section className="manage-card">
          {sites.length === 0 ? <div className="empty">배정된 건물이 없습니다.</div> : (
            <div className="manage-list">
              {sites.map((item) => (
                <Link key={item.id} className="manage-row" to={`/sites/${item.id}/diagnosis${search}`}>
                  <span>
                    <strong>{item.name}</strong>
                    <em>{item.location || '위치 미등록'}</em>
                  </span>
                  <b>열기</b>
                </Link>
              ))}
            </div>
          )}
        </section>
      </ManageFrame>
    )
  }

  if (!site) {
    return (
      <ManageFrame kicker="진단" title="현장을 찾지 못했습니다">
        <div className="empty">배정 목록에 없는 건물입니다.</div>
      </ManageFrame>
    )
  }

  const received = receivedRows(site.id)
  const samples: Row[] = SAMPLES.map((item, index) => ({
    ...item,
    id: `${site.id}-sample-${index}`,
    sample: true,
  }))

  return (
    <ManageFrame kicker="" title="진단">
      <p className="manage-note">
        {site.name} 설비 진단입니다. 알람과 통신 이상만 올립니다. 예시 표시는 아직 수신된 진단이 아닙니다.
      </p>
      <section className="manage-card">
        <h2>수신된 진단</h2>
        {received.length === 0 ? <div className="empty">수신된 진단이 없습니다.</div> : (
          <div className="manage-list">
            {received.map((item) => (
              <div key={item.id} className="manage-row">
                <span>
                  <strong>{item.equipment}</strong>
                  <em>{item.detail}</em>
                </span>
                <b>{item.result}</b>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="manage-card">
        <h2>화면 예시</h2>
        <div className="manage-list">
          {samples.map((item) => (
            <div key={item.id} className="manage-row">
              <span>
                <strong>{item.equipment}<span className="sample-tag">예시</span></strong>
                <em>{item.detail}</em>
              </span>
              <b>{item.result}</b>
            </div>
          ))}
        </div>
      </section>
    </ManageFrame>
  )
}
