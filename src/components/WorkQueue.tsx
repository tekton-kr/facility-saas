import { Link } from 'react-router-dom'
import { getVendor, isSlaOpen, siteLabel, worksForScope } from '../lib/field.ts'
import { formatDateTime, WORK_KIND_LABEL, WORK_STATUS_LABEL } from '../lib/format.ts'
import { useField } from '../lib/useField.ts'
import { useScope } from '../lib/useScope.ts'

type Props = {
  siteId?: string
  limit?: number
}

export function WorkQueue({ siteId, limit }: Props) {
  const { search } = useScope()
  useField()
  const works = worksForScope(siteId)
  const visible = limit ? works.slice(0, limit) : works

  if (visible.length === 0) {
    return <div className="empty">오늘 열린 작업이 없습니다.</div>
  }

  return (
    <div className="list">
      {visible.map((work) => {
        const late = isSlaOpen(work)
        return (
          <Link key={work.id} className="list-item" to={`/work/${work.id}${search}`}>
            <span>
              <span className={`badge is-${work.status === 'done' ? 'info' : late ? 'critical' : 'warning'}`}>
                {WORK_STATUS_LABEL[work.status]}
              </span>
              {' '}
              <span className="badge">{WORK_KIND_LABEL[work.kind]}</span>
              {late ? <span className="badge is-critical">SLA</span> : null}
              <strong className="event-title">{work.title}</strong>
              <div className="kpi-meta">
                {siteLabel(work.siteId)}
                {getVendor(work.vendorId) ? ` · ${getVendor(work.vendorId)?.name}` : ''}
                {' · 기한 '}
                {formatDateTime(work.slaDueAt)}
              </div>
            </span>
          </Link>
        )
      })}
    </div>
  )
}
